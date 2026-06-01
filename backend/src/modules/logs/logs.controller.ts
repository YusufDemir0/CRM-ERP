import { Controller, Get, Post, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { LogsQueryDto } from './dto/logs-query.dto';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @RequirePermissions('AUDIT_LOG_VIEW')
  async findAll(@Query() query: LogsQueryDto) {
    return this.logsService.findAll(query);
  }

  @Get('notifications')
  async getNotifications() {
    return this.logsService.getNotifications();
  }

  @Post('notifications/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.logsService.markAsRead(id);
  }

  @Post('notifications/read-all')
  async markAllAsRead() {
    return this.logsService.markAllAsRead();
  }
}
