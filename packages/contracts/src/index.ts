import { Currency, RoleName, Permission, OrderStatus, OrgType, Money } from './enums.js';

export { Currency, RoleName, Permission, OrderStatus, OrgType, Money };

export type Language = 'en' | 'zh';

/**
 * UI-facing customer display role. Runtime authorization is server-controlled
 * by RoleName/Permission from enums.ts, never by this display value.
 */
export type UserRole = string;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
}

export interface Organization {
  id: string;
  name: string;
  taxId?: string;
  preferredCurrency: Currency;
  destinationPort?: string;
  country: string;
  address: string;
  contactEmail: string;
  members: UserProfile[];
}

export type StructureType =
  | 'EXPANDABLE_CONTAINER'
  | 'LUXURY_POD'
  | 'STEEL_VILLA'
  | 'MODULAR_OFFICE'
  | 'FLAT_PACK_CABIN'
  | 'DOME_STRUCTURE';

export type CategoryUsage = 'RESIDENTIAL' | 'COMMERCIAL' | 'HOSPITALITY' | 'EMERGENCY_HOUSING' | 'INDUSTRIAL';

export interface PhysicalProfile {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  floorAreaSqm: number;
  weightKg: number;
  shippingVolumeCbm: number;
  containerTypeNeeded: '40ft_HC' | '20ft_GP' | 'FLAT_RACK' | 'BREAK_BULK';
  containersRequired: number;
}

export interface PerformanceSpecs {
  windResistanceKmh: number;
  snowLoadKnSqm: number;
  seismicRating: string;
  fireRating: string;
  thermalInsulationRValue: number;
  soundproofDb: number;
  lifespanYears: number;
  regionalCertifications: string[];
}

export interface OptionValue {
  id: string;
  name: { en: string; zh: string };
  description?: { en: string; zh: string };
  priceDeltaUsd: Money;
  weightDeltaKg: number;
  cbmDelta: number;
  leadTimeDeltaDays: number;
  isDefault?: boolean;
}

export interface OptionGroup {
  id: string;
  code: string;
  name: { en: string; zh: string };
  description?: { en: string; zh: string };
  isRequired: boolean;
  values: OptionValue[];
}

export interface BOMComponent {
  id: string;
  name: { en: string; zh: string };
  category: 'STRUCTURAL_STEEL' | 'PANEL' | 'INSULATION' | 'GLAZING' | 'ELECTRICAL' | 'PLUMBING' | 'FINISH';
  specifications: string;
  quantity: number;
  unit: string;
  unitCostUsd: Money;
}

export interface Product {
  id: string;
  sku: string;
  name: { en: string; zh: string };
  tagline: { en: string; zh: string };
  description: { en: string; zh: string };
  structureType: StructureType;
  primaryUsage: CategoryUsage[];
  basePriceUsd: Money;
  baseLeadTimeDays: number;
  images: string[];
  floorPlanImages: string[];
  videoUrl?: string;
  cadFileUrl?: string;
  physicalProfile: PhysicalProfile;
  performanceSpecs: PerformanceSpecs;
  optionGroups: OptionGroup[];
  standardBom: BOMComponent[];
}

export interface SelectedOption {
  groupId: string;
  groupCode: string;
  valueId: string;
  valueName: { en: string; zh: string };
  priceDeltaUsd: Money;
  weightDeltaKg: number;
  cbmDelta: number;
  leadTimeDeltaDays: number;
}

export interface ProductConfiguration {
  id: string;
  productId: string;
  productSku: string;
  productName: { en: string; zh: string };
  selectedOptions: SelectedOption[];
  calculatedPriceUsd: Money;
  calculatedWeightKg: number;
  calculatedCbm: number;
  calculatedLeadTimeDays: number;
  containersRequired: number;
  createdAt: string;
}

export interface ProjectSite {
  id: string;
  name: string;
  locationAddress: string;
  country: string;
  destinationPort: string;
  latitude?: number;
  longitude?: number;
  soilBearingCapacityKpa?: number;
  soilTestReportUrl?: string;
  applicableBuildingCode: string;
  siteSurveyCompleted: boolean;
  notes?: string;
}

export interface Project {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string;
  site: ProjectSite;
  targetDeliveryDate: string;
  budgetUsd?: Money;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  rfqIds: string[];
  orderIds: string[];
  createdAt: string;
}

export type RFQStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'REVISION_REQUESTED' | 'EXPIRED' | 'CANCELLED';

export interface RFQItem {
  id: string;
  productId: string;
  productName: { en: string; zh: string };
  configuration: ProductConfiguration;
  quantity: number;
  unitTargetPriceUsd?: number;
  notes?: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  status: RFQStatus;
  items: RFQItem[];
  destinationPort: string;
  incotermsRequested: Incoterm;
  requestedDeliveryDate: string;
  technicalRequirementsNote?: string;
  attachments: { name: string; url: string; sizeBytes: number }[];
  quotesGeneratedIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type Incoterm = 'FOB' | 'CIF' | 'DDP';

export interface QuoteLineItem {
  id: string;
  productId: string;
  productName: { en: string; zh: string };
  configurationSnapshot: ProductConfiguration;
  quantity: number;
  unitPriceUsd: Money;
  totalPriceUsd: Money;
  leadTimeDays: number;
}

export interface QuoteVersion {
  versionNumber: number;
  issuedAt: string;
  validUntil: string;
  lineItems: QuoteLineItem[];
  subtotalUsd: Money;
  seaFreightEstimateUsd: Money;
  customsInsuranceEstimateUsd: Money;
  discountUsd: Money;
  totalUsd: Money;
  incoterms: Incoterm;
  paymentTermsNote: string;
  validityDays: number;
  sellerNotes?: string;
  changesSummaryFromPrevious?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  rfqId: string;
  rfqNumber: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  currentVersion: QuoteVersion;
  versionHistory: QuoteVersion[];
  status: 'ISSUED' | 'ACCEPTED' | 'SUPERSEDED' | 'DECLINED' | 'EXPIRED';
  acceptedAt?: string;
  acceptedByUserId?: string;
  purchaseOrderRef?: string;
}

export type OrderState =
  | 'DRAFT'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'CONTRACT_PENDING'
  | 'DEPOSIT_PENDING'
  | 'CONFIRMED'
  | 'ENGINEERING'
  | 'PRODUCTION'
  | 'QC'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'INSTALLATION'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'DISPUTED';

export interface PaymentMilestone {
  id: string;
  stageName: string;
  percentage: number;
  amountUsd: Money;
  dueDate: string;
  status: 'PENDING' | 'RECEIPT_SUBMITTED' | 'VERIFIED_PAID' | 'OVERDUE';
  receiptUrl?: string;
  submittedAt?: string;
  verifiedAt?: string;
  bankRefNumber?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  milestoneId: string;
  stageTitle: string;
  amountUsd: Money;
  currency: Currency;
  convertedAmount: number;
  issuedDate: string;
  dueDate: string;
  status: 'ISSUED' | 'RECEIPT_UNDER_VERIFICATION' | 'PAID' | 'OVERDUE';
  sellerBankDetails: {
    bankName: string;
    swiftCode: string;
    accountName: string;
    accountNumber: string;
    iban?: string;
    bankAddress: string;
  };
  paymentReceipts: {
    id: string;
    uploadedAt: string;
    fileUrl: string;
    fileName: string;
    bankRefNumber: string;
    status: 'UNDER_VERIFICATION' | 'APPROVED' | 'REJECTED';
    notes?: string;
  }[];
}

export interface PackageUnit {
  id: string;
  packageCode: string;
  description: string;
  weightKg: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  cbm: number;
  itemsInside: string[];
}

export interface Container {
  id: string;
  containerNumber: string;
  sealNumber: string;
  containerType: '40ft_HC' | '20ft_GP' | 'FLAT_RACK';
  packages: PackageUnit[];
  totalWeightKg: number;
  totalCbm: number;
}

export interface TrackingEvent {
  id: string;
  timestamp: string;
  location: string;
  title: string;
  description: string;
  source: 'CARRIER_API' | 'PORT_AUTHORITY' | 'LOGISTICS_MANAGER' | 'FACTORY';
  evidenceUrl?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber: string;
  shippingLine: string;
  vesselName: string;
  voyageNumber: string;
  billOfLadingNumber: string;
  originPort: string;
  destinationPort: string;
  estimatedDeparture: string;
  actualDeparture?: string;
  estimatedArrival: string;
  actualArrival?: string;
  containers: Container[];
  trackingEvents: TrackingEvent[];
  currentStatus: 'PACKING' | 'PORT_ORIGIN' | 'SAILING' | 'PORT_DESTINATION' | 'CUSTOMS_CLEARANCE' | 'DELIVERED';
}

export interface Order {
  id: string;
  orderNumber: string;
  quoteId: string;
  quoteNumber: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  state: OrderState;
  stateHistory: { state: OrderState; timestamp: string; updatedBy: string; notes?: string }[];
  acceptedQuoteSnapshot: QuoteVersion;
  paymentMilestones: PaymentMilestone[];
  invoices: Invoice[];
  shipments: Shipment[];
  engineeringDrawingApproved: boolean;
  productionProgressPct: number;
  responsibleAccountManager: { name: string; title: string; email: string; avatarUrl: string };
  responsibleFactoryEngineer: { name: string; title: string; email: string; avatarUrl: string };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

export interface Document {
  id: string;
  title: string;
  category: 'ENGINEERING_DRAWING' | 'COMPLIANCE_CERTIFICATE' | 'COMMERCIAL_INVOICE' | 'BILL_OF_LADING' | 'SITE_PREP_MANUAL' | 'CONTRACT' | 'QC_INSPECTION_REPORT';
  projectId?: string;
  orderId?: string;
  currentVersion: DocumentVersion;
  versionHistory: DocumentVersion[];
  accessLevel: 'PUBLIC' | 'CUSTOMER_ORGANIZATION' | 'ADMIN_ONLY';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  content: string;
  attachments?: { name: string; url: string; sizeBytes: number }[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  topic: string;
  contextType: 'PROJECT' | 'RFQ' | 'ORDER' | 'GENERAL';
  contextId?: string;
  participants: { id: string; name: string; role: string }[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'QUOTE_ISSUED' | 'MILESTONE_UPDATED' | 'PAYMENT_RECEIPT_VERIFIED' | 'SHIPMENT_EVENT' | 'NEW_MESSAGE';
  linkUrl?: string;
  read: boolean;
  createdAt: string;
}
