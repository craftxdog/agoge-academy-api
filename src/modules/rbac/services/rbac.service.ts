import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult, SYSTEM_ROLES } from '../../../common';
import {
  CreatePermissionDto,
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
} from '../dto';
import {
  RbacAccessModuleRecord,
  RbacMemberRoleRecord,
  RbacPermissionRecord,
  RbacRepository,
  RbacRoleRecord,
} from '../repositories/rbac.repository';
import { RealtimeService } from '../../realtime';

@Injectable()
export class RbacService {
  constructor(
    private readonly rbacRepository: RbacRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  async listPermissions(
    query: RbacPermissionQueryDto,
  ): Promise<RbacPermissionResponseDto[]> {
    const permissions = await this.rbacRepository.findPermissions({
      moduleKey: query.moduleKey,
    });

    return permissions.map((permission) => this.mapPermission(permission));
  }

  async createPermission(
    organizationId: string,
    dto: CreatePermissionDto,
  ): Promise<RbacPermissionResponseDto> {
    const key = this.normalizeKey(dto.key);
    const moduleKey = dto.moduleKey
      ? this.normalizeKey(dto.moduleKey)
      : undefined;

    if (await this.rbacRepository.findPermissionByKey(key)) {
      throw new ConflictException('Permission key already exists');
    }

    const module = moduleKey
      ? await this.rbacRepository.findModuleByKey(moduleKey)
      : null;

    if (moduleKey && !module) {
      throw new BadRequestException('Module key does not exist');
    }

    const permission = await this.rbacRepository.createPermission({
      key,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      moduleId: module?.id,
    });

    const response = this.mapPermission(permission);

    this.emitRbacEvent({
      organizationId,
      resource: 'permission',
      action: 'created',
      entityId: response.id,
      data: response,
      invalidate: ['rbac.permissions', 'rbac.roles', 'rbac.access-matrix'],
    });

    return response;
  }

  async listRoles(
    organizationId: string,
    query: RbacRoleQueryDto,
  ): Promise<PaginatedResult<RbacRoleResponseDto>> {
    const page = await this.rbacRepository.findRolesPage(organizationId, query);

    return {
      ...page,
      items: page.items.map((role) => this.mapRole(role)),
      message: 'Roles retrieved successfully',
    };
  }

  async getRole(
    organizationId: string,
    roleId: string,
  ): Promise<RbacRoleResponseDto> {
    const role = await this.getRoleOrThrow(organizationId, roleId);

    return this.mapRole(role);
  }

  async createRole(
    organizationId: string,
    dto: CreateRoleDto,
  ): Promise<RbacRoleResponseDto> {
    const key = this.normalizeKey(dto.key);
    const permissionKeys = this.normalizeUniqueList(dto.permissionKeys ?? []);

    if (await this.rbacRepository.findRoleByKey(organizationId, key)) {
      throw new ConflictException('Role key already exists in this tenant');
    }

    await this.assertPermissionsExist(permissionKeys);

    const role = await this.rbacRepository.createRole({
      organizationId,
      key,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      isDefault: dto.isDefault,
      permissionKeys,
    });

    const response = this.mapRole(role);

    this.emitRbacEvent({
      organizationId,
      resource: 'role',
      action: 'created',
      entityId: response.id,
      data: response,
      invalidate: ['rbac.roles', 'rbac.access-matrix'],
    });

    return response;
  }

  async updateRole(
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<RbacRoleResponseDto> {
    const role = await this.getRoleOrThrow(organizationId, roleId);
    this.assertSystemRoleCanBeChanged(role);

    const updatedRole = await this.rbacRepository.updateRole({
      organizationId,
      roleId,
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      isDefault: dto.isDefault,
    });

    const response = this.mapRole(updatedRole);

    this.emitRbacEvent({
      organizationId,
      resource: 'role',
      action: 'updated',
      entityId: response.id,
      data: response,
      invalidate: ['rbac.roles', 'rbac.access-matrix'],
    });

    return response;
  }

  async replaceRolePermissions(
    organizationId: string,
    roleId: string,
    dto: ReplaceRolePermissionsDto,
  ): Promise<RbacRoleResponseDto> {
    const role = await this.getRoleOrThrow(organizationId, roleId);
    this.assertSystemRoleCanBeChanged(role);

    const permissionKeys = this.normalizeUniqueList(dto.permissionKeys);
    await this.assertPermissionsExist(permissionKeys);

    const updatedRole = await this.rbacRepository.replaceRolePermissions({
      organizationId,
      roleId,
      permissionKeys,
    });

    const response = this.mapRole(updatedRole);

    this.emitRbacEvent({
      organizationId,
      resource: 'role',
      action: 'permissions.replaced',
      entityId: response.id,
      data: response,
      invalidate: ['rbac.roles', 'rbac.access-matrix'],
    });

    return response;
  }

  async deleteRole(
    organizationId: string,
    roleId: string,
  ): Promise<RbacRoleResponseDto> {
    const role = await this.getRoleOrThrow(organizationId, roleId);
    this.assertSystemRoleCanBeChanged(role);

    if (role._count.members > 0) {
      throw new ConflictException(
        'Role is assigned to members and cannot be deleted',
      );
    }

    const deletedRole = await this.rbacRepository.deleteRole(
      organizationId,
      roleId,
    );

    const response = this.mapRole(deletedRole);

    this.emitRbacEvent({
      organizationId,
      resource: 'role',
      action: 'deleted',
      entityId: response.id,
      data: response,
      invalidate: ['rbac.roles', 'rbac.access-matrix'],
    });

    return response;
  }

  async getMemberRoles(
    organizationId: string,
    memberId: string,
  ): Promise<RbacMemberRoleResponseDto> {
    const member = await this.getMemberRolesOrThrow(organizationId, memberId);

    return this.mapMemberRoles(member);
  }

  async replaceMemberRoles(
    organizationId: string,
    memberId: string,
    dto: ReplaceMemberRolesDto,
  ): Promise<RbacMemberRoleResponseDto> {
    await this.getMemberRolesOrThrow(organizationId, memberId);

    const roleKeys = this.normalizeUniqueList(dto.roleKeys);
    await this.assertRolesExist(organizationId, roleKeys);

    const member = await this.rbacRepository.replaceMemberRoles({
      organizationId,
      memberId,
      roleKeys,
    });

    const response = this.mapMemberRoles(member);

    this.emitRbacEvent({
      organizationId,
      resource: 'member-role',
      action: 'roles.replaced',
      entityId: response.memberId,
      data: response,
      invalidate: ['rbac.member-roles', 'rbac.access-matrix', 'users.members'],
    });

    return response;
  }

  async getAccessMatrix(
    organizationId: string,
  ): Promise<RbacAccessMatrixResponseDto> {
    const [modules, rolesPage] = await Promise.all([
      this.rbacRepository.findAccessModules(organizationId),
      this.rbacRepository.findRolesPage(organizationId, {
        limit: 100,
        sortBy: 'key',
        sortDirection: 'asc',
      } as RbacRoleQueryDto),
    ]);

    return {
      organizationId,
      modules: modules.map((module) => this.mapAccessModule(module)),
      roles: rolesPage.items.map((role) => this.mapRole(role)),
    };
  }

  private async getRoleOrThrow(
    organizationId: string,
    roleId: string,
  ): Promise<RbacRoleRecord> {
    const role = await this.rbacRepository.findRoleById(organizationId, roleId);

    if (!role) {
      throw new NotFoundException('Role was not found in this tenant');
    }

    return role;
  }

  private async getMemberRolesOrThrow(
    organizationId: string,
    memberId: string,
  ): Promise<RbacMemberRoleRecord> {
    const member = await this.rbacRepository.findMemberRoles(
      organizationId,
      memberId,
    );

    if (!member) {
      throw new NotFoundException('Member was not found in this tenant');
    }

    return member;
  }

  private async assertPermissionsExist(
    permissionKeys: string[],
  ): Promise<void> {
    const existingKeys =
      await this.rbacRepository.findExistingPermissionKeys(permissionKeys);
    const missingKeys = permissionKeys.filter(
      (permissionKey) => !existingKeys.includes(permissionKey),
    );

    if (missingKeys.length > 0) {
      throw new BadRequestException({
        message: 'Some permission keys do not exist',
        missingPermissionKeys: missingKeys,
      });
    }
  }

  private async assertRolesExist(
    organizationId: string,
    roleKeys: string[],
  ): Promise<void> {
    const existingKeys = await this.rbacRepository.findExistingRoleKeys(
      organizationId,
      roleKeys,
    );
    const missingKeys = roleKeys.filter(
      (roleKey) => !existingKeys.includes(roleKey),
    );

    if (missingKeys.length > 0) {
      throw new BadRequestException({
        message: 'Some role keys do not exist in this tenant',
        missingRoleKeys: missingKeys,
      });
    }
  }

  private assertSystemRoleCanBeChanged(role: RbacRoleRecord): void {
    if (!role.isSystem) {
      return;
    }

    const message =
      role.key === SYSTEM_ROLES.admin
        ? 'The system admin role is protected because it must keep full tenant access'
        : 'System roles are protected and cannot be changed from RBAC endpoints';

    throw new ForbiddenException(message);
  }

  private normalizeKey(key: string): string {
    return key.trim().toLowerCase();
  }

  private normalizeUniqueList(values: string[]): string[] {
    return [...new Set(values.map((value) => this.normalizeKey(value)))];
  }

  private mapRole(role: RbacRoleRecord): RbacRoleResponseDto {
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      permissions: role.permissions.map((rolePermission) =>
        this.mapPermission(rolePermission.permission),
      ),
      memberCount: role._count.members,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private mapPermission(
    permission: RbacPermissionRecord,
  ): RbacPermissionResponseDto {
    return {
      id: permission.id,
      key: permission.key,
      name: permission.name,
      description: permission.description,
      module: permission.module
        ? {
            key: permission.module.key,
            name: permission.module.name,
            description: permission.module.description,
          }
        : null,
    };
  }

  private mapMemberRoles(
    member: RbacMemberRoleRecord,
  ): RbacMemberRoleResponseDto {
    return {
      memberId: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      status: member.status,
      roles: member.roles.map((memberRole) => this.mapRole(memberRole.role)),
    };
  }

  private mapAccessModule(module: RbacAccessModuleRecord) {
    const screens = module.organization.screens.filter(
      (screen) => screen.moduleId === module.moduleId,
    );

    return {
      key: module.module.key,
      name: module.module.name,
      isEnabled: module.isEnabled,
      permissions: module.module.permissions.map((permission) =>
        this.mapPermission(permission),
      ),
      screens: screens.map((screen) => ({
        key: screen.key,
        title: screen.title,
        path: screen.path,
        type: screen.type,
        requiredPermissionKey: screen.requiredPermissionKey,
        isVisible: screen.isVisible,
      })),
    };
  }

  private emitRbacEvent(params: {
    organizationId: string;
    resource: string;
    action: string;
    entityId?: string | null;
    data: unknown;
    invalidate: string[];
  }): void {
    this.realtimeService.publishOrganizationEvent({
      organizationId: params.organizationId,
      domain: 'rbac',
      resource: params.resource,
      action: params.action,
      entityId: params.entityId,
      data: params.data,
      invalidate: params.invalidate,
    });
  }
}
