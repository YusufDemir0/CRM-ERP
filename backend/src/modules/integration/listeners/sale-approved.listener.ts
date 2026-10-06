import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { IntegrationNotificationService } from '../integration-notification.service';
import { Sale } from '../../sales/entities/sale.entity';
import { WebOrderLink } from '../entities/web-order-link.entity';

interface SaleApprovedPayload {
  sale?: { id?: string | number };
}

/**
 * `sale.approved` (outbox → RabbitMQ) olayında, satış web'den geldiyse ErmayWeb'e bildirir.
 * Mağaza satışları web'e gönderilmez. Hata fırlatılırsa mesaj DLQ'ya düşer.
 */
@Injectable()
export class SaleApprovedNotificationListener implements OnModuleInit {
  private readonly logger = new Logger(SaleApprovedNotificationListener.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly notificationService: IntegrationNotificationService,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.setupConsumer();
  }

  private setupConsumer() {
    const trySubscribe = async () => {
      if (!this.rabbitMQService.isConnected()) {
        setTimeout(trySubscribe, 2000);
        return;
      }
      await this.rabbitMQService.subscribe(
        'ermay.integration.sale_approved_notify',
        'sale.approved',
        async (msg) => {
          const payload = JSON.parse(msg.content.toString()) as SaleApprovedPayload;
          const saleId = payload.sale?.id;
          if (!saleId) return;

          const link = await this.dataSource.getRepository(WebOrderLink).findOne({ where: { saleId: String(saleId) } });
          if (!link) return; // web'den gelmeyen satış

          const sale = await this.dataSource.getRepository(Sale).findOne({
            where: { id: String(saleId) },
            select: { id: true, code: true },
          });
          if (!sale) {
            this.logger.warn(`Approved sale ${saleId} linked to a web order was not found`);
            return;
          }

          await this.notificationService.notifySaleApproved({
            saleId: String(sale.id),
            saleCode: sale.code,
            externalRef: link.idempotencyKey,
          });
        },
      );
    };
    void trySubscribe();
  }
}
