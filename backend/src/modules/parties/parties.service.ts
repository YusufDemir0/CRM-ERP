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
      qb.where('(party.name LIKE :s OR party.phone1 LIKE :s OR party.email LIKE :s OR party.taxNumber LIKE :s)', { s: `%${query.search}%` });
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

  async getBalance(id: number): Promise<{ balance: number; creditLimitPlus: number; creditLimitMinus: number; available: number }> {
    const party = await this.findOne(id);
    const balance = Number(party.balance || 0);
    const plus = Number(party.creditLimitPlus || 0);
    const minus = Number(party.creditLimitMinus || 0);
    
    // Basit bir müsait limit hesabı: Alacak limitinden bakiyeyi çıkarıyoruz (Müşteri için)
    // Borç tarafında ise borç limitine ne kadar yaklaşıldığını gösterir.
    const available = plus - balance;

    return {
      balance,
      creditLimitPlus: plus,
      creditLimitMinus: minus,
      available,
    };
  }
}
