import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  saleId: string;

  @IsString()
  @IsNotEmpty()
  outgoingDepartmentId: string;

  @IsString()
  @IsNotEmpty()
  deliveryCity: string;

  @IsString()
  @IsNotEmpty()
  deliveryDistrict: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @IsOptional()
  @IsString()
  deliveryDistrict?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  carrierNameOrPlate?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(['pending', 'shipped', 'completed', 'cancelled'])
  status?: 'pending' | 'shipped' | 'completed' | 'cancelled';
}

export class DispatchShipmentDto {
  @IsOptional()
  @IsString()
  carrierNameOrPlate?: string;
}

export class ShipmentsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  today?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;
}
