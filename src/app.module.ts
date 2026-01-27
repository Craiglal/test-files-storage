import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { FolderModule } from './folder/folder.module';
import { Folder } from './folder/entities/folder.entity';
import { File } from './file/entities/file.entity';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [config.KEY],
      useFactory: (cfg: ConfigType<typeof config>) => ({
        type: 'postgres',
        host: cfg.database.host,
        port: cfg.database.port,
        username: cfg.database.username,
        password: cfg.database.password,
        database: cfg.database.name,
        entities: [User, Folder, File],
        synchronize: true,
      }),
    }),
    AuthModule,
    UserModule,
    FolderModule,
    FileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
