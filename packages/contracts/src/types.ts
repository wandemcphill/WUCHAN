// WUCHAN Shared Domain Contracts - Merchant / Factory Domain

export interface OrganizationProfile {
  id: string;
  name: string;
  taxId: string;
  country: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  verified: boolean;
}

export interface FactoryProfile {
  id: string;
  organizationId: string;
  factoryName: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  facilityAreaSqM: number;
  annualCapacityUnits: number;
  certifications: string[];
  productionLines: number;
  qcStandards: string[];
}

export interface MerchantProfile {
  id: string;
  organizationId: string;
  merchantName: string;
  exportMarkets: string[];
  supportedIncoterms: string[];
  bankAccounts: {
    bankName: string;
    swiftCode: string;
    accountNumber: string;
    currency: string;
  }[];
}

export interface Lead {
  id: string;
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
  country: string;
  projectType: string;
  budgetUSD: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'RFQ_ISSUED' | 'UNQUALIFIED' | 'CONVERTED';
  source: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  country: string;
  totalOrders: number;
  lifetimeValueUSD: number;
  creditTermDays: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
}

export interface RFQItem {
  productId?: string;
  productName: string;
  quantity: number;
  targetPriceUSD?: number;
  specifications: Record<string, string>;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  customerId: string;
  customerName: string;
  items: RFQItem[];
  destinationCountry: string;
  destinationPort: string;
  status: 'AWAITING_RESPONSE' | 'UNDER_REVIEW' | 'QUOTED' | 'REJECTED' | 'EXPIRED';
  dueDate: string;
  createdAt: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface QuoteVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changeLog: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceUSD: number;
    totalPriceUSD: number;
    customizations: Record<string, string>;
  }[];
  subtotalUSD: number;
  discountUSD: number;
  shippingUSD: number;
  totalAmountUSD: number;
  incoterm: string;
  paymentTerms: string;
  validUntil: string;
  leadTimeWeeks: number;
}

export interface Quote {
  id: string;
  rfqId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  currentVersionNumber: number;
  versions: QuoteVersion[];
  status: 'DRAFT' | 'AWAITING_DECISION' | 'ACCEPTED' | 'REJECTED' | 'REVISED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export type InventoryState =
  | 'available'
  | 'reserved'
  | 'allocated'
  | 'in_production'
  | 'qc_hold'
  | 'damaged'
  | 'quarantined'
  | 'packed'
  | 'dispatched'
  | 'in_transit';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'RAW_MATERIAL' | 'COMPONENT' | 'SEMI_FINISHED' | 'FINISHED_GOOD';
  warehouseId: string;
  warehouseName: string;
  quantities: Record<InventoryState, number>;
  unit: string;
  minThreshold: number;
  reorderPoint: number;
}

export interface StockReservation {
  id: string;
  sku: string;
  orderId?: string;
  rfqId?: string;
  quantity: number;
  state: InventoryState;
  reservedAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED';
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  type: 'FACTORY_STORE' | 'REGIONAL_HUB' | 'TRANSIT_PORT';
  totalCapacitySqM: number;
  usedCapacitySqM: number;
}

export interface BOMComponent {
  id: string;
  componentSku: string;
  componentName: string;
  quantityPerUnit: number;
  unit: string;
  category: string;
  leadTimeDays: number;
  unitCostUSD: number;
  subComponents?: BOMComponent[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  basePriceUSD: number;
  dimensionsMM: { length: number; width: number; height: number };
  weightKG: number;
  cbm: number;
  configurableOptions: {
    id: string;
    name: string;
    options: { label: string; priceModifierUSD: number; skuSuffix: string }[];
  }[];
  bom: BOMComponent[];
  active: boolean;
}

export type ProductionStage =
  | 'order'
  | 'engineering'
  | 'material_allocation'
  | 'production'
  | 'qc'
  | 'packaging'
  | 'dispatch';

export interface QCInspection {
  id: string;
  productionOrderId: string;
  inspectorName: string;
  stage: ProductionStage;
  inspectedAt: string;
  result: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
  defects?: { severity: 'CRITICAL' | 'MAJOR' | 'MINOR'; description: string; photoUrl?: string }[];
  actionRequired?: string;
  resolved: boolean;
}

export interface ProductionOrder {
  id: string;
  productionOrderNumber: string;
  orderId: string;
  productName: string;
  sku: string;
  quantity: number;
  currentStage: ProductionStage;
  stageProgressPercent: number;
  factoryId: string;
  startDate: string;
  targetCompletionDate: string;
  delayed: boolean;
  delayReason?: string;
  qcInspections: QCInspection[];
}

export interface OrderChangeRequest {
  id: string;
  orderId: string;
  requestNumber: string;
  requestedBy: 'CUSTOMER' | 'MERCHANT' | 'ENGINEERING';
  reason: string;
  description: string;
  commercialImpactUSD: number;
  leadTimeImpactDays: number;
  status: 'PENDING_CUSTOMER_APPROVAL' | 'PENDING_MERCHANT_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  totalAmountUSD: number;
  paidAmountUSD: number;
  paymentStatus: 'AWAITING_PAYMENT' | 'PARTIALLY_PAID' | 'PAID_IN_FULL' | 'OVERDUE';
  status: 'CONFIRMED' | 'ENGINEERING' | 'PRODUCTION' | 'QC' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  atRisk: boolean;
  riskReason?: string;
  changeRequests: OrderChangeRequest[];
  createdAt: string;
}

export interface PackageUnit {
  id: string;
  packageNumber: string;
  dimensionsMM: { length: number; width: number; height: number };
  weightKG: number;
  cbm: number;
  contentsDescription: string;
  qcPassed: boolean;
}

export interface ShippingContainer {
  id: string;
  containerNumber: string;
  sealNumber: string;
  containerType: '20GP' | '40HC' | '45HC' | 'FLAT_RACK';
  packages: PackageUnit[];
}

export interface TrackingEvent {
  id: string;
  timestamp: string;
  location: string;
  status: string;
  description: string;
  source: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  customerName: string;
  originPort: string;
  destinationPort: string;
  incoterm: string;
  carrierName: string;
  vesselName?: string;
  containers: ShippingContainer[];
  trackingEvents: TrackingEvent[];
  missingDocuments: boolean;
  requiredDocuments: string[];
  submittedDocuments: string[];
  status: 'PREPARING' | 'DISPATCHED' | 'IN_TRANSIT' | 'CUSTOMS_HOLD' | 'ARRIVED' | 'DELIVERED';
  estimatedArrival: string;
}

export interface DocumentRecord {
  id: string;
  documentNumber: string;
  title: string;
  category: 'COMMERCIAL_INVOICE' | 'PACKING_LIST' | 'BILL_OF_LADING' | 'CERTIFICATE_OF_ORIGIN' | 'QC_REPORT' | 'ENGINEERING_DRAWING';
  relatedEntityId: string; // Order, Shipment, ProductionOrder
  fileUrl: string;
  version: number;
  uploadedAt: string;
  status: 'DRAFT' | 'VERIFIED' | 'REJECTED';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  amountUSD: number;
  milestoneName: string;
  dueDate: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';
  issuedAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  orderId: string;
  paymentNumber: string;
  amountUSD: number;
  paymentMethod: 'WIRE_TRANSFER' | 'LETTER_OF_CREDIT' | 'CREDIT_CARD';
  referenceNumber: string;
  receivedAt: string;
  status: 'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED';
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'MERCHANT' | 'CUSTOMER' | 'FACTORY_WORKER';
  content: string;
  sentAt: string;
  attachments?: string[];
}

export interface CustomerConversation {
  id: string;
  customerId: string;
  customerName: string;
  topic: string;
  relatedEntityType?: 'RFQ' | 'QUOTE' | 'ORDER' | 'SHIPMENT' | 'WARRANTY';
  relatedEntityId?: string;
  unreadMerchantCount: number;
  messages: ConversationMessage[];
  updatedAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'RFQ' | 'QUOTE' | 'ORDER' | 'QC' | 'INVENTORY' | 'PAYMENT' | 'SHIPMENT';
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  productName: string;
  serialNumber?: string;
  issueDescription: string;
  photos: string[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REPLACEMENT_SENT' | 'REJECTED';
  resolutionDetails?: string;
  createdAt: string;
}

export interface OperationalAnalytics {
  rfqConversionRate: number;
  averageQuoteTimeHours: number;
  activeOrdersTotalUSD: number;
  onTimeInFullShippingRatePercent: number;
  qcPassRatePercent: number;
  monthlyRevenueUSD: { month: string; amount: number }[];
  productionStageCounts: Record<ProductionStage, number>;
}
