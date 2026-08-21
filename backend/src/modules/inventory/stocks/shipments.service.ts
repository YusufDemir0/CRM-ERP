import { Injectable, NotFoundException, BadRequestException, StreamableFile, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateShipmentDto, UpdateShipmentDto, DispatchShipmentDto, ShipmentsQueryDto } from './dto/shipment.dto';
import { StocksTransactionsService } from './stocks-transactions.service';
import { Sale } from '../../sales/entities/sale.entity';
import { SaleItem } from '../../sales/entities/sale-item.entity';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { LogsService } from '../../logs/logs.service';
import { Transactional } from '@nestjs-cls/transactional';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import * as ExcelJS from 'exceljs';
import { Decimal } from 'decimal.js';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';
import { SalesTransactionsService } from '../../sales/sales-transactions.service';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment) private readonly shipmentRepo: Repository<Shipment>,
    private readonly stocksTransactionsService: StocksTransactionsService,
    private readonly transactionContext: TransactionContextService,
    private readonly logsService: LogsService,
    @Inject(forwardRef(() => SalesTransactionsService))
    private readonly salesTransactionsService: SalesTransactionsService,
  ) {}

  async findAll(query: ShipmentsQueryDto): Promise<PaginatedResult<Shipment>> {
    const qb = this.shipmentRepo.createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.sale', 'sale')
      .leftJoinAndSelect('sale.party', 'party')
      .leftJoinAndSelect('shipment.outgoingDepartment', 'outgoingDepartment')
      .leftJoinAndSelect('shipment.vehicles', 'vehicle')
      .leftJoinAndSelect('shipment.assignedStaff', 'staff')
      .select([
        'shipment.id', 'shipment.saleId', 'shipment.outgoingDepartmentId',
        'shipment.deliveryCity', 'shipment.deliveryDistrict', 'shipment.deliveryAddress',
        'shipment.carrierNameOrPlate', 'shipment.status', 'shipment.approvedAt',
        'shipment.deadline', 'shipment.createdAt', 'shipment.updatedAt',
        'sale.id', 'sale.code', 'sale.grandTotal', 'sale.status',
        'party.id', 'party.name',
        'outgoingDepartment.id', 'outgoingDepartment.name',
        'vehicle.id', 'vehicle.name', 'vehicle.plate',
        'staff.id', 'staff.firstName', 'staff.lastName'
      ]);

    if (query.status && query.status !== 'all') {
      qb.andWhere('shipment.status = :status', { status: query.status });
    }

    if (query.city) {
      qb.andWhere('shipment.deliveryCity = :city', { city: query.city });
    }

    if (query.district) {
      qb.andWhere('shipment.deliveryDistrict = :district', { district: query.district });
    }

    if (String(query.today) === 'true') {
      const todayStr = new Date().toISOString().split('T')[0];
      qb.andWhere('shipment.deadline = :todayStr', { todayStr });
    }

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      if (s) {
        qb.andWhere(
          '(shipment.deliveryCity LIKE :s OR shipment.deliveryDistrict LIKE :s OR shipment.deliveryAddress LIKE :s OR shipment.carrierNameOrPlate LIKE :s OR sale.code LIKE :s OR party.name LIKE :s)',
          { s }
        );
      }
    }

    const sortCol = 'shipment.createdAt';
    qb.orderBy(sortCol, 'DESC');

    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20))
      }
    };
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: String(id) },
      relations: ['sale', 'sale.items', 'sale.party', 'outgoingDepartment', 'vehicles', 'assignedStaff']
    });
    if (!shipment) {
      throw new NotFoundException('Sevkiyat kaydı bulunamadı');
    }
    return shipment;
  }

  @Transactional()
  async create(dto: CreateShipmentDto, userId: string): Promise<Shipment> {
    const manager = this.transactionContext.manager;
    const shipment = manager.create(Shipment, {
      saleId: dto.saleId,
      outgoingDepartmentId: dto.outgoingDepartmentId,
      deliveryCity: dto.deliveryCity,
      deliveryDistrict: dto.deliveryDistrict,
      deliveryAddress: dto.deliveryAddress,
      deadline: dto.deadline,
      status: 'pending',
    });
    return manager.save(Shipment, shipment);
  }

  @Transactional()
  async dispatch(id: string, dto: DispatchShipmentDto, userId: string): Promise<Shipment> {
    const manager = this.transactionContext.manager;
    const shipment = await manager.findOne(Shipment, {
      where: { id: String(id) },
      relations: ['sale', 'sale.items']
    });
    if (!shipment) throw new NotFoundException('Sevkiyat kaydı bulunamadı');
    if (shipment.status !== 'pending') {
      throw new BadRequestException('Sadece bekleyen sevkiyatlar yola çıkarılabilir');
    }

    if (shipment.sale && shipment.sale.paymentType !== 'VADELİ') {
      const paidAmount = new Decimal(shipment.sale.paidAmount || 0);
      const grandTotal = new Decimal(shipment.sale.grandTotal || 0);
      if (grandTotal.minus(paidAmount).abs().gt(0.01)) {
        throw new BadRequestException(
          `Bu siparişin ödemesi tam olarak kapatılmamıştır! ` +
          `Toplam Ödenen: ${paidAmount.toFixed(2)}, Toplam Tutar: ${grandTotal.toFixed(2)}. ` +
          `Siparişi sevk edebilmek için toplam ödemenin net satış tutarını karşılaması gerekmektedir.`
        );
      }
    }

    const outgoingDeptId = shipment.outgoingDepartmentId;
    if (outgoingDeptId) {
      const selectedDept = await manager.query(
        "SELECT name FROM departments WHERE id = ? LIMIT 1",
        [outgoingDeptId]
      );
      if (selectedDept && selectedDept.length > 0) {
        const deptName = selectedDept[0].name.toLowerCase();
        if (deptName === 'sanaldepo' || deptName === 'satisdepo') {
          throw new BadRequestException("Sevkiyat çıkış deposu 'sanaldepo' veya 'satisdepo' olamaz. Lütfen geçerli bir fiziksel depo seçiniz.");
        }
      }
    }

    shipment.status = 'shipped';
    shipment.carrierNameOrPlate = dto.carrierNameOrPlate || null;
    shipment.approvedAt = new Date();

    const saved = await manager.save(Shipment, shipment);

    if (shipment.sale) {
      shipment.sale.status = 'shipped';
      await manager.save(Sale, shipment.sale);
    }

    this.logsService.logActivity({
      userId,
      module: 'inventory',
      action: 'SHIPMENT_DISPATCH',
      tag: 'DISPATCH',
      details: `Sevkiyat yola çıktı. ID: ${shipment.id}, Taşıyıcı: ${dto.carrierNameOrPlate || 'Belirtilmedi'}`,
    });

    return saved;
  }

  @Transactional()
  async complete(id: string, userId: string): Promise<Shipment> {
    const manager = this.transactionContext.manager;
    const shipment = await manager.findOne(Shipment, {
      where: { id: String(id) },
      relations: ['sale', 'sale.items']
    });
    if (!shipment) throw new NotFoundException('Sevkiyat kaydı bulunamadı');
    if (shipment.status !== 'shipped' && shipment.status !== 'pending') {
      throw new BadRequestException('Sadece bekleyen veya yola çıkmış sevkiyatlar tamamlanabilir');
    }

    shipment.status = 'completed';

    const saved = await manager.save(Shipment, shipment);

    // Call StocksTransactionsService.finalizeShipmentBulk to permanently deduct stock levels
    if (shipment.sale && shipment.sale.items && shipment.sale.items.length > 0) {
      const itemsToDeduct = shipment.sale.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      }));

      // Get the virtual department (sanaldepo) ID
      const sanalDept = await manager.query(
        "SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1"
      );
      const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';

      // Find physical reserve movements to determine which warehouses stock was reserved in
      const reserveMovements = await manager.find(StockMovement, {
        where: { referenceType: 'sale', referenceId: shipment.sale.id },
        relations: ['stock']
      });

      // Filter out sanaldepo movements as it does not hold reservations
      const physicalReserveMovements = reserveMovements.filter(
        m => m.stock && String(m.stock.departmentId) !== String(sanalDeptId)
      );

      const deptShipments = new Map<string, Array<{ itemId: string; quantity: number }>>();

      for (const reqItem of itemsToDeduct) {
        const itemMovements = physicalReserveMovements.filter(m => m.stock?.itemId === String(reqItem.itemId));
        let remainingQtyToShip = new Decimal(reqItem.quantity);

        for (const mov of itemMovements) {
          if (remainingQtyToShip.lte(0)) break;
          const stock = mov.stock;
          if (!stock) continue;

          // Sum up already shipped quantity from this stockId (excluding current movement if applicable)
          const shippedResult = await manager.createQueryBuilder(StockMovement, 'm')
            .where('m.stockId = :stockId', { stockId: stock.id })
            .andWhere('m.referenceType IN (:...refTypes)', { refTypes: ['sale', 'shipment'] })
            .andWhere('m.referenceId = :saleId', { saleId: shipment.sale.id })
            .andWhere('m.id != :movId', { movId: mov.id })
            .select('SUM(m.quantity)', 'total')
            .getRawOne();

          const alreadyShippedFromStock = new Decimal(shippedResult?.total || 0);
          const maxShippableFromDept = new Decimal(mov.quantity).sub(alreadyShippedFromStock);

          if (maxShippableFromDept.gt(0)) {
            const qtyToShipFromDept = Decimal.min(remainingQtyToShip, maxShippableFromDept);
            const deptId = stock.departmentId;
            const list = deptShipments.get(deptId) || [];
            list.push({ itemId: String(reqItem.itemId), quantity: qtyToShipFromDept.toNumber() });
            deptShipments.set(deptId, list);
            remainingQtyToShip = remainingQtyToShip.sub(qtyToShipFromDept);
          }
        }

        if (remainingQtyToShip.gt(0)) {
          const deptId = shipment.outgoingDepartmentId || '1';
          const list = deptShipments.get(deptId) || [];
          list.push({ itemId: String(reqItem.itemId), quantity: remainingQtyToShip.toNumber() });
          deptShipments.set(deptId, list);
        }
      }

      for (const [deptId, items] of deptShipments.entries()) {
        if (items.length > 0) {
          await this.stocksTransactionsService.finalizeShipmentBulk(
            items,
            deptId,
            manager,
            {
              type: 'shipment',
              id: shipment.id,
              description: 'Stok Düştü'
            },
            userId
          );
        }
      }

      // Replenish stock in virtual warehouse (sanaldepo) so it zeroes out
      for (const item of shipment.sale.items) {
        await this.stocksTransactionsService.increaseStock(
          String(item.itemId),
          sanalDeptId,
          item.quantity,
          item.costPrice || 0,
          manager,
          {
            type: 'shipment',
            id: shipment.id,
            description: `Sanal Stok Sevk Girişi: ${shipment.sale.code}`
          },
          userId
        );
      }

      // Also update shippedQuantity on SaleItem
      const saleItemsToUpdate: SaleItem[] = [];
      for (const item of shipment.sale.items) {
        item.shippedQuantity = new Decimal(item.shippedQuantity || 0).add(item.quantity);
        saleItemsToUpdate.push(item);
      }
      await manager.save(SaleItem, saleItemsToUpdate);

      shipment.sale.status = 'invoiced';
      await manager.save(Sale, shipment.sale);
    }

    this.logsService.logActivity({
      userId,
      module: 'inventory',
      action: 'SHIPMENT_COMPLETE',
      tag: 'COMPLETE',
      details: `Sevkiyat tamamlandı ve stoklar düşüldü. ID: ${shipment.id}, Satış Kodu: ${shipment.sale?.code}`,
    });

    return saved;
  }

  @Transactional()
  async cancel(id: string, userId: string): Promise<Shipment> {
    const manager = this.transactionContext.manager;
    const shipment = await manager.findOne(Shipment, {
      where: { id: String(id) },
      relations: ['sale']
    });
    if (!shipment) throw new NotFoundException('Sevkiyat kaydı bulunamadı');
    if (shipment.status === 'completed' || shipment.status === 'cancelled') {
      throw new BadRequestException('Tamamlanmış veya zaten iptal edilmiş sevkiyatlar iptal edilemez');
    }

    // Cancel the sale using SalesTransactionsService (which also cancels the shipment and handles all stock/financial logic)
    if (shipment.sale) {
      await this.salesTransactionsService.cancelSale(shipment.sale.id, 'Sevkiyat İptal Edildi', userId);
    } else {
      shipment.status = 'cancelled';
      await manager.save(Shipment, shipment);
    }

    this.logsService.logActivity({
      userId,
      module: 'inventory',
      action: 'SHIPMENT_CANCEL',
      tag: 'CANCEL',
      details: `Sevkiyat iptal edildi. ID: ${shipment.id}`,
    });

    const refreshed = await manager.findOne(Shipment, { where: { id: String(id) } });
    if (!refreshed) throw new NotFoundException('Sevkiyat kaydı bulunamadı');
    return refreshed;
  }

  async getMetrics() {
    const [pending, shipped, completed, cancelled] = await Promise.all([
      this.shipmentRepo.count({ where: { status: 'pending' } }),
      this.shipmentRepo.count({ where: { status: 'shipped' } }),
      this.shipmentRepo.count({ where: { status: 'completed' } }),
      this.shipmentRepo.count({ where: { status: 'cancelled' } }),
    ]);

    const routePooling = await this.shipmentRepo.createQueryBuilder('shipment')
      .where('shipment.status IN (:...statuses)', { statuses: ['pending', 'shipped'] })
      .select('shipment.deliveryCity', 'deliveryCity')
      .addSelect('shipment.deliveryDistrict', 'deliveryDistrict')
      .addSelect('COUNT(shipment.id)', 'count')
      .groupBy('shipment.deliveryCity')
      .addGroupBy('shipment.deliveryDistrict')
      .getRawMany();

    const mappedRoutePooling = routePooling.map(r => ({
      deliveryCity: r.deliveryCity || 'Belirtilmemiş',
      deliveryDistrict: r.deliveryDistrict || 'Belirtilmemiş',
      count: Number(r.count || 0)
    }));

    return {
      statusCounts: { pending, shipped, completed, cancelled },
      routePooling: mappedRoutePooling
    };
  }

  async exportToExcel(query: ShipmentsQueryDto): Promise<StreamableFile> {
    query.limit = 10000;
    const { data: shipments } = await this.findAll(query);

    // Group shipments by deliveryCity and deliveryDistrict for Route Pooling
    const groups: Record<string, Record<string, Shipment[]>> = {};
    for (const sh of shipments) {
      const city = sh.deliveryCity || 'Belirtilmemiş';
      const district = sh.deliveryDistrict || 'Belirtilmemiş';
      if (!groups[city]) groups[city] = {};
      if (!groups[city][district]) groups[city][district] = [];
      groups[city][district].push(sh);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sevkiyat Havuzu (Route Pooling)');

    worksheet.columns = [
      { header: 'SEVKİYAT ID', key: 'id', width: 15 },
      { header: 'SATIŞ KODU', key: 'saleCode', width: 20 },
      { header: 'MÜŞTERİ / CARİ', key: 'partyName', width: 35 },
      { header: 'ADRES', key: 'address', width: 50 },
      { header: 'TAŞIYICI / PLAKA', key: 'carrier', width: 20 },
      { header: 'TERMİN TARİHİ', key: 'deadline', width: 15 },
      { header: 'DURUM', key: 'status', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800

    const statusMap = {
      'pending': 'Bekliyor',
      'shipped': 'Yolda',
      'completed': 'Teslim Edildi',
      'cancelled': 'İptal Edildi'
    };

    for (const city of Object.keys(groups).sort()) {
      for (const district of Object.keys(groups[city]).sort()) {
        const list = groups[city][district];
        
        // Add a beautiful grouping header row
        const groupRow = worksheet.addRow({
          id: `📍 ${city.toUpperCase()} - ${district.toUpperCase()} (${list.length} Sevkiyat)`
        });
        worksheet.mergeCells(groupRow.number, 1, groupRow.number, 7);
        groupRow.font = { bold: true, color: { argb: 'FF0F172A' } };
        groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate-100

        for (const sh of list) {
          worksheet.addRow({
            id: String(sh.id),
            saleCode: sh.sale?.code || '',
            partyName: sh.sale?.party?.name || '',
            address: sh.deliveryAddress || '',
            carrier: sh.carrierNameOrPlate || '-',
            deadline: sh.deadline || '',
            status: statusMap[sh.status] || sh.status
          });
        }

        // Blank spacer row after each district group
        worksheet.addRow({});
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer));
  }
}
