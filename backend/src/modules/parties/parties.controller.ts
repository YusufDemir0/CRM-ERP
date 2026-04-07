import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto } from './dto/party.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('parties')
@UseGuards(AuthGuard('jwt'))
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  @RequirePermissions('musteri_goruntuleme')
  findAll(@Query() query: PartiesQueryDto) { return this.partiesService.findAll(query); }

  @Get('status')
  @RequirePermissions('musteri_goruntuleme')
  getStatus() { return this.partiesService.getStatus(); }

  @Get(':id')
  @RequirePermissions('musteri_goruntuleme')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.partiesService.findOne(id); }

  @Get(':id/balance')
  @RequirePermissions('musteri_goruntuleme')
  getBalance(@Param('id', ParseIntPipe) id: number) { return this.partiesService.getBalance(id); }

  @Post()
  @RequirePermissions('musteri_olusturma')
  create(@Body() dto: CreatePartyDto, @CurrentUser('sub') userId: number) { return this.partiesService.create(dto, userId); }

  @Put(':id')
  @RequirePermissions('musteri_duzenleme')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePartyDto, @CurrentUser('sub') userId: number) {
    return this.partiesService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('musteri_silme')
  remove(@Param('id', ParseIntPipe) id: number) { return this.partiesService.softDelete(id); }
}
