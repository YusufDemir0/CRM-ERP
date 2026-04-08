import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.notesService.findAllByUser(req.user.id);
  }

  @Post()
  async create(@Request() req: any, @Body() data: any) {
    return this.notesService.create(req.user.id, data);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.notesService.update(+id, req.user.id, data);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.notesService.remove(+id, req.user.id);
  }
}
