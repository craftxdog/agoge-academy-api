import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  COOKIE_PATHS,
  CurrentUser,
  JwtAuthGuard,
  Public,
  REFRESH_COOKIE,
  TenantRequest,
} from '../../common';
import {
  AuthSessionResponseDto,
  LoginDto,
  MeResponseDto,
  RefreshTokenDto,
  RegisterOrganizationDto,
  SwitchOrganizationDto,
} from './dto';
import { AuthService } from './services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-organization')
  @ApiOperation({
    summary: 'Create a new SaaS organization and founder account',
    description:
      'Creates the tenant organization, owner user, active membership, admin role assignment, enabled modules and default settings.',
  })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  async registerOrganization(
    @Body() dto: RegisterOrganizationDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.registerOrganization(dto);
    this.setRefreshCookie(response, session.tokens.refreshToken);

    return session;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate a user',
    description:
      'When organizationId or organizationSlug is provided, the access token includes tenant roles, permissions and enabled modules. If the user belongs to multiple organizations and no tenant is provided, the response lists memberships and activeMembership is null.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(response, session.tokens.refreshToken);

    return session;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({
    summary: 'Rotate refresh token and issue a new access token',
    description:
      'Reads the refresh token from the httpOnly cookie first, then from the request body as a fallback for non-browser clients.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  async refresh(
    @Req() request: TenantRequest,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE] ?? dto.refreshToken;
    const session = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(response, session.tokens.refreshToken);

    return session;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('switch-organization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Switch the active tenant organization',
    description:
      'Issues fresh tokens scoped to the selected organization, including roles, permissions and enabled modules for that membership.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  async switchOrganization(
    @CurrentUser('id') userId: string,
    @Body() dto: SwitchOrganizationDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.switchOrganization(userId, dto);
    this.setRefreshCookie(response, session.tokens.refreshToken);

    return session;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({
    summary: 'Get the current authenticated SaaS context',
    description:
      'Returns the platform user, memberships and the active tenant membership when the token is tenant-scoped.',
  })
  @ApiOkResponse({ type: MeResponseDto })
  async me(@CurrentUser('id') userId: string, @Req() request: TenantRequest) {
    return this.authService.me(userId, request.member?.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout and revoke the current refresh session',
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.logout(userId);
    this.clearRefreshCookie(response);

    return result;
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: COOKIE_PATHS.authRefresh,
      maxAge: this.authService.getRefreshCookieMaxAgeMs(),
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: COOKIE_PATHS.authRefresh,
    });
  }
}
