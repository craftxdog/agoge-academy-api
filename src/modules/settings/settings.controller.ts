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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { StorageFile } from '../storage';
import {
  CreateOrganizationScreenDto,
  OrganizationBrandingResponseDto,
  OrganizationModuleResponseDto,
  OrganizationProfileResponseDto,
  OrganizationScreenResponseDto,
  OrganizationSettingResponseDto,
  OrganizationSettingsQueryDto,
  UpdateOrganizationBrandingDto,
  UpdateOrganizationModuleDto,
  UpdateOrganizationProfileDto,
  UpdateOrganizationScreenDto,
  UpsertOrganizationSettingsDto,
} from './dto';
import { SettingsService } from './services/settings.service';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.settings)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('organization')
  @Permissions(SYSTEM_PERMISSIONS.settingsRead)
  @ApiOperation({
    summary: 'Get organization profile',
    description:
      'Returns the active tenant profile, regional defaults and branding summary.',
  })
  @ApiOkResponse({ type: OrganizationProfileResponseDto })
  getOrganization(@CurrentOrganization('id') organizationId: string) {
    return this.settingsService.getOrganizationProfile(organizationId);
  }

  @Patch('organization')
  @Permissions(SYSTEM_PERMISSIONS.settingsWrite)
  @ApiOperation({
    summary: 'Update organization profile',
    description:
      'Updates company identity, tax fields and regional defaults for the active tenant.',
  })
  @ApiOkResponse({ type: OrganizationProfileResponseDto })
  updateOrganization(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: UpdateOrganizationProfileDto,
  ) {
    return this.settingsService.updateOrganizationProfile(organizationId, dto);
  }

  @Put('branding')
  @Permissions(SYSTEM_PERMISSIONS.settingsWrite)
  @ApiOperation({
    summary: 'Update organization branding',
    description:
      'Upserts logo, icon, tenant colors and free-form theme tokens for the active tenant.',
  })
  @ApiOkResponse({ type: OrganizationBrandingResponseDto })
  updateBranding(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: UpdateOrganizationBrandingDto,
  ) {
    return this.settingsService.updateBranding(organizationId, dto);
  }

  @Post('branding/logo')
  @Permissions(SYSTEM_PERMISSIONS.settingsWrite)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload organization logo',
    description:
      'Uploads the tenant logo to Cloudinary and updates branding with the resulting asset URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: OrganizationBrandingResponseDto })
  uploadBrandingLogo(
    @CurrentOrganization('id') organizationId: string,
    @UploadedFile() file: StorageFile,
  ) {
    return this.settingsService.uploadBrandingAsset(
      organizationId,
      'logo',
      file,
    );
  }

  @Post('branding/icon')
  @Permissions(SYSTEM_PERMISSIONS.settingsWrite)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload organization icon',
    description:
      'Uploads the tenant icon to Cloudinary and updates branding with the resulting asset URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: OrganizationBrandingResponseDto })
  uploadBrandingIcon(
    @CurrentOrganization('id') organizationId: string,
    @UploadedFile() file: StorageFile,
  ) {
    return this.settingsService.uploadBrandingAsset(
      organizationId,
      'icon',
      file,
    );
  }

  @Get('preferences')
  @Permissions(SYSTEM_PERMISSIONS.settingsRead)
  @ApiOperation({
    summary: 'List organization settings',
    description:
      'Returns JSON settings stored by namespace/key. Use namespace filtering for settings screens.',
  })
  @ApiOkResponse({ type: [OrganizationSettingResponseDto] })
  listPreferences(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: OrganizationSettingsQueryDto,
  ) {
    return this.settingsService.listSettings(organizationId, query);
  }

  @Put('preferences')
  @Permissions(SYSTEM_PERMISSIONS.settingsWrite)
  @ApiOperation({
    summary: 'Upsert organization settings',
    description:
      'Bulk upserts JSON settings by namespace/key for tenant preferences.',
  })
  @ApiOkResponse({ type: [OrganizationSettingResponseDto] })
  upsertPreferences(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: UpsertOrganizationSettingsDto,
  ) {
    return this.settingsService.upsertSettings(organizationId, dto);
  }

  @Get('modules')
  @Permissions(SYSTEM_PERMISSIONS.modulesManage)
  @ApiOperation({
    summary: 'List tenant modules',
    description:
      'Returns the active tenant module configuration backed by the app module catalog.',
  })
  @ApiOkResponse({ type: [OrganizationModuleResponseDto] })
  listModules(@CurrentOrganization('id') organizationId: string) {
    return this.settingsService.listModules(organizationId);
  }

  @Patch('modules/:moduleKey')
  @Permissions(SYSTEM_PERMISSIONS.modulesManage)
  @ApiOperation({
    summary: 'Update tenant module configuration',
    description:
      'Enables, disables, reorders or configures an app module for the active tenant.',
  })
  @ApiParam({ name: 'moduleKey', example: 'billing' })
  @ApiOkResponse({ type: OrganizationModuleResponseDto })
  updateModule(
    @CurrentOrganization('id') organizationId: string,
    @Param('moduleKey') moduleKey: string,
    @Body() dto: UpdateOrganizationModuleDto,
  ) {
    return this.settingsService.updateModule(organizationId, moduleKey, dto);
  }

  @Get('screens')
  @Permissions(SYSTEM_PERMISSIONS.modulesManage)
  @ApiOperation({
    summary: 'List tenant screens',
    description:
      'Returns system and custom screens visible/configurable for the active tenant.',
  })
  @ApiOkResponse({ type: [OrganizationScreenResponseDto] })
  listScreens(@CurrentOrganization('id') organizationId: string) {
    return this.settingsService.listScreens(organizationId);
  }

  @Post('screens')
  @Permissions(SYSTEM_PERMISSIONS.modulesManage)
  @ApiOperation({
    summary: 'Create a custom tenant screen',
    description:
      'Adds a custom page, external link, form or embedded screen to the active tenant.',
  })
  @ApiCreatedResponse({ type: OrganizationScreenResponseDto })
  createScreen(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateOrganizationScreenDto,
  ) {
    return this.settingsService.createScreen(organizationId, dto);
  }

  @Patch('screens/:screenId')
  @Permissions(SYSTEM_PERMISSIONS.modulesManage)
  @ApiOperation({
    summary: 'Update tenant screen configuration',
    description:
      'Updates visibility, ordering and configurable metadata for a tenant screen. System screen type remains protected.',
  })
  @ApiParam({ name: 'screenId', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationScreenResponseDto })
  updateScreen(
    @CurrentOrganization('id') organizationId: string,
    @Param('screenId') screenId: string,
    @Body() dto: UpdateOrganizationScreenDto,
  ) {
    return this.settingsService.updateScreen(organizationId, screenId, dto);
  }

  @Delete('screens/:screenId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.modulesManage)
  @ApiOperation({
    summary: 'Delete a custom tenant screen',
    description:
      'Deletes only custom tenant screens. App catalog system screens are protected.',
  })
  @ApiParam({ name: 'screenId', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationScreenResponseDto })
  deleteScreen(
    @CurrentOrganization('id') organizationId: string,
    @Param('screenId') screenId: string,
  ) {
    return this.settingsService.deleteScreen(organizationId, screenId);
  }
}
