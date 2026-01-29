import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsUrl()
  picture?: string;
}
