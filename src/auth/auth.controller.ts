import {
    Controller,
    Get,
    HttpStatus,
    Inject,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleOauthGuard } from './guard/google-auth.guard';
import type { ConfigType } from '@nestjs/config';
import config from '../config/config';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject(config.KEY) private configService: ConfigType<typeof config>,
        private authService: AuthService
    ) { }

    @Get('google')
    @UseGuards(GoogleOauthGuard)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async auth() { }

    @Get('google/callback')
    @UseGuards(GoogleOauthGuard)
    async googleAuthCallback(@Req() req, @Res() res: Response) {
        const token = await this.authService.signIn(req.user);

        res.cookie('access_token', token, {
            maxAge: 2592000000,
            sameSite: true,
            secure: false,
        });

        return res.redirect(HttpStatus.FOUND, this.configService.viteApiBaseUrl);
    }
}