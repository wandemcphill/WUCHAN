import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { OrganizationsModule } from './domains/organizations/organizations.module';
import { CatalogModule } from './domains/catalog/catalog.module';
import { CommercialModule } from './domains/commercial/commercial.module';
import { OperationsModule } from './domains/operations/operations.module';
import { ContractsModule } from './domains/contracts/contracts.module';

@Module({
  imports: [
    AuditModule,
    OrganizationsModule,
    CatalogModule,
    CommercialModule,
    ContractsModule,
    OperationsModule
  ]
})
export class AppModule {}
