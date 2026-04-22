import { Controller, Get, Post, Put, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  create(@Body() createStaffDto: CreateStaffDto, @Request() req: { user: { id: number } }) {
    return this.staffService.create(createStaffDto, req.user.id);
  }

  @Get()
  findAll(@Query() query: { departmentId?: number; page?: number; limit?: number; state?: number }) {
    return this.staffService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto, @Request() req: { user: { id: number } }) {
    return this.staffService.update(+id, updateStaffDto, req.user.id);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string, @Request() req: { user: { id: number } }) {
    return this.staffService.toggleActive(+id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: { id: number } }) {
    return this.staffService.remove(+id, req.user.id);
  }
}
