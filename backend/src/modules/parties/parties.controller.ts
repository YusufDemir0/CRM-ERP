import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto } from './dto/party.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  @RequirePermissions('CUSTOMER_VIEW')
  findAll(@Query() query: PartiesQueryDto) { return this.partiesService.findAll(query); }

  @Get('status')
  @RequirePermissions('CUSTOMER_VIEW')
  getStatus() { return this.partiesService.getStatus(); }

  @Get(':id')
  @RequirePermissions('CUSTOMER_VIEW')
  findOne(@Param('id') id: string) { return this.partiesService.findOne(id); }

  @Get(':id/balance')
  @RequirePermissions('CUSTOMER_VIEW')
  getBalance(@Param('id') id: string) { return this.partiesService.getBalance(id); }

  @Post()
  @RequirePermissions('CUSTOMER_CREATE')
  create(@Body() dto: CreatePartyDto, @CurrentUser('sub') userId: string) { return this.partiesService.create(dto, userId); }

  @Put(':id')
  @RequirePermissions('CUSTOMER_EDIT')
  update(@Param('id') id: string, @Body() dto: UpdatePartyDto, @CurrentUser('sub') userId: string) {
    return this.partiesService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('CUSTOMER_DELETE')
  remove(@Param('id') id: string) { return this.partiesService.softDelete(id); }
}
