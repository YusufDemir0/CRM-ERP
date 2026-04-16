import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'benyaptim',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // CRITICAL: mevcut şemayı koruyoruz
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  charset: 'utf8mb4',
  timezone: '+00:00',
  extra: {
    connectionLimit: 50,
  },
}));
