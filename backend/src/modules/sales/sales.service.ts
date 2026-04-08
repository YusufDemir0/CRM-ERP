import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Item } from '../inventory/items/entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';
import { StockMovement } from '../inventory/stocks/entities/stock-movement.entity';
import { Party } from '../parties/entities/party.entity';
import { Currency } from '../finance/currencies/entities/currency.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  CreateSaleTypeDto,
  ApproveSaleDto,
} from './dto/sale.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private saleItemRepo: Repository<SaleItem>,
    @InjectRepository(SaleType) private saleTypeRepo: Repository<SaleType>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
  ) {}

  // ────── SALE TYPES ──────

  async findAllSaleTypes(): Promise<SaleType[]> {
    return this.saleTypeRepo.find();
  }

  async createSaleType(dto: CreateSaleTypeDto, userId?: number): Promise<SaleType> {
    const type = new SaleType();
    type.name = dto.name;
    type.abbreviation = dto.abbreviation;
    type.createdBy = userId ?? null;
    return this.saleTypeRepo.save(type);
  }

  // ────── SALES CRUD ──────

  async findAll(query: PaginationDto & { status?: string; partyId?: number }): Promise<PaginatedResult<Sale>> {
    const qb = this.saleRepo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.party', 'party')
      .leftJoinAndSelect('sale.saleType', 'saleType')
      .leftJoinAndSelect('sale.currency', 'currency')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.item', 'item');

    if (query.search) {
      qb.where('(sale.code LIKE :s OR party.name LIKE :s)', { s: `%${query.search}%` });
    }
    if (query.status) qb.andWhere('sale.status = :status', { status: query.status });
    if (query.partyId) qb.andWhere('sale.partyId = :partyId', { partyId: query.partyId });

    qb.orderBy(`sale.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const[data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations:['party', 'saleType', 'currency', 'items', 'items.item'],
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    return sale;
  }

  async create(dto: CreateSaleDto, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const party = await queryRunner.manager.findOne(Party, { where: { id: dto.partyId } });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı.');
      if (party.type === 'provider') throw new BadRequestException('Sadece Tedarikçi tipindeki bir cariye satış yapılamaz.');

      const currency = await queryRunner.manager.findOne(Currency, { where: { id: dto.currencyId } });
      const currentExchangeRate = currency ? Number(currency.exchangeRate) : 1;

      const code = await this.sequenceGenerator.generateSaleCode(queryRunner, dto.saleTypeId);

      let rawTotalAmount = 0;
      const saleItems: Partial<SaleItem>[] =[];

      // İlk aşama: Toplam Matrah Bulma (KDV hariç net toplamı bulma)
      for (const itemDto of dto.items) {
        const discountAmount = itemDto.discountAmount || 0;
        const discountPercent = itemDto.discountPercent || 0;
        
        let netPrice = itemDto.price;
        if (discountAmount > 0) netPrice = itemDto.price - discountAmount;
        else if (discountPercent > 0) netPrice = itemDto.price * (1 - discountPercent / 100);

        const subtotal = itemDto.quantity * netPrice;
        rawTotalAmount += subtotal;

        saleItems.push({
          itemId: itemDto.itemId,
          quantity: itemDto.quantity,
          price: itemDto.price,
          discountAmount,
          discountPercent,
          netPrice,
          kdvRate: itemDto.kdvRate ?? 20,
          description: itemDto.description,
          createdBy: userId,
        });
      }

      // Fatura Altı Genel İndirim ve KDV Matrahı (Türkiye KDV standartları: KDV indirimden sonra hesaplanır)
      const headerDiscountAmount = dto.discountAmount || 0;
      const headerDiscountPercent = dto.discountPercent || 0;
      let discountToSubtract = headerDiscountAmount;
      if (headerDiscountPercent > 0) {
        discountToSubtract = rawTotalAmount * (headerDiscountPercent / 100);
      }
      
      const discountedMatrah = rawTotalAmount - discountToSubtract;

      let totalKdv = 0;
      saleItems.forEach(item => {
        // İndirimi oranına göre satırlara dağıt
        const lineRatio = rawTotalAmount > 0 ? (item.quantity! * item.netPrice!) / rawTotalAmount : 0;
        const lineMatrah = discountedMatrah * lineRatio;
        const lineKdv = lineMatrah * (item.kdvRate! / 100);
        
        item.kdvAmount = lineKdv;
        item.lineTotal = lineMatrah + lineKdv;
        totalKdv += lineKdv;
      });

      const grandTotal = discountedMatrah + totalKdv;

      const sale = queryRunner.manager.create(Sale, {
        code,
        partyId: dto.partyId,
        saleTypeId: dto.saleTypeId,
        currencyId: dto.currencyId,
        exchangeRate: currentExchangeRate, // İşlem anındaki kur donduruldu
        deliveryDate: dto.deliveryDate,
        status: 'draft',
        deposit: dto.deposit || 0,
        totalAmount: rawTotalAmount,
        discountAmount: headerDiscountAmount,
        discountPercent: headerDiscountPercent,
        kdv: totalKdv,
        grandTotal,
        notes: dto.notes,
        createdBy: userId,
      });

      const savedSale = await queryRunner.manager.save(sale);

      for (const si of saleItems) {
        await queryRunner.manager.save(queryRunner.manager.create(SaleItem, { ...si, saleId: savedSale.id }));
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedSale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateSaleDto, userId?: number): Promise<Sale> {
    const sale = await this.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir. İptal / İade süreçlerini kullanın.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.notes !== undefined) sale.notes = dto.notes;
      if (dto.deliveryDate !== undefined) sale.deliveryDate = dto.deliveryDate;
      sale.updatedBy = userId || null;

      // İç İçe (Nested) Güncelleme: Kalemler gönderildiyse tüm matrah, indirim ve KDV baştan hesaplanır
      if (dto.items && dto.items.length > 0) {
        let rawTotalAmount = 0;
        const saleItems: Partial<SaleItem>[] =[];

        for (const itemDto of dto.items) {
          const discountAmount = itemDto.discountAmount || 0;
          const discountPercent = itemDto.discountPercent || 0;
          let netPrice = itemDto.price;
          if (discountAmount > 0) netPrice = itemDto.price - discountAmount;
          else if (discountPercent > 0) netPrice = itemDto.price * (1 - discountPercent / 100);
          rawTotalAmount += itemDto.quantity * netPrice;
          
          saleItems.push({
            itemId: itemDto.itemId, quantity: itemDto.quantity, price: itemDto.price,
            discountAmount, discountPercent, netPrice, kdvRate: itemDto.kdvRate ?? 20,
            description: itemDto.description, createdBy: userId,
          });
        }

        const headerDiscountAmount = dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount;
        const headerDiscountPercent = dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent;
        let discountToSubtract = headerDiscountAmount;
        if (headerDiscountPercent > 0) discountToSubtract = rawTotalAmount * (headerDiscountPercent / 100);
        
        const discountedMatrah = rawTotalAmount - discountToSubtract;

        let totalKdv = 0;
        saleItems.forEach(item => {
          const lineRatio = rawTotalAmount > 0 ? (item.quantity! * item.netPrice!) / rawTotalAmount : 0;
          const lineMatrah = discountedMatrah * lineRatio;
          const lineKdv = lineMatrah * (item.kdvRate! / 100);
          item.kdvAmount = lineKdv;
          item.lineTotal = lineMatrah + lineKdv;
          totalKdv += lineKdv;
        });

        sale.totalAmount = rawTotalAmount;
        sale.discountAmount = headerDiscountAmount;
        sale.discountPercent = headerDiscountPercent;
        sale.kdv = totalKdv;
        sale.grandTotal = discountedMatrah + totalKdv;
        sale.deposit = dto.deposit !== undefined ? dto.deposit : sale.deposit;

        // Eski kalemleri silip yenilerini ekleyelim
        await queryRunner.manager.delete(SaleItem, { saleId: sale.id });
        for (const si of saleItems) {
          await queryRunner.manager.save(queryRunner.manager.create(SaleItem, { ...si, saleId: sale.id }));
        }
      } else {
        // Kalem gelmediyse bile kapora ve notlar gibi verileri güncelle
        if (dto.deposit !== undefined) sale.deposit = dto.deposit;
      }

      await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  // EN KRİTİK ALAN: STOK DÜŞÜŞ, BAKİYE ARTIRIMI, KAPORA TAHSİLATI (TRANSACTIONAL)
  async approveSale(saleId: number, dto: ApproveSaleDto, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, { where: { id: saleId }, relations: ['items'] });
      if (!sale) throw new NotFoundException('Satış bulunamadı');
      if (sale.status !== 'draft') throw new BadRequestException('Sadece taslak (draft) durumundaki siparişler onaylanabilir.');

      const party = await queryRunner.manager.findOne(Party, { where: { id: sale.partyId } });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı');

      const tlGrandTotal = Number(sale.grandTotal) * Number(sale.exchangeRate);
      const currentPartyBalance = Number(party.balance);

      // KREDİ LİMİT KONTROLÜ
      if (Number(party.creditLimitPlus) > 0 && (currentPartyBalance + tlGrandTotal) > Number(party.creditLimitPlus)) {
         throw new BadRequestException(`Cari limit aşıldı! Firmanın Kredi Limiti: ${party.creditLimitPlus}. Sipariş sonrası bakiye: ${currentPartyBalance + tlGrandTotal} olmaktadır. İşlem gerçekleştirilemez.`);
      }

      // STOK DÜŞME
      for (const saleItem of sale.items) {
        let stock = await queryRunner.manager.findOne(Stock, {
          where: { itemId: saleItem.itemId, departmentId: dto.departmentId },
        });

        if (!stock || Number(stock.quantity) < Number(saleItem.quantity)) {
          throw new BadRequestException(`Yetersiz stok durumu. (Ürün ID: ${saleItem.itemId}, Depo ID: ${dto.departmentId}) Üretim emri açmanız veya mal alımı yapmanız gerekebilir.`);
        }

        const quantityBefore = Number(stock.quantity);
        const quantityAfter = quantityBefore - Number(saleItem.quantity);

        await queryRunner.manager.update(Stock, stock.id, { quantity: quantityAfter, updatedBy: userId });

        await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
          stockId: stock.id, quantity: saleItem.quantity, quantityBefore, quantityAfter,
          type: 'out', referenceType: 'sale', referenceId: sale.id, description: `Satış Onayı: ${sale.code}`, createdBy: userId,
        }));
      }

      // MÜŞTERİYİ BORÇLANDIR (Bakiyeyi Artır)
      await queryRunner.manager.update(Party, party.id, { balance: currentPartyBalance + tlGrandTotal, updatedBy: userId });

      // KAPORANIN FİNANSA KAYDI (Varsa)
      let finalDepositSaved = 0;
      if (Number(sale.deposit) > 0) {
        if (!dto.commercialAccountId) {
          throw new BadRequestException('Siparişte kapora alınmış. Bu paranın gireceği Finans (Kasa/Banka) hesabını seçmelisiniz.');
        }

        const txCode = await this.sequenceGenerator.generateTransactionCode(queryRunner, 'MKB');
        const tlDeposit = Number(sale.deposit) * Number(sale.exchangeRate);

        await queryRunner.manager.save(queryRunner.manager.create(Transaction, {
          code: txCode, partyId: party.id, commercialAccountId: dto.commercialAccountId,
          amount: Number(sale.deposit), currencyId: sale.currencyId, exchangeRate: sale.exchangeRate,
          type: 'in', referenceType: 'sale', referenceId: sale.id, date: new Date().toISOString().split('T')[0],
          description: `${sale.code} Nolu Sipariş Peşinat / Kaporası`, status: 'completed', createdBy: userId
        }));

        // Kaporayı müşterinin bakiyesinden geri düşüyoruz (Borcu kapattı)
        await queryRunner.manager.update(Party, party.id, { balance: (currentPartyBalance + tlGrandTotal) - tlDeposit, updatedBy: userId });
        finalDepositSaved = tlDeposit;
      }

      await queryRunner.manager.update(Sale, sale.id, { status: 'approved', updatedBy: userId });
      await queryRunner.commitTransaction();
      
      this.logger.log(`✅ Sipariş Onaylandı: ${sale.code}, Satış Tutarı: ${tlGrandTotal}, Kapora Düşüşü: ${finalDepositSaved}`);
      return this.findOne(saleId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Sipariş Onay Hata: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // TERS İŞLEM REVERT MANTIĞI: (Bozulan siparişi komple silmek yerine iade/iptal alma)
  async cancelSale(saleId: number, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, { where: { id: saleId } });
      if (!sale) throw new NotFoundException('Satış bulunamadı');
      if (sale.status === 'cancelled') throw new BadRequestException('Sipariş zaten iptal edilmiş.');

      if (sale.status === 'approved' || sale.status === 'shipped') {
        const party = await queryRunner.manager.findOne(Party, { where: { id: sale.partyId }});
        if (!party) throw new NotFoundException('Cari hesap bulunamadı');
        
        // 1. Düşülen stokları bul ve depoya geri sok (In)
        const outMovements = await queryRunner.manager.find(StockMovement, { where: { referenceType: 'sale', referenceId: sale.id, type: 'out' }, relations: ['stock'] });
        for (const mov of outMovements) {
           const stock = await queryRunner.manager.findOne(Stock, { where: { id: mov.stockId }});
           if (stock) {
              const newQty = Number(stock.quantity) + Number(mov.quantity);
              await queryRunner.manager.update(Stock, stock.id, { quantity: newQty });
              
              await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
                 stockId: stock.id, quantity: mov.quantity, quantityBefore: stock.quantity, quantityAfter: newQty,
                 type: 'in', referenceType: 'return', referenceId: sale.id, description: `${sale.code} Sipariş İptaliyle Stoka İade`, createdBy: userId
              }));
           }
        }

        // 2. Bakiyeyi geri al
        const tlGrandTotal = Number(sale.grandTotal) * Number(sale.exchangeRate);
        const tlDeposit = Number(sale.deposit) * Number(sale.exchangeRate);
        
        // Cariyi satış kadar alacaklandır, eğer kapora alınmışsa onu müşterinin parasını (bakiye) tutmaya devam etmek adına caride alacak olarak bırakıyoruz
        const targetBalance = Number(party.balance) - tlGrandTotal + tlDeposit;
        await queryRunner.manager.update(Party, party.id, { balance: targetBalance, updatedBy: userId });

        // 3. Fatura ödemesini/Kaporasını iptal edilmiş işaretle
        await queryRunner.manager.update(Transaction, { referenceType: 'sale', referenceId: sale.id }, { status: 'cancelled', updatedBy: userId });
      }

      await queryRunner.manager.update(Sale, sale.id, { status: 'cancelled', updatedBy: userId });
      await queryRunner.commitTransaction();
      return this.findOne(saleId);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async softDelete(id: number): Promise<void> {
    const sale = await this.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak siparişler kalıcı silinebilir. Onaylanmış faturalar için "İptal Et / Revert" işlemi yapınız.');
    }
    await this.saleRepo.softDelete(id);
  }

  async getStatus() {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // KURLA ÇARPILMIŞ CİRO HESABI EKLENDİ
    const[stats, pending] = await Promise.all([
      this.saleRepo.createQueryBuilder('sale')
        .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
        .addSelect("COUNT(*)", "total")
        .where("sale.createdAt >= :date", { date: firstDayOfMonth.toISOString() })
        .andWhere("sale.status != 'cancelled'")
        .getRawOne(),
      this.saleRepo.count({ where: { status: 'draft' } }),
    ]);

    return {
      monthlyRevenue: Number(stats.revenue || 0),
      monthlyOrders: Number(stats.total || 0),
      pendingOrders: Number(pending || 0),
    };
  }
}