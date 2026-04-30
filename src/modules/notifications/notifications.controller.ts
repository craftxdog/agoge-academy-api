import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
  NotificationListResponseDto,
  NotificationQueryDto,
  NotificationReadAllResponseDto,
  NotificationReadResponseDto,
  NotificationSummaryResponseDto,
} from './dto';
import { NotificationsService } from './services';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.notifications)
@Permissions(SYSTEM_PERMISSIONS.notificationsRead)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List shared tenant notifications',
    description:
      'Returns the historical operations inbox for the active tenant with cursor pagination, unread filters and text search.',
  })
  @ApiOkResponse({ type: NotificationListResponseDto })
  listNotifications(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.listNotifications(organizationId, query);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get notification inbox summary',
    description:
      'Returns the unread count plus the most recent shared tenant notifications for dropdowns and operational dashboards.',
  })
  @ApiOkResponse({ type: NotificationSummaryResponseDto })
  getSummary(@CurrentOrganization('id') organizationId: string) {
    return this.notificationsService.getSummary(organizationId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all shared tenant notifications as read',
  })
  @ApiOkResponse({ type: NotificationReadAllResponseDto })
  markAllAsRead(@CurrentOrganization('id') organizationId: string) {
    return this.notificationsService.markAllAsRead(organizationId);
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark one shared tenant notification as read',
  })
  @ApiParam({ name: 'notificationId', format: 'uuid' })
  @ApiOkResponse({ type: NotificationReadResponseDto })
  markAsRead(
    @CurrentOrganization('id') organizationId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(organizationId, notificationId);
  }
}
