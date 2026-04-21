import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
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
  AnalyticsCatalogResponseDto,
  AnalyticsDashboardResponseDto,
  AnalyticsMemberResponseDto,
  AnalyticsOperationsResponseDto,
  AnalyticsQueryDto,
  AnalyticsRevenueResponseDto,
} from './dto';
import { AnalyticsService } from './services';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.analytics)
@Permissions(SYSTEM_PERMISSIONS.analyticsRead)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get executive analytics dashboard',
    description:
      'Returns a SaaS-ready analytics overview with KPI cards, revenue, member growth, operational metrics and generated insights.',
  })
  @ApiOkResponse({ type: AnalyticsDashboardResponseDto })
  getDashboard(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getDashboard(organizationId, query);
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue analytics',
    description:
      'Returns invoiced, collected, overdue and outstanding amounts with top payment types, collection channels and trend buckets.',
  })
  @ApiOkResponse({ type: AnalyticsRevenueResponseDto })
  getRevenue(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getRevenue(organizationId, query);
  }

  @Get('members')
  @ApiOperation({
    summary: 'Get member growth analytics',
    description:
      'Returns current member composition, invitation conversion and growth trend data for the active tenant.',
  })
  @ApiOkResponse({ type: AnalyticsMemberResponseDto })
  getMembers(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getMembers(organizationId, query);
  }

  @Get('operations')
  @ApiOperation({
    summary: 'Get operational analytics',
    description:
      'Returns location usage, schedule coverage, audit activity, unread workload and enabled module visibility for the tenant.',
  })
  @ApiOkResponse({ type: AnalyticsOperationsResponseDto })
  getOperations(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getOperations(organizationId, query);
  }

  @Get('catalog')
  @ApiOperation({
    summary: 'Get analytics filter catalog',
    description:
      'Returns active payment types, payment methods, locations, currencies and enabled modules to power analytics dashboards or BI filters.',
  })
  @ApiOkResponse({ type: AnalyticsCatalogResponseDto })
  getCatalog(@CurrentOrganization('id') organizationId: string) {
    return this.analyticsService.getCatalog(organizationId);
  }
}
