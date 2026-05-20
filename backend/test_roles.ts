import { DataSource } from 'typeorm';
import { User } from './src/modules/auth/entities/user.entity';
import { Role } from './src/modules/auth/entities/role.entity';
import { Permission } from './src/modules/auth/entities/permission.entity';
import { UserRole } from './src/modules/auth/entities/user-role.entity';
import { UserPermission } from './src/modules/auth/entities/user-permission.entity';
import { RolePermission } from './src/modules/auth/entities/role-permission.entity';
import { Department } from './src/modules/departments/entities/department.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'erp_user',
  password: 'ermay_db_2026',
  database: 'ERPCRMDB',
  entities: [User, Role, Permission, UserRole, UserPermission, RolePermission, Department],
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  console.log('DB Connected.');

  const userId = '1'; // testadmin
  const user = await dataSource.getRepository(User).createQueryBuilder('user')
    .leftJoinAndSelect('user.roles', 'role')
    .leftJoinAndSelect('role.permissions', 'permission')
    .where('user.id = :userId', { userId })
    .getOne();

  console.log('User roles:', user?.roles);
  
  if (user?.roles && user.roles.length > 0) {
    console.log('Permissions count:', user.roles[0].permissions?.length);
  }

  // user_roles tablosundan düz SQL ile bakalım
  const rawUserRoles = await dataSource.query('SELECT * FROM user_roles');
  console.log('Raw user_roles:', rawUserRoles);

  process.exit(0);
}

run().catch(console.error);
