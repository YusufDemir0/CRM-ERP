import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsIn } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];

  @IsOptional()
  @IsNumber()
  @IsIn([0, 1])
  state?: number;
}

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  module: string;
}

export class AssignRoleDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  roleId: number;
}

export class SetUserPermissionDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  permissionId: number;

  @IsString()
  @IsIn(['allow', 'deny'])
  effect: 'allow' | 'deny';

  @IsString()
  @IsIn(['global', 'department', 'own'])
  scopeType: 'global' | 'department' | 'own';

  @IsOptional()
  @IsNumber()
  scopeId?: number;
}
