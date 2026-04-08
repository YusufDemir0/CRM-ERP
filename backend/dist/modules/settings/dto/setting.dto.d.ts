export declare class UpdateSettingDto {
    settingKey: string;
    settingValue?: string;
}
export declare class BulkUpdateSettingsDto {
    settings?: {
        settingKey: string;
        settingValue: string;
    }[];
}
