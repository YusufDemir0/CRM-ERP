import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto, UpdateDepartmentTypeDto, DepartmentsQueryDto } from './dto/department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Get()
  @RequirePermissions('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE', 'SALES_PAGE', 'FINANCE_PAGE', 'INVENTORY_PAGE', 'USERS_PAGE')
  findAll(@Query() query: DepartmentsQueryDto, @CurrentUser() user: JwtPayload) { 
    return this.deptService.findAll(query, user); 
  }

  @Get('status')
  @RequirePermissions('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE')
  getStatus() { return this.deptService.getStatus(); }

  @Get('types')
  @RequirePermissions('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE', 'USERS_PAGE', 'SYSTEM_PAGE')
  findAllTypes() { return this.deptService.findAllTypes(); }

  @Post('types')
  @RequirePermissions('DEPARTMENTS_CREATE')
  createType(@Body() dto: CreateDepartmentTypeDto, @CurrentUser('sub') userId: string) { 
    return this.deptService.createType(dto, userId); 
  }

  @Put('types/:id')
  @RequirePermissions('DEPARTMENTS_EDIT')
  updateType(@Param('id') id: string, @Body() dto: UpdateDepartmentTypeDto, @CurrentUser('sub') userId: string) {
    return this.deptService.updateType(id, dto, userId);
  }

  @Delete('types/:id')
  @RequirePermissions('DEPARTMENTS_DELETE')
  removeType(@Param('id') id: string) {
    return this.deptService.softDeleteType(id);
  }

  @Get(':id')
  @RequirePermissions('DEPARTMENTS_VIEW_ALL', 'DEPARTMENTS_PAGE')
  findOne(@Param('id') id: string) { return this.deptService.findOne(id); }

  @Post()
  @RequirePermissions('DEPARTMENTS_CREATE')
  create(@Body() dto: CreateDepartmentDto, @CurrentUser('sub') userId: string) { return this.deptService.create(dto, userId); }

  @Put(':id')
  @RequirePermissions('DEPARTMENTS_EDIT')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser('sub') userId: string) {
    return this.deptService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('DEPARTMENTS_DELETE')
  remove(@Param('id') id: string) { return this.deptService.softDelete(id); }
}
