import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
export declare class CommonModule implements OnModuleInit {
    private readonly dataSource;
    private readonly cls;
    constructor(dataSource: DataSource, cls: ClsService);
    onModuleInit(): void;
}
