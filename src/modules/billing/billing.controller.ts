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
  BillingCatalogQueryDto,
  BillingSummaryResponseDto,
  CreatePaymentDto,
  CreatePaymentMethodDto,
  CreatePaymentTransactionDto,
  CreatePaymentTypeDto,
  PaymentMethodResponseDto,
  PaymentQueryDto,
  PaymentResponseDto,
  PaymentTransactionQueryDto,
  PaymentTransactionResponseDto,
  PaymentTypeResponseDto,
  UpdatePaymentDto,
  UpdatePaymentMethodDto,
  UpdatePaymentTypeDto,
} from './dto';
import { BillingService } from './services/billing.service';

@ApiTags('Billing')
@ApiBearerAuth('JWT-auth')
@Controller('billing')
@UseGuards(JwtAuthGuard, TenantGuard, ModulesGuard, PermissionsGuard)
@RequireModules(SYSTEM_MODULES.billing)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  @Permissions(SYSTEM_PERMISSIONS.billingRead)
  @ApiOperation({
    summary: 'Get tenant billing summary',
    description:
      'Returns open balances, overdue balances and paid amount for the current month.',
  })
  @ApiOkResponse({ type: BillingSummaryResponseDto })
  getSummary(@CurrentOrganization('id') organizationId: string) {
    return this.billingService.getSummary(organizationId);
  }

  @Get('payment-types')
  @Permissions(SYSTEM_PERMISSIONS.billingRead)
  @ApiOperation({
    summary: 'List payment types',
    description:
      'Returns tenant billing concepts such as memberships, classes, fees or custom charges.',
  })
  @ApiOkResponse({ type: [PaymentTypeResponseDto] })
  listPaymentTypes(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: BillingCatalogQueryDto,
  ) {
    return this.billingService.listPaymentTypes(organizationId, query);
  }

  @Post('payment-types')
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({
    summary: 'Create a payment type',
    description:
      'Creates a tenant-scoped billing concept with optional default amount and frequency.',
  })
  @ApiCreatedResponse({ type: PaymentTypeResponseDto })
  createPaymentType(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreatePaymentTypeDto,
  ) {
    return this.billingService.createPaymentType(organizationId, dto);
  }

  @Patch('payment-types/:paymentTypeId')
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({ summary: 'Update a payment type' })
  @ApiParam({ name: 'paymentTypeId', format: 'uuid' })
  @ApiOkResponse({ type: PaymentTypeResponseDto })
  updatePaymentType(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentTypeId') paymentTypeId: string,
    @Body() dto: UpdatePaymentTypeDto,
  ) {
    return this.billingService.updatePaymentType(
      organizationId,
      paymentTypeId,
      dto,
    );
  }

  @Delete('payment-types/:paymentTypeId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({
    summary: 'Delete or archive a payment type',
    description:
      'Deletes unused payment types. Types already referenced by payments are safely marked inactive.',
  })
  @ApiParam({ name: 'paymentTypeId', format: 'uuid' })
  @ApiOkResponse({ type: PaymentTypeResponseDto })
  deletePaymentType(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentTypeId') paymentTypeId: string,
  ) {
    return this.billingService.deletePaymentType(organizationId, paymentTypeId);
  }

  @Get('payment-methods')
  @Permissions(SYSTEM_PERMISSIONS.billingRead)
  @ApiOperation({
    summary: 'List payment methods',
    description:
      'Returns tenant payment methods such as cash, transfer, card or custom integrations.',
  })
  @ApiOkResponse({ type: [PaymentMethodResponseDto] })
  listPaymentMethods(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: BillingCatalogQueryDto,
  ) {
    return this.billingService.listPaymentMethods(organizationId, query);
  }

  @Post('payment-methods')
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({ summary: 'Create a payment method' })
  @ApiCreatedResponse({ type: PaymentMethodResponseDto })
  createPaymentMethod(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return this.billingService.createPaymentMethod(organizationId, dto);
  }

  @Patch('payment-methods/:paymentMethodId')
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({ summary: 'Update a payment method' })
  @ApiParam({ name: 'paymentMethodId', format: 'uuid' })
  @ApiOkResponse({ type: PaymentMethodResponseDto })
  updatePaymentMethod(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.billingService.updatePaymentMethod(
      organizationId,
      paymentMethodId,
      dto,
    );
  }

  @Delete('payment-methods/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({
    summary: 'Delete or archive a payment method',
    description:
      'Deletes unused methods. Methods already referenced by transactions are safely marked inactive.',
  })
  @ApiParam({ name: 'paymentMethodId', format: 'uuid' })
  @ApiOkResponse({ type: PaymentMethodResponseDto })
  deletePaymentMethod(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.billingService.deletePaymentMethod(
      organizationId,
      paymentMethodId,
    );
  }

  @Get('payments')
  @Permissions(SYSTEM_PERMISSIONS.billingRead)
  @ApiOperation({
    summary: 'List tenant payments',
    description:
      'Cursor-paginated payment list with member, payment type and transaction summary.',
  })
  @ApiOkResponse({ type: [PaymentResponseDto] })
  listPayments(
    @CurrentOrganization('id') organizationId: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.billingService.listPayments(organizationId, query);
  }

  @Post('payments')
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({
    summary: 'Create a payment',
    description:
      'Creates an invoice-like payment for a tenant member. Amount can come from a payment type default.',
  })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  createPayment(
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.createPayment(organizationId, dto);
  }

  @Get('payments/:paymentId')
  @Permissions(SYSTEM_PERMISSIONS.billingRead)
  @ApiOperation({ summary: 'Get payment detail' })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  @ApiOkResponse({ type: PaymentResponseDto })
  getPayment(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.billingService.getPayment(organizationId, paymentId);
  }

  @Patch('payments/:paymentId')
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({
    summary: 'Update payment metadata or lifecycle status',
    description:
      'Updates due date, notes, metadata or explicit lifecycle status such as cancelled/refunded.',
  })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  @ApiOkResponse({ type: PaymentResponseDto })
  updatePayment(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.billingService.updatePayment(organizationId, paymentId, dto);
  }

  @Get('payments/:paymentId/transactions')
  @Permissions(SYSTEM_PERMISSIONS.billingRead)
  @ApiOperation({ summary: 'List payment transactions' })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  @ApiOkResponse({ type: [PaymentTransactionResponseDto] })
  listTransactions(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentId') paymentId: string,
    @Query() query: PaymentTransactionQueryDto,
  ) {
    return this.billingService.listTransactions(
      organizationId,
      paymentId,
      query,
    );
  }

  @Post('payments/:paymentId/transactions')
  @Permissions(SYSTEM_PERMISSIONS.billingWrite)
  @ApiOperation({
    summary: 'Record a payment transaction',
    description:
      'Creates a transaction and recalculates payment status and balance using successful transactions.',
  })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  createTransaction(
    @CurrentOrganization('id') organizationId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: CreatePaymentTransactionDto,
  ) {
    return this.billingService.createTransaction(
      organizationId,
      paymentId,
      dto,
    );
  }
}
