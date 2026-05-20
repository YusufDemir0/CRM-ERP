import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsIn } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];

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
  @IsString()
  userId: string;

  @IsString()
  roleId: string;
}

export class SetUserPermissionDto {
  @IsString()
  userId: string;

  @IsString()
  permissionId: string;

  @IsString()
  @IsIn(['allow', 'deny'])
  effect: 'allow' | 'deny';

  @IsString()
  @IsIn(['global', 'department', 'own'])
  scopeType: 'global' | 'department' | 'own';

  @IsOptional() @IsString() scopeId?: string;
}

export class RemoveUserPermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  permissionId: string;
}
