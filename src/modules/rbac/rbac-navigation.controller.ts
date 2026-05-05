import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentMember,
  CurrentOrganization,
  JwtAuthGuard,
  TenantGuard,
} from '../../common';
import { RbacNavigationResponseDto } from './dto';
import { RbacService } from './services/rbac.service';

@ApiTags('RBAC')
@ApiBearerAuth('JWT-auth')
@Controller('rbac')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RbacNavigationController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('navigation')
  @ApiOperation({
    summary: 'Get current member navigation contract',
    description:
      'Returns only the enabled and authorized modules/screens for the current tenant member after applying screen visibility, module enablement and permission scope rules.',
  })
  @ApiOkResponse({ type: RbacNavigationResponseDto })
  getNavigation(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('permissions') permissions: string[],
    @CurrentMember('enabledModules') enabledModules: string[],
  ) {
    return this.rbacService.getNavigation({
      organizationId,
      permissions: permissions ?? [],
      enabledModules: enabledModules ?? [],
    });
  }
}
