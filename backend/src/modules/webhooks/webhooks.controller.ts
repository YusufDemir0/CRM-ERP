import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { WebhookGuard } from '../../common/guards/webhook.guard';

@Controller('webhooks')
export class WebhooksController {
  
  /**
   * SEC-03: Secure Webhook Endpoint
   * Enforced with HMAC validation.
   */
  @Public() // Webhooks are technically public but secured by HMAC Guard
  @UseGuards(WebhookGuard)
  @Post('receive')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() data: Record<string, unknown>) {
    // Process external system updates (e.g., payment status, order tracking)
    console.log('✅ Secure Webhook Received:', data);
    return { status: 'acknowledged' };
  }
}
