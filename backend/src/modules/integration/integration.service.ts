import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryFailedError } from 'typeorm';
import { Transactional } from '@nestjs-cls/transactional';
import { Decimal } from 'decimal.js';

import { Item } from '../inventory/items/entities/item.entity';
import { Party } from '../parties/entities/party.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleType } from '../sales/entities/sale-type.entity';
import { Department } from '../departments/entities/department.entity';
import { SalesTransactionsService } from '../sales/sales-transactions.service';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { WebOrderDto, WebPlaceholder } from './dto/web-order.dto';
import { CreateSaleDto } from '../sales/dto/sale.dto';
import { WebOrderLink } from './entities/web-order-link.entity';

/** Web siparişlerini ERP'de kaydeden sistem kullanıcısı (migration seed'indeki ilk admin). */
const SYSTEM_USER_ID = '1';
const WEB_DEPARTMENT_ABBREVIATION = 'MWDS';
const TRY_CURRENCY_ID = '1';
/** Deneme ürün kodları (migration 1780600000000); web kataloğuna gönderilmez. */
const PLACEHOLDER_CODE_PREFIX = 'DNM-';
const placeholderCode = (placeholder: WebPlaceholder) => `${PLACEHOLDER_CODE_PREFIX}${placeholder}`;

export interface SyncableItem {
  id: string;
  code: string;
  name: string;
  salePrice: number;
  totalStock: number;
  image: string | null;
  kdv: number;
  description: string;
  itemTypeId: string | null;
  typeName: string;
}

export interface WebOrderResult {
  success: true;
  replayed: boolean;
  saleId: string;
  saleCode: string;
  orderNumber: string;
  grandTotal: string;
  partyId: string;
  departmentId: string;
}

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    private readonly salesTransactionsService: SalesTransactionsService,
    private readonly transactionContext: TransactionContextService,
  ) {}

  /**
   * Web kataloğu için aktif ürünler (pasif ürünler web'e gitmez).
   */
  async getSyncableItems(): Promise<SyncableItem[]> {
    const items = await this.itemRepo.createQueryBuilder('item')
      .leftJoin('item.itemType', 'itemType')
      .select([
        'item.id',
        'item.code',
        'item.name',
        'item.salePrice',
        'item.totalStock',
        'item.image',
        'item.kdv',
        'item.description',
        'item.itemTypeId',
        'itemType.id',
        'itemType.name',
      ])
      .where('item.state = 1')
      .andWhere('item.code NOT LIKE :placeholderPrefix', { placeholderPrefix: `${PLACEHOLDER_CODE_PREFIX}%` })
      .orderBy('item.id', 'DESC')
      .getMany();

    return items.map((item) => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
      salePrice: item.salePrice ? new Decimal(item.salePrice).toNumber() : 0,
      totalStock: item.totalStock ? new Decimal(item.totalStock).toNumber() : 0,
      image: item.image || null,
      kdv: item.kdv ? new Decimal(item.kdv).toNumber() : 20,
      description: item.description || '',
      itemTypeId: item.itemTypeId ? String(item.itemTypeId) : null,
      typeName: item.itemType?.name || 'Genel',
    }));
  }

  async updateItemImage(itemId: string, imageUrl: string): Promise<{ success: true; itemId: string; code: string; image: string }> {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Ürün ID ${itemId} ERP veritabanında bulunamadı.`);
    }

    item.image = imageUrl;
    await this.itemRepo.save(item);
    this.logger.log(`Item image updated for ${item.code} (${item.id})`);

    return { success: true, itemId: String(item.id), code: item.code, image: imageUrl };
  }

  /**
   * Web siparişini ERP'ye taslak satış olarak işler.
   * Idempotent: aynı anahtar tekrar gelirse yeni cari/satış açılmaz, ilk sonuç döner.
   * Atomik: doğrulama yazmadan önce yapılır; cari + satış + eşleme tek transaction'dadır.
   */
  async createWebOrder(dto: WebOrderDto, idempotencyKey: string): Promise<WebOrderResult> {
    try {
      return await this.createWebOrderTx(dto, idempotencyKey);
    } catch (err) {
      // Aynı anahtarla eşzamanlı iki istek: ikincisi PK çakışmasıyla geri alınır, ilk sonucu döndür.
      if (err instanceof QueryFailedError && (err as QueryFailedError & { code?: string }).code === 'ER_DUP_ENTRY') {
        const replay = await this.findExisting(idempotencyKey);
        if (replay) return replay;
      }
      throw err;
    }
  }

  @Transactional()
  private async createWebOrderTx(dto: WebOrderDto, idempotencyKey: string): Promise<WebOrderResult> {
    const manager = this.transactionContext.manager;

    const existing = await this.findExisting(idempotencyKey);
    if (existing) {
      this.logger.log(`Web order replay: key already linked to sale ${existing.saleCode}`);
      return existing;
    }

    // 1. Doğrulama (hiçbir şey yazılmadan önce)
    const department = await manager.findOne(Department, { where: { abbreviation: WEB_DEPARTMENT_ABBREVIATION } });
    if (!department) {
      throw new InternalServerErrorException(`${WEB_DEPARTMENT_ABBREVIATION} (Web Depo Satış) departmanı ERP'de tanımlı değil.`);
    }
    const departmentId = String(department.id);

    const saleTypeAbbreviation = dto.customerType === 'CORPORATE' ? 'TPT' : 'PRK';
    const saleType = await manager.findOne(SaleType, { where: { abbreviation: saleTypeAbbreviation } });
    if (!saleType) {
      throw new InternalServerErrorException(`Satış tipi ${saleTypeAbbreviation} ERP'de tanımlı değil.`);
    }

    // Deneme ürün satırlarını ERP ürün ID'sine çöz (web'de olup ERP'de olmayan ürünler)
    for (const it of dto.items) {
      if (Boolean(it.itemId) === Boolean(it.placeholder)) {
        throw new BadRequestException('Her sipariş satırında itemId ya da placeholder alanlarından tam biri bulunmalıdır.');
      }
    }
    const placeholderCodes = [...new Set(dto.items.flatMap((it) => (it.placeholder ? [placeholderCode(it.placeholder)] : [])))];
    const placeholderIdByCode = new Map<string, string>();
    if (placeholderCodes.length > 0) {
      const rows = await manager.find(Item, { where: { code: In(placeholderCodes), state: 1 }, select: { id: true, code: true } });
      rows.forEach((row) => placeholderIdByCode.set(row.code, String(row.id)));
      const missingCodes = placeholderCodes.filter((code) => !placeholderIdByCode.has(code));
      if (missingCodes.length > 0) {
        throw new BadRequestException(`Deneme ürün(ler) ERP'de tanımlı değil veya pasif: ${missingCodes.join(', ')}.`);
      }
    }

    // Aynı ERP ürünü birden çok satırla gelebilir (renkler, aynı deneme ürüne bağlı farklı web ürünleri);
    // sale_items (sale_id, item_id) tekil olduğu için birleştir.
    const merged = new Map<string, { quantity: number; webTotal: Decimal; names: string[]; isPlaceholder: boolean }>();
    for (const it of dto.items) {
      const itemId = it.itemId ?? placeholderIdByCode.get(placeholderCode(it.placeholder!))!;
      const line = merged.get(itemId) ?? { quantity: 0, webTotal: new Decimal(0), names: [], isPlaceholder: Boolean(it.placeholder) };
      line.quantity += it.quantity;
      line.webTotal = line.webTotal.add(new Decimal(it.price).mul(it.quantity));
      if (it.name && !line.names.includes(it.name)) line.names.push(it.name);
      merged.set(itemId, line);
    }
    const itemIds = [...merged.keys()];

    const activeItems = await manager.find(Item, { where: { id: In(itemIds), state: 1 }, select: { id: true, kdv: true } });
    const kdvById = new Map(activeItems.map((i) => [String(i.id), new Decimal(i.kdv ?? 20)]));
    const missing = itemIds.filter((id) => !kdvById.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Sipariş edilen ürün(ler) ERP'de bulunamadı veya pasif: ${missing.join(', ')}. Eşleşmeyen ürün satışa eklenemez.`,
      );
    }

    // Deneme ürünlerde ERP fiyatı 0'dır: web birim fiyatı kullanılır. Perakendede (PRK) fiyat KDV dahildir,
    // toptanda (TPT) matrah beklenir.
    const isRetail = saleType.abbreviation === 'PRK';
    const salePriceOverrides = new Map<string, Decimal>();
    merged.forEach((line, itemId) => {
      if (!line.isPlaceholder) return;
      const unitGross = line.webTotal.div(line.quantity);
      const kdv = kdvById.get(itemId)!;
      salePriceOverrides.set(itemId, isRetail ? unitGross : unitGross.div(new Decimal(1).add(kdv.div(100))));
    });

    // 2. Her web satışı için yeni sanal cari (MWDS departmanında)
    const party = await manager.save(Party, manager.create(Party, {
      name: dto.fullName.trim(),
      type: 'customer',
      phone1: dto.phone1,
      phone2: dto.phone2 || null,
      email: dto.email.trim(),
      address: dto.address.trim(),
      districtName: dto.district.trim(),
      taxOffice: dto.taxOffice?.trim() || null,
      taxNumber: dto.taxNumber || null,
      notes: `Web Siparişi Sanal Cari (${WEB_DEPARTMENT_ABBREVIATION}) [${dto.customerType === 'CORPORATE' ? 'Kurumsal' : 'Bireysel'}]`,
      currencyId: TRY_CURRENCY_ID,
      balance: new Decimal(0),
      creditLimit: new Decimal(0),
      createdBy: SYSTEM_USER_ID,
      departmentId,
    }));

    // 3. Taslak satış (aynı transaction'a katılır)
    const saleDto = new CreateSaleDto();
    saleDto.partyId = String(party.id);
    saleDto.saleTypeId = String(saleType.id);
    saleDto.currencyId = TRY_CURRENCY_ID;
    saleDto.phone = dto.phone1;
    saleDto.email = dto.email;
    saleDto.address = dto.address;
    saleDto.city = dto.city;
    saleDto.district = dto.district;
    saleDto.taxNumber = dto.taxNumber || undefined;
    const noteParts = [
      dto.orderNote,
      dto.phone2 ? `2. İletişim Tel: ${dto.phone2}` : null,
      dto.totalAmount !== undefined ? `Web Tutarı: ${new Decimal(dto.totalAmount).toFixed(2)} TL` : null,
      '[ErmayWeb Siparişi]',
    ].filter(Boolean);
    saleDto.notes = noteParts.join(' | ');
    saleDto.source = 'WEB_SIPARIS';
    saleDto.paymentType = dto.paymentMethod || 'HAVALE/EFT';
    saleDto.items = [...merged.entries()].map(([itemId, line]) => ({
      itemId,
      quantity: String(line.quantity),
      price: line.webTotal.div(line.quantity).toFixed(2), // bilgi amaçlı: SaleCalculator ERP fiyatını (ya da override'ı) kullanır
      kdvRate: kdvById.get(itemId)!.toString(),
      description: line.names.join(', ').slice(0, 1000) || undefined,
    }));
    // Teklif fiyatı: satış toplamı müşterinin web'de gördüğü tutara sabitlenir, fark iskonto olarak dağıtılır
    if (dto.totalAmount !== undefined && dto.totalAmount > 0) {
      saleDto.representativePrice = new Decimal(dto.totalAmount).toFixed(2);
    }

    const createdSale = await this.salesTransactionsService.create(saleDto, SYSTEM_USER_ID, { departmentId, salePriceOverrides });

    // 4. Idempotency eşlemesi — eşzamanlı ikinci istek burada PK çakışmasıyla geri alınır
    await manager.insert(WebOrderLink, {
      idempotencyKey,
      saleId: String(createdSale.id),
      partyId: String(party.id),
      departmentId,
    });

    this.logger.log(`Web order created: sale ${createdSale.code} (${createdSale.id})`);

    return {
      success: true,
      replayed: false,
      saleId: String(createdSale.id),
      saleCode: createdSale.code,
      orderNumber: createdSale.code,
      grandTotal: createdSale.grandTotal ? new Decimal(createdSale.grandTotal).toFixed(2) : '0.00',
      partyId: String(party.id),
      departmentId,
    };
  }

  private async findExisting(idempotencyKey: string): Promise<WebOrderResult | null> {
    const manager = this.transactionContext.manager;
    const link = await manager.findOne(WebOrderLink, { where: { idempotencyKey } });
    if (!link) return null;

    const sale = await manager.findOne(Sale, { where: { id: link.saleId }, select: { id: true, code: true, grandTotal: true } });
    if (!sale) return null;

    return {
      success: true,
      replayed: true,
      saleId: String(sale.id),
      saleCode: sale.code,
      orderNumber: sale.code,
      grandTotal: sale.grandTotal ? new Decimal(sale.grandTotal).toFixed(2) : '0.00',
      partyId: String(link.partyId),
      departmentId: String(link.departmentId),
    };
  }
}
