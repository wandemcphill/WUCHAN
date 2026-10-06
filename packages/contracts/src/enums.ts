export enum Domain {
  AUTH = 'auth',
  ORGANIZATIONS = 'organizations',
  CATALOG = 'catalog',
  RFQ = 'rfq',
  QUOTES = 'quotes',
  ORDERS = 'orders',
  PAYMENTS = 'payments',
  INVOICING = 'invoicing',
  INVENTORY = 'inventory',
  PRODUCTION = 'production',
  QUALITY = 'quality',
  SHIPPING = 'shipping',
  DOCUMENTS = 'documents',
  MESSAGING = 'messaging',
  NOTIFICATIONS = 'notifications',
  AI = 'ai',
  AUDIT = 'audit'
}

export enum OrgType {
  CUSTOMER = 'CUSTOMER',
  FACTORY = 'FACTORY',
  PLATFORM = 'PLATFORM'
}

export enum RoleName {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ORG_OWNER = 'ORG_OWNER',
  ORG_ADMIN = 'ORG_ADMIN',
  FACTORY_MANAGER = 'FACTORY_MANAGER',
  PRODUCTION_SUPERVISOR = 'PRODUCTION_SUPERVISOR',
  QUALITY_INSPECTOR = 'QUALITY_INSPECTOR',
  CUSTOMER_BUYER = 'CUSTOMER_BUYER',
  CUSTOMER_PROJECT_MANAGER = 'CUSTOMER_PROJECT_MANAGER',
  MEMBER = 'MEMBER'
}

export enum Permission {
  // Organizations
  ORG_READ = 'organizations:read',
  ORG_MANAGE = 'organizations:manage',
  ORG_MEMBERS_MANAGE = 'organizations:members:manage',

  // Catalog
  CATALOG_READ = 'catalog:read',
  CATALOG_MANAGE = 'catalog:manage',

  // RFQ
  RFQ_CREATE = 'rfq:create',
  RFQ_READ = 'rfq:read',
  RFQ_MANAGE = 'rfq:manage',

  // Quotes
  QUOTE_CREATE = 'quotes:create',
  QUOTE_READ = 'quotes:read',
  QUOTE_APPROVE = 'quotes:approve',
  QUOTE_MANAGE = 'quotes:manage',

  // Contracts
  CONTRACT_READ = 'contracts:read',
  CONTRACT_CREATE = 'contracts:create',
  CONTRACT_SIGN = 'contracts:sign',
  CONTRACT_MANAGE = 'contracts:manage',

  // Orders
  ORDER_READ = 'orders:read',
  ORDER_CREATE = 'orders:create',
  ORDER_MANAGE = 'orders:manage',
  ORDER_STATE_UPDATE = 'orders:state:update',

  // Payments & Invoicing
  PAYMENT_READ = 'payments:read',
  PAYMENT_PROCESS = 'payments:process',
  INVOICE_READ = 'invoicing:read',
  INVOICE_CREATE = 'invoicing:create',

  // Inventory & Production & Quality
  INVENTORY_READ = 'inventory:read',
  INVENTORY_MANAGE = 'inventory:manage',
  PRODUCTION_READ = 'production:read',
  PRODUCTION_MANAGE = 'production:manage',
  QUALITY_READ = 'quality:read',
  QUALITY_INSPECT = 'quality:inspect',

  // Shipping & Documents
  SHIPPING_READ = 'shipping:read',
  SHIPPING_MANAGE = 'shipping:manage',
  DOCUMENTS_READ = 'documents:read',
  DOCUMENTS_MANAGE = 'documents:manage',

  // Messaging & Notifications & AI
  MESSAGING_READ = 'messaging:read',
  MESSAGING_SEND = 'messaging:send',
  NOTIFICATIONS_READ = 'notifications:read',
  AI_EXECUTE = 'ai:execute',

  // Audit
  AUDIT_READ = 'audit:read'
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  CONTRACT_PENDING = 'CONTRACT_PENDING',
  DEPOSIT_PENDING = 'DEPOSIT_PENDING',
  CONFIRMED = 'CONFIRMED',
  ENGINEERING = 'ENGINEERING',
  PRODUCTION = 'PRODUCTION',
  QC = 'QC',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  INSTALLATION = 'INSTALLATION',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

/** Explicit Server-Controlled Order State Machine Allowed Transitions */
const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.QUOTED, OrderStatus.CANCELLED],
  [OrderStatus.QUOTED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
  [OrderStatus.ACCEPTED]: [OrderStatus.CONTRACT_PENDING, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
  [OrderStatus.CONTRACT_PENDING]: [OrderStatus.DEPOSIT_PENDING, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
  [OrderStatus.DEPOSIT_PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
  [OrderStatus.CONFIRMED]: [OrderStatus.ENGINEERING, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
  [OrderStatus.ENGINEERING]: [OrderStatus.PRODUCTION, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
  [OrderStatus.PRODUCTION]: [OrderStatus.QC, OrderStatus.ON_HOLD, OrderStatus.DISPUTED],
  [OrderStatus.QC]: [OrderStatus.READY_TO_SHIP, OrderStatus.PRODUCTION, OrderStatus.ON_HOLD, OrderStatus.DISPUTED],
  [OrderStatus.READY_TO_SHIP]: [OrderStatus.SHIPPED, OrderStatus.ON_HOLD, OrderStatus.DISPUTED],
  [OrderStatus.SHIPPED]: [OrderStatus.IN_TRANSIT, OrderStatus.DISPUTED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.ARRIVED, OrderStatus.DISPUTED],
  [OrderStatus.ARRIVED]: [OrderStatus.DELIVERED, OrderStatus.DISPUTED],
  [OrderStatus.DELIVERED]: [OrderStatus.INSTALLATION, OrderStatus.COMPLETED, OrderStatus.DISPUTED],
  [OrderStatus.INSTALLATION]: [OrderStatus.COMPLETED, OrderStatus.DISPUTED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.ON_HOLD]: [OrderStatus.DRAFT, OrderStatus.QUOTED, OrderStatus.CONFIRMED, OrderStatus.ENGINEERING, OrderStatus.PRODUCTION, OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.DISPUTED]: [OrderStatus.ON_HOLD, OrderStatus.CANCELLED, OrderStatus.PRODUCTION, OrderStatus.READY_TO_SHIP, OrderStatus.SHIPPED]
};

export function isValidOrderStatusTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  CNY = 'CNY',
  GBP = 'GBP',
  AUD = 'AUD'
}

export interface Money {
  /** Amount represented as integer minor units (e.g., $100.00 USD -> 10000) */
  amountCents: number;
  /** ISO-4217 Currency Code */
  currency: Currency;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export interface UserContext {
  userId: string;
  email: string;
  activeOrgId?: string;
  activeRole?: RoleName;
  permissions: Permission[];
}

export interface AuditEventPayload {
  eventId: string;
  domain: Domain;
  action: string;
  actorId: string;
  organizationId?: string;
  resourceId?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  timestamp: string;
}

export interface NotificationPayload {
  notificationId: string;
  recipientUserId: string;
  organizationId?: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, any>;
}
