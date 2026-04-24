import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  InvitationStatus,
  MemberStatus,
  PlatformRole,
  UserStatus,
} from 'generated/prisma/enums';
import { UsersService } from './users.service';

const createMemberRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'member-id',
  organizationId: 'organization-id',
  userId: 'user-id',
  status: MemberStatus.ACTIVE,
  phone: null,
  documentId: null,
  address: null,
  joinedAt: new Date('2026-04-20T00:00:00.000Z'),
  deletedAt: null,
  createdAt: new Date('2026-04-20T00:00:00.000Z'),
  updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  user: {
    id: 'user-id',
    email: 'coach@agoge.com',
    username: 'coach',
    passwordHash: 'hash',
    firstName: 'Alex',
    lastName: 'Coach',
    platformRole: PlatformRole.USER,
    status: UserStatus.ACTIVE,
    refreshTokenHash: null,
    deletedAt: null,
    createdAt: new Date('2026-04-20T00:00:00.000Z'),
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  },
  roles: [],
  ...overrides,
});

const createInvitationRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'invitation-id',
  organizationId: 'organization-id',
  invitedByMemberId: 'admin-member-id',
  email: 'coach@agoge.com',
  status: InvitationStatus.PENDING,
  tokenHash: 'hash',
  expiresAt: new Date('2026-04-27T00:00:00.000Z'),
  acceptedAt: null,
  revokedAt: null,
  createdAt: new Date('2026-04-20T00:00:00.000Z'),
  updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  ...overrides,
});

describe('UsersService', () => {
  const repository = {
    findMembersPage: jest.fn(),
    findMemberById: jest.fn(),
    findMembershipByUserId: jest.fn(),
    findUserByEmail: jest.fn(),
    usernameBelongsToAnotherUser: jest.fn(),
    documentIdBelongsToAnotherMember: jest.fn(),
    findRoleIdsByKeys: jest.fn(),
    findDefaultRoleIds: jest.fn(),
    createMember: jest.fn(),
    updateMember: jest.fn(),
    updateMemberStatus: jest.fn(),
    removeMember: jest.fn(),
    findInvitationsPage: jest.fn(),
    findPendingInvitationByEmail: jest.fn(),
    findInvitationById: jest.fn(),
    createInvitation: jest.fn(),
    revokeInvitation: jest.fn(),
    findInvitationByToken: jest.fn(),
    expireInvitation: jest.fn(),
    acceptInvitation: jest.fn(),
  };
  const passwordService = {
    hash: jest.fn(),
  };
  const realtimeService = {
    publishOrganizationEvent: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      repository as never,
      passwordService as never,
      realtimeService as never,
    );
  });

  it('requires a password when creating a brand-new platform user', async () => {
    repository.findUserByEmail.mockResolvedValue(null);

    await expect(
      service.createMember('organization-id', {
        email: 'coach@agoge.com',
        firstName: 'Alex',
        lastName: 'Coach',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createMember).not.toHaveBeenCalled();
  });

  it('rejects creating a member when user already belongs to tenant', async () => {
    repository.findUserByEmail.mockResolvedValue({ id: 'user-id' });
    repository.findMembershipByUserId.mockResolvedValue(createMemberRecord());

    await expect(
      service.createMember('organization-id', {
        email: 'coach@agoge.com',
        firstName: 'Alex',
        lastName: 'Coach',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents a member from removing itself', async () => {
    repository.findMemberById.mockResolvedValue(createMemberRecord());

    await expect(
      service.removeMember('organization-id', 'member-id', 'member-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.removeMember).not.toHaveBeenCalled();
  });

  it('expires stale invitations during acceptance', async () => {
    repository.findInvitationByToken.mockResolvedValue(
      createInvitationRecord({
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    );
    repository.expireInvitation.mockResolvedValue(
      createInvitationRecord({ status: InvitationStatus.EXPIRED }),
    );

    await expect(
      service.acceptInvitation({
        token: 'this-is-a-valid-length-token',
        firstName: 'Alex',
        lastName: 'Coach',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.acceptInvitation).not.toHaveBeenCalled();
  });

  it('emits a removed realtime event after deleting a member', async () => {
    repository.findMemberById.mockResolvedValue(createMemberRecord());
    repository.removeMember.mockResolvedValue(
      createMemberRecord({ status: MemberStatus.REMOVED }),
    );

    await service.removeMember('organization-id', 'member-id', 'other-member');

    expect(realtimeService.publishOrganizationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        domain: 'users',
        resource: 'member',
        action: 'removed',
      }),
    );
  });
});
