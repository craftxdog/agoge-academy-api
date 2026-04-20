import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentMember,
  CurrentOrganization,
  JwtAuthGuard,
  ModulesGuard,
  Permissions,
  PermissionsGuard,
  Public,
  RequireModules,
  SYSTEM_MODULES,
  SYSTEM_PERMISSIONS,
  TenantGuard,
} from '../../common';
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
} from './dto';
import { UsersService } from './services/users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.users)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('members')
  @Permissions(SYSTEM_PERMISSIONS.usersRead)
  @ApiOperation({
    summary: 'List tenant members',
    description:
      'Cursor-paginated member directory scoped to the active tenant. Includes account profile and assigned role summaries.',
  })
  @ApiOkResponse({ type: [MemberResponseDto] })
  listMembers(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: MemberQueryDto,
  ) {
    return this.usersService.listMembers(organizationId, query);
  }

  @Post('members')
  @Permissions(SYSTEM_PERMISSIONS.usersWrite)
  @ApiOperation({
    summary: 'Create or add a tenant member',
    description:
      'Creates a new platform user when email does not exist, or adds an existing platform user to the active tenant. Initial roles can be assigned by key.',
  })
  @ApiCreatedResponse({ type: MemberResponseDto })
  createMember(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.usersService.createMember(organizationId, dto);
  }

  @Get('members/:memberId')
  @Permissions(SYSTEM_PERMISSIONS.usersRead)
  @ApiOperation({
    summary: 'Get a tenant member',
    description:
      'Returns one member profile, platform account summary and assigned roles.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: MemberResponseDto })
  getMember(
    @CurrentOrganization('id') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.usersService.getMember(organizationId, memberId);
  }

  @Patch('members/:memberId')
  @Permissions(SYSTEM_PERMISSIONS.usersWrite)
  @ApiOperation({
    summary: 'Update tenant member profile',
    description:
      'Updates tenant member contact information and platform first/last name.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: MemberResponseDto })
  updateMember(
    @CurrentOrganization('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.usersService.updateMember(organizationId, memberId, dto);
  }

  @Patch('members/:memberId/status')
  @Permissions(SYSTEM_PERMISSIONS.usersWrite)
  @ApiOperation({
    summary: 'Suspend or reactivate a tenant member',
    description:
      'Changes membership status between ACTIVE and SUSPENDED. Members cannot change their own status.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: MemberResponseDto })
  updateMemberStatus(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('id') currentMemberId: string | undefined,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    return this.usersService.updateMemberStatus(
      organizationId,
      memberId,
      currentMemberId,
      dto,
    );
  }

  @Delete('members/:memberId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.usersWrite)
  @ApiOperation({
    summary: 'Remove a tenant member',
    description:
      'Soft-removes the member from the active tenant. The platform user remains available for other organizations.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: MemberResponseDto })
  removeMember(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('id') currentMemberId: string | undefined,
    @Param('memberId') memberId: string,
  ) {
    return this.usersService.removeMember(
      organizationId,
      memberId,
      currentMemberId,
    );
  }

  @Get('invitations')
  @Permissions(SYSTEM_PERMISSIONS.usersRead)
  @ApiOperation({
    summary: 'List tenant invitations',
    description:
      'Cursor-paginated invitation listing for the active tenant, including pending, accepted, expired and revoked records.',
  })
  @ApiOkResponse({ type: [InvitationResponseDto] })
  listInvitations(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: InvitationQueryDto,
  ) {
    return this.usersService.listInvitations(organizationId, query);
  }

  @Post('invitations')
  @Permissions(SYSTEM_PERMISSIONS.usersWrite)
  @ApiOperation({
    summary: 'Create a tenant invitation',
    description:
      'Creates a pending invitation and returns the raw token once so it can be delivered through email or another secure channel.',
  })
  @ApiCreatedResponse({ type: CreatedInvitationResponseDto })
  createInvitation(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('id') invitedByMemberId: string | undefined,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.usersService.createInvitation({
      organizationId,
      invitedByMemberId,
      dto,
    });
  }

  @Public()
  @Post('invitations/accept')
  @ApiOperation({
    summary: 'Accept a tenant invitation',
    description:
      'Public endpoint used by invited users to create or attach a platform account to the invited organization.',
  })
  @ApiOkResponse({ type: AcceptInvitationResponseDto })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.usersService.acceptInvitation(dto);
  }

  @Post('invitations/:invitationId/revoke')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.usersWrite)
  @ApiOperation({
    summary: 'Revoke a pending invitation',
    description: 'Marks an invitation as revoked for the active tenant.',
  })
  @ApiParam({ name: 'invitationId', format: 'uuid' })
  @ApiOkResponse({ type: InvitationResponseDto })
  revokeInvitation(
    @CurrentOrganization('id') organizationId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.usersService.revokeInvitation(organizationId, invitationId);
  }
}
