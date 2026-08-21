import { Controller, Get, Post, Body, Param, Query, UseGuards, StreamableFile, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShipmentsService } from './shipments.service';
import { DispatchShipmentDto, ShipmentsQueryDto } from './dto/shipment.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('shipments')
@UseGuards(AuthGuard('jwt'))
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  @RequirePermissions('SHIPMENT_VIEW')
  findAll(@Query() query: ShipmentsQueryDto) {
    return this.shipmentsService.findAll(query);
  }

  @Get('metrics')
  @RequirePermissions('SHIPMENT_VIEW')
  getMetrics() {
    return this.shipmentsService.getMetrics();
  }

  @Get('export-excel')
  @RequirePermissions('SHIPMENT_VIEW')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="sevkiyat_havuzu.xlsx"')
  async exportExcel(@Query() query: ShipmentsQueryDto): Promise<StreamableFile> {
    return this.shipmentsService.exportToExcel(query);
  }

  @Get(':id')
  @RequirePermissions('SHIPMENT_VIEW')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Post(':id/dispatch')
  @RequirePermissions('SHIPMENT_MANAGE')
  dispatch(
    @Param('id') id: string,
    @Body() dto: DispatchShipmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.shipmentsService.dispatch(id, dto, userId);
  }

  @Post(':id/complete')
  @RequirePermissions('SHIPMENT_MANAGE')
  complete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.shipmentsService.complete(id, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions('SHIPMENT_MANAGE')
  cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.shipmentsService.cancel(id, userId);
  }
}
