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
  BusinessHourQueryDto,
  BusinessHourResponseDto,
  CreateBusinessHourDto,
  CreateLocationDto,
  CreateMemberScheduleDto,
  CreateScheduleExceptionDto,
  DayScheduleQueryDto,
  DayScheduleResponseDto,
  LocationQueryDto,
  LocationResponseDto,
  MemberScheduleQueryDto,
  MemberScheduleResponseDto,
  ReplaceMemberSchedulesDto,
  ScheduleExceptionQueryDto,
  ScheduleExceptionResponseDto,
  UpdateBusinessHourDto,
  UpdateLocationDto,
  UpdateMemberScheduleDto,
  UpdateScheduleExceptionDto,
  UpsertBusinessHoursDto,
} from './dto';
import { SchedulesService } from './services';

@ApiTags('Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('schedules')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.schedules)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('day')
  @Permissions(SYSTEM_PERMISSIONS.schedulesRead)
  @ApiOperation({
    summary: 'Get effective day schedule',
    description:
      'Builds the effective local day in America/Managua by combining organization hours, location overrides, exceptions and member availability.',
  })
  @ApiOkResponse({ type: DayScheduleResponseDto })
  getDaySchedule(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: DayScheduleQueryDto,
  ) {
    return this.schedulesService.getDaySchedule(organizationId, query);
  }

  @Get('locations')
  @Permissions(SYSTEM_PERMISSIONS.schedulesRead)
  @ApiOperation({
    summary: 'List tenant locations',
    description:
      'Returns tenant branches or training locations. Nicaragua timezone defaults to America/Managua.',
  })
  @ApiOkResponse({ type: [LocationResponseDto] })
  listLocations(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: LocationQueryDto,
  ) {
    return this.schedulesService.listLocations(organizationId, query);
  }

  @Post('locations')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({
    summary: 'Create a tenant location',
    description:
      'Creates a branch/location for business hours and member schedules. Defaults timezone to America/Managua.',
  })
  @ApiCreatedResponse({ type: LocationResponseDto })
  createLocation(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.schedulesService.createLocation(organizationId, dto);
  }

  @Patch('locations/:locationId')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({ summary: 'Update a tenant location' })
  @ApiParam({ name: 'locationId', format: 'uuid' })
  @ApiOkResponse({ type: LocationResponseDto })
  updateLocation(
    @CurrentOrganization('id') organizationId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.schedulesService.updateLocation(
      organizationId,
      locationId,
      dto,
    );
  }

  @Delete('locations/:locationId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({
    summary: 'Delete or deactivate a location',
    description:
      'Deletes unused locations. Locations referenced by hours, exceptions or member schedules are safely marked inactive.',
  })
  @ApiParam({ name: 'locationId', format: 'uuid' })
  @ApiOkResponse({ type: LocationResponseDto })
  deleteLocation(
    @CurrentOrganization('id') organizationId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.schedulesService.deleteLocation(organizationId, locationId);
  }

  @Get('business-hours')
  @Permissions(SYSTEM_PERMISSIONS.schedulesRead)
  @ApiOperation({
    summary: 'List business hours',
    description:
      'Returns organization-level or location-specific weekly business hours. dayOfWeek uses 0 Sunday through 6 Saturday.',
  })
  @ApiOkResponse({ type: [BusinessHourResponseDto] })
  listBusinessHours(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: BusinessHourQueryDto,
  ) {
    return this.schedulesService.listBusinessHours(organizationId, query);
  }

  @Post('business-hours')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({
    summary: 'Create a business-hour window',
    description:
      'Adds one weekly opening or closed interval using HH:mm local Nicaragua time.',
  })
  @ApiCreatedResponse({ type: BusinessHourResponseDto })
  createBusinessHour(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateBusinessHourDto,
  ) {
    return this.schedulesService.createBusinessHour(organizationId, dto);
  }

  @Put('business-hours')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({
    summary: 'Replace business hours for one scope',
    description:
      'Atomically replaces all weekly business-hour rules for either the organization scope or one locationId scope.',
  })
  @ApiOkResponse({ type: [BusinessHourResponseDto] })
  replaceBusinessHours(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: UpsertBusinessHoursDto,
  ) {
    return this.schedulesService.replaceBusinessHours(organizationId, dto);
  }

  @Patch('business-hours/:businessHourId')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({ summary: 'Update a business-hour window' })
  @ApiParam({ name: 'businessHourId', format: 'uuid' })
  @ApiOkResponse({ type: BusinessHourResponseDto })
  updateBusinessHour(
    @CurrentOrganization('id') organizationId: string,
    @Param('businessHourId') businessHourId: string,
    @Body() dto: UpdateBusinessHourDto,
  ) {
    return this.schedulesService.updateBusinessHour(
      organizationId,
      businessHourId,
      dto,
    );
  }

  @Delete('business-hours/:businessHourId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({ summary: 'Delete a business-hour window' })
  @ApiParam({ name: 'businessHourId', format: 'uuid' })
  @ApiOkResponse({ type: BusinessHourResponseDto })
  deleteBusinessHour(
    @CurrentOrganization('id') organizationId: string,
    @Param('businessHourId') businessHourId: string,
  ) {
    return this.schedulesService.deleteBusinessHour(
      organizationId,
      businessHourId,
    );
  }

  @Get('exceptions')
  @Permissions(SYSTEM_PERMISSIONS.schedulesRead)
  @ApiOperation({
    summary: 'List schedule exceptions',
    description:
      'Returns date-based closures, partial closures or special opening hours for Nicaragua local dates.',
  })
  @ApiOkResponse({ type: [ScheduleExceptionResponseDto] })
  listExceptions(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ScheduleExceptionQueryDto,
  ) {
    return this.schedulesService.listExceptions(organizationId, query);
  }

  @Post('exceptions')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({
    summary: 'Create a schedule exception',
    description:
      'Adds a full-day closure, partial closure, or special opening hours for a local Nicaragua date.',
  })
  @ApiCreatedResponse({ type: ScheduleExceptionResponseDto })
  createException(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateScheduleExceptionDto,
  ) {
    return this.schedulesService.createException(organizationId, dto);
  }

  @Patch('exceptions/:exceptionId')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({ summary: 'Update a schedule exception' })
  @ApiParam({ name: 'exceptionId', format: 'uuid' })
  @ApiOkResponse({ type: ScheduleExceptionResponseDto })
  updateException(
    @CurrentOrganization('id') organizationId: string,
    @Param('exceptionId') exceptionId: string,
    @Body() dto: UpdateScheduleExceptionDto,
  ) {
    return this.schedulesService.updateException(
      organizationId,
      exceptionId,
      dto,
    );
  }

  @Delete('exceptions/:exceptionId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({ summary: 'Delete a schedule exception' })
  @ApiParam({ name: 'exceptionId', format: 'uuid' })
  @ApiOkResponse({ type: ScheduleExceptionResponseDto })
  deleteException(
    @CurrentOrganization('id') organizationId: string,
    @Param('exceptionId') exceptionId: string,
  ) {
    return this.schedulesService.deleteException(organizationId, exceptionId);
  }

  @Get('members/:memberId/availability')
  @Permissions(SYSTEM_PERMISSIONS.schedulesRead)
  @ApiOperation({
    summary: 'List member availability',
    description:
      'Returns weekly availability windows for a tenant member, optionally scoped by location or dayOfWeek.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: [MemberScheduleResponseDto] })
  listMemberSchedules(
    @CurrentOrganization('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Query() query: MemberScheduleQueryDto,
  ) {
    return this.schedulesService.listMemberSchedules(
      organizationId,
      memberId,
      query,
    );
  }

  @Post('members/:memberId/availability')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({
    summary: 'Create member availability',
    description:
      'Adds one weekly availability window for a member using HH:mm local Nicaragua time.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiCreatedResponse({ type: MemberScheduleResponseDto })
  createMemberSchedule(
    @CurrentOrganization('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: CreateMemberScheduleDto,
  ) {
    return this.schedulesService.createMemberSchedule(
      organizationId,
      memberId,
      dto,
    );
  }

  @Put('members/:memberId/availability')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({
    summary: 'Replace member availability',
    description:
      'Atomically replaces all weekly availability windows for one tenant member.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: [MemberScheduleResponseDto] })
  replaceMemberSchedules(
    @CurrentOrganization('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: ReplaceMemberSchedulesDto,
  ) {
    return this.schedulesService.replaceMemberSchedules(
      organizationId,
      memberId,
      dto,
    );
  }

  @Patch('availability/:scheduleId')
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({ summary: 'Update one member availability window' })
  @ApiParam({ name: 'scheduleId', format: 'uuid' })
  @ApiOkResponse({ type: MemberScheduleResponseDto })
  updateMemberSchedule(
    @CurrentOrganization('id') organizationId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateMemberScheduleDto,
  ) {
    return this.schedulesService.updateMemberSchedule(
      organizationId,
      scheduleId,
      dto,
    );
  }

  @Delete('availability/:scheduleId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.schedulesWrite)
  @ApiOperation({ summary: 'Delete one member availability window' })
  @ApiParam({ name: 'scheduleId', format: 'uuid' })
  @ApiOkResponse({ type: MemberScheduleResponseDto })
  deleteMemberSchedule(
    @CurrentOrganization('id') organizationId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.schedulesService.deleteMemberSchedule(
      organizationId,
      scheduleId,
    );
  }
}
