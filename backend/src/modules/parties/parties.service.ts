import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Party } from './entities/party.entity';
import { CreatePartyDto, UpdatePartyDto } from './dto/party.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PartiesService {
  constructor(
    @InjectRepository(Party)
    private partyRepo: Repository<Party>,
  ) {}

  async findAll(query: PaginationDto & { type?: string }): Promise<PaginatedResult<Party>> {
    const qb = this.partyRepo.createQueryBuilder('party')
      .leftJoinAndSelect('party.currency', 'currency');

    if (query.search) {
      qb.where('(party.name LIKE :s OR party.phone1 LIKE :s OR party.email LIKE :s OR party.taxNumber LIKE :s OR party.taxOffice LIKE :s OR party.city LIKE :s OR party.address LIKE :s OR party.notes LIKE :s OR currency.name LIKE :s)', { s: `%${query.search}%` });
    }

    if (query.type) {
      qb.andWhere('party.type = :type', { type: query.type });
    }

    qb.orderBy(`party.${query.sortBy || 'name'}`, query.sortOrder || 'ASC');
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
    const party = this.partyRepo.create({ ...dto, createdBy: userId });
    return this.partyRepo.save(party);
  }

  async update(id: number, dto: UpdatePartyDto, userId?: number): Promise<Party> {
    const party = await this.findOne(id);
    Object.assign(party, dto);
    party.updatedBy = userId || null;
    return this.partyRepo.save(party);
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id);
    await this.partyRepo.softDelete(id);
  }

  async getBalance(id: number) {
    const party = await this.findOne(id);
    return {
      balance: Number(party.balance || 0),
      creditLimit: Number(party.creditLimitPlus || 0),
      currency: party.currency?.code || 'TRY',
      symbol: party.currency?.symbol || '₺'
    };
  }

  // ────── V2 REFINEMENTS ──────

  async getStatus() {
    const [active, passive, all] = await Promise.all([
      this.partyRepo.count({ where: { state: 1 } }),
      this.partyRepo.count({ where: { state: 0 } }),
      this.partyRepo.find(),
    ]);

    const totalReceivable = all.reduce((sum, p) => sum + Number(p.balance || 0), 0);
    const totalCreditLimit = all.reduce((sum, p) => sum + Number(p.creditLimitPlus || 0), 0);
    const atRisk = all.filter(p => p.state === 1 && Number(p.balance) >= Number(p.creditLimitPlus) * 0.9);
    
    return { 
      active, 
      passive,
      totalReceivable,
      exposurePercentage: totalCreditLimit > 0 ? Math.round((totalReceivable / totalCreditLimit) * 100) : 0,
      atRiskCount: atRisk.length
    };
  }

  async getGlobalExposure() {
    const all = await this.partyRepo.find();
    const totalReceivable = all.reduce((sum, p) => sum + Number(p.balance || 0), 0);
    const totalCreditLimit = all.reduce((sum, p) => sum + Number(p.creditLimitPlus || 0), 0);
    
    return {
      totalReceivable,
      totalCreditLimit,
      exposurePercentage: totalCreditLimit > 0 ? (totalReceivable / totalCreditLimit) * 100 : 0
    };
  }

  async getHealthMetrics() {
    const all = await this.partyRepo.find({ where: { state: 1 } });
    const atRisk = all.filter(p => Number(p.balance) >= Number(p.creditLimitPlus) * 0.9);
    
    return {
      healthyCount: all.length - atRisk.length,
      atRiskCount: atRisk.length,
      requiresAttention: atRisk.map(p => ({ id: p.id, name: p.name, balance: p.balance, limit: p.creditLimitPlus }))
    };
  }
}
