import { CatalogController } from '../src/domains/catalog/catalog.module';
import { DatabaseService } from '../src/database/database.service';

describe('Public Catalog Visibility Unit Test', () => {
  let controller: CatalogController;
  let dbService: DatabaseService;

  beforeEach(() => {
    dbService = new DatabaseService();
    const auditService = { logAction: jest.fn() } as any;
    controller = new CatalogController(auditService, dbService);
  });

  it('filters unauthenticated queries to only public items', async () => {
    const querySpy = jest.spyOn(dbService, 'query').mockResolvedValue({
      rows: [{ id: 'prod_1', name: 'Public Cabin', is_public: true }],
      rowCount: 1
    });

    const unauthReq = { user: null };
    const items = await controller.listProducts(unauthReq);

    expect(items).toHaveLength(1);
    expect(querySpy).toHaveBeenCalled();
    const sql = querySpy.mock.calls[0][0];
    expect(sql).toContain('WHERE is_public = TRUE');
  });

  it('allows authenticated users to query tenant items with user session context', async () => {
    const querySpy = jest.spyOn(dbService, 'query').mockResolvedValue({
      rows: [
        { id: 'prod_1', name: 'Public Cabin', is_public: true },
        { id: 'prod_2', name: 'Private Custom Cabin', is_public: false }
      ],
      rowCount: 2
    });

    const authReq = { user: { userId: 'u_123', activeOrgId: 'org_456' } };
    const items = await controller.listProducts(authReq);

    expect(items).toHaveLength(2);
    expect(querySpy).toHaveBeenCalled();
    const sql = querySpy.mock.calls[0][0];
    expect(sql).not.toContain('WHERE is_public = TRUE');
  });
});
