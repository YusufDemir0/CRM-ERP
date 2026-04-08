import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { UserNote } from './entities/note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserNote])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
