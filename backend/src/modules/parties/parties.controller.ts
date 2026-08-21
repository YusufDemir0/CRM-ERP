import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PartiesService } from './parties.service';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto } from './dto/party.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { MovementsQueryDto } from './dto/party.dto';

@Controller('parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  @RequirePermissions('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL')
  findAll(@Query() query: PartiesQueryDto, @CurrentUser() user: JwtPayload) { 
    return this.partiesService.findAll(query, user); 
  }

  @Get('status')
  @RequirePermissions('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL')
  getStatus() { return this.partiesService.getStatus(); }

  @Get('all-movements')
  @RequirePermissions('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL')
  findAllMovements(@Query() query: MovementsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.partiesService.findAllMovements(query, user);
  }

  @Get('lookup')
  @RequirePermissions(
    'PARTIES_USE_SELECTION',
    'PARTIES_VIEW_OWN',
    'PARTIES_VIEW_DEPT',
    'PARTIES_VIEW_ALL',
    'SALES_CREATE',
    'SALES_EDIT_OWN',
    'SALES_EDIT_ALL',
    'SALES_VIEW_OWN',
    'SALES_VIEW_DEPT',
    'SALES_VIEW_ALL'
  )
  lookup(@Query('type') type?: string, @CurrentUser() user?: JwtPayload) { 
    return this.partiesService.lookup(type, user); 
  }

  @Get(':id')
  @RequirePermissions('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL')
  findOne(@Param('id') id: string) { return this.partiesService.findOne(id); }

  @Get(':id/balance')
  @RequirePermissions('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL')
  getBalance(@Param('id') id: string) { return this.partiesService.getBalance(id); }

  @Get(':id/statement')
  @RequirePermissions('PARTIES_VIEW_OWN', 'PARTIES_VIEW_DEPT', 'PARTIES_VIEW_ALL', 'PARTIES_VIEW_SALES_HISTORY')
  getStatement(@Param('id') id: string) { return this.partiesService.getStatement(id); }

  @Post()
  @RequirePermissions('PARTIES_CREATE')
  create(@Body() dto: CreatePartyDto, @CurrentUser('sub') userId: string) { return this.partiesService.create(dto, userId); }

  @Put(':id')
  @RequirePermissions('PARTIES_EDIT_OWN', 'PARTIES_EDIT_ALL')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePartyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.partiesService.update(id, dto, String(user.sub), user);
  }

  @Delete(':id')
  @RequirePermissions('PARTIES_DELETE')
  remove(@Param('id') id: string) { return this.partiesService.softDelete(id); }
}
