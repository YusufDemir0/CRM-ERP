import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  settingKey: string;

  @IsString()
  @IsOptional()
  settingValue?: string;
}

export class BulkUpdateSettingsDto {
  @IsOptional()
  settings?: { settingKey: string; settingValue: string }[];
}
