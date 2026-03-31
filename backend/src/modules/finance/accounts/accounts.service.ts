import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommercialAccount } from './entities/commercial-account.entity';
import { CreateAccountDto, UpdateAccountDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(CommercialAccount) private accRepo: Repository<CommercialAccount>) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<CommercialAccount>> {
    const qb = this.accRepo.createQueryBuilder('acc')
      .leftJoinAndSelect('acc.currency', 'currency');

    if (query.search) {
      qb.where('(acc.name LIKE :s OR acc.bankName LIKE :s)', { s: `%${query.search}%` });
    }

    qb.orderBy('acc.name', 'ASC').skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: number): Promise<CommercialAccount> {
    const acc = await this.accRepo.findOne({ where: { id }, relations: ['currency'] });
    if (!acc) throw new NotFoundException('Hesap bulunamadı');
    return acc;
  }

  async create(dto: CreateAccountDto, userId?: number): Promise<CommercialAccount> {
    const acc = this.accRepo.create({ ...dto, createdBy: userId });
    return this.accRepo.save(acc);
  }

  async update(id: number, dto: UpdateAccountDto, userId?: number): Promise<CommercialAccount> {
    const acc = await this.findOne(id);
    Object.assign(acc, dto);
    acc.updatedBy = userId || null;
    return this.accRepo.save(acc);
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id);
    await this.accRepo.softDelete(id);
  }
}
