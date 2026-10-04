import {
  OrganizationProfile,
  FactoryProfile,
  MerchantProfile,
  Lead,
  Customer,
  RFQ,
  Quote,
  InventoryItem,
  Warehouse,
  StockReservation,
  Product,
  ProductionOrder,
  Order,
  Shipment,
  DocumentRecord,
  Invoice,
  PaymentRecord,
  CustomerConversation,
  SystemNotification,
  WarrantyClaim,
  OperationalAnalytics,
} from './types.js';

export const mockOrganization: OrganizationProfile = {
  id: 'org-101',
  name: 'Apex Modular Structure Industries Group Co., Ltd.',
  taxId: 'US987654321',
  country: 'United States',
  currency: 'USD',
  contactEmail: 'operations@apexmodular.com',
  contactPhone: '+1 (800) 555-0199',
  website: 'https://apexmodular.com',
  verified: true,
};

export const mockFactory: FactoryProfile = {
  id: 'fac-301',
  organizationId: 'org-101',
  factoryName: 'Apex Precision Steel & Modular Fabrication Plant #1',
  location: 'Houston, TX, USA',
  coordinates: { lat: 29.7604, lng: -95.3698 },
  facilityAreaSqM: 45000,
  annualCapacityUnits: 1200,
  certifications: ['ISO 9001', 'EN 1090-1 Steel Structures', 'CE Mark', 'AWS Welding D1.1'],
  productionLines: 4,
  qcStandards: ['ASTM A36', 'AS/NZS 3678', 'ISO 14001'],
};

export const mockMerchant: MerchantProfile = {
  id: 'mer-201',
  organizationId: 'org-101',
  merchantName: 'Apex Prefab Global Trade Services',
  exportMarkets: ['North America', 'Europe', 'Australia', 'Middle East'],
  supportedIncoterms: ['FOB', 'CIF', 'DDP', 'EXW'],
  bankAccounts: [
    {
      bankName: 'JPMorgan Chase Bank N.A.',
      swiftCode: 'CHASUS33XXX',
      accountNumber: '****9988',
      currency: 'USD',
    },
  ],
};

export const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    customerName: 'Marcus Vance',
    companyName: 'Vance Eco-Resorts LLC',
    email: 'marcus@vanceecoresorts.com',
    phone: '+1 415 555 2671',
    country: 'United States',
    projectType: 'Luxury Glamping Resort Phase 2',
    budget: { amount: 45000000, currency: 'USD' }, // $450,000.00
    status: 'RFQ_ISSUED',
    source: 'Inbound Web Form',
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-20T14:30:00Z',
  },
  {
    id: 'lead-002',
    customerName: 'Elena Rostova',
    companyName: 'Nordic Retreats AS',
    email: 'elena@nordicretreats.no',
    phone: '+47 22 55 01 99',
    country: 'Norway',
    projectType: 'Fjord Cabin Hospitality Pods',
    budget: { amount: 28000000, currency: 'USD' }, // $280,000.00
    status: 'QUALIFIED',
    source: 'Trade Show Berlin',
    createdAt: '2026-09-18T08:15:00Z',
    updatedAt: '2026-09-21T09:00:00Z',
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-501',
    name: 'Marcus Vance',
    companyName: 'Vance Eco-Resorts LLC',
    email: 'marcus@vanceecoresorts.com',
    phone: '+1 415 555 2671',
    country: 'United States',
    totalOrders: 3,
    lifetimeValue: { amount: 82000000, currency: 'USD' }, // $820,000.00
    creditTermDays: 30,
    status: 'ACTIVE',
    createdAt: '2025-03-10T00:00:00Z',
  },
];

export const mockRFQs: RFQ[] = [
  {
    id: 'rfq-1001',
    rfqNumber: 'RFQ-2026-0089',
    customerId: 'cust-501',
    customerName: 'Marcus Vance (Vance Eco-Resorts)',
    items: [
      {
        productName: 'Apex Horizon Luxury Prefab Pod 40ft',
        quantity: 6,
        targetPrice: { amount: 4800000, currency: 'USD' }, // $48,000.00
        specifications: { Insulation: 'R-30 Mineral Wool', Glazing: 'Double-pane Low-E', Finish: 'Composite Wood Siding' },
      },
    ],
    destinationCountry: 'United States',
    destinationPort: 'Port of Long Beach',
    status: 'AWAITING_RESPONSE',
    dueDate: '2026-10-05T23:59:59Z',
    createdAt: '2026-09-22T09:00:00Z',
    priority: 'HIGH',
  },
];

export const mockQuotes: Quote[] = [
  {
    id: 'q-2001',
    rfqId: 'rfq-1001',
    quoteNumber: 'QUO-2026-0142',
    customerId: 'cust-501',
    customerName: 'Marcus Vance',
    currentVersionNumber: 2,
    status: 'AWAITING_DECISION',
    createdAt: '2026-09-23T11:00:00Z',
    updatedAt: '2026-09-24T16:00:00Z',
    versions: [
      {
        version: 1,
        createdAt: '2026-09-23T11:00:00Z',
        createdBy: 'Sales Director - Sarah Jenkins',
        changeLog: 'Initial quote version issued.',
        items: [
          {
            productId: 'prod-401',
            productName: 'Apex Horizon Luxury Prefab Pod 40ft',
            quantity: 6,
            unitPrice: { amount: 5200000, currency: 'USD' },
            totalPrice: { amount: 31200000, currency: 'USD' },
            customizations: { Insulation: 'R-30 Mineral Wool', Cladding: 'ThermoWood Oak' },
          },
        ],
        subtotal: { amount: 31200000, currency: 'USD' },
        discount: { amount: 1200000, currency: 'USD' },
        shipping: { amount: 1800000, currency: 'USD' },
        totalAmount: { amount: 31800000, currency: 'USD' },
        incoterm: 'CIF Long Beach',
        paymentTerms: '30% Deposit, 60% Before Shipping, 10% Upon Delivery',
        validUntil: '2026-10-15T23:59:59Z',
        leadTimeWeeks: 8,
      },
      {
        version: 2,
        createdAt: '2026-09-24T16:00:00Z',
        createdBy: 'Sales Director - Sarah Jenkins',
        changeLog: 'Applied 5% volume discount as requested by client.',
        items: [
          {
            productId: 'prod-401',
            productName: 'Apex Horizon Luxury Prefab Pod 40ft',
            quantity: 6,
            unitPrice: { amount: 4940000, currency: 'USD' },
            totalPrice: { amount: 29640000, currency: 'USD' },
            customizations: { Insulation: 'R-30 Mineral Wool', Cladding: 'ThermoWood Oak' },
          },
        ],
        subtotal: { amount: 29640000, currency: 'USD' },
        discount: { amount: 1482000, currency: 'USD' },
        shipping: { amount: 1800000, currency: 'USD' },
        totalAmount: { amount: 29958000, currency: 'USD' },
        incoterm: 'CIF Long Beach',
        paymentTerms: '30% Deposit, 60% Before Shipping, 10% Upon Delivery',
        validUntil: '2026-10-20T23:59:59Z',
        leadTimeWeeks: 8,
      },
    ],
  },
];

export const mockWarehouses: Warehouse[] = [
  {
    id: 'wh-01',
    code: 'WH-TX-MAIN',
    name: 'Houston Primary Factory Warehouse',
    location: 'Houston, TX',
    type: 'FACTORY_STORE',
    totalCapacitySqM: 12000,
    usedCapacitySqM: 8400,
  },
  {
    id: 'wh-02',
    code: 'WH-LBC-HUB',
    name: 'Long Beach Transit Logistics Hub',
    location: 'Long Beach, CA',
    type: 'TRANSIT_PORT',
    totalCapacitySqM: 6000,
    usedCapacitySqM: 3100,
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv-101',
    sku: 'STEEL-C-CHANNEL-100',
    name: 'Galvanized Steel C-Channel 100mm x 50mm',
    category: 'RAW_MATERIAL',
    warehouseId: 'wh-01',
    warehouseName: 'Houston Primary Factory Warehouse',
    unit: 'meters',
    minThreshold: 1000,
    reorderPoint: 1500,
    quantities: {
      available: 450,
      reserved: 200,
      allocated: 300,
      in_production: 800,
      qc_hold: 150,
      damaged: 20,
      quarantined: 50,
      packed: 0,
      dispatched: 0,
      in_transit: 0,
    },
  },
  {
    id: 'inv-102',
    sku: 'GLAZING-DBL-LOWE-40',
    name: 'Double Tempered Low-E Glass Window Assembly',
    category: 'COMPONENT',
    warehouseId: 'wh-01',
    warehouseName: 'Houston Primary Factory Warehouse',
    unit: 'sets',
    minThreshold: 50,
    reorderPoint: 80,
    quantities: {
      available: 85,
      reserved: 30,
      allocated: 20,
      in_production: 15,
      qc_hold: 5,
      damaged: 0,
      quarantined: 0,
      packed: 10,
      dispatched: 0,
      in_transit: 0,
    },
  },
];

export const mockReservations: StockReservation[] = [
  {
    id: 'res-801',
    sku: 'STEEL-C-CHANNEL-100',
    orderId: 'ord-9001',
    quantity: 200,
    state: 'reserved',
    reservedAt: '2026-09-20T10:00:00Z',
    status: 'ACTIVE',
  },
];

export const mockProducts: Product[] = [
  {
    id: 'prod-401',
    sku: 'MOD-HORIZON-40',
    name: 'Apex Horizon Luxury Prefab Pod 40ft',
    category: 'Modular Residential Pod',
    basePrice: { amount: 4940000, currency: 'USD' }, // $49,400.00
    dimensionsMM: { length: 12192, width: 2438, height: 2896 },
    weightKG: 7200,
    cbm: 86.2,
    configurableOptions: [
      {
        id: 'opt-insulation',
        name: 'Thermal Insulation Core',
        options: [
          { label: 'EPS Panel 100mm', priceModifier: { amount: 0, currency: 'USD' }, skuSuffix: 'EPS100' },
          { label: 'PU Foam 120mm (R-30 High Climate)', priceModifier: { amount: 350000, currency: 'USD' }, skuSuffix: 'PU120' },
        ],
      },
      {
        id: 'opt-cladding',
        name: 'Exterior Architectural Cladding',
        options: [
          { label: 'Standard Fluorocarbon Steel Sheet', priceModifier: { amount: 0, currency: 'USD' }, skuSuffix: 'STL' },
          { label: 'ThermoWood Sustainable Pine Accent', priceModifier: { amount: 280000, currency: 'USD' }, skuSuffix: 'TWD' },
        ],
      },
    ],
    bom: [
      {
        id: 'bom-01',
        componentSku: 'STEEL-FRAME-40HC',
        componentName: 'Heavy Structural Steel Base & Column Frame',
        quantityPerUnit: 1,
        unit: 'set',
        category: 'Structure',
        leadTimeDays: 10,
        unitCost: { amount: 1150000, currency: 'USD' },
      },
      {
        id: 'bom-02',
        componentSku: 'PANEL-WALL-R30',
        componentName: 'Insulated Sandwich Wall Panel R-30',
        quantityPerUnit: 18,
        unit: 'panels',
        category: 'Enclosure',
        leadTimeDays: 7,
        unitCost: { amount: 65000, currency: 'USD' },
      },
    ],
    active: true,
  },
];

export const mockProductionOrders: ProductionOrder[] = [
  {
    id: 'po-7001',
    productionOrderNumber: 'PO-2026-031',
    orderId: 'ord-9001',
    productName: 'Apex Horizon Luxury Prefab Pod 40ft',
    sku: 'MOD-HORIZON-40',
    quantity: 6,
    currentStage: 'production',
    stageProgressPercent: 65,
    factoryId: 'fac-301',
    startDate: '2026-09-10T08:00:00Z',
    targetCompletionDate: '2026-10-10T17:00:00Z',
    delayed: true,
    delayReason: 'Custom ThermoWood exterior cladding material delayed at port customs inspection.',
    qcInspections: [
      {
        id: 'qc-101',
        productionOrderId: 'po-7001',
        inspectorName: 'Chief Inspector David Wu',
        stage: 'engineering',
        inspectedAt: '2026-09-12T14:00:00Z',
        result: 'PASS',
        resolved: true,
      },
      {
        id: 'qc-102',
        productionOrderId: 'po-7001',
        inspectorName: 'Senior Auditor Rachel Miller',
        stage: 'production',
        inspectedAt: '2026-09-22T11:30:00Z',
        result: 'FAIL',
        defects: [
          {
            severity: 'CRITICAL',
            description: 'Weld seam porosity detected along main chassis joint B-4.',
          },
        ],
        actionRequired: 'Grind out defective weld section and re-weld with Ultrasonic NDT re-test.',
        resolved: false,
      },
    ],
  },
];

export const mockOrders: Order[] = [
  {
    id: 'ord-9001',
    orderNumber: 'ORD-2026-0045',
    quoteId: 'q-2001',
    customerId: 'cust-501',
    customerName: 'Marcus Vance (Vance Eco-Resorts LLC)',
    totalAmount: { amount: 29958000, currency: 'USD' },
    paidAmount: { amount: 8987400, currency: 'USD' },
    paymentStatus: 'PARTIALLY_PAID',
    status: 'PRODUCTION',
    atRisk: true,
    riskReason: 'QC Fail on chassis weld B-4 and material delay on external cladding.',
    changeRequests: [
      {
        id: 'cr-301',
        orderId: 'ord-9001',
        requestNumber: 'CR-2026-002',
        requestedBy: 'CUSTOMER',
        reason: 'Upgrade interior lighting fixture to Smart RGB Smart Home System.',
        description: 'Customer requested integration of Phillips Hue smart lighting control hub.',
        commercialImpact: { amount: 450000, currency: 'USD' },
        leadTimeImpactDays: 3,
        status: 'PENDING_MERCHANT_APPROVAL',
        createdAt: '2026-09-21T15:20:00Z',
      },
    ],
    createdAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'ord-9002',
    orderNumber: 'ORD-2026-0048',
    quoteId: 'q-2002',
    customerId: 'cust-502',
    customerName: 'Nordic Retreats AS',
    totalAmount: { amount: 14500000, currency: 'USD' },
    paidAmount: { amount: 0, currency: 'USD' },
    paymentStatus: 'AWAITING_PAYMENT',
    status: 'CONFIRMED',
    atRisk: false,
    changeRequests: [],
    createdAt: '2026-09-23T14:00:00Z',
  },
];

export const mockShipments: Shipment[] = [
  {
    id: 'ship-401',
    shipmentNumber: 'SHP-2026-0082',
    orderId: 'ord-8990',
    customerName: 'Pacific Glamping Group',
    originPort: 'Port of Houston, USA',
    destinationPort: 'Port of Sydney, Australia',
    incoterm: 'CIF Sydney',
    carrierName: 'Maersk Line',
    vesselName: 'MAERSK MC-KINNEY MOLLER / V.2608',
    missingDocuments: true,
    requiredDocuments: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Fumigation Certificate', 'CE Certificate of Origin'],
    submittedDocuments: ['Commercial Invoice', 'Packing List', 'Bill of Lading'],
    status: 'IN_TRANSIT',
    estimatedArrival: '2026-10-18T00:00:00Z',
    containers: [
      {
        id: 'cntr-11',
        containerNumber: 'MSKU-8823910',
        sealNumber: 'SL-992812',
        containerType: '40HC',
        packages: [
          {
            id: 'pkg-01',
            packageNumber: 'PKG-MOD-01',
            dimensionsMM: { length: 12192, width: 2438, height: 2896 },
            weightKG: 7200,
            cbm: 86.2,
            contentsDescription: 'Prefab Pod Structure Unit #1 Fully Assembled',
            qcPassed: true,
          },
        ],
      },
    ],
    trackingEvents: [
      {
        id: 'evt-01',
        timestamp: '2026-09-15T08:00:00Z',
        location: 'Houston Factory Yard',
        status: 'DISPATCHED',
        description: 'Loaded onto chassis truck and departed factory.',
        source: 'Factory Dispatch Telematics',
      },
      {
        id: 'evt-02',
        timestamp: '2026-09-17T18:30:00Z',
        location: 'Port of Houston Terminal 2',
        status: 'CONTAINER_LOADED',
        description: 'Vessel loading completed aboard MAERSK MC-KINNEY MOLLER.',
        source: 'Maersk EDI Feed',
      },
    ],
  },
];

export const mockDocuments: DocumentRecord[] = [
  {
    id: 'doc-001',
    documentNumber: 'DOC-CI-2026-082',
    title: 'Commercial Invoice SHP-2026-0082',
    category: 'COMMERCIAL_INVOICE',
    relatedEntityId: 'ship-401',
    fileUrl: '/docs/ci-2026-082.pdf',
    version: 1,
    uploadedAt: '2026-09-14T10:00:00Z',
    status: 'VERIFIED',
  },
  {
    id: 'doc-002',
    documentNumber: 'DOC-FUM-2026-082',
    title: 'Timber Fumigation Certificate (AWM Direct)',
    category: 'CERTIFICATE_OF_ORIGIN',
    relatedEntityId: 'ship-401',
    fileUrl: '',
    version: 0,
    uploadedAt: '',
    status: 'REJECTED',
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-3001',
    invoiceNumber: 'INV-2026-0091',
    orderId: 'ord-9002',
    customerId: 'cust-502',
    customerName: 'Nordic Retreats AS',
    amount: { amount: 4350000, currency: 'USD' },
    milestoneName: '30% Initial Production Deposit',
    dueDate: '2026-09-20T23:59:59Z',
    status: 'OVERDUE',
    issuedAt: '2026-09-05T09:00:00Z',
  },
  {
    id: 'inv-3002',
    invoiceNumber: 'INV-2026-0088',
    orderId: 'ord-9001',
    customerId: 'cust-501',
    customerName: 'Marcus Vance',
    amount: { amount: 8987400, currency: 'USD' },
    milestoneName: '30% Initial Production Deposit',
    dueDate: '2026-09-05T23:59:59Z',
    status: 'PAID',
    issuedAt: '2026-09-01T10:00:00Z',
  },
];

export const mockPayments: PaymentRecord[] = [
  {
    id: 'pay-5001',
    invoiceId: 'inv-3002',
    orderId: 'ord-9001',
    paymentNumber: 'PAY-2026-0041',
    amount: { amount: 8987400, currency: 'USD' },
    paymentMethod: 'WIRE_TRANSFER',
    referenceNumber: 'WT-JPMC-9981273921',
    receivedAt: '2026-09-04T14:22:00Z',
    status: 'CONFIRMED',
  },
];

export const mockConversations: CustomerConversation[] = [
  {
    id: 'conv-12',
    customerId: 'cust-501',
    customerName: 'Marcus Vance',
    topic: 'Chassis Weld Inspection & Lighting Change Request',
    relatedEntityType: 'ORDER',
    relatedEntityId: 'ord-9001',
    unreadMerchantCount: 1,
    updatedAt: '2026-09-24T18:10:00Z',
    messages: [
      {
        id: 'msg-1',
        senderId: 'cust-501',
        senderName: 'Marcus Vance',
        senderRole: 'CUSTOMER',
        content: 'Hi Sarah, can you provide an update on the weld inspection defect reported on unit #2? Also did you receive our change request for the smart lighting?',
        sentAt: '2026-09-24T18:10:00Z',
      },
    ],
  },
];

export const mockNotifications: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'QC Inspection Failure Reported',
    message: 'Production Order PO-2026-031 failed QC at stage "production" (Chassis weld seam porosity).',
    type: 'QC',
    priority: 'CRITICAL',
    createdAt: '2026-09-22T11:35:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'New RFQ Submitted',
    message: 'RFQ-2026-0089 submitted by Marcus Vance requires quotation within 5 days.',
    type: 'RFQ',
    priority: 'HIGH',
    createdAt: '2026-09-22T09:00:00Z',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Missing Shipping Documents',
    message: 'Shipment SHP-2026-0082 is missing Timber Fumigation Certificate for customs clearance.',
    type: 'SHIPMENT',
    priority: 'HIGH',
    createdAt: '2026-09-23T08:00:00Z',
    read: false,
  },
];

export const mockWarrantyClaims: WarrantyClaim[] = [
  {
    id: 'warr-601',
    claimNumber: 'WRN-2026-004',
    orderId: 'ord-8500',
    customerId: 'cust-490',
    customerName: 'Sierra Glamping Co.',
    productName: 'Apex Horizon Luxury Prefab Pod 40ft',
    serialNumber: 'SN-POD-40-2025-089',
    issueDescription: 'Water intrusion detected at northern window rubber seal during heavy rain.',
    photos: ['/claims/seal-leak-1.jpg'],
    status: 'UNDER_REVIEW',
    createdAt: '2026-09-19T11:00:00Z',
  },
];

export const mockAnalytics: OperationalAnalytics = {
  rfqConversionRate: 68.4,
  averageQuoteTimeHours: 18.5,
  activeOrdersTotal: { amount: 145000000, currency: 'USD' },
  onTimeInFullShippingRatePercent: 94.2,
  qcPassRatePercent: 91.5,
  monthlyRevenue: [
    { month: 'May 2026', amount: { amount: 32000000, currency: 'USD' } },
    { month: 'Jun 2026', amount: { amount: 48000000, currency: 'USD' } },
    { month: 'Jul 2026', amount: { amount: 61000000, currency: 'USD' } },
    { month: 'Aug 2026', amount: { amount: 55000000, currency: 'USD' } },
    { month: 'Sep 2026', amount: { amount: 72000000, currency: 'USD' } },
  ],
  productionStageCounts: {
    order: 3,
    engineering: 2,
    material_allocation: 1,
    production: 4,
    qc: 2,
    packaging: 1,
    dispatch: 2,
  },
};
