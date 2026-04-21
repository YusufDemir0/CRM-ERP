import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Party } from './entities/party.entity';
import { CreatePartyDto, UpdatePartyDto } from './dto/party.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CurrenciesService } from '../finance/currencies/currencies.service';
import { Decimal } from 'decimal.js';

import { getSafeSearchPattern } from '../../common/utils/sql.helper';

@Injectable()
export class PartiesService {
  constructor(
    @InjectRepository(Party)
    private partyRepo: Repository<Party>,
    private currenciesService: CurrenciesService,
  ) { }

  async findAll(query: PaginationDto & { type?: string }): Promise<PaginatedResult<Party>> {
    const qb = this.partyRepo.createQueryBuilder('party')
      .leftJoinAndSelect('party.currency', 'currency');

    if (query.search) {
      const searchPattern = getSafeSearchPattern(query.search);
      if (searchPattern) {
        qb.andWhere('(party.name LIKE :s OR party.phone1 LIKE :s OR party.email LIKE :s OR party.taxNumber LIKE :s OR party.taxOffice LIKE :s OR party.districtName LIKE :s OR party.address LIKE :s OR party.notes LIKE :s OR currency.name LIKE :s)', { s: searchPattern });
      }
    }

    // DB-04: Dynamic Advanced Filters (Sidebar filters) with Map-based whitelist
    const partyFilterMap: Record<string, string> = {
      name: 'party.name',
      phone1: 'party.phone1',
      email: 'party.email',
      taxNumber: 'party.taxNumber',
      taxOffice: 'party.taxOffice',
      cityId: 'party.cityId',
      districtName: 'party.districtName',
    };

    Object.keys(query).forEach(key => {
      const dbCol = partyFilterMap[key];
      const val = query[key as keyof typeof query];
      if (dbCol && val !== undefined) {
        const searchPattern = getSafeSearchPattern(val.toString());
        if (searchPattern) {
          qb.andWhere(`${dbCol} LIKE :${key}`, { [key]: searchPattern });
        }
      }
    });

    if (query.type) {
      const types = query.type.split(',');
      if (types.length > 1) {
        qb.andWhere('party.type IN (:...types)', { types });
      } else {
        qb.andWhere('party.type = :type', { type: query.type });
      }
    }

    if (query.state !== undefined) {
      qb.andWhere('party.state = :state', { state: query.state });
    }

    // Security: Whitelist sort columns
    const allowedSortCols = ['name', 'balance', 'creditLimit', 'createdAt'];
    const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'name';
    qb.orderBy(`party.${sortCol}`, query.sortOrder || 'ASC');

    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }


  async findOne(id: number): Promise<Party> {
    const party = await this.partyRepo.findOne({ where: { id }, relations: ['currency'] });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı');
    return party;
  }

  async create(dto: CreatePartyDto, userId?: number): Promise<Party> {
    if (dto.taxNumber) {
      const existing = await this.partyRepo.findOne({
        where: { taxNumber: dto.taxNumber },
        withDeleted: true
      });
      if (existing) {
        throw new BadRequestException(`'${dto.taxNumber}' vergi numarası ile başka bir cari mevcut (ID: ${existing.id}, İsim: ${existing.name}).`);
      }
    }

    if (!dto.currencyId) {
      try {
        const defaultCurrency = await this.currenciesService.getDefault();
        dto.currencyId = Number(defaultCurrency.id);
      } catch (error) {
        console.warn('Default currency not found, setting to null');
      }
    }
    const party = this.partyRepo.create({ ...dto, createdBy: userId });
    return this.partyRepo.save(party);
  }

  async update(id: number, dto: UpdatePartyDto, userId?: number): Promise<Party> {
    const party = await this.findOne(id);

    // DB-05: Uniqueness Check
    if (dto.taxNumber && dto.taxNumber !== party.taxNumber) {
      const existing = await this.partyRepo.findOne({ where: { taxNumber: dto.taxNumber } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`'${dto.taxNumber}' vergi numarası ile başka bir cari mevcut (${existing.name}).`);
      }
    }

    // Modernize mapping with strict field control
    const fields: (keyof Party)[] = [
      'name', 'type', 'phone1', 'phone2', 'taxOffice', 'taxNumber', 'email',
      'address', 'cityId', 'districtName', 'paymentTerms', 'currencyId', 'notes', 'state'
    ];

    fields.forEach((field) => {
      const dtoValue = dto[field as keyof UpdatePartyDto];
      if (dtoValue !== undefined) {
        // DB-04: Pasife alma kontrolü
        if (field === 'state' && dtoValue === 0 && !new Decimal(party.balance).isZero()) {
          throw new BadRequestException(
            `Bakiyesi olan cari hesaplar pasife alınamaz. Mevcut Bakiye: ${party.balance.toString()}. ` +
            `Lütfen önce finansal hesabı sıfırlayınız.`
          );
        }

        (party as unknown as Record<string, unknown>)[field] = dtoValue;
      }
    });

    // Explicit Decimal fields
    if (dto.creditLimit !== undefined) {
      party.creditLimit = new Decimal(dto.creditLimit);
    }

    party.updatedBy = userId || null;
    return this.partyRepo.save(party);
  }

  async softDelete(id: number): Promise<void> {
    const party = await this.findOne(id);

    // DB-04: Bakiye varsa silmeyi engelle
    if (!new Decimal(party.balance).isZero()) {
      throw new BadRequestException(
        `Bakiyesi olan cari hesaplar silinemez. Mevcut Bakiye: ${party.balance.toString()}. ` +
        `Lütfen önce finansal hesabı sıfırlayınız (Tahsilat/Ödeme).`
      );
    }

    // SEC-05: Aktif Sipariş Kontrolü
    const dataSource = this.partyRepo.manager.connection;
    const { Sale } = await import('../sales/entities/sale.entity');
    const activeSales = await dataSource.getRepository(Sale).count({
      where: { partyId: id, status: In(['draft', 'approved', 'shipped']) }
    });

    if (activeSales > 0) {
      throw new BadRequestException(
        `Bu cari hesaba ait ${activeSales} adet aktif satış/sipariş bulunmaktadır. ` +
        `Önce bunları iptal etmeli veya tamamlamalısınız.`
      );
    }

    const timestamp = Date.now();
    await this.partyRepo.update(id, {
      taxNumber: `_DEL_${timestamp}_${party.taxNumber || id}`.substring(0, 50),
      state: 0,
    });
    await this.partyRepo.softDelete(id);
  }


  async getBalance(id: number) {
    const party = await this.findOne(id);
    return {
      balance: Number(party.balance || 0),
      creditLimit: Number(party.creditLimit || 0),
      currency: party.currency?.code || 'TRY',
      symbol: party.currency?.symbol || '₺'
    };
  }

  // ────── V2 REFINEMENTS ──────

  async getStatus() {
    const [active, passive, all] = await Promise.all([
      this.partyRepo.count({ where: { state: 1 } }),
      this.partyRepo.count({ where: { state: 0 } }),
      this.partyRepo.find({ relations: ['currency'] }),
    ]);

    const totalReceivable = all.reduce((sum, p) => {
      const exchangeRate = new Decimal(p.currency?.exchangeRate || 1);
      return sum.plus(new Decimal(p.balance || 0).mul(exchangeRate));
    }, new Decimal(0));

    const totalCreditLimit = all.reduce((sum, p) => {
      const exchangeRate = new Decimal(p.currency?.exchangeRate || 1);
      return sum.plus(new Decimal(p.creditLimit || 0).mul(exchangeRate));
    }, new Decimal(0));

    const atRisk = all.filter(p => {
      const exchangeRate = new Decimal(p.currency?.exchangeRate || 1);
      const tlBalance = new Decimal(p.balance || 0).mul(exchangeRate);
      const tlLimit = new Decimal(p.creditLimit || 0).mul(exchangeRate);
      return p.state === 1 && tlLimit.gt(0) && tlBalance.abs().gte(tlLimit.mul(0.9));
    });

    return {
      active,
      passive,
      totalReceivable: totalReceivable.toNumber(),
      exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toDecimalPlaces(0).toNumber() : 0,
      atRiskCount: atRisk.length
    };
  }

  async getGlobalExposure() {
    const all = await this.partyRepo.find({ relations: ['currency'] });
    const totalReceivable = all.reduce((sum, p) => {
      const exchangeRate = p.currency?.exchangeRate || new Decimal(1);
      return sum.plus(new Decimal(p.balance || 0).mul(exchangeRate));
    }, new Decimal(0));

    const totalCreditLimit = all.reduce((sum, p) => {
      const exchangeRate = p.currency?.exchangeRate || new Decimal(1);
      return sum.plus(new Decimal(p.creditLimit || 0).mul(exchangeRate));
    }, new Decimal(0));

    return {
      totalReceivable: totalReceivable.toNumber(),
      totalCreditLimit: totalCreditLimit.toNumber(),
      exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toNumber() : 0
    };
  }

  async getHealthMetrics() {
    const all = await this.partyRepo.find({ where: { state: 1 }, relations: ['currency'] });
    const atRisk = all.filter(p => {
      const exchangeRate = p.currency?.exchangeRate || new Decimal(1);
      const tlBalance = new Decimal(p.balance || 0).mul(exchangeRate);
      const tlLimit = new Decimal(p.creditLimit || 0).mul(exchangeRate);
      return tlLimit.gt(0) && tlBalance.gte(tlLimit.mul(0.9));
    });

    return {
      healthyCount: all.length - atRisk.length,
      atRiskCount: atRisk.length,
      requiresAttention: atRisk.map(p => ({ id: p.id, name: p.name, balance: p.balance, limit: p.creditLimit }))
    };
  }
}
