import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  MemberStatus,
  PlatformRole,
} from 'generated/prisma/enums';
import { PaginatedResult } from '../../../common';
import { PasswordService } from '../../auth';
import {
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  CreateInvitationDto,
  CreateMemberDto,
  CreatedInvitationResponseDto,
  InvitationQueryDto,
  InvitationResponseDto,
  MemberQueryDto,
  MemberResponseDto,
  UpdateMemberDto,
  UpdateMemberStatusDto,
} from '../dto';
import {
  UserInvitationRecord,
  UserMemberRecord,
  UsersRepository,
} from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async listMembers(
    organizationId: string,
    query: MemberQueryDto,
  ): Promise<PaginatedResult<MemberResponseDto>> {
    const page = await this.usersRepository.findMembersPage(
      organizationId,
      query,
    );

    return {
      ...page,
      items: page.items.map((member) => this.mapMember(member)),
      message: 'Members retrieved successfully',
    };
  }

  async getMember(
    organizationId: string,
    memberId: string,
  ): Promise<MemberResponseDto> {
    const member = await this.getMemberOrThrow(organizationId, memberId);

    return this.mapMember(member);
  }

  async createMember(
    organizationId: string,
    dto: CreateMemberDto,
  ): Promise<MemberResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const username = dto.username?.trim().toLowerCase();
    const existingUser = await this.usersRepository.findUserByEmail(email);

    if (existingUser) {
      const existingMember = await this.usersRepository.findMembershipByUserId({
        organizationId,
        userId: existingUser.id,
      });

      if (existingMember && existingMember.status !== MemberStatus.REMOVED) {
        throw new ConflictException('User already belongs to this tenant');
      }
    }

    if (!existingUser && !dto.password) {
      throw new BadRequestException(
        'Password is required when creating a new platform user',
      );
    }

    if (
      username &&
      (await this.usersRepository.usernameBelongsToAnotherUser({
        username,
        userId: existingUser?.id,
      }))
    ) {
      throw new ConflictException('Username is already registered');
    }

    if (dto.documentId) {
      await this.assertDocumentIdAvailable({
        organizationId,
        documentId: dto.documentId,
      });
    }

    const roleIds = await this.resolveRoleIds(
      organizationId,
      dto.roleKeys ?? [],
    );
    const passwordHash = dto.password
      ? await this.passwordService.hash(dto.password)
      : undefined;

    const member = await this.usersRepository.createMember({
      organizationId,
      email,
      username,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      passwordHash,
      phone: dto.phone?.trim(),
      documentId: dto.documentId?.trim(),
      address: dto.address?.trim(),
      roleIds,
    });

    return this.mapMember(member);
  }

  async updateMember(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    await this.getMemberOrThrow(organizationId, memberId);

    if (dto.documentId) {
      await this.assertDocumentIdAvailable({
        organizationId,
        documentId: dto.documentId,
        memberId,
      });
    }

    const member = await this.usersRepository.updateMember({
      organizationId,
      memberId,
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      phone: dto.phone?.trim(),
      documentId: dto.documentId?.trim(),
      address: dto.address?.trim(),
    });

    return this.mapMember(member);
  }

  async updateMemberStatus(
    organizationId: string,
    memberId: string,
    currentMemberId: string | undefined,
    dto: UpdateMemberStatusDto,
  ): Promise<MemberResponseDto> {
    await this.getMemberOrThrow(organizationId, memberId);
    this.assertNotSelfAction(
      memberId,
      currentMemberId,
      'change your own status',
    );

    const member = await this.usersRepository.updateMemberStatus({
      organizationId,
      memberId,
      status: dto.status,
    });

    return this.mapMember(member);
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    currentMemberId?: string,
  ): Promise<MemberResponseDto> {
    await this.getMemberOrThrow(organizationId, memberId);
    this.assertNotSelfAction(memberId, currentMemberId, 'remove yourself');

    const member = await this.usersRepository.removeMember(
      organizationId,
      memberId,
    );

    return this.mapMember(member);
  }

  async listInvitations(
    organizationId: string,
    query: InvitationQueryDto,
  ): Promise<PaginatedResult<InvitationResponseDto>> {
    const page = await this.usersRepository.findInvitationsPage(
      organizationId,
      query,
    );

    return {
      ...page,
      items: page.items.map((invitation) => this.mapInvitation(invitation)),
      message: 'Invitations retrieved successfully',
    };
  }

  async createInvitation(params: {
    organizationId: string;
    invitedByMemberId?: string;
    dto: CreateInvitationDto;
  }): Promise<CreatedInvitationResponseDto> {
    const email = this.normalizeEmail(params.dto.email);

    if (
      await this.usersRepository.findPendingInvitationByEmail(
        params.organizationId,
        email,
      )
    ) {
      throw new ConflictException('A pending invitation already exists');
    }

    const existingUser = await this.usersRepository.findUserByEmail(email);
    if (existingUser) {
      const existingMember = await this.usersRepository.findMembershipByUserId({
        organizationId: params.organizationId,
        userId: existingUser.id,
      });

      if (existingMember && existingMember.status !== MemberStatus.REMOVED) {
        throw new ConflictException('User already belongs to this tenant');
      }
    }

    const expiresAt = this.buildExpirationDate(params.dto.expiresInDays ?? 7);
    const invitation = await this.usersRepository.createInvitation({
      organizationId: params.organizationId,
      invitedByMemberId: params.invitedByMemberId,
      email,
      expiresAt,
    });

    return {
      ...this.mapInvitation(invitation),
      token: invitation.token,
    };
  }

  async revokeInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<InvitationResponseDto> {
    const existingInvitation = await this.usersRepository.findInvitationById(
      organizationId,
      invitationId,
    );

    if (!existingInvitation) {
      throw new NotFoundException('Invitation was not found in this tenant');
    }

    if (existingInvitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    const invitation = await this.usersRepository.revokeInvitation(
      organizationId,
      invitationId,
    );

    return this.mapInvitation(invitation);
  }

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    const invitation = await this.usersRepository.findInvitationByToken(
      dto.token,
    );

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new NotFoundException(
        'Invitation is not valid or no longer active',
      );
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      const expiredInvitation = await this.usersRepository.expireInvitation(
        invitation.id,
      );
      throw new BadRequestException({
        message: 'Invitation has expired',
        invitation: this.mapInvitation(expiredInvitation),
      });
    }

    const existingUser = await this.usersRepository.findUserByEmail(
      invitation.email,
    );
    const username = dto.username?.trim().toLowerCase();

    if (existingUser) {
      const existingMember = await this.usersRepository.findMembershipByUserId({
        organizationId: invitation.organizationId,
        userId: existingUser.id,
      });

      if (existingMember && existingMember.status !== MemberStatus.REMOVED) {
        throw new ConflictException('User already belongs to this tenant');
      }
    }

    if (
      username &&
      (await this.usersRepository.usernameBelongsToAnotherUser({
        username,
        userId: existingUser?.id,
      }))
    ) {
      throw new ConflictException('Username is already registered');
    }

    if (dto.documentId) {
      await this.assertDocumentIdAvailable({
        organizationId: invitation.organizationId,
        documentId: dto.documentId,
      });
    }

    const roleIds = await this.resolveRoleIds(invitation.organizationId, []);
    const accepted = await this.usersRepository.acceptInvitation({
      invitationId: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      username,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      passwordHash: await this.passwordService.hash(dto.password),
      phone: dto.phone?.trim(),
      documentId: dto.documentId?.trim(),
      address: dto.address?.trim(),
      roleIds,
    });

    return {
      member: this.mapMember(accepted.member),
      invitation: this.mapInvitation(accepted.invitation),
    };
  }

  private async getMemberOrThrow(
    organizationId: string,
    memberId: string,
  ): Promise<UserMemberRecord> {
    const member = await this.usersRepository.findMemberById(
      organizationId,
      memberId,
    );

    if (!member) {
      throw new NotFoundException('Member was not found in this tenant');
    }

    return member;
  }

  private async resolveRoleIds(
    organizationId: string,
    roleKeys: string[],
  ): Promise<string[]> {
    const normalizedRoleKeys = this.normalizeUniqueList(roleKeys);
    const roles =
      normalizedRoleKeys.length > 0
        ? await this.usersRepository.findRoleIdsByKeys(
            organizationId,
            normalizedRoleKeys,
          )
        : await this.usersRepository.findDefaultRoleIds(organizationId);
    const missingRoleKeys = normalizedRoleKeys.filter(
      (roleKey) => !roles.some((role) => role.key === roleKey),
    );

    if (missingRoleKeys.length > 0) {
      throw new BadRequestException({
        message: 'Some role keys do not exist in this tenant',
        missingRoleKeys,
      });
    }

    return roles.map((role) => role.id);
  }

  private async assertDocumentIdAvailable(params: {
    organizationId: string;
    documentId: string;
    memberId?: string;
  }): Promise<void> {
    if (
      await this.usersRepository.documentIdBelongsToAnotherMember({
        organizationId: params.organizationId,
        documentId: params.documentId.trim(),
        memberId: params.memberId,
      })
    ) {
      throw new ConflictException(
        'Document id is already assigned in this tenant',
      );
    }
  }

  private assertNotSelfAction(
    memberId: string,
    currentMemberId: string | undefined,
    action: string,
  ): void {
    if (memberId === currentMemberId) {
      throw new ForbiddenException(`You cannot ${action}`);
    }
  }

  private buildExpirationDate(expiresInDays: number): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return expiresAt;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeUniqueList(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim().toLowerCase()))];
  }

  private mapMember(member: UserMemberRecord): MemberResponseDto {
    return {
      id: member.id,
      organizationId: member.organizationId,
      user: {
        id: member.user.id,
        email: member.user.email,
        username: member.user.username,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        platformRole: member.user.platformRole ?? PlatformRole.USER,
        status: member.user.status,
      },
      status: member.status,
      phone: member.phone,
      documentId: member.documentId,
      address: member.address,
      joinedAt: member.joinedAt,
      roles: member.roles.map((memberRole) => ({
        key: memberRole.role.key,
        name: memberRole.role.name,
        isSystem: memberRole.role.isSystem,
      })),
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  private mapInvitation(
    invitation: UserInvitationRecord,
  ): InvitationResponseDto {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      status: invitation.status,
      invitedByMemberId: invitation.invitedByMemberId,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      revokedAt: invitation.revokedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }
}
