import {
  Module,
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Req,
  ForbiddenException,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Permission, Domain } from '@wuchan/contracts';
import {
  createContractFromQuoteSchema,
  signContractSchema
} from '@wuchan/validation';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuditService, AuditModule } from '../../audit/audit.module';
import { DatabaseService } from '../../database/database.service';

@Controller('contracts')
@UseGuards(AuthGuard, PermissionsGuard)
export class ContractsController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.CONTRACT_READ)
  async list(@Req() req: any) {
    const res = await this.db.query(
      \`SELECT c.*, q.quote_number, q.status AS quote_status
       FROM public.contracts c
       JOIN public.quotes q ON q.id = c.quote_id
       ORDER BY c.created_at DESC\`,
      [],
      req.user.userId
    );
    return res.rows;
  }

  @Get(':id')
  @RequirePermissions(Permission.CONTRACT_READ)
  async getById(@Req() req: any, @Param('id') id: string) {
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      throw new ForbiddenException('Invalid contract id');
    }

    const res = await this.db.query(
      \`SELECT c.*, q.quote_number, q.status AS quote_status, q.current_version AS quote_current_version
       FROM public.contracts c
       JOIN public.quotes q ON q.id = c.quote_id
       WHERE c.id = $1\`,
      [id],
      req.user.userId
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Contract ' + id + ' not found');
    }

    return res.rows[0];
  }

  @Post('from-quote')
  @RequirePermissions(Permission.CONTRACT_CREATE)
  async createFromQuote(@Req() req: any, @Body() body: any) {
    const validated = createContractFromQuoteSchema.parse(body);
    const actorId = req.user.userId;
    const sellerOrgId = req.user.activeOrgId;

    if (!sellerOrgId) {
      throw new ForbiddenException('An active factory organization is required to draft a contract');
    }

    return this.db.withTransaction(async (client) => {
      const quoteRes = await client.query(
        \`SELECT
           q.id,
           q.quote_number,
           q.organization_id AS customer_organization_id,
           q.seller_organization_id,
           q.status,
           seller.type AS seller_type
         FROM public.quotes q
         LEFT JOIN public.organizations seller ON seller.id = q.seller_organization_id
         WHERE q.id = $1
         FOR UPDATE\`,
        [validated.quoteId]
      );
      const quote = quoteRes.rows[0];

      if (!quote) {
        throw new NotFoundException('Quote ' + validated.quoteId + ' not found');
      }
      if (quote.status !== 'ACCEPTED') {
        throw new ForbiddenException('Only accepted quotes can move to contract preparation');
      }
      if (quote.seller_organization_id !== sellerOrgId || quote.seller_type !== 'FACTORY') {
        throw new ForbiddenException('Only the assigned factory may prepare this contract');
      }

      const existingRes = await client.query(
        'SELECT id, contract_number FROM public.contracts WHERE quote_id = $1 FOR UPDATE',
        [quote.id]
      );
      if (existingRes.rows[0]) {
        throw new ConflictException('A contract already exists for this quote');
      }

      const contractNumber =
        'CON-' + new Date().getUTCFullYear() + '-' + randomUUID().slice(0, 8).toUpperCase();

      const contractRes = await client.query(
        \`INSERT INTO public.contracts
          (quote_id, organization_id, seller_organization_id, contract_number, terms_text, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING_SIGNATURE')
         RETURNING *\`,
        [
          quote.id,
          quote.customer_organization_id,
          quote.seller_organization_id,
          contractNumber,
          validated.termsText
        ]
      );
      const contract = contractRes.rows[0];

      await this.auditService.logActionInTransaction({
        domain: Domain.CONTRACTS,
        action: 'CONTRACT_DRAFTED',
        actorId,
        organizationId: quote.customer_organization_id,
        resourceId: contract.id,
        afterState: {
          contract,
          quoteNumber: quote.quote_number,
          sellerOrganizationId: quote.seller_organization_id
        }
      }, client);

      return contract;
    }, actorId);
  }

  @Post(':id/sign')
  @RequirePermissions(Permission.CONTRACT_SIGN)
  async sign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    signContractSchema.parse(body);
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const res = await client.query(
        \`SELECT c.*, q.quote_number
         FROM public.contracts c
         JOIN public.quotes q ON q.id = c.quote_id
         WHERE c.id = $1
         FOR UPDATE\`,
        [id]
      );
      const contract = res.rows[0];

      if (!contract) {
        throw new NotFoundException('Contract ' + id + ' not found');
      }

      const activeOrgId = req.user.activeOrgId;
      const isCustomerSide = contract.organization_id === activeOrgId;
      const isSellerSide = contract.seller_organization_id === activeOrgId;

      if (!isCustomerSide && !isSellerSide) {
        throw new ForbiddenException('Contract is not associated with the authenticated organization');
      }

      if (isCustomerSide && !contract.customer_signed_at) {
        const updatedRes = await client.query(
          \`UPDATE public.contracts
           SET customer_signed_at = NOW(),
               customer_signed_by = $2,
               status = CASE
                 WHEN seller_signed_at IS NOT NULL THEN 'FULLY_EXECUTED'
                 ELSE 'CUSTOMER_SIGNED'
               END,
               signed_at = CASE
                 WHEN seller_signed_at IS NOT NULL THEN NOW()
                 ELSE signed_at
               END,
               signed_by = CASE
                 WHEN seller_signed_at IS NOT NULL THEN $2
                 ELSE signed_by
               END
           WHERE id = $1
           RETURNING *\`,
          [id, actorId]
        );
        const updated = updatedRes.rows[0];

        await this.auditService.logActionInTransaction({
          domain: Domain.CONTRACTS,
          action: 'CONTRACT_CUSTOMER_SIGNED',
          actorId,
          organizationId: contract.organization_id,
          resourceId: id,
          beforeState: contract,
          afterState: updated
        }, client);

        return updated;
      }

      if (isSellerSide && !contract.seller_signed_at) {
        const updatedRes = await client.query(
          \`UPDATE public.contracts
           SET seller_signed_at = NOW(),
               seller_signed_by = $2,
               status = CASE
                 WHEN customer_signed_at IS NOT NULL THEN 'FULLY_EXECUTED'
                 ELSE 'SELLER_SIGNED'
               END,
               signed_at = CASE
                 WHEN customer_signed_at IS NOT NULL THEN NOW()
                 ELSE signed_at
               END,
               signed_by = CASE
                 WHEN customer_signed_at IS NOT NULL THEN $2
                 ELSE signed_by
               END
           WHERE id = $1
           RETURNING *\`,
          [id, actorId]
        );
        const updated = updatedRes.rows[0];

        await this.auditService.logActionInTransaction({
          domain: Domain.CONTRACTS,
          action: 'CONTRACT_SELLER_SIGNED',
          actorId,
          organizationId: contract.organization_id,
          resourceId: id,
          beforeState: contract,
          afterState: updated
        }, client);

        return updated;
      }

      return contract;
    }, actorId);
  }
}

@Module({
  imports: [AuditModule],
  controllers: [ContractsController]
})
export class ContractsModule {}
