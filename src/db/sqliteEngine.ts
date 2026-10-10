import { Component, Device, Compatibility, Equivalent, ComponentDetail, DeviceDetail, SearchResultItem, WorkshopStats } from './types';
import { INITIAL_COMPONENTS, INITIAL_DEVICES, INITIAL_COMPATIBILITIES, INITIAL_EQUIVALENTS } from './initialData';

const STORAGE_KEY_PREFIX = 'electrocross_db_v2_';

export class ElectroCrossDB {
  private components: Component[] = [];
  private devices: Device[] = [];
  private compatibilities: Compatibility[] = [];
  private equivalents: Equivalent[] = [];
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
        this.components = JSON.parse(compStr);
        this.devices = JSON.parse(devStr);
        this.compatibilities = JSON.parse(compatsStr);
        this.equivalents = JSON.parse(equivStr);
        this.isInitialized = true;
        return;
      }
    } catch {
      console.warn('Storage read failed, initializing with seed data');
    }

    this.resetToSeed();
  }

  public saveToStorage() {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}components`, JSON.stringify(this.components));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}devices`, JSON.stringify(this.devices));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}compatibilities`, JSON.stringify(this.compatibilities));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}equivalents`, JSON.stringify(this.equivalents));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public resetToSeed() {
    this.components = JSON.parse(JSON.stringify(INITIAL_COMPONENTS));
    this.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
    this.compatibilities = JSON.parse(JSON.stringify(INITIAL_COMPATIBILITIES));
    this.equivalents = JSON.parse(JSON.stringify(INITIAL_EQUIVALENTS));
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

  // --- CRUD Operations ---
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
    const newComp: Component = {
      ...data,
      id: nextId,
    };
    this.components.push(newComp);
    this.saveToStorage();
    return newComp;
  }

  public updateComponent(comp: Component): void {
    const idx = this.components.findIndex(c => c.id === comp.id);
    if (idx !== -1) {
      this.components[idx] = { ...comp };
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

  // --- Backup & SQL Generator (Deliverable D) ---
  public generateSqlDump(): string {
    const lines: string[] = [];
    lines.push('-- ElectroCross Backup Export');
    lines.push(`-- Date: ${new Date().toISOString()}`);
    lines.push('PRAGMA foreign_keys = ON;\n');

    lines.push('BEGIN TRANSACTION;');
    lines.push('DELETE FROM equivalents;');
    lines.push('DELETE FROM compatibilities;');
    lines.push('DELETE FROM devices;');
    lines.push('DELETE FROM components;\n');

    for (const c of this.components) {
      const part = c.part_number.replace(/'/g, "''");
      const pkg = (c.package_type || '').replace(/'/g, "''");
      const cat = (c.category || '').replace(/'/g, "''");
      const desc = (c.description || '').replace(/'/g, "''");
      const bin = (c.bin_location || '').replace(/'/g, "''");
      lines.push(`INSERT INTO components (id, part_number, package_type, category, description, stock_quantity, bin_location) VALUES (${c.id}, '${part}', '${pkg}', '${cat}', '${desc}', ${c.stock_quantity}, '${bin}');`);
    }
    lines.push('');

    for (const d of this.devices) {
      const dt = d.device_type.replace(/'/g, "''");
      const br = d.brand.replace(/'/g, "''");
      const mod = d.model_number.replace(/'/g, "''");
      const bd = (d.board_number || '').replace(/'/g, "''");
      lines.push(`INSERT INTO devices (id, device_type, brand, model_number, board_number) VALUES (${d.id}, '${dt}', '${br}', '${mod}', '${bd}');`);
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
    lines.push('COMMIT;');

    return lines.join('\n');
  }

  // --- SQLite Binary Export (Tauri / Electron electro.db compatibility) ---
  public async exportSqliteBinary(): Promise<Uint8Array | null> {
    try {
      // dynamically import sql.js to create the genuine binary electro.db file
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });
      const db = new SQL.Database();
      const sqlDump = this.generateSqlDump();
      
      // Execute table creation
      db.run(`
        CREATE TABLE IF NOT EXISTS components (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_number TEXT NOT NULL UNIQUE,
            package_type TEXT,
            category TEXT,
            description TEXT,
            stock_quantity INTEGER DEFAULT 0,
            bin_location TEXT
        );
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_type TEXT NOT NULL,
            brand TEXT NOT NULL,
            model_number TEXT NOT NULL,
            board_number TEXT
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
      `);

      // Execute data population
      db.run(sqlDump);
      const binary = db.export();
      db.close();
      return binary;
    } catch (err) {
      console.warn('sql.js binary export fallback:', err);
      return null;
    }
  }

  public importFromData(data: { components: Component[]; devices: Device[]; compatibilities: Compatibility[]; equivalents: Equivalent[] }) {
    if (data.components && Array.isArray(data.components)) {
      this.components = data.components;
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
    this.saveToStorage();
  }
}

// Global instance
export const dbInstance = new ElectroCrossDB();
