import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
