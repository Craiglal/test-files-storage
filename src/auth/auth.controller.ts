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
import {
  ApiBadRequestResponse,
  ApiFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    private authService: AuthService,
  ) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  @ApiOperation({
    summary: 'Start Google OAuth',
    description:
      'Redirects the user to the Google consent screen to authorize and continue login.',
  })
  @ApiFoundResponse({
    description: 'Redirect to Google OAuth consent screen.',
  })
  async auth() {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
    description:
      'Exchanges the Google profile for a JWT, sets it as the `access_token` cookie, and redirects to the client app.',
  })
  @ApiFoundResponse({
    description:
      'Sets Set-Cookie: access_token=<jwt>; redirects to the configured client URL.',
  })
  @ApiBadRequestResponse({ description: 'Unauthenticated or missing Google profile.' })
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
