import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ApprovedSaleNotice {
  saleId: string;
  saleCode: string;
  /** Web talebinin kimliği (Idempotency-Key). */
  externalRef: string;
}

const REQUEST_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;

/**
 * Web'den gelen bir satışın onayını ErmayWeb'e bildirir (web talebi PAID_OFFLINE olur).
 * Kişisel veri gönderilmez; web müşteriyi kendi kaydından bilir.
 * Yalnız outbox → RabbitMQ `sale.approved` dinleyicisinden çağrılır, yani commit sonrası ve tek kez.
 * Başarısızlıkta hata fırlatır; mesaj DLQ'ya düşer ve kaybolmaz.
 */
@Injectable()
export class IntegrationNotificationService {
  private readonly logger = new Logger(IntegrationNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async notifySaleApproved(sale: ApprovedSaleNotice): Promise<void> {
    const baseUrl = this.configService.get<string>('ERMAY_WEB_URL');
    const key = this.configService.get<string>('INTEGRATION_KEY');
    if (!baseUrl || !key) {
      this.logger.warn(`ErmayWeb notification skipped for sale ${sale.saleCode}: ERMAY_WEB_URL or INTEGRATION_KEY not configured`);
      return;
    }

    const url = new URL('/api/v1/integration/erp-sale-approved', baseUrl);
    const body = JSON.stringify({
      saleId: sale.saleId,
      saleCode: sale.saleCode,
      externalRef: sale.externalRef,
      status: 'approved',
    });

    let lastError = '';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-integration-key': key },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (res.ok) {
          this.logger.log(`ErmayWeb notified of approved sale ${sale.saleCode} (status ${res.status})`);
          return;
        }
        // Anahtar uyuşmazlığı yapılandırma hatasıdır: bildirimi kaybetme, DLQ'ya düşsün.
        if (res.status === 401 || res.status === 403) {
          throw new Error(`ErmayWeb rejected the integration key (status ${res.status})`);
        }
        // Diğer 4xx: tekrar denemek sonucu değiştirmez — kaydet ve bırak.
        if (res.status >= 400 && res.status < 500) {
          this.logger.warn(`ErmayWeb rejected approval notice for sale ${sale.saleCode} (status ${res.status})`);
          return;
        }
        lastError = `HTTP ${res.status}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }

    throw new Error(`ErmayWeb approval notice failed for sale ${sale.saleCode} after ${MAX_ATTEMPTS} attempts: ${lastError}`);
  }
}
