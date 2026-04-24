import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { Response } from 'express';
import { JwtAuthGuard, REFRESH_COOKIE } from '../../common';
import { PrismaService } from '../../database/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthSession } from './types';

describe('AuthController', () => {
  let controller: AuthController;
  const session: AuthSession = {
    user: {
      id: 'user-id',
      email: 'founder@agoge.com',
      username: 'founder',
      firstName: 'Alex',
      lastName: 'Founder',
      platformRole: 'USER',
    },
    activeMembership: null,
    memberships: [],
    tokens: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
    },
  };
  const authService = {
    registerOrganization: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    switchOrganization: jest.fn(),
    me: jest.fn(),
    logout: jest.fn(),
    getRefreshCookieMaxAgeMs: jest.fn().mockReturnValue(604800000),
  };

  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: PrismaService,
          useValue: {
            organizationMember: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('sets refresh cookie on login', async () => {
    authService.login.mockResolvedValue(session);

    await expect(
      controller.login(
        { email: 'founder@agoge.com', password: 'password' },
        response,
      ),
    ).resolves.toBe(session);
    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      'refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('clears refresh cookie on logout', async () => {
    authService.logout.mockResolvedValue({ loggedOut: true });

    await expect(controller.logout('user-id', response)).resolves.toEqual({
      loggedOut: true,
    });
    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
