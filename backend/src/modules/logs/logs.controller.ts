import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { LogsQueryDto } from './dto/logs-query.dto';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @RequirePermissions('system:manage')
  async findAll(@Query() query: LogsQueryDto) {
    return this.logsService.findAll(query);
  }
}
