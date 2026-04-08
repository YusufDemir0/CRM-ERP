import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../dto/finance.dto';

@Injectable()
export class CurrenciesService {
  constructor(@InjectRepository(Currency) private currencyRepo: Repository<Currency>) {}

  async findAll(): Promise<Currency[]> {
    return this.currencyRepo.find({ order: { isDefault: 'DESC', name: 'ASC' } });
  }

  async findOne(id: number): Promise<Currency> {
    const curr = await this.currencyRepo.findOne({ where: { id } });
    if (!curr) throw new NotFoundException('Para birimi bulunamadı');
    return curr;
  }

  async create(dto: CreateCurrencyDto, userId?: number): Promise<Currency> {
    const curr = this.currencyRepo.create({ ...dto, createdBy: userId });
    return this.currencyRepo.save(curr);
  }

  async update(id: number, dto: UpdateCurrencyDto, userId?: number): Promise<Currency> {
    const curr = await this.findOne(id);
    Object.assign(curr, dto);
    curr.updatedBy = userId || null;
    return this.currencyRepo.save(curr);
  }

  async getDefault(): Promise<Currency> {
    const curr = await this.currencyRepo.findOne({ where: { isDefault: 1 } });
    if (!curr) throw new NotFoundException('Varsayılan para birimi tanımlı değil');
    return curr;
  }

  async setDefault(id: number): Promise<Currency> {
    await this.currencyRepo
      .createQueryBuilder()
      .update(Currency)
      .set({ isDefault: 0 })
      .execute();
    
    const curr = await this.findOne(id);
    curr.isDefault = 1;
    return this.currencyRepo.save(curr);
  }

  async delete(id: number): Promise<void> {
    const curr = await this.findOne(id);
    if (curr.isDefault) {
      throw new BadRequestException('Varsayılan para birimi silinemez');
    }
    await this.currencyRepo.softDelete(id);
  }
}
