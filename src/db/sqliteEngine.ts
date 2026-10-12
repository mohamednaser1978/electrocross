import { 
  Component, Device, Compatibility, Equivalent, 
  ComponentDetail, DeviceDetail, SearchResultItem, WorkshopStats,
  WorkshopSettings, Customer, Supplier, Technician, Purchase, Sale, MaintenanceStatus, FinancialStats 
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
      this.sales = salesStr ? JSON.parse(salesStr) : JSON.parse(JSON.stringify(INITIAL_SALES));

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
    this.saveToStorage();
    return newSale;
  }

  public updateSale(updatedSale: Sale): void {
    const idx = this.sales.findIndex(s => s.id === updatedSale.id);
    if (idx !== -1) {
      this.sales[idx] = { ...updatedSale };
      this.saveToStorage();
    }
  }

  public updateMaintenanceStatus(saleId: number, status: MaintenanceStatus): void {
    const sale = this.sales.find(s => s.id === saleId);
    if (sale && sale.maintenance) {
      sale.maintenance.status = status;
      if (status === 'delivered' && !sale.maintenance.deliveryDate) {
        sale.maintenance.deliveryDate = new Date().toISOString().split('T')[0];
        sale.paymentStatus = 'paid';
        sale.paidAmount = sale.totalAmount;
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
}

// Global instance
export const dbInstance = new ElectroCrossDB();
