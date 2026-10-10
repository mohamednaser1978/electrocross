export type EquivalenceType = 'Direct_Drop_In' | 'Requires_Modification';

export interface Component {
  id: number;
  part_number: string;
  package_type: string;
  category: string;
  description: string;
  stock_quantity: number;
  bin_location: string;
}

export interface Device {
  id: number;
  device_type: string;
  brand: string;
  model_number: string;
  board_number: string;
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
