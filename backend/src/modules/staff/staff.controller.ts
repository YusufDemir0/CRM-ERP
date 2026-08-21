import { Controller, Get, Post, Put, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @RequirePermissions('USERS_CREATE')
  create(@Body() createStaffDto: CreateStaffDto, @Request() req: { user: { id: string } }) {
    return this.staffService.create(createStaffDto, req.user.id);
  }

  @Get()
  @RequirePermissions('USERS_VIEW_DEPT', 'USERS_VIEW_ALL')
  findAll(@Query() query: { departmentId: string; page?: number; limit?: number; state?: number }) {
    return this.staffService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('USERS_VIEW_DEPT', 'USERS_VIEW_ALL')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('USERS_EDIT')
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto, @Request() req: { user: { id: string } }) {
    return this.staffService.update(id, updateStaffDto, req.user.id);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('USERS_LOCK_ACCOUNT')
  toggleActive(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.staffService.toggleActive(id, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions('USERS_DELETE')
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.staffService.remove(id, req.user.id);
  }
}
