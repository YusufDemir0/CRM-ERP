import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, AccountsQueryDto } from '../dto/finance.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accService: AccountsService) {}

  @Get()
  findAll(@Query() query: AccountsQueryDto & { ignorePermissionRestrictions?: string }, @CurrentUser() user: JwtPayload) { 
    const isSelection = String(query.ignorePermissionRestrictions) === 'true';
    if (isSelection) {
      const hasSelect = user.isSystemAdmin ||
                        user.permissions?.includes('FINANCE_SELECT_ALL_CASH') ||
                        user.permissions?.includes('finance_select_all_cash') ||
                        user.permissions?.includes('FINANCE_SELECT_DEPT_CASH') ||
                        user.permissions?.includes('finance_select_dept_cash') ||
                        user.permissions?.includes('FINANCE_USE_SELECTION') ||
                        user.permissions?.includes('finance_use_selection') ||
                        user.permissions?.includes('FINANCE_VIEW_ALL') ||
                        user.permissions?.includes('finance_view_all') ||
                        user.permissions?.includes('FINANCE_VIEW_DEPT') ||
                        user.permissions?.includes('finance_view_dept') ||
                        user.permissions?.includes('SALES_CREATE') ||
                        user.permissions?.includes('sales_create') ||
                        user.permissions?.includes('SALES_EDIT_OWN') ||
                        user.permissions?.includes('sales_edit_own') ||
                        user.permissions?.includes('SALES_EDIT_ALL') ||
                        user.permissions?.includes('sales_edit_all') ||
                        user.permissions?.includes('SALES_VIEW_OWN') ||
                        user.permissions?.includes('sales_view_own') ||
                        user.permissions?.includes('SALES_VIEW_DEPT') ||
                        user.permissions?.includes('sales_view_dept') ||
                        user.permissions?.includes('SALES_VIEW_ALL') ||
                        user.permissions?.includes('sales_view_all');
      if (!hasSelect) {
        throw new ForbiddenException('Satışta kasa/banka seçebilme yetkiniz bulunmamaktadır.');
      }
    } else {
      const hasView = user.isSystemAdmin ||
                      user.permissions?.includes('FINANCE_VIEW_ALL') ||
                      user.permissions?.includes('finance_view_all') ||
                      user.permissions?.includes('FINANCE_VIEW_DEPT') ||
                      user.permissions?.includes('finance_view_dept');
      if (!hasView) {
        throw new ForbiddenException('Kasa ve banka hesaplarını görüntüleme yetkiniz bulunmamaktadır.');
      }
    }
    return this.accService.findAll(query, user);
  }

  @Get('status')
  @RequirePermissions('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL')
  getStatus() { return this.accService.getStatus(); }

  @Get(':id')
  @RequirePermissions('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL')
  findOne(@Param('id') id: string) { return this.accService.findOne(id); }

  @Post()
  @RequirePermissions('FINANCE_CREATE')
  create(@Body() dto: CreateAccountDto, @CurrentUser('sub') userId: string) { return this.accService.create(dto, userId); }

  @Put(':id')
  @RequirePermissions('FINANCE_EDIT')
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto, @CurrentUser('sub') userId: string) {
    return this.accService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('FINANCE_DELETE')
  remove(@Param('id') id: string) { return this.accService.softDelete(id); }
}
