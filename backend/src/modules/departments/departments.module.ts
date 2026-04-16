import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';
import { DepartmentType } from './entities/department-type.entity';
import { User } from '../auth/entities/user.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Department, DepartmentType, User, Stock])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
