import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentTypeDto, UpdateDepartmentTypeDto } from './dto/department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('departments')
@UseGuards(AuthGuard('jwt'))
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) { return this.deptService.findAll(query); }

  @Get('status')
  getStatus() { return this.deptService.getStatus(); }

  @Get('types')
  findAllTypes() { return this.deptService.findAllTypes(); }

  @Post('types')
  createType(@Body() dto: CreateDepartmentTypeDto, @CurrentUser('sub') userId: number) { 
    return this.deptService.createType(dto, userId); 
  }

  @Put('types/:id')
  updateType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepartmentTypeDto, @CurrentUser('sub') userId: number) {
    return this.deptService.updateType(id, dto, userId);
  }

  @Delete('types/:id')
  removeType(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.softDeleteType(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.deptService.findOne(id); }

  @Post()
  create(@Body() dto: CreateDepartmentDto, @CurrentUser('sub') userId: number) { return this.deptService.create(dto, userId); }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepartmentDto, @CurrentUser('sub') userId: number) {
    return this.deptService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.deptService.softDelete(id); }
}
