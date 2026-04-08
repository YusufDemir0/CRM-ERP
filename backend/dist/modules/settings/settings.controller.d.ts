import { SettingsService } from './settings.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/setting.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    findAll(): Promise<Record<string, string>>;
    findByKey(key: string): Promise<import("./entities/setting.entity").Setting>;
    update(key: string, dto: UpdateSettingDto): Promise<import("./entities/setting.entity").Setting>;
    bulkUpdate(dto: BulkUpdateSettingsDto): Promise<import("./entities/setting.entity").Setting[]>;
}
