import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepo: Repository<Setting>,
  ) {}

  async findAll(): Promise<Setting[]> {
    return this.settingRepo.find({ order: { settingKey: 'ASC' } });
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingRepo.findOne({ where: { settingKey: key } });
    if (!setting) throw new NotFoundException(`Ayar bulunamadı: ${key}`);
    return setting;
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.settingRepo.findOne({ where: { settingKey: key } });
    return setting?.settingValue ?? null;
  }

  async updateByKey(key: string, value: string): Promise<Setting> {
    let setting = await this.settingRepo.findOne({ where: { settingKey: key } });
    if (!setting) {
      setting = this.settingRepo.create({ settingKey: key, settingValue: value });
    } else {
      setting.settingValue = value;
    }
    return this.settingRepo.save(setting);
  }

  async bulkUpdate(items: { settingKey: string; settingValue: string }[]): Promise<Setting[]> {
    const results: Setting[] = [];
    for (const item of items) {
      const updated = await this.updateByKey(item.settingKey, item.settingValue);
      results.push(updated);
    }
    return results;
  }

  async getSettingsMap(): Promise<Record<string, string>> {
    const all = await this.findAll();
    const map: Record<string, string> = {};
    for (const s of all) {
      map[s.settingKey] = s.settingValue || '';
    }
    return map;
  }
}
