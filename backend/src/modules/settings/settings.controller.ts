import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/setting.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.getSettingsMap();
  }

  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.updateByKey(key, dto.settingValue || '');
  }

  @Put()
  bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(dto.settings || []);
  }
}
