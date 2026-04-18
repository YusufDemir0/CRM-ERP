import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotesService } from './notes.service';
import { UserNote } from './entities/note.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll(@Request() req: { user: { id: number } }) {
    return this.notesService.findAllByUser(req.user.id);
  }

  @Post()
  async create(@Request() req: { user: { id: number } }, @Body() data: Partial<UserNote>) {
    return this.notesService.create(req.user.id, data);
  }

  @Put(':id')
  async update(@Request() req: { user: { id: number } }, @Param('id') id: string, @Body() data: Partial<UserNote>) {
    return this.notesService.update(+id, req.user.id, data);
  }

  @Delete(':id')
  async remove(@Request() req: { user: { id: number } }, @Param('id') id: string) {
    return this.notesService.remove(+id, req.user.id);
  }
}
