import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

// filepath: /home/oleksii/Документи/vreal-test/src/auth/dto/auth.dto.ts

export class RegisterUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    name!: string;

    @IsString()
    googleId!: string;

    @IsOptional()
    @IsUrl()
    photoUrl?: string;
}