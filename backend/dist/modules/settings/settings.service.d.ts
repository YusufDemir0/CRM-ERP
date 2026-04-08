import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
export declare class SettingsService {
    private settingRepo;
    constructor(settingRepo: Repository<Setting>);
    findAll(): Promise<Setting[]>;
    findByKey(key: string): Promise<Setting>;
    getValue(key: string): Promise<string | null>;
    updateByKey(key: string, value: string): Promise<Setting>;
    bulkUpdate(items: {
        settingKey: string;
        settingValue: string;
    }[]): Promise<Setting[]>;
    getSettingsMap(): Promise<Record<string, string>>;
}
