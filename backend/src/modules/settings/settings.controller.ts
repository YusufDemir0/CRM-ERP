import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/setting.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('SYSTEM_VIEW')
  findAll() {
    return this.settingsService.getSettingsMap();
  }

  @Get(':key')
  @RequirePermissions('SYSTEM_VIEW')
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  @RequirePermissions('SYSTEM_EDIT_INFO')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.updateByKey(key, dto.settingValue || '');
  }

  @Put()
  @RequirePermissions('SYSTEM_EDIT_INFO')
  bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(dto.settings || []);
  }
}
