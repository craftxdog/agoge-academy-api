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
  CurrentMember,
  CurrentOrganization,
  JwtAuthGuard,
  Permissions,
  PermissionsGuard,
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

@ApiTags('Activity')
@ApiBearerAuth('JWT-auth')
@Controller('activity')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Permissions(SYSTEM_PERMISSIONS.notificationsSelfRead)
export class NotificationsActivityController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List personal activity notifications',
    description:
      'Returns member-scoped activity notifications used for customer or self-service experiences.',
  })
  @ApiOkResponse({ type: NotificationListResponseDto })
  listActivity(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('id') memberId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.listActivity(
      organizationId,
      memberId,
      query,
    );
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get personal activity summary',
    description:
      'Returns unread count and recent member activity for lightweight header centers or self-service dashboards.',
  })
  @ApiOkResponse({ type: NotificationSummaryResponseDto })
  getActivitySummary(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('id') memberId: string,
  ) {
    return this.notificationsService.getActivitySummary(
      organizationId,
      memberId,
    );
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all personal activity notifications as read',
  })
  @ApiOkResponse({ type: NotificationReadAllResponseDto })
  markAllActivityAsRead(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('id') memberId: string,
  ) {
    return this.notificationsService.markAllActivityAsRead(
      organizationId,
      memberId,
    );
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark one personal activity notification as read',
  })
  @ApiParam({ name: 'notificationId', format: 'uuid' })
  @ApiOkResponse({ type: NotificationReadResponseDto })
  markActivityAsRead(
    @CurrentOrganization('id') organizationId: string,
    @CurrentMember('id') memberId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markActivityAsRead(
      organizationId,
      memberId,
      notificationId,
    );
  }
}
