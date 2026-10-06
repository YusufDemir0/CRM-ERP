import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Item } from '../inventory/items/entities/item.entity';
import { SalesModule } from '../sales/sales.module';
import { CommonModule } from '../../common/common.module';
import { RabbitMQModule } from '../../common/services/rabbitmq.module';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { IntegrationNotificationService } from './integration-notification.service';
import { SaleApprovedNotificationListener } from './listeners/sale-approved.listener';
import { IntegrationAuthGuard } from './guards/integration-auth.guard';
import { WebOrderLink } from './entities/web-order-link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, WebOrderLink]),
    ConfigModule,
    CommonModule,
    SalesModule,
    RabbitMQModule,
  ],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    IntegrationNotificationService,
    SaleApprovedNotificationListener,
    IntegrationAuthGuard,
  ],
})
export class IntegrationModule {}
