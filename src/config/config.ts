import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.PORT) || 3000,
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    name: process.env.POSTGRES_DB || 'filestorage',
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost/api/auth/google/callback',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
  },
  viteApiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost',
  frontendOrigin:
    process.env.FRONTEND_ORIGIN || process.env.VITE_API_BASE_URL || 'http://localhost:5173',
}));
