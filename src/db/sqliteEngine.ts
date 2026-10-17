import { 
  Component, Device, Compatibility, Equivalent, 
  ComponentDetail, DeviceDetail, SearchResultItem, WorkshopStats,
  WorkshopSettings, Customer, Supplier, Technician, Purchase, Sale, MaintenanceStatus, FinancialStats,
  MaintenanceOrder, MaintenanceWorkflowStatus, MaintenanceOrderPart, MaintenanceOrderTimeline, MaintenanceStats,
  PartDisposition
} from './types';
import { 
  INITIAL_COMPONENTS, INITIAL_DEVICES, INITIAL_COMPATIBILITIES, INITIAL_EQUIVALENTS,
  INITIAL_SETTINGS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, INITIAL_TECHNICIANS, INITIAL_PURCHASES, INITIAL_SALES 
} from './initialData';

const STORAGE_KEY_PREFIX = 'electrocross_db_v2_';

// Helper to provide realistic default prices for components if not set (Libyan Dinar د.ل)
function assignDefaultPrices(comp: Component): Component {
  if (comp.cost_price !== undefined && comp.sale_price !== undefined && comp.cost_price <= 100) {
    return comp;
  }
  let cost = 4;
  let sale = 9;
  const cat = (comp.category || '').toLowerCase();
  if (cat.includes('pwm') || cat.includes('controller') || cat.includes('switcher')) {
    cost = 6;
    sale = 14;
  } else if (cat.includes('mosfet') || cat.includes('transistor') || cat.includes('igbt')) {
    cost = 10;
    sale = 22;
  } else if (cat.includes('capacitor') || cat.includes('مكثف')) {
    cost = 5;
    sale = 10;
  } else if (cat.includes('microcontroller') || cat.includes('متحكم') || cat.includes('atmega')) {
    cost = 20;
    sale = 45;
  } else if (cat.includes('regulator') || cat.includes('منظم')) {
    cost = 3;
    sale = 7;
  } else if (cat.includes('optocoupler') || cat.includes('فوتوكبلر')) {
    cost = 1.5;
    sale = 4;
  }
  return {
    ...comp,
    cost_price: comp.cost_price && comp.cost_price <= 100 ? comp.cost_price : cost,
    sale_price: comp.sale_price && comp.sale_price <= 100 ? comp.sale_price : sale,
  };
}

export class ElectroCrossDB {
  private components: Component[] = [];
  private devices: Device[] = [];
  private compatibilities: Compatibility[] = [];
  private equivalents: Equivalent[] = [];

  // Business Modules State
  private settings: WorkshopSettings = INITIAL_SETTINGS;
  private customers: Customer[] = [];
  private suppliers: Supplier[] = [];
  private technicians: Technician[] = [];
  private purchases: Purchase[] = [];
  private sales: Sale[] = [];
  private maintenanceOrders: MaintenanceOrder[] = [];

  private isInitialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const compStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}components`);
      const devStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}devices`);
      const compatsStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}compatibilities`);
      const equivStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}equivalents`);

      if (compStr && devStr && compatsStr && equivStr) {
        const initCompMap = new Map(INITIAL_COMPONENTS.map(c => [c.id, c]));
        this.components = JSON.parse(compStr).map((c: Component) => {
          const init = initCompMap.get(c.id);
          return assignDefaultPrices({
            ...c,
            image_url: c.image_url || init?.image_url,
          });
        });

        const initDevMap = new Map(INITIAL_DEVICES.map(d => [d.id, d]));
        this.devices = JSON.parse(devStr).map((d: Device) => {
          const init = initDevMap.get(d.id);
          return {
            ...d,
            image_url: d.image_url || init?.image_url,
          };
        });

        this.compatibilities = JSON.parse(compatsStr);
        this.equivalents = JSON.parse(equivStr);
      } else {
        this.components = JSON.parse(JSON.stringify(INITIAL_COMPONENTS)).map(assignDefaultPrices);
        this.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
        this.compatibilities = JSON.parse(JSON.stringify(INITIAL_COMPATIBILITIES));
        this.equivalents = JSON.parse(JSON.stringify(INITIAL_EQUIVALENTS));
      }

      // Load Business Modules
      const settingsStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
      const customersStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}customers`);
      const suppliersStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}suppliers`);
      const techStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}technicians`);
      const purchasesStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}purchases`);
      const salesStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}sales`);
      const maintenanceStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}maintenance_orders`);

      this.settings = settingsStr ? JSON.parse(settingsStr) : JSON.parse(JSON.stringify(INITIAL_SETTINGS));
      this.customers = customersStr ? JSON.parse(customersStr) : JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
      this.suppliers = suppliersStr ? JSON.parse(suppliersStr) : JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
      this.technicians = techStr ? JSON.parse(techStr) : JSON.parse(JSON.stringify(INITIAL_TECHNICIANS));
      const rawPurchases = purchasesStr ? JSON.parse(purchasesStr) : JSON.parse(JSON.stringify(INITIAL_PURCHASES));
      this.purchases = rawPurchases.map((p: any) => ({
        ...p,
        paidAmount: typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount,
        paymentStatus: p.paymentStatus || ((typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount) >= p.totalAmount ? 'paid' : ((p.paidAmount || 0) > 0 ? 'partial' : 'unpaid')),
      }));
      const loadedSales = salesStr ? JSON.parse(salesStr) : JSON.parse(JSON.stringify(INITIAL_SALES));
      this.sales = loadedSales.map((s: Sale) => {
        if (!s.isSuspended) {
          return {
            ...s,
            isSuspended: false,
            suspensionReason: undefined,
            requestedParts: undefined,
            maintenance: s.maintenance ? {
              ...s.maintenance,
              isSuspended: false,
              suspensionReason: undefined,
              requestedParts: undefined,
              status: s.maintenance.status === 'awaiting_part'
                ? ((s.paidAmount >= s.totalAmount && s.totalAmount > 0) ? 'delivered' : 'ready')
                : s.maintenance.status,
            } : undefined,
          };
        }
        return s;
      });

      const rawMaintenance = maintenanceStr ? JSON.parse(maintenanceStr) : [];
      this.maintenanceOrders = rawMaintenance.map((o: MaintenanceOrder) => {
        const order = {
          ...o,
          status: (o.status as string) === 'received' ? 'in_safes' : o.status,
        };
        if (!order.isSuspended && order.status === 'awaiting_part') {
          order.status = (order.paidAmount >= order.totalAmount && order.totalAmount > 0) ? 'delivered' : 'ready';
          order.suspensionReason = undefined;
          order.requestedParts = undefined;
        }
        return order;
      });

      // Automatic migration to Libyan Dinar (د.ل) if currently in Iraqi Dinar or unmigrated
      const isLydMigrated = localStorage.getItem(`${STORAGE_KEY_PREFIX}migrated_lyd_v3`);
      if (!isLydMigrated || this.settings.currency !== 'د.ل') {
        this.settings.currency = 'د.ل';
        this.settings.phone = '+218 91 123 4567';
        this.sales = JSON.parse(JSON.stringify(INITIAL_SALES));
        this.purchases = JSON.parse(JSON.stringify(INITIAL_PURCHASES));
        this.components = this.components.map(assignDefaultPrices);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}migrated_lyd_v3`, 'true');
      }

      this.isInitialized = true;
      this.saveToStorage();
      return;
    } catch {
      console.warn('Storage read failed, initializing with seed data');
      this.resetToSeed();
    }
  }

  public saveToStorage() {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}components`, JSON.stringify(this.components));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}devices`, JSON.stringify(this.devices));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}compatibilities`, JSON.stringify(this.compatibilities));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}equivalents`, JSON.stringify(this.equivalents));

      localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(this.settings));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}customers`, JSON.stringify(this.customers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}suppliers`, JSON.stringify(this.suppliers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}technicians`, JSON.stringify(this.technicians));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}purchases`, JSON.stringify(this.purchases));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}sales`, JSON.stringify(this.sales));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}maintenance_orders`, JSON.stringify(this.maintenanceOrders));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public resetToSeed() {
    this.components = JSON.parse(JSON.stringify(INITIAL_COMPONENTS)).map(assignDefaultPrices);
    this.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
    this.compatibilities = JSON.parse(JSON.stringify(INITIAL_COMPATIBILITIES));
    this.equivalents = JSON.parse(JSON.stringify(INITIAL_EQUIVALENTS));

    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
    this.technicians = JSON.parse(JSON.stringify(INITIAL_TECHNICIANS));
    this.purchases = JSON.parse(JSON.stringify(INITIAL_PURCHASES));
    this.sales = JSON.parse(JSON.stringify(INITIAL_SALES));
    this.maintenanceOrders = [];

    this.isInitialized = true;
    this.saveToStorage();
  }

  // --- Statistics ---
  public getStats(): WorkshopStats {
    const lowStockCount = this.components.filter(c => c.stock_quantity > 0 && c.stock_quantity <= 2).length;
    const outOfStockCount = this.components.filter(c => c.stock_quantity <= 0).length;
    const totalStockUnits = this.components.reduce((sum, c) => sum + Math.max(0, c.stock_quantity), 0);

    return {
      totalComponents: this.components.length,
      totalDevices: this.devices.length,
      totalCompatibilities: this.compatibilities.length,
      totalEquivalents: this.equivalents.length,
      lowStockCount,
      outOfStockCount,
      totalStockUnits,
    };
  }

  // --- Financial & Workshop Business Analytics ---
  public getFinancialStats(): FinancialStats {
    let totalRevenue = 0;
    let directSalesRevenue = 0;
    let maintenanceRevenue = 0;
    let totalCost = 0;
    let totalLaborEarned = 0;
    let directSalesCount = 0;
    let maintenanceCount = 0;
    let activeMaintenanceCount = 0;
    let completedMaintenanceCount = 0;

    for (const sale of this.sales) {
      totalRevenue += sale.totalAmount;
      totalCost += sale.totalCost;

      if (sale.saleType === 'direct') {
        directSalesRevenue += sale.totalAmount;
        directSalesCount++;
      } else {
        maintenanceRevenue += sale.totalAmount;
        maintenanceCount++;
        if (sale.maintenance) {
          totalLaborEarned += sale.maintenance.technicianFee || 0;
          if (sale.maintenance.status === 'delivered') {
            completedMaintenanceCount++;
          } else {
            activeMaintenanceCount++;
          }
        }
      }
    }

    const totalProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      directSalesRevenue,
      maintenanceRevenue,
      totalCost,
      totalProfit,
      totalLaborEarned,
      totalSalesCount: this.sales.length,
      directSalesCount,
      maintenanceCount,
      activeMaintenanceCount,
      completedMaintenanceCount,
    };
  }

  // --- Settings Management ---
  public getSettings(): WorkshopSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<WorkshopSettings>): WorkshopSettings {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    this.saveToStorage();
    return this.getSettings();
  }

  public resetSettings(): WorkshopSettings {
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
    this.saveToStorage();
    return this.getSettings();
  }

  // --- Customers Management ---
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomer(id: number): Customer | undefined {
    return this.customers.find(c => c.id === id);
  }

  public addCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const nextId = this.customers.length > 0 ? Math.max(...this.customers.map(c => c.id)) + 1 : 1;
    const newCustomer: Customer = {
      ...data,
      id: nextId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.customers.push(newCustomer);
    this.saveToStorage();
    return newCustomer;
  }

  public updateCustomer(data: Customer): void {
    const idx = this.customers.findIndex(c => c.id === data.id);
    if (idx !== -1) {
      this.customers[idx] = { ...data };
      this.saveToStorage();
    }
  }

  public deleteCustomer(id: number): void {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveToStorage();
  }

  // --- Suppliers Management ---
  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public getSupplier(id: number): Supplier | undefined {
    return this.suppliers.find(s => s.id === id);
  }

  public addSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const nextId = this.suppliers.length > 0 ? Math.max(...this.suppliers.map(s => s.id)) + 1 : 1;
    const newSupplier: Supplier = {
      ...data,
      id: nextId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.suppliers.push(newSupplier);
    this.saveToStorage();
    return newSupplier;
  }

  public updateSupplier(data: Supplier): void {
    const idx = this.suppliers.findIndex(s => s.id === data.id);
    if (idx !== -1) {
      this.suppliers[idx] = { ...data };
      this.saveToStorage();
    }
  }

  public deleteSupplier(id: number): void {
    this.suppliers = this.suppliers.filter(s => s.id !== id);
    this.saveToStorage();
  }

  // --- Technicians / Maintenance Engineers Management ---
  public getTechnicians(): Technician[] {
    return [...this.technicians];
  }

  public getTechnician(id: number): Technician | undefined {
    return this.technicians.find(t => t.id === id);
  }

  public addTechnician(data: Omit<Technician, 'id' | 'createdAt'>): Technician {
    const nextId = this.technicians.length > 0 ? Math.max(...this.technicians.map(t => t.id)) + 1 : 1;
    const newTech: Technician = {
      ...data,
      id: nextId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.technicians.push(newTech);
    this.saveToStorage();
    return newTech;
  }

  public updateTechnician(data: Technician): void {
    const idx = this.technicians.findIndex(t => t.id === data.id);
    if (idx !== -1) {
      this.technicians[idx] = { ...data };
      this.saveToStorage();
    }
  }

  public deleteTechnician(id: number): void {
    this.technicians = this.technicians.filter(t => t.id !== id);
    this.saveToStorage();
  }

  // --- Purchases Management (Restocks Components) ---
  public getPurchases(): Purchase[] {
    return [...this.purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addPurchase(data: Omit<Purchase, 'id'>): Purchase {
    const nextId = this.purchases.length > 0 ? Math.max(...this.purchases.map(p => p.id)) + 1 : 1;
    const paidAmount = typeof data.paidAmount === 'number' ? data.paidAmount : data.totalAmount;
    const paymentStatus = data.paymentStatus || (paidAmount >= data.totalAmount ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'));

    const newPurchase: Purchase = {
      ...data,
      id: nextId,
      paidAmount,
      paymentStatus,
    };

    // Increment inventory stock, update cost price, and update sale price for each component
    for (const item of newPurchase.items) {
      const comp = this.components.find(c => c.id === item.componentId);
      if (comp) {
        comp.stock_quantity += item.quantity;
        comp.cost_price = item.unitCost;
        if (typeof item.salePrice === 'number' && item.salePrice > 0) {
          comp.sale_price = item.salePrice;
        }
      }
    }

    this.purchases.unshift(newPurchase);
    this.saveToStorage();
    return newPurchase;
  }

  public paySupplierBalance(purchaseId: number, amount: number, paymentDate?: string, notes?: string): Purchase | null {
    const purchase = this.purchases.find(p => p.id === purchaseId);
    if (!purchase) return null;

    const currentPaid = typeof purchase.paidAmount === 'number' ? purchase.paidAmount : purchase.totalAmount;
    const newPaid = Math.min(purchase.totalAmount, Math.max(0, currentPaid + amount));
    purchase.paidAmount = newPaid;
    purchase.paymentStatus = (purchase.paidAmount >= purchase.totalAmount) ? 'paid' : (purchase.paidAmount > 0 ? 'partial' : 'unpaid');

    const dateStr = paymentDate || new Date().toISOString().split('T')[0];
    const logEntry = `[سداد للمورد: ${amount} د.ل بتاريخ ${dateStr}${notes ? ' - ' + notes : ''}]`;
    purchase.notes = purchase.notes ? `${purchase.notes} | ${logEntry}` : logEntry;

    this.saveToStorage();
    return purchase;
  }

  public deletePurchase(id: number): void {
    this.purchases = this.purchases.filter(p => p.id !== id);
    this.saveToStorage();
  }

  // --- Sales Management (Direct & Maintenance) ---
  public getSales(): Sale[] {
    return [...this.sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getSale(id: number): Sale | undefined {
    return this.sales.find(s => s.id === id);
  }

  public addSale(data: Omit<Sale, 'id'>): Sale {
    const nextId = this.sales.length > 0 ? Math.max(...this.sales.map(s => s.id)) + 1 : 1;

    // Deduct stock for all items
    for (const item of data.items) {
      const comp = this.components.find(c => c.id === item.componentId);
      if (comp) {
        comp.stock_quantity = Math.max(0, comp.stock_quantity - item.quantity);
      }
    }

    const newSale: Sale = {
      ...data,
      id: nextId,
    };

    this.sales.unshift(newSale);

    // If this sale is linked to a maintenance order, synchronize the maintenance order!
    if (data.saleType === 'maintenance' && data.maintenanceOrderId) {
      const order = this.maintenanceOrders.find(o => o.id === data.maintenanceOrderId);
      if (order) {
        const targetStatus: MaintenanceWorkflowStatus = data.maintenance?.status || 'delivered';
        order.status = targetStatus;
        order.paidAmount = Math.max(order.paidAmount, data.paidAmount);
        order.totalAmount = data.totalAmount;
        if (data.isSuspended || data.maintenance?.isSuspended) {
          order.isSuspended = true;
          order.suspensionReason = data.suspensionReason || data.maintenance?.suspensionReason || 'قيد الانتظار';
          order.requestedParts = data.requestedParts || data.maintenance?.requestedParts;
          order.suspendedAt = new Date().toISOString();
        } else if (order.isSuspended) {
          order.isSuspended = false;
        }

        if (targetStatus === 'delivered') {
          order.deliveryTimestamp = new Date().toISOString();
          order.paymentStatus = data.paymentStatus;
          order.deliveredBy = data.maintenance?.technicianName || 'المسؤول';
        }
        order.updatedAt = new Date().toISOString();
        order.timeline.push({
          id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
          timestamp: new Date().toISOString(),
          action: data.isSuspended
            ? `تعليق الفاتورة (قيد الانتظار): ${data.invoiceNumber} — ${order.suspensionReason}`
            : `تسجيل فاتورة صيانة متكاملة رقم: ${data.invoiceNumber} بمبلغ ${data.totalAmount} د.ل`,
          newStatus: targetStatus,
          performedBy: data.maintenance?.technicianName || 'المحاسب',
          notes: data.isSuspended 
            ? `القطع المطلوبة: ${order.requestedParts || 'غير محدد'}`
            : `حالة السداد: ${data.paymentStatus === 'paid' ? 'مدفوع بالكامل' : data.paymentStatus === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}`,
        });
      }
    }

    this.saveToStorage();
    return newSale;
  }

  public updateSale(updatedSale: Sale): Sale {
    const idx = this.sales.findIndex(s => s.id === updatedSale.id);
    if (idx === -1) {
      const { id, ...dataWithoutId } = updatedSale;
      return this.addSale(dataWithoutId);
    }

    const oldSale = this.sales[idx];

    // 1. Calculate stock deltas for components
    const stockDeltas: Record<number, number> = {};
    for (const item of oldSale.items) {
      if (item.componentId) {
        stockDeltas[item.componentId] = (stockDeltas[item.componentId] || 0) + item.quantity;
      }
    }
    for (const item of updatedSale.items) {
      if (item.componentId) {
        stockDeltas[item.componentId] = (stockDeltas[item.componentId] || 0) - item.quantity;
      }
    }

    // Apply stock adjustments
    for (const [compIdStr, delta] of Object.entries(stockDeltas)) {
      if (delta !== 0) {
        const comp = this.components.find(c => c.id === Number(compIdStr));
        if (comp) {
          comp.stock_quantity = Math.max(0, comp.stock_quantity + delta);
        }
      }
    }

    const isSusp = Boolean(updatedSale.isSuspended || updatedSale.maintenance?.isSuspended);
    if (!isSusp) {
      updatedSale.isSuspended = false;
      updatedSale.suspensionReason = undefined;
      updatedSale.requestedParts = undefined;
      if (updatedSale.maintenance) {
        updatedSale.maintenance.isSuspended = false;
        updatedSale.maintenance.suspensionReason = undefined;
        updatedSale.maintenance.requestedParts = undefined;
        if (updatedSale.maintenance.status === 'awaiting_part') {
          updatedSale.maintenance.status = (updatedSale.paidAmount >= updatedSale.totalAmount && updatedSale.totalAmount > 0) ? 'delivered' : 'ready';
        }
      }
    }

    // 2. Update sale record
    this.sales[idx] = { ...updatedSale };

    // 3. Synchronize linked maintenance order if exists
    const orderId = updatedSale.maintenanceOrderId || oldSale.maintenanceOrderId;
    if (orderId) {
      const order = this.maintenanceOrders.find(o => o.id === orderId);
      if (order) {
        order.isSuspended = isSusp;
        if (isSusp) {
          order.suspensionReason = updatedSale.suspensionReason || updatedSale.maintenance?.suspensionReason || 'قيد الانتظار';
          order.requestedParts = updatedSale.requestedParts || updatedSale.maintenance?.requestedParts;
          order.status = updatedSale.maintenance?.status || 'awaiting_part';
        } else {
          order.isSuspended = false;
          order.suspensionReason = undefined;
          order.requestedParts = undefined;
          if (updatedSale.maintenance?.status && updatedSale.maintenance.status !== 'awaiting_part') {
            order.status = updatedSale.maintenance.status;
          } else {
            order.status = (updatedSale.paidAmount >= updatedSale.totalAmount && updatedSale.totalAmount > 0) ? 'delivered' : 'ready';
          }
        }

        order.totalAmount = updatedSale.totalAmount;
        order.paidAmount = updatedSale.paidAmount;
        order.paymentStatus = updatedSale.paymentStatus;
        if (order.status === 'delivered') {
          order.deliveryTimestamp = new Date().toISOString();
          order.deliveredBy = updatedSale.maintenance?.technicianName || order.deliveredBy || 'المسؤول';
        }
        order.updatedAt = new Date().toISOString();

        order.timeline.push({
          id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
          timestamp: new Date().toISOString(),
          action: isSusp
            ? `تعديل بيانات الفاتورة المعلقة: ${updatedSale.invoiceNumber}`
            : `إنهاء تعليق الفاتورة واعتماد الصيانة: ${updatedSale.invoiceNumber}`,
          newStatus: order.status,
          performedBy: updatedSale.maintenance?.technicianName || 'شاشة المبيعات',
          notes: isSusp 
            ? `السبب: ${order.suspensionReason}${order.requestedParts ? ` | القطع المطلوبة: ${order.requestedParts}` : ''}`
            : `تم استئناف الفاتورة وإنهاء التعليق بنجاح واعتماد المبلغ: ${updatedSale.totalAmount} د.ل`,
        });
      }
    }

    this.saveToStorage();
    return this.sales[idx];
  }

  public updateMaintenanceStatus(saleId: number, status: MaintenanceWorkflowStatus | MaintenanceStatus): void {
    const sale = this.sales.find(s => s.id === saleId);
    if (sale && sale.maintenance) {
      const isAwaitingPart = status === 'awaiting_part';
      sale.maintenance.status = status as MaintenanceWorkflowStatus;
      sale.isSuspended = isAwaitingPart;
      sale.maintenance.isSuspended = isAwaitingPart;
      if (!isAwaitingPart) {
        sale.suspensionReason = undefined;
        sale.requestedParts = undefined;
        sale.maintenance.suspensionReason = undefined;
        sale.maintenance.requestedParts = undefined;
      }

      if (status === 'delivered' && !sale.maintenance.deliveryDate) {
        sale.maintenance.deliveryDate = new Date().toISOString().split('T')[0];
        sale.paymentStatus = 'paid';
        sale.paidAmount = sale.totalAmount;
      }

      // Sync with linked maintenance order if exists
      if (sale.maintenanceOrderId) {
        const order = this.maintenanceOrders.find(o => o.id === sale.maintenanceOrderId);
        if (order) {
          order.status = status as MaintenanceWorkflowStatus;
          order.isSuspended = isAwaitingPart;
          if (!isAwaitingPart) {
            order.suspensionReason = undefined;
            order.requestedParts = undefined;
          }
          if (status === 'delivered') {
            order.deliveryTimestamp = new Date().toISOString();
            order.paymentStatus = 'paid';
            order.paidAmount = sale.totalAmount;
          }
          order.updatedAt = new Date().toISOString();
          order.timeline.push({
            id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
            timestamp: new Date().toISOString(),
            action: isAwaitingPart ? 'تعليق الفاتورة والعملية من شاشة المبيعات' : `تحديث الحالة من شاشة المبيعات إلى: ${status}`,
            newStatus: status as MaintenanceWorkflowStatus,
            performedBy: 'شاشة المبيعات',
          });
        }
      }

      this.saveToStorage();
    }
  }

  public deleteSale(id: number): void {
    const sale = this.sales.find(s => s.id === id);
    if (sale) {
      // Restore inventory stock for the sold items
      for (const item of sale.items) {
        const comp = this.components.find(c => c.id === item.componentId);
        if (comp) {
          comp.stock_quantity += item.quantity;
        }
      }
      this.sales = this.sales.filter(s => s.id !== id);
      this.saveToStorage();
    }
  }

  public collectCustomerPayment(saleId: number, amount: number, paymentDate?: string, notes?: string): Sale | null {
    const sale = this.sales.find(s => s.id === saleId);
    if (!sale) return null;

    const currentPaid = sale.paidAmount || 0;
    const newPaid = Math.min(sale.totalAmount, Math.max(0, currentPaid + amount));
    sale.paidAmount = newPaid;
    sale.paymentStatus = (sale.paidAmount >= sale.totalAmount) ? 'paid' : (sale.paidAmount > 0 ? 'partial' : 'unpaid');

    const dateStr = paymentDate || new Date().toISOString().split('T')[0];
    const logEntry = `[تحصيل من العميل: ${amount} د.ل بتاريخ ${dateStr}${notes ? ' - ' + notes : ''}]`;
    sale.notes = sale.notes ? `${sale.notes} | ${logEntry}` : logEntry;

    this.saveToStorage();
    return sale;
  }

  // --- Dual Instant Search ---
  public search(query: string, filter: 'all' | 'components' | 'devices' | 'low_stock' = 'all'): SearchResultItem[] {
    const cleanQ = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // Search Components
    if (filter === 'all' || filter === 'components' || filter === 'low_stock') {
      for (const comp of this.components) {
        if (filter === 'low_stock' && comp.stock_quantity > 2) {
          continue;
        }

        let isMatch = false;
        let matchReason = '';

        if (!cleanQ) {
          isMatch = true;
        } else {
          const partLower = comp.part_number.toLowerCase();
          const pkgLower = comp.package_type.toLowerCase();
          const catLower = comp.category.toLowerCase();
          const descLower = comp.description.toLowerCase();
          const binLower = comp.bin_location.toLowerCase();

          if (partLower.includes(cleanQ)) {
            isMatch = true;
            matchReason = `مطابقة رمز القطعة: ${comp.part_number}`;
          } else if (pkgLower.includes(cleanQ)) {
            isMatch = true;
            matchReason = `مطابقة التغليف: ${comp.package_type}`;
          } else if (catLower.includes(cleanQ)) {
            isMatch = true;
            matchReason = `مطابقة التصنيف: ${comp.category}`;
          } else if (descLower.includes(cleanQ) || binLower.includes(cleanQ)) {
            isMatch = true;
            matchReason = `مطابقة الوصف أو الدرج`;
          }
        }

        if (isMatch) {
          results.push({
            type: 'component',
            id: comp.id,
            title: comp.part_number,
            subtitle: `${comp.package_type} • ${comp.category}`,
            badge: comp.category,
            category: comp.category,
            stock: comp.stock_quantity,
            binLocation: comp.bin_location,
            matchReason: matchReason || 'قطعة إلكترونية',
            imageUrl: comp.image_url,
          });
        }
      }
    }

    // Search Devices
    if (filter === 'all' || filter === 'devices') {
      for (const dev of this.devices) {
        let isMatch = false;
        let matchReason = '';

        if (!cleanQ) {
          isMatch = true;
        } else {
          const brandLower = dev.brand.toLowerCase();
          const modelLower = dev.model_number.toLowerCase();
          const boardLower = (dev.board_number || '').toLowerCase();
          const typeLower = dev.device_type.toLowerCase();

          if (modelLower.includes(cleanQ)) {
            isMatch = true;
            matchReason = `مطابقة موديل الجهاز: ${dev.model_number}`;
          } else if (boardLower.includes(cleanQ)) {
            isMatch = true;
            matchReason = `مطابقة رقم الشاسيه/البوردة: ${dev.board_number}`;
          } else if (brandLower.includes(cleanQ) || typeLower.includes(cleanQ)) {
            isMatch = true;
            matchReason = `مطابقة الماركة أو النوع`;
          }
        }

        if (isMatch) {
          results.push({
            type: 'device',
            id: dev.id,
            title: `${dev.brand} ${dev.model_number}`,
            subtitle: `${dev.device_type} ${dev.board_number ? '• بوردة: ' + dev.board_number : ''}`,
            badge: dev.device_type,
            category: dev.device_type,
            boardNumber: dev.board_number,
            matchReason: matchReason || 'جهاز / شاسيه',
            imageUrl: dev.image_url,
          });
        }
      }
    }

    return results;
  }

  // --- Component Details with Equivalents & Compatible Devices ---
  public getComponentDetail(id: number): ComponentDetail | null {
    const comp = this.components.find(c => c.id === id);
    if (!comp) return null;

    // Compatible devices
    const compats = this.compatibilities.filter(c => c.component_id === id);
    const compatibleDevices = compats.map(c => {
      const dev = this.devices.find(d => d.id === c.device_id);
      return {
        compatibilityId: c.id,
        deviceId: c.device_id,
        brand: dev?.brand || 'غير معروف',
        deviceType: dev?.device_type || 'جهاز',
        modelNumber: dev?.model_number || 'بدون موديل',
        boardNumber: dev?.board_number || 'غير محدد',
        circuitRole: c.circuit_role,
        boardLocation: c.board_location,
        technicianNotes: c.technician_notes,
      };
    });

    // Equivalents (where this component is the original)
    const equivRecords = this.equivalents.filter(e => e.original_id === id);
    const equivalents = equivRecords.map(e => {
      const sub = this.components.find(s => s.id === e.substitute_id);
      return {
        equivalentId: e.id,
        substituteId: e.substitute_id,
        partNumber: sub?.part_number || `قطعة #${e.substitute_id}`,
        packageType: sub?.package_type || '',
        category: sub?.category || '',
        stockQuantity: sub?.stock_quantity ?? 0,
        binLocation: sub?.bin_location || '',
        equivalenceType: e.equivalence_type,
        modificationInstructions: e.modification_instructions,
      };
    });

    // Also where this component can be used as a substitute for others
    const subRecords = this.equivalents.filter(e => e.substitute_id === id);
    const usedAsSubstituteFor = subRecords.map(e => {
      const orig = this.components.find(o => o.id === e.original_id);
      return {
        equivalentId: e.id,
        originalId: e.original_id,
        partNumber: orig?.part_number || `قطعة #${e.original_id}`,
        packageType: orig?.package_type || '',
        equivalenceType: e.equivalence_type,
        modificationInstructions: e.modification_instructions,
      };
    });

    return {
      ...comp,
      compatibleDevices,
      equivalents,
      usedAsSubstituteFor,
    };
  }

  // --- Device Details with Board Components & Stock Status ---
  public getDeviceDetail(id: number): DeviceDetail | null {
    const dev = this.devices.find(d => d.id === id);
    if (!dev) return null;

    const compats = this.compatibilities.filter(c => c.device_id === id);
    const components = compats.map(c => {
      const comp = this.components.find(p => p.id === c.component_id);
      // count direct substitutes in stock
      const directSubs = this.equivalents
        .filter(e => e.original_id === c.component_id && e.equivalence_type === 'Direct_Drop_In')
        .map(e => this.components.find(s => s.id === e.substitute_id))
        .filter(s => (s?.stock_quantity ?? 0) > 0);

      return {
        compatibilityId: c.id,
        componentId: c.component_id,
        partNumber: comp?.part_number || 'غير معروف',
        packageType: comp?.package_type || '',
        category: comp?.category || '',
        description: comp?.description || '',
        stockQuantity: comp?.stock_quantity ?? 0,
        binLocation: comp?.bin_location || '',
        circuitRole: c.circuit_role,
        boardLocation: c.board_location,
        technicianNotes: c.technician_notes,
        directSubstitutesCount: directSubs.length,
      };
    });

    return {
      ...dev,
      components,
    };
  }

  // --- CRUD Operations for Components & Devices ---
  public updateStock(componentId: number, delta: number): number {
    const comp = this.components.find(c => c.id === componentId);
    if (!comp) return 0;
    comp.stock_quantity = Math.max(0, comp.stock_quantity + delta);
    this.saveToStorage();
    return comp.stock_quantity;
  }

  public setStock(componentId: number, newStock: number): number {
    const comp = this.components.find(c => c.id === componentId);
    if (!comp) return 0;
    comp.stock_quantity = Math.max(0, newStock);
    this.saveToStorage();
    return comp.stock_quantity;
  }

  public addComponent(data: Omit<Component, 'id'>): Component {
    const existing = this.components.find(c => c.part_number.toUpperCase() === data.part_number.toUpperCase());
    if (existing) {
      throw new Error(`القطعة ذات الرمز "${data.part_number}" مسجلة مسبقاً!`);
    }

    const nextId = this.components.length > 0 ? Math.max(...this.components.map(c => c.id)) + 1 : 1;
    const newComp: Component = assignDefaultPrices({
      ...data,
      id: nextId,
    });
    this.components.push(newComp);
    this.saveToStorage();
    return newComp;
  }

  public updateComponent(comp: Component): void {
    const idx = this.components.findIndex(c => c.id === comp.id);
    if (idx !== -1) {
      this.components[idx] = assignDefaultPrices({ ...comp });
      this.saveToStorage();
    }
  }

  public deleteComponent(id: number): void {
    this.components = this.components.filter(c => c.id !== id);
    this.compatibilities = this.compatibilities.filter(c => c.component_id !== id);
    this.equivalents = this.equivalents.filter(e => e.original_id !== id && e.substitute_id !== id);
    this.saveToStorage();
  }

  public addDevice(data: Omit<Device, 'id'>): Device {
    const nextId = this.devices.length > 0 ? Math.max(...this.devices.map(d => d.id)) + 1 : 1;
    const newDev: Device = {
      ...data,
      id: nextId,
    };
    this.devices.push(newDev);
    this.saveToStorage();
    return newDev;
  }

  public updateDevice(dev: Device): void {
    const idx = this.devices.findIndex(d => d.id === dev.id);
    if (idx !== -1) {
      this.devices[idx] = { ...dev };
      this.saveToStorage();
    }
  }

  public deleteDevice(id: number): void {
    this.devices = this.devices.filter(d => d.id !== id);
    this.compatibilities = this.compatibilities.filter(c => c.device_id !== id);
    this.saveToStorage();
  }

  public addCompatibility(data: Omit<Compatibility, 'id'>): Compatibility {
    const nextId = this.compatibilities.length > 0 ? Math.max(...this.compatibilities.map(c => c.id)) + 1 : 1;
    const newCompat: Compatibility = {
      ...data,
      id: nextId,
    };
    this.compatibilities.push(newCompat);
    this.saveToStorage();
    return newCompat;
  }

  public deleteCompatibility(id: number): void {
    this.compatibilities = this.compatibilities.filter(c => c.id !== id);
    this.saveToStorage();
  }

  public addEquivalent(data: Omit<Equivalent, 'id'>): Equivalent {
    if (data.original_id === data.substitute_id) {
      throw new Error('لا يمكن تحديد القطعة كبديل لنفسها!');
    }
    const nextId = this.equivalents.length > 0 ? Math.max(...this.equivalents.map(e => e.id)) + 1 : 1;
    const newEquiv: Equivalent = {
      ...data,
      id: nextId,
    };
    this.equivalents.push(newEquiv);
    this.saveToStorage();
    return newEquiv;
  }

  public deleteEquivalent(id: number): void {
    this.equivalents = this.equivalents.filter(e => e.id !== id);
    this.saveToStorage();
  }

  // --- Getters for full lists ---
  public getComponents(): Component[] {
    return [...this.components];
  }

  public getDevices(): Device[] {
    return [...this.devices];
  }

  public getCompatibilities(): Compatibility[] {
    return [...this.compatibilities];
  }

  public getEquivalents(): Equivalent[] {
    return [...this.equivalents];
  }

  // --- Backup & SQL Generator (Comprehensive with New Modules) ---
  public generateSqlDump(): string {
    const lines: string[] = [];
    lines.push('-- ElectroCross Workshop Pro Backup Export');
    lines.push(`-- Workshop: ${this.settings.shopName}`);
    lines.push(`-- Date: ${new Date().toISOString()}`);
    lines.push('PRAGMA foreign_keys = ON;\n');

    lines.push('BEGIN TRANSACTION;');
    lines.push('DELETE FROM equivalents;');
    lines.push('DELETE FROM compatibilities;');
    lines.push('DELETE FROM devices;');
    lines.push('DELETE FROM components;');
    lines.push('DELETE FROM customers;');
    lines.push('DELETE FROM suppliers;');
    lines.push('DELETE FROM sales;');
    lines.push('DELETE FROM purchases;\n');

    for (const c of this.components) {
      const part = c.part_number.replace(/'/g, "''");
      const pkg = (c.package_type || '').replace(/'/g, "''");
      const cat = (c.category || '').replace(/'/g, "''");
      const desc = (c.description || '').replace(/'/g, "''");
      const bin = (c.bin_location || '').replace(/'/g, "''");
      const img = (c.image_url || '').replace(/'/g, "''");
      const cost = c.cost_price ?? 0;
      const sale = c.sale_price ?? 0;
      lines.push(`INSERT INTO components (id, part_number, package_type, category, description, stock_quantity, bin_location, cost_price, sale_price, image_url) VALUES (${c.id}, '${part}', '${pkg}', '${cat}', '${desc}', ${c.stock_quantity}, '${bin}', ${cost}, ${sale}, '${img}');`);
    }
    lines.push('');

    for (const d of this.devices) {
      const dt = d.device_type.replace(/'/g, "''");
      const br = d.brand.replace(/'/g, "''");
      const mod = d.model_number.replace(/'/g, "''");
      const bd = (d.board_number || '').replace(/'/g, "''");
      const img = (d.image_url || '').replace(/'/g, "''");
      lines.push(`INSERT INTO devices (id, device_type, brand, model_number, board_number, image_url) VALUES (${d.id}, '${dt}', '${br}', '${mod}', '${bd}', '${img}');`);
    }
    lines.push('');

    for (const cp of this.compatibilities) {
      const role = (cp.circuit_role || '').replace(/'/g, "''");
      const loc = (cp.board_location || '').replace(/'/g, "''");
      const note = (cp.technician_notes || '').replace(/'/g, "''");
      lines.push(`INSERT INTO compatibilities (id, component_id, device_id, circuit_role, board_location, technician_notes) VALUES (${cp.id}, ${cp.component_id}, ${cp.device_id}, '${role}', '${loc}', '${note}');`);
    }
    lines.push('');

    for (const eq of this.equivalents) {
      const inst = (eq.modification_instructions || '').replace(/'/g, "''");
      lines.push(`INSERT INTO equivalents (id, original_id, substitute_id, equivalence_type, modification_instructions) VALUES (${eq.id}, ${eq.original_id}, ${eq.substitute_id}, '${eq.equivalence_type}', '${inst}');`);
    }
    lines.push('');

    for (const cust of this.customers) {
      const name = cust.name.replace(/'/g, "''");
      const phone = cust.phone.replace(/'/g, "''");
      const addr = (cust.address || '').replace(/'/g, "''");
      lines.push(`INSERT INTO customers (id, name, phone, address) VALUES (${cust.id}, '${name}', '${phone}', '${addr}');`);
    }
    lines.push('');

    for (const sup of this.suppliers) {
      const name = sup.name.replace(/'/g, "''");
      const phone = sup.phone.replace(/'/g, "''");
      const comp = (sup.company || '').replace(/'/g, "''");
      lines.push(`INSERT INTO suppliers (id, name, company, phone) VALUES (${sup.id}, '${name}', '${comp}', '${phone}');`);
    }
    lines.push('');

    for (const tech of this.technicians) {
      const name = tech.name.replace(/'/g, "''");
      const phone = (tech.phone || '').replace(/'/g, "''");
      const spec = (tech.specialty || '').replace(/'/g, "''");
      lines.push(`INSERT INTO technicians (id, name, phone, specialty) VALUES (${tech.id}, '${name}', '${phone}', '${spec}');`);
    }
    lines.push('');

    lines.push('COMMIT;');

    return lines.join('\n');
  }

  // --- SQLite Binary Export ---
  public async exportSqliteBinary(): Promise<Uint8Array | null> {
    try {
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });
      const db = new SQL.Database();
      const sqlDump = this.generateSqlDump();
      
      db.run(`
        CREATE TABLE IF NOT EXISTS components (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_number TEXT NOT NULL UNIQUE,
            package_type TEXT,
            category TEXT,
            description TEXT,
            stock_quantity INTEGER DEFAULT 0,
            bin_location TEXT,
            cost_price REAL DEFAULT 0,
            sale_price REAL DEFAULT 0,
            image_url TEXT
        );
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_type TEXT NOT NULL,
            brand TEXT NOT NULL,
            model_number TEXT NOT NULL,
            board_number TEXT,
            image_url TEXT
        );
        CREATE TABLE IF NOT EXISTS compatibilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
            device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
            circuit_role TEXT,
            board_location TEXT,
            technician_notes TEXT
        );
        CREATE TABLE IF NOT EXISTS equivalents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
            substitute_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
            equivalence_type TEXT CHECK(equivalence_type IN ('Direct_Drop_In', 'Requires_Modification')),
            modification_instructions TEXT
        );
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            address TEXT
        );
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            company TEXT,
            phone TEXT
        );
        CREATE TABLE IF NOT EXISTS technicians (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            specialty TEXT
        );
      `);

      db.run(sqlDump);
      const binary = db.export();
      db.close();
      return binary;
    } catch (err) {
      console.warn('sql.js binary export fallback:', err);
      return null;
    }
  }

  public importFromData(data: { 
    components?: Component[]; 
    devices?: Device[]; 
    compatibilities?: Compatibility[]; 
    equivalents?: Equivalent[];
    settings?: WorkshopSettings;
    customers?: Customer[];
    suppliers?: Supplier[];
    technicians?: Technician[];
    purchases?: Purchase[];
    sales?: Sale[];
  }) {
    if (data.components && Array.isArray(data.components)) {
      this.components = data.components.map(assignDefaultPrices);
    }
    if (data.devices && Array.isArray(data.devices)) {
      this.devices = data.devices;
    }
    if (data.compatibilities && Array.isArray(data.compatibilities)) {
      this.compatibilities = data.compatibilities;
    }
    if (data.equivalents && Array.isArray(data.equivalents)) {
      this.equivalents = data.equivalents;
    }
    if (data.settings) {
      this.settings = data.settings;
    }
    if (data.customers && Array.isArray(data.customers)) {
      this.customers = data.customers;
    }
    if (data.suppliers && Array.isArray(data.suppliers)) {
      this.suppliers = data.suppliers;
    }
    if (data.technicians && Array.isArray(data.technicians)) {
      this.technicians = data.technicians;
    }
    if (data.purchases && Array.isArray(data.purchases)) {
      this.purchases = data.purchases;
    }
    if (data.sales && Array.isArray(data.sales)) {
      this.sales = data.sales;
    }
    this.saveToStorage();
  }

  // ============================================================
  // --- MAINTENANCE ORDERS (إدارة الصيانة والأمانات) ---
  // ============================================================

  public generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const maxNum = this.maintenanceOrders.length > 0
      ? Math.max(...this.maintenanceOrders.map(o => {
          const parts = o.orderNumber.split('-');
          return parseInt(parts[parts.length - 1]) || 0;
        }))
      : 0;
    const nextNum = (maxNum + 1).toString().padStart(5, '0');
    return `SR-${year}-${nextNum}`;
  }

  public getMaintenanceOrders(filter?: { status?: MaintenanceWorkflowStatus | 'all' }): MaintenanceOrder[] {
    let orders = [...this.maintenanceOrders];
    if (filter?.status && filter.status !== 'all') {
      orders = orders.filter(o => o.status === filter.status);
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getMaintenanceOrder(id: number): MaintenanceOrder | null {
    return this.maintenanceOrders.find(o => o.id === id) || null;
  }

  public addMaintenanceOrder(data: Omit<MaintenanceOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>): MaintenanceOrder {
    const nextId = this.maintenanceOrders.length > 0 ? Math.max(...this.maintenanceOrders.map(o => o.id)) + 1 : 1;
    const now = new Date().toISOString();
    const orderNumber = this.generateOrderNumber();

    const effectiveStatus: MaintenanceWorkflowStatus = (data.status === 'received' || !data.status) ? 'in_safes' : data.status;

    const firstEvent: MaintenanceOrderTimeline = {
      id: 1,
      timestamp: now,
      action: effectiveStatus === 'under_inspection' 
        ? 'تم استلام الجهاز والبدء بالفحص المباشر'
        : `تم استلام الجهاز وإيداعه في الأمانات${data.shelfLocation ? ` (الرف: ${data.shelfLocation})` : ''}`,
      newStatus: effectiveStatus,
      performedBy: data.technicianName || 'الموظف المستلم',
      notes: `رقم أمر الصيانة: ${orderNumber}`,
    };

    const newOrder: MaintenanceOrder = {
      ...data,
      status: effectiveStatus,
      id: nextId,
      orderNumber,
      createdAt: now,
      updatedAt: now,
      timeline: [firstEvent],
    };

    this.maintenanceOrders.unshift(newOrder);
    this.saveToStorage();
    return newOrder;
  }

  public updateMaintenanceOrder(id: number, data: Partial<MaintenanceOrder>): MaintenanceOrder | null {
    const idx = this.maintenanceOrders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.maintenanceOrders[idx] = {
      ...this.maintenanceOrders[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.maintenanceOrders[idx];
  }

  public changeMaintenanceStatus(
    id: number,
    newStatus: MaintenanceWorkflowStatus,
    performedBy: string,
    notes?: string
  ): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === id);
    if (!order) return null;

    const oldStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    const statusLabels: Record<MaintenanceWorkflowStatus, string> = {
      received: 'تم الاستلام',
      in_safes: 'في الأمانات',
      under_inspection: 'قيد الفحص',
      under_repair: 'قيد الصيانة',
      awaiting_part: 'بانتظار قطعة',
      awaiting_approval: 'بانتظار موافقة الزبون',
      ready: 'جاهز للتسليم',
      delivered: 'تم التسليم',
      unrepairable: 'تعذر الإصلاح',
      returned_no_repair: 'تم الإرجاع بدون إصلاح',
      rejected_by_customer: 'رفض الزبون الإصلاح',
    };

    const timelineEntry: MaintenanceOrderTimeline = {
      id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
      timestamp: new Date().toISOString(),
      action: `تغيير الحالة إلى: ${statusLabels[newStatus]}`,
      oldStatus: statusLabels[oldStatus],
      newStatus: statusLabels[newStatus],
      performedBy,
      notes,
    };
    order.timeline.push(timelineEntry);

    this.saveToStorage();
    return order;
  }

  public addPartToMaintenanceOrder(orderId: number, part: Omit<MaintenanceOrderPart, 'id'>): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === orderId);
    if (!order) return null;

    const nextPartId = order.parts.length > 0 ? Math.max(...order.parts.map(p => p.id)) + 1 : 1;
    order.parts.push({ ...part, id: nextPartId, orderId });
    this._recalcOrderTotals(order);
    order.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return order;
  }

  public removePartFromMaintenanceOrder(orderId: number, partId: number): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === orderId);
    if (!order) return null;
    order.parts = order.parts.filter(p => p.id !== partId);
    this._recalcOrderTotals(order);
    order.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return order;
  }

  private _recalcOrderTotals(order: MaintenanceOrder): void {
    const isBilled = (p: MaintenanceOrderPart) => {
      if (p.isBilledToCustomer === false) return false;
      if (p.disposition === 'return_to_stock' || p.disposition === 'damaged' || p.disposition === 'not_billed') return false;
      return true;
    };

    const sparePartsBilled = order.parts.filter(p => p.type === 'spare' && isBilled(p));
    const consumablesBilled = order.parts.filter(p => p.type === 'consumable' && isBilled(p));

    order.partsTotal = sparePartsBilled.reduce((sum, p) => sum + p.totalSalePrice, 0);
    order.consumablesTotal = consumablesBilled.reduce((sum, p) => sum + p.totalSalePrice, 0);

    // Workshop cost: parts returned to stock don't cost the workshop; damaged parts DO cost the workshop
    const effectiveCostParts = order.parts.filter(p => p.disposition !== 'return_to_stock');
    order.totalCost = effectiveCostParts.reduce((sum, p) => sum + p.totalCost, 0);

    order.totalAmount = Math.max(0, order.partsTotal + order.consumablesTotal + order.laborFee - order.discount);
  }

  public updatePartDisposition(
    orderId: number,
    partId: number,
    disposition: PartDisposition,
    isBilledToCustomer: boolean,
    notes?: string
  ): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === orderId);
    if (!order) return null;
    const part = order.parts.find(p => p.id === partId);
    if (!part) return null;

    const oldDisp = part.disposition;
    part.disposition = disposition;
    part.isBilledToCustomer = isBilledToCustomer;
    if (notes) part.dispositionNotes = notes;

    // Handle warehouse stock if return_to_stock
    if (disposition === 'return_to_stock' && oldDisp !== 'return_to_stock' && part.componentId) {
      this.updateStock(part.componentId, part.quantity);
    } else if (oldDisp === 'return_to_stock' && disposition !== 'return_to_stock' && part.componentId) {
      this.updateStock(part.componentId, -part.quantity);
    }

    this._recalcOrderTotals(order);
    order.updatedAt = new Date().toISOString();

    const dispLabels: Record<PartDisposition, string> = {
      used: 'مركبة بنجاح في الجهاز (محتسبة)',
      bill_customer: 'محتسبة على العميل',
      return_to_stock: 'إرجاع إلى المستودع (معفاة للعميل)',
      damaged: 'تالفة أثناء الاختبار (معفاة للعميل)',
      not_billed: 'غير محتسبة على العميل',
    };

    const timelineEntry: MaintenanceOrderTimeline = {
      id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
      timestamp: new Date().toISOString(),
      action: `تحديد مصير القطعة (${part.partNumber || part.description}): ${dispLabels[disposition] || disposition}`,
      performedBy: 'الفني',
      notes,
    };
    order.timeline.push(timelineEntry);

    this.saveToStorage();
    return order;
  }

  public suspendMaintenanceOrder(
    orderId: number,
    reason: string,
    requestedParts?: string,
    performedBy: string = 'الفني'
  ): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === orderId);
    if (!order) return null;

    order.isSuspended = true;
    order.suspensionReason = reason;
    order.requestedParts = requestedParts;
    order.suspendedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    if (requestedParts && order.status !== 'awaiting_part') {
      order.status = 'awaiting_part';
    }

    const timelineEntry: MaintenanceOrderTimeline = {
      id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
      timestamp: new Date().toISOString(),
      action: 'تعليق الفاتورة والعملية (قيد الانتظار)',
      performedBy,
      notes: `السبب: ${reason}${requestedParts ? ` | القطع المطلوبة: ${requestedParts}` : ''}`,
    };
    order.timeline.push(timelineEntry);

    // Sync linked sale if exists
    const linkedSale = this.sales.find(s => s.maintenanceOrderId === orderId);
    if (linkedSale) {
      linkedSale.isSuspended = true;
      linkedSale.suspensionReason = reason;
      linkedSale.requestedParts = requestedParts;
      if (linkedSale.maintenance) {
        linkedSale.maintenance.isSuspended = true;
        linkedSale.maintenance.suspensionReason = reason;
        linkedSale.maintenance.requestedParts = requestedParts;
        linkedSale.maintenance.status = order.status;
      }
    }

    this.saveToStorage();
    return order;
  }

  public resumeMaintenanceOrder(
    orderId: number,
    performedBy: string = 'الفني',
    notes?: string
  ): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === orderId);
    if (!order) return null;

    order.isSuspended = false;
    order.suspensionReason = undefined;
    order.requestedParts = undefined;
    order.updatedAt = new Date().toISOString();
    if (order.status === 'awaiting_part' || order.status === 'awaiting_approval') {
      order.status = 'under_repair';
    }

    const timelineEntry: MaintenanceOrderTimeline = {
      id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
      timestamp: new Date().toISOString(),
      action: 'استئناف العمل على الفاتورة المعلقة (إعادة لقيد الصيانة)',
      performedBy,
      notes,
    };
    order.timeline.push(timelineEntry);

    // Sync linked sale if exists
    const linkedSaleResume = this.sales.find(s => s.maintenanceOrderId === orderId || s.invoiceNumber === `MNT-${order.orderNumber}`);
    if (linkedSaleResume) {
      linkedSaleResume.isSuspended = false;
      linkedSaleResume.suspensionReason = undefined;
      linkedSaleResume.requestedParts = undefined;
      if (linkedSaleResume.maintenance) {
        linkedSaleResume.maintenance.isSuspended = false;
        linkedSaleResume.maintenance.suspensionReason = undefined;
        linkedSaleResume.maintenance.requestedParts = undefined;
        linkedSaleResume.maintenance.status = order.status;
      }
    }

    this.saveToStorage();
    return order;
  }

  public confirmDelivery(
    orderId: number,
    paymentData: { paidAmount: number; paymentMethod: 'cash' | 'transfer' | 'card'; deliveredBy: string; notes?: string }
  ): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === orderId);
    if (!order) return null;

    // Deduct inventory for spare parts from warehouse (excluding parts returned to stock)
    for (const part of order.parts) {
      if (part.type === 'spare' && part.componentId && part.disposition !== 'return_to_stock') {
        const comp = this.components.find(c => c.id === part.componentId);
        if (comp) {
          comp.stock_quantity = Math.max(0, comp.stock_quantity - part.quantity);
        }
      }
    }

    const now = new Date().toISOString();
    order.paidAmount = paymentData.paidAmount;
    order.paymentStatus = paymentData.paidAmount >= order.totalAmount ? 'paid' : (paymentData.paidAmount > 0 ? 'partial' : 'unpaid');
    order.paymentMethod = paymentData.paymentMethod;
    order.deliveredBy = paymentData.deliveredBy;
    order.deliveryTimestamp = now;
    order.status = 'delivered';
    order.isSuspended = false;
    order.suspensionReason = undefined;
    order.requestedParts = undefined;
    order.updatedAt = now;

    // Sync linked sale if exists
    const linkedSaleDelivered = this.sales.find(s => s.maintenanceOrderId === orderId || s.invoiceNumber === `MNT-${order.orderNumber}`);
    if (linkedSaleDelivered) {
      linkedSaleDelivered.isSuspended = false;
      linkedSaleDelivered.suspensionReason = undefined;
      linkedSaleDelivered.requestedParts = undefined;
      linkedSaleDelivered.paidAmount = paymentData.paidAmount;
      linkedSaleDelivered.paymentStatus = order.paymentStatus;
      if (linkedSaleDelivered.maintenance) {
        linkedSaleDelivered.maintenance.isSuspended = false;
        linkedSaleDelivered.maintenance.suspensionReason = undefined;
        linkedSaleDelivered.maintenance.requestedParts = undefined;
        linkedSaleDelivered.maintenance.status = 'delivered';
      }
    }

    const timelineEntry: MaintenanceOrderTimeline = {
      id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
      timestamp: now,
      action: 'تم تسليم الجهاز للزبون',
      oldStatus: 'جاهز للتسليم',
      newStatus: 'تم التسليم',
      performedBy: paymentData.deliveredBy,
      notes: paymentData.notes,
    };
    order.timeline.push(timelineEntry);

    this.saveToStorage();
    return order;
  }

  public collectMaintenancePayment(orderId: number, amount: number, notes?: string): MaintenanceOrder | null {
    const order = this.maintenanceOrders.find(o => o.id === orderId);
    if (!order) return null;
    const newPaid = Math.min(order.totalAmount, Math.max(0, order.paidAmount + amount));
    order.paidAmount = newPaid;
    order.paymentStatus = newPaid >= order.totalAmount ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
    order.updatedAt = new Date().toISOString();

    const timelineEntry: MaintenanceOrderTimeline = {
      id: (order.timeline.length > 0 ? Math.max(...order.timeline.map(t => t.id)) + 1 : 1),
      timestamp: new Date().toISOString(),
      action: `تحصيل دفعة: ${amount} د.ل`,
      performedBy: 'الصندوق',
      notes,
    };
    order.timeline.push(timelineEntry);

    this.saveToStorage();
    return order;
  }

  public deleteMaintenanceOrder(id: number): void {
    this.maintenanceOrders = this.maintenanceOrders.filter(o => o.id !== id);
    this.saveToStorage();
  }

  public getMaintenanceStats(): MaintenanceStats {
    const today = new Date().toISOString().split('T')[0];
    const activeOrders = this.maintenanceOrders.filter(o =>
      o.status !== 'delivered' && o.status !== 'returned_no_repair' && o.status !== 'rejected_by_customer'
    );
    return {
      totalOrders: this.maintenanceOrders.length,
      inSafes: this.maintenanceOrders.filter(o => o.status === 'in_safes' || o.status === 'received').length,
      underInspection: this.maintenanceOrders.filter(o => o.status === 'under_inspection').length,
      underRepair: this.maintenanceOrders.filter(o => o.status === 'under_repair').length,
      awaitingPart: this.maintenanceOrders.filter(o => o.status === 'awaiting_part').length,
      awaitingApproval: this.maintenanceOrders.filter(o => o.status === 'awaiting_approval').length,
      ready: this.maintenanceOrders.filter(o => o.status === 'ready').length,
      deliveredToday: this.maintenanceOrders.filter(o => o.status === 'delivered' && (o.deliveryTimestamp || '').startsWith(today)).length,
      suspendedCount: this.maintenanceOrders.filter(o => o.isSuspended || o.status === 'awaiting_part').length,
      totalRevenue: this.maintenanceOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0),
      totalUnpaid: activeOrders.reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0),
    };
  }
}


// Global instance
export const dbInstance = new ElectroCrossDB();
