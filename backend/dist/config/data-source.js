"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)();
exports.default = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'benyaptim',
    entities: [(0, path_1.join)(__dirname, '/../**/*.entity{.ts,.js}')],
    migrations: [(0, path_1.join)(__dirname, '/../database/migrations/*{.ts,.js}')],
    synchronize: false,
    logging: true,
});
//# sourceMappingURL=data-source.js.map