import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { UserNote } from './entities/note.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    const userId = String(user.sub);
    return this.notesService.findAllByUser(userId, user);
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() data: Partial<UserNote>) {
    const userId = String(user.sub);
    if (data.title?.startsWith('SATIŞ HATASI BİLDİRİMİ')) {
      data.status = 'new';
    }
    return this.notesService.create(userId, data);
  }

  @Put(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() data: Partial<UserNote>) {
    const userId = String(user.sub);
    return this.notesService.update(id, userId, data, user);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const userId = String(user.sub);
    return this.notesService.remove(id, userId, user);
  }
}
