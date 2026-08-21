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
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ERPCRMDB',
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
