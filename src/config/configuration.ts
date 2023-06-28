import * as path from 'path';

export default () => ({
  port: parseInt(process.env.PORT || '', 10) || 3003,
  database: {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '', 10) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    migrationsRun: true,
    migrations: [
      path.join(__dirname, '..', '/database/migrations/**/*{.ts,.js}'),
    ],
    autoLoadEntities: true,
    logging: process.env.DB_LOGGING !== 'false',
    ssl:
      process.env.NODE_ENV != 'production'
        ? false
        : {
            rejectUnauthorized: false,
          },
    cli: {
      migrationsDir: __dirname + '/../database/migrations',
    },
    extra: {
      connectionLimit: 20, // Number of connections increased to improve parallel calls
    },
  },
});
