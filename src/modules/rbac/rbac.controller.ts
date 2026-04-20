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
  Put,
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
  CurrentOrganization,
  JwtAuthGuard,
  ModulesGuard,
  Permissions,
  PermissionsGuard,
  RequireModules,
  SYSTEM_MODULES,
  SYSTEM_PERMISSIONS,
  TenantGuard,
} from '../../common';
import {
  CreateRoleDto,
  RbacAccessMatrixResponseDto,
  RbacMemberRoleResponseDto,
  RbacPermissionQueryDto,
  RbacPermissionResponseDto,
  RbacRoleQueryDto,
  RbacRoleResponseDto,
  ReplaceMemberRolesDto,
  ReplaceRolePermissionsDto,
  UpdateRoleDto,
} from './dto';
import { RbacService } from './services/rbac.service';

@ApiTags('RBAC')
@ApiBearerAuth('JWT-auth')
@Controller('rbac')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.settings)
@Permissions(SYSTEM_PERMISSIONS.rolesManage)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @ApiOperation({
    summary: 'List available SaaS permissions',
    description:
      'Returns the global permission catalog grouped by module metadata. These keys are assigned to tenant roles.',
  })
  @ApiOkResponse({ type: [RbacPermissionResponseDto] })
  listPermissions(@Query() query: RbacPermissionQueryDto) {
    return this.rbacService.listPermissions(query);
  }

  @Get('roles')
  @ApiOperation({
    summary: 'List tenant roles',
    description:
      'Cursor-paginated tenant role listing including assigned permissions and member counts.',
  })
  @ApiOkResponse({ type: [RbacRoleResponseDto] })
  listRoles(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: RbacRoleQueryDto,
  ) {
    return this.rbacService.listRoles(organizationId, query);
  }

  @Post('roles')
  @ApiOperation({
    summary: 'Create a custom tenant role',
    description:
      'Creates a non-system role scoped to the active organization and assigns the requested permission keys.',
  })
  @ApiCreatedResponse({ type: RbacRoleResponseDto })
  createRole(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rbacService.createRole(organizationId, dto);
  }

  @Get('roles/:roleId')
  @ApiOperation({
    summary: 'Get a tenant role',
    description:
      'Returns one role with its permission set and current member assignment count.',
  })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: RbacRoleResponseDto })
  getRole(
    @CurrentOrganization('id') organizationId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rbacService.getRole(organizationId, roleId);
  }

  @Patch('roles/:roleId')
  @ApiOperation({
    summary: 'Update custom role metadata',
    description:
      'Updates name, description and default flag. System roles are protected and cannot be mutated here.',
  })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: RbacRoleResponseDto })
  updateRole(
    @CurrentOrganization('id') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRole(organizationId, roleId, dto);
  }

  @Put('roles/:roleId/permissions')
  @ApiOperation({
    summary: 'Replace custom role permissions',
    description:
      'Replaces the full permission set for a custom role. Use this endpoint from settings when configuring module access.',
  })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: RbacRoleResponseDto })
  replaceRolePermissions(
    @CurrentOrganization('id') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() dto: ReplaceRolePermissionsDto,
  ) {
    return this.rbacService.replaceRolePermissions(organizationId, roleId, dto);
  }

  @Delete('roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a custom role',
    description:
      'Deletes a custom role only when it is not assigned to members. System roles remain protected.',
  })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: RbacRoleResponseDto })
  deleteRole(
    @CurrentOrganization('id') organizationId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rbacService.deleteRole(organizationId, roleId);
  }

  @Get('members/:memberId/roles')
  @ApiOperation({
    summary: 'Get roles assigned to a member',
    description:
      'Returns the active tenant member role assignments used to build JWT permissions.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: RbacMemberRoleResponseDto })
  getMemberRoles(
    @CurrentOrganization('id') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.rbacService.getMemberRoles(organizationId, memberId);
  }

  @Put('members/:memberId/roles')
  @ApiOperation({
    summary: 'Replace roles assigned to a member',
    description:
      'Replaces the complete role set for a member in the active tenant. The member should refresh or switch organization to receive updated JWT claims.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: RbacMemberRoleResponseDto })
  replaceMemberRoles(
    @CurrentOrganization('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: ReplaceMemberRolesDto,
  ) {
    return this.rbacService.replaceMemberRoles(organizationId, memberId, dto);
  }

  @Get('access-matrix')
  @ApiOperation({
    summary: 'Get tenant RBAC access matrix',
    description:
      'Returns enabled modules, visible screens, permission catalog and roles for the active organization settings UI.',
  })
  @ApiOkResponse({ type: RbacAccessMatrixResponseDto })
  getAccessMatrix(@CurrentOrganization('id') organizationId: string) {
    return this.rbacService.getAccessMatrix(organizationId);
  }
}
