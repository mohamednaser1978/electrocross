export type EquivalenceType = 'Direct_Drop_In' | 'Requires_Modification';

export interface Component {
  id: number;
  part_number: string;
  package_type: string;
  category: string;
  description: string;
  stock_quantity: number;
  bin_location: string;
  cost_price?: number; // سعر التكلفة / الشراء
  sale_price?: number; // سعر البيع الافتراضي
  image_url?: string;  // صورة القطعة / الآيسي / المخطط
}

export interface Device {
  id: number;
  device_type: string;
  brand: string;
  model_number: string;
  board_number: string;
  image_url?: string;  // صورة اللوحة / الشاسيه / الجهاز
}

export interface Compatibility {
  id: number;
  component_id: number;
  device_id: number;
  circuit_role: string;
  board_location: string;
  technician_notes: string;
  // Joined fields
  part_number?: string;
  package_type?: string;
  category?: string;
  stock_quantity?: number;
  bin_location?: string;
  brand?: string;
  device_type?: string;
  model_number?: string;
  board_number?: string;
}

export interface Equivalent {
  id: number;
  original_id: number;
  substitute_id: number;
  equivalence_type: EquivalenceType;
  modification_instructions: string;
  // Joined fields for substitute
  substitute_part_number?: string;
  substitute_package?: string;
  substitute_category?: string;
  substitute_stock?: number;
  substitute_bin?: string;
  // Joined fields for original
  original_part_number?: string;
}

export interface ComponentDetail extends Component {
  compatibleDevices: {
    compatibilityId: number;
    deviceId: number;
    brand: string;
    deviceType: string;
    modelNumber: string;
    boardNumber: string;
    circuitRole: string;
    boardLocation: string;
    technicianNotes: string;
  }[];
  equivalents: {
    equivalentId: number;
    substituteId: number;
    partNumber: string;
    packageType: string;
    category: string;
    stockQuantity: number;
    binLocation: string;
    equivalenceType: EquivalenceType;
    modificationInstructions: string;
  }[];
  usedAsSubstituteFor: {
    equivalentId: number;
    originalId: number;
    partNumber: string;
    packageType: string;
    equivalenceType: EquivalenceType;
    modificationInstructions: string;
  }[];
}

export interface DeviceDetail extends Device {
  components: {
    compatibilityId: number;
    componentId: number;
    partNumber: string;
    packageType: string;
    category: string;
    description: string;
    stockQuantity: number;
    binLocation: string;
    circuitRole: string;
    boardLocation: string;
    technicianNotes: string;
    directSubstitutesCount: number;
  }[];
}

export interface SearchResultItem {
  type: 'component' | 'device';
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  category: string;
  stock?: number;
  binLocation?: string;
  boardNumber?: string;
  matchReason?: string;
  imageUrl?: string;
}

export interface WorkshopStats {
  totalComponents: number;
  totalDevices: number;
  totalCompatibilities: number;
  totalEquivalents: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
}

// ==========================================
// NEW MODULES: SETTINGS, CUSTOMERS, SUPPLIERS, PURCHASES, SALES
// ==========================================

export interface WorkshopSettings {
  shopName: string; // e.g. "المتحكمات الكهربائية"
  subTitle: string; // e.g. "لصيانة الأجهزة والمتحكمات الإلكترونية وبدائل القطع"
  phone: string;
  address: string;
  currency: string; // e.g. "د.ع" أو "ج.م" أو "ر.س" أو "$"
  invoiceFooterNote: string;
  warrantyTerms: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  company?: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Technician {
  id: number;
  name: string;
  phone?: string;
  specialty?: string; // التخصص: صيانة شاشات، كروت إنفرتر، باور سبلاي، غسالات وتكييف...
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId?: number;
  componentId: number;
  partNumber: string;
  quantity: number;
  unitCost: number;
  salePrice?: number; // سعر البيع بالمستودع للقطعة الموردة
  totalCost: number;
}

export interface Purchase {
  id: number;
  invoiceNumber: string;
  supplierId?: number;
  supplierName: string;
  date: string;
  totalAmount: number;
  paidAmount: number; // المبلغ المدفوع للمورد
  paymentStatus: 'paid' | 'partial' | 'unpaid'; // حالة السداد للمورد
  notes?: string;
  items: PurchaseItem[];
}

export type SaleType = 'direct' | 'maintenance';
export type MaintenanceStatus = 'received' | 'in_progress' | 'ready' | 'delivered';

export interface SaleItem {
  id: number;
  saleId?: number;
  componentId: number;
  partNumber: string;
  quantity: number;
  unitPrice: number; // سعر البيع للقطعة
  unitCost: number;  // تكلفة الشراء للقطعة
  totalPrice: number;
  totalCost: number;
}

export interface MaintenanceDetail {
  deviceType: string; // نوع الجهاز (شاشة، كارت مكيف، غسالة، باور، إنفرتر...)
  brand: string;      // الماركة
  modelOrBoard: string; // الموديل أو رقم البوردة
  serialOrChassis?: string; // رقم الشاسيه أو السيريال
  faultDescription: string; // وصف العطل والتشخيص
  technicianName: string;   // اسم الفني
  technicianFee: number;    // أجرة التركيب / أجرة الفني
  extraServicesDescription?: string; // تفاصيل الخدمات والمصاريف الإضافية
  extraServicesFee: number; // رسوم الخدمات الإضافية المحتسبة على العميل
  extraExpensesCost: number; // تكلفة المصاريف الفعلية (لتدقيق الربح)
  status: MaintenanceStatus;
  receivedDate?: string;
  deliveryDate?: string;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  saleType: SaleType; // direct | maintenance
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: SaleItem[]; // قطع الغيار المستخدمة أو المباعة
  partsTotal: number; // إجمالي سعر بيع قطع الغيار
  maintenance?: MaintenanceDetail; // تفاصيل الصيانة في حال كان نوع البيع صيانة
  discount: number; // الخصم
  totalAmount: number; // الإيراد الإجمالي للعملية
  totalCost: number;   // التكلفة الإجمالية (تكلفة قطع الغيار + المصاريف المباشرة)
  profit: number;      // صافي الربح = totalAmount - totalCost
  paidAmount: number;  // المبلغ المدفوع
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}

export interface FinancialStats {
  totalRevenue: number;
  directSalesRevenue: number;
  maintenanceRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalLaborEarned: number;
  totalSalesCount: number;
  directSalesCount: number;
  maintenanceCount: number;
  activeMaintenanceCount: number;
  completedMaintenanceCount: number;
}
