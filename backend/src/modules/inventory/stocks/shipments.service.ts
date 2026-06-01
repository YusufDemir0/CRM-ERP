import { Injectable, NotFoundException, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto, UpdateShipmentDto, DispatchShipmentDto, ShipmentsQueryDto } from './dto/shipment.dto';
import { StocksTransactionsService } from './stocks-transactions.service';
import { Sale } from '../../sales/entities/sale.entity';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { LogsService } from '../../logs/logs.service';
import { Transactional } from '@nestjs-cls/transactional';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment) private readonly shipmentRepo: Repository<Shipment>,
    private readonly stocksTransactionsService: StocksTransactionsService,
    private readonly transactionContext: TransactionContextService,
    private readonly logsService: LogsService,
  ) {}

  async findAll(query: ShipmentsQueryDto): Promise<PaginatedResult<Shipment>> {
    const qb = this.shipmentRepo.createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.sale', 'sale')
      .leftJoinAndSelect('sale.party', 'party')
      .leftJoinAndSelect('shipment.outgoingDepartment', 'outgoingDepartment')
      .select([
        'shipment.id', 'shipment.saleId', 'shipment.outgoingDepartmentId',
        'shipment.deliveryCity', 'shipment.deliveryDistrict', 'shipment.deliveryAddress',
        'shipment.carrierNameOrPlate', 'shipment.status', 'shipment.approvedAt',
        'shipment.deadline', 'shipment.createdAt', 'shipment.updatedAt',
        'sale.id', 'sale.code', 'sale.grandTotal', 'sale.status',
        'party.id', 'party.name',
        'outgoingDepartment.id', 'outgoingDepartment.name'
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

    if (query.today === 'true' || query.today === true as any) {
      const todayStr = new Date().toISOString().split('T')[0];
      qb.andWhere('shipment.deadline = :todayStr', { todayStr });
    }

    if (query.search) {
      qb.andWhere(
        '(shipment.deliveryCity LIKE :s OR shipment.deliveryDistrict LIKE :s OR shipment.deliveryAddress LIKE :s OR shipment.carrierNameOrPlate LIKE :s OR sale.code LIKE :s OR party.name LIKE :s)',
        { s: `%${query.search}%` }
      );
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
      relations: ['sale', 'sale.items', 'sale.party', 'outgoingDepartment']
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

    shipment.status = 'shipped';
    shipment.carrierNameOrPlate = dto.carrierNameOrPlate || null;
    shipment.approvedAt = new Date();

    const saved = await manager.save(Shipment, shipment);

    if (shipment.sale) {
      shipment.sale.status = 'shipped';
      await manager.save(Sale, shipment.sale);

      // Reserve Stock bulk on dispatch
      if (shipment.sale.items && shipment.sale.items.length > 0) {
        const itemsToReserve = shipment.sale.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        }));

        await this.stocksTransactionsService.reserveStockBulk(
          itemsToReserve,
          shipment.outgoingDepartmentId,
          manager,
          {
            type: 'reserve',
            id: shipment.id,
            description: 'Stok Kilitlendi'
          },
          userId
        );
      }
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

      await this.stocksTransactionsService.finalizeShipmentBulk(
        itemsToDeduct,
        shipment.outgoingDepartmentId,
        manager,
        {
          type: 'shipment',
          id: shipment.id,
          description: 'Stok Düştü'
        },
        userId
      );

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
      relations: ['sale', 'sale.items']
    });
    if (!shipment) throw new NotFoundException('Sevkiyat kaydı bulunamadı');
    if (shipment.status === 'completed' || shipment.status === 'cancelled') {
      throw new BadRequestException('Tamamlanmış veya zaten iptal edilmiş sevkiyatlar iptal edilemez');
    }

    const previousStatus = shipment.status;
    shipment.status = 'cancelled';

    const saved = await manager.save(Shipment, shipment);

    // Call StocksTransactionsService.releaseStockBulk to revert reservations only if it was shipped
    if (previousStatus === 'shipped' && shipment.sale && shipment.sale.items && shipment.sale.items.length > 0) {
      const itemsToRelease = shipment.sale.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      }));

      await this.stocksTransactionsService.releaseStockBulk(
        itemsToRelease,
        shipment.outgoingDepartmentId,
        manager,
        {
          type: 'revert',
          id: shipment.id,
          description: 'Rezervasyon İptali'
        },
        userId
      );
    }

    if (shipment.sale) {
      shipment.sale.status = 'cancelled';
      await manager.save(Sale, shipment.sale);
    }

    this.logsService.logActivity({
      userId,
      module: 'inventory',
      action: 'SHIPMENT_CANCEL',
      tag: 'CANCEL',
      details: `Sevkiyat iptal edildi ve stok rezervasyonları serbest bırakıldı. ID: ${shipment.id}, Satış Kodu: ${shipment.sale?.code}`,
    });

    return saved;
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
