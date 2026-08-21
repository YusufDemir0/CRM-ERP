import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'))
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermissions('SHIPMENT_VIEW')
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('SHIPMENT_VIEW')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @RequirePermissions('SHIPMENT_MANAGE')
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('SHIPMENT_MANAGE')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SHIPMENT_MANAGE')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
