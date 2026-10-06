import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus, Headers, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { IntegrationAuthGuard } from './guards/integration-auth.guard';
import { IntegrationService } from './integration.service';
import { WebOrderDto, UpdateItemImageDto } from './dto/web-order.dto';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** ErmayWeb'in çağırdığı uçlar: JWT yerine paylaşılan anahtarla korunur. */
@Controller('integration')
@Public()
@UseGuards(IntegrationAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('items')
  @HttpCode(HttpStatus.OK)
  async getSyncableItems() {
    const items = await this.integrationService.getSyncableItems();
    return { success: true, count: items.length, items };
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createWebOrder(@Body() dto: WebOrderDto, @Headers('idempotency-key') idempotencyKey?: string) {
    if (!idempotencyKey || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new BadRequestException('Geçerli bir Idempotency-Key başlığı zorunludur (8-64 karakter, harf/rakam/-/_).');
    }
    return this.integrationService.createWebOrder(dto, idempotencyKey);
  }

  @Patch('items/:id/image')
  @HttpCode(HttpStatus.OK)
  async updateItemImage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemImageDto) {
    return this.integrationService.updateItemImage(String(id), dto.imageUrl);
  }
}
