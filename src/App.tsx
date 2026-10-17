import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { dbInstance } from './db/sqliteEngine';
import { 
  Component, Device, ComponentDetail, DeviceDetail, 
  WorkshopSettings, Customer, Supplier, Purchase, Sale, MaintenanceStatus, Technician,
  MaintenanceWorkflowStatus
} from './db/types';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainTabType } from './components/NavigationTabs';
import { StatsBar } from './components/StatsBar';
import { SearchBar } from './components/SearchBar';
import { ResultsDashboard } from './components/ResultsDashboard';

import { SalesDashboard } from './components/sales/SalesDashboard';
import { AddDirectSaleModal } from './components/sales/AddDirectSaleModal';
import { AddMaintenanceSaleModal } from './components/sales/AddMaintenanceSaleModal';
import { InvoicePrintModal } from './components/sales/InvoicePrintModal';
import { CollectCustomerPaymentModal } from './components/sales/CollectCustomerPaymentModal';

import { PurchasesDashboard } from './components/purchases/PurchasesDashboard';
import { AddPurchaseModal } from './components/purchases/AddPurchaseModal';
import { PaySupplierModal } from './components/purchases/PaySupplierModal';

import { CustomersDashboard } from './components/customers/CustomersDashboard';
import { AddCustomerModal } from './components/customers/AddCustomerModal';

import { SuppliersDashboard } from './components/suppliers/SuppliersDashboard';
import { AddSupplierModal } from './components/suppliers/AddSupplierModal';

import { SettingsView } from './components/settings/SettingsView';
import { AddTechnicianModal } from './components/technicians/AddTechnicianModal';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { MaintenanceDashboard } from './components/maintenance/MaintenanceDashboard';

import { ComponentDetailModal } from './components/ComponentDetailModal';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { BackupModal } from './components/BackupModal';
import { PackagingGuideModal } from './components/PackagingGuideModal';
import { AddEditComponentModal } from './components/AddEditComponentModal';
import { AddEditDeviceModal } from './components/AddEditDeviceModal';
import { AddCompatibilityModal } from './components/AddCompatibilityModal';
import { AddEquivalentModal } from './components/AddEquivalentModal';
import { Cpu } from 'lucide-react';

export default function App() {
  // Main Tab Navigation: catalog | maintenance | sales | purchases | customers | suppliers | reports | settings
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('catalog');

  // Sidebar responsive collapse and drawer states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('electrocross_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('electrocross_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  const activeTabLabels: Record<MainTabType, string> = {
    catalog: 'المستودع وبدائل القطع',
    maintenance: 'الصيانة والأمانات',
    sales: 'المبيعات المباشرة',
    purchases: 'المشتريات والتوريد',
    customers: 'العملاء والفنيين',
    suppliers: 'الموردون والمصادر',
    reports: 'التقارير الشاملة',
    settings: 'إعدادات الورشة',
  };

  // Trigger re-render on database changes
  const [dbVersion, setDbVersion] = useState(0);
  const refreshDb = useCallback(() => {
    setDbVersion(v => v + 1);
  }, []);

  // Workshop Data Sources
  const settings = useMemo(() => {
    return dbInstance.getSettings();
  }, [dbVersion]);

  const stats = useMemo(() => {
    return dbInstance.getStats();
  }, [dbVersion]);

  const financialStats = useMemo(() => {
    return dbInstance.getFinancialStats();
  }, [dbVersion]);

  const components = useMemo(() => {
    return dbInstance.getComponents();
  }, [dbVersion]);

  const devices = useMemo(() => {
    return dbInstance.getDevices();
  }, [dbVersion]);

  const sales = useMemo(() => {
    return dbInstance.getSales();
  }, [dbVersion]);

  const purchases = useMemo(() => {
    return dbInstance.getPurchases();
  }, [dbVersion]);

  const customers = useMemo(() => {
    return dbInstance.getCustomers();
  }, [dbVersion]);

  const suppliers = useMemo(() => {
    return dbInstance.getSuppliers();
  }, [dbVersion]);

  const technicians = useMemo(() => {
    return dbInstance.getTechnicians();
  }, [dbVersion]);

  const maintenanceOrders = useMemo(() => {
    return dbInstance.getMaintenanceOrders();
  }, [dbVersion]);

  const activeMaintenanceCount = useMemo(() => {
    return maintenanceOrders.filter(o => 
      o.status !== 'delivered' && o.status !== 'returned_no_repair' && o.status !== 'rejected_by_customer'
    ).length;
  }, [maintenanceOrders]);

  // Search & Filter State for Catalog Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'components' | 'devices' | 'low_stock'>('all');

  // Selected Entities for Deep Detail Views
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);

  // Entities being edited
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);

  // Pre-filled IDs for linking modals
  const [linkInitialComponentId, setLinkInitialComponentId] = useState<number | undefined>(undefined);
  const [linkInitialDeviceId, setLinkInitialDeviceId] = useState<number | undefined>(undefined);
  const [equivInitialOriginalId, setEquivInitialOriginalId] = useState<number | undefined>(undefined);

  // Modals Visibility
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPackagingGuideOpen, setIsPackagingGuideOpen] = useState(false);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddCompatibilityOpen, setIsAddCompatibilityOpen] = useState(false);
  const [isAddEquivalentOpen, setIsAddEquivalentOpen] = useState(false);

  // New Modals: Sales, Purchases, Customers, Suppliers, Printing
  const [isAddDirectSaleOpen, setIsAddDirectSaleOpen] = useState(false);
  const [isAddMaintenanceSaleOpen, setIsAddMaintenanceSaleOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false);
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);
  const [collectingPaymentSale, setCollectingPaymentSale] = useState<Sale | null>(null);
  const [payingSupplierPurchase, setPayingSupplierPurchase] = useState<Purchase | null>(null);
  const [requestNewMaintenanceOrder, setRequestNewMaintenanceOrder] = useState(false);

  // Search Results for Catalog
  const searchResults = useMemo(() => {
    return dbInstance.search(searchQuery, activeFilter);
  }, [searchQuery, activeFilter, dbVersion]);

  // Autocomplete Suggestions for typing
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return dbInstance.search(searchQuery, 'all');
  }, [searchQuery, dbVersion]);

  // Active Detail Queries
  const activeComponentDetail = useMemo((): ComponentDetail | null => {
    if (!selectedComponentId) return null;
    return dbInstance.getComponentDetail(selectedComponentId);
  }, [selectedComponentId, dbVersion]);

  const activeDeviceDetail = useMemo((): DeviceDetail | null => {
    if (!selectedDeviceId) return null;
    return dbInstance.getDeviceDetail(selectedDeviceId);
  }, [selectedDeviceId, dbVersion]);

  // Handlers for Stock Adjustment
  const handleUpdateStock = (componentId: number, delta: number) => {
    dbInstance.updateStock(componentId, delta);
    refreshDb();
  };

  const handleDeleteComponent = (id: number) => {
    dbInstance.deleteComponent(id);
    setSelectedComponentId(null);
    refreshDb();
  };

  const handleDeleteDevice = (id: number) => {
    dbInstance.deleteDevice(id);
    setSelectedDeviceId(null);
    refreshDb();
  };

  // Handlers for Sales
  const handleSaveSale = (saleData: Omit<Sale, 'id'>) => {
    const created = dbInstance.addSale(saleData);
    refreshDb();
    setPrintingSale(created);
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    const saved = dbInstance.updateSale(updatedSale);
    refreshDb();
    setEditingSale(null);
    setPrintingSale(saved);
  };

  const handleUpdateMaintenanceStatus = (saleId: number, status: MaintenanceWorkflowStatus | MaintenanceStatus) => {
    dbInstance.updateMaintenanceStatus(saleId, status);
    refreshDb();
  };

  const handleDeleteSale = (saleId: number) => {
    dbInstance.deleteSale(saleId);
    refreshDb();
  };

  // Handlers for Purchases
  const handleSavePurchase = (purchaseData: Omit<Purchase, 'id'>) => {
    dbInstance.addPurchase(purchaseData);
    refreshDb();
  };

  const handleDeletePurchase = (purchaseId: number) => {
    dbInstance.deletePurchase(purchaseId);
    refreshDb();
  };

  // Handlers for Payment Collections & Supplier Disbursements
  const handleCollectPayment = (saleId: number, amount: number, paymentDate: string, notes?: string) => {
    dbInstance.collectCustomerPayment(saleId, amount, paymentDate, notes);
    refreshDb();
  };

  const handlePaySupplier = (purchaseId: number, amount: number, paymentDate: string, notes?: string) => {
    dbInstance.paySupplierBalance(purchaseId, amount, paymentDate, notes);
    refreshDb();
  };

  // Handlers for Customers
  const handleSaveCustomer = (data: Omit<Customer, 'id' | 'createdAt'>) => {
    if (editingCustomer) {
      dbInstance.updateCustomer({
        ...editingCustomer,
        ...data,
      });
    } else {
      dbInstance.addCustomer(data);
    }
    setEditingCustomer(null);
    refreshDb();
  };

  const handleDeleteCustomer = (id: number) => {
    dbInstance.deleteCustomer(id);
    refreshDb();
  };

  // Handlers for Suppliers
  const handleSaveSupplier = (data: Omit<Supplier, 'id' | 'createdAt'>) => {
    if (editingSupplier) {
      dbInstance.updateSupplier({
        ...editingSupplier,
        ...data,
      });
    } else {
      dbInstance.addSupplier(data);
    }
    setEditingSupplier(null);
    refreshDb();
  };

  const handleDeleteSupplier = (id: number) => {
    dbInstance.deleteSupplier(id);
    refreshDb();
  };

  // Handlers for Maintenance Technicians
  const handleSaveTechnician = (data: Omit<Technician, 'id' | 'createdAt'>) => {
    if (editingTechnician) {
      dbInstance.updateTechnician({
        ...editingTechnician,
        ...data,
      });
    } else {
      dbInstance.addTechnician(data);
    }
    setEditingTechnician(null);
    refreshDb();
  };

  const handleDeleteTechnician = (id: number) => {
    dbInstance.deleteTechnician(id);
    refreshDb();
  };

  // Handlers for Settings
  const handleSaveSettings = (newSettings: WorkshopSettings) => {
    dbInstance.updateSettings(newSettings);
    refreshDb();
  };

  const handleResetSettings = () => {
    dbInstance.resetSettings();
    refreshDb();
  };

  // Theme State (Dark Mode & Light Mode) with localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('electrocross_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('electrocross_theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row font-sans transition-colors duration-200 print:bg-white print:text-slate-900 print:min-h-0 overflow-x-hidden" dir="rtl">
      {/* 1. Collapsible Sidebar (Right Side in RTL) */}
      <Sidebar
        activeTab={activeMainTab}
        onTabChange={setActiveMainTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        lowStockCount={stats.lowStockCount}
        activeRepairsCount={financialStats.activeMaintenanceCount}
        maintenanceActiveCount={activeMaintenanceCount}
        shopName={settings.shopName}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Main Application Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header with Customizable Workshop Name & Actions */}
        <Header
          theme={theme}
          onToggleTheme={handleToggleTheme}
          shopName={settings.shopName}
          subTitle={settings.subTitle}
          activeTabLabel={activeTabLabels[activeMainTab]}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenSettings={() => setActiveMainTab('settings')}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenAddDirectSale={() => setIsAddDirectSaleOpen(true)}
          onOpenAddMaintenanceSale={() => setIsAddMaintenanceSaleOpen(true)}
          onOpenNewMaintenanceOrder={() => {
            setActiveMainTab('maintenance');
            setRequestNewMaintenanceOrder(true);
          }}
          onOpenAddPurchase={() => setIsAddPurchaseOpen(true)}
          onOpenAddCustomer={() => {
            setEditingCustomer(null);
            setIsAddCustomerOpen(true);
          }}
          onOpenAddSupplier={() => {
            setEditingSupplier(null);
            setIsAddSupplierOpen(true);
          }}
          onOpenAddTechnician={() => {
            setEditingTechnician(null);
            setIsAddTechnicianOpen(true);
          }}
          onOpenAddComponent={() => {
            setEditingComponent(null);
            setIsAddComponentOpen(true);
          }}
          onOpenAddDevice={() => {
            setEditingDevice(null);
            setIsAddDeviceOpen(true);
          }}
          onOpenAddCompatibility={() => {
            setLinkInitialComponentId(undefined);
            setLinkInitialDeviceId(undefined);
            setIsAddCompatibilityOpen(true);
          }}
          onOpenAddEquivalent={() => {
            setEquivInitialOriginalId(undefined);
            setIsAddEquivalentOpen(true);
          }}
        />

        {/* Main Workshop Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-6 print:hidden">
          {/* Welcome Banner on Catalog Screen (Image 2 style) */}
          {activeMainTab === 'catalog' && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900/80 to-slate-950 border border-blue-800/40 p-5 sm:p-6 shadow-xl backdrop-blur-md animate-fade-in">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      مرحباً بك في نظام ورشة الإصلاحات الإلكترونية
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      إدارة ذكية لقطع الغيار والمكونات الإلكترونية، فحص التوافقية والبدائل، والمبيعات والصيانة
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-slate-300">النظام متصل</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-cyan-400 font-mono text-[11px]">{settings.shopName || 'الفرع الرئيسي'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: CATALOG & CROSS REFERENCE (Original Core Engine) */}
          {activeMainTab === 'catalog' && (
            <div className="space-y-6 animate-fade-in">
              {/* Workshop Quick Stats Bar */}
              <StatsBar
                stats={stats}
                activeFilter={activeFilter}
                onFilterChange={(filter) => {
                  setActiveFilter(filter);
                  setSearchQuery('');
                }}
              />

            {/* Dual Instant Search Engine */}
            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              suggestions={suggestions}
              onSelectSuggestion={(item) => {
                if (item.type === 'component') {
                  setSelectedComponentId(item.id);
                } else {
                  setSelectedDeviceId(item.id);
                }
              }}
            />

            {/* Results Dashboard (Split Components & Devices View) */}
            <ResultsDashboard
              searchResults={searchResults}
              components={components}
              devices={devices}
              onSelectComponent={(id) => setSelectedComponentId(id)}
              onSelectDevice={(id) => setSelectedDeviceId(id)}
              onUpdateStock={handleUpdateStock}
              onOpenAddComponent={() => {
                setEditingComponent(null);
                setIsAddComponentOpen(true);
              }}
              onOpenAddDevice={() => {
                setEditingDevice(null);
                setIsAddDeviceOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 1.5: MAINTENANCE & SAFES WORKFLOW */}
        {activeMainTab === 'maintenance' && (
          <div className="animate-fade-in">
            <MaintenanceDashboard
              settings={settings}
              onRefresh={refreshDb}
              dbVersion={dbVersion}
              requestNewOrder={requestNewMaintenanceOrder}
              onNewOrderRequestHandled={() => setRequestNewMaintenanceOrder(false)}
              onEditSale={(sale) => setEditingSale(sale)}
            />
          </div>
        )}

        {/* TAB 2: SALES & MAINTENANCE (Direct Sales & Maintenance Orders) */}
        {activeMainTab === 'sales' && (
          <div className="animate-fade-in">
            <SalesDashboard
              sales={sales}
              financialStats={financialStats}
              settings={settings}
              onOpenAddDirectSale={() => setIsAddDirectSaleOpen(true)}
              onOpenAddMaintenanceSale={() => {
                setEditingSale(null);
                setIsAddMaintenanceSaleOpen(true);
              }}
              onEditSale={(sale) => setEditingSale(sale)}
              onPrintSale={(s) => setPrintingSale(s)}
              onCollectPayment={(s) => setCollectingPaymentSale(s)}
              onUpdateStatus={handleUpdateMaintenanceStatus}
              onDeleteSale={handleDeleteSale}
            />
          </div>
        )}

        {/* TAB 3: PURCHASES & STOCK IN */}
        {activeMainTab === 'purchases' && (
          <div className="animate-fade-in">
            <PurchasesDashboard
              purchases={purchases}
              suppliers={suppliers}
              settings={settings}
              onOpenAddPurchase={() => setIsAddPurchaseOpen(true)}
              onPaySupplier={(p) => setPayingSupplierPurchase(p)}
              onDeletePurchase={handleDeletePurchase}
            />
          </div>
        )}

        {/* TAB 4: CUSTOMERS */}
        {activeMainTab === 'customers' && (
          <div className="animate-fade-in">
            <CustomersDashboard
              customers={customers}
              sales={sales}
              settings={settings}
              onOpenAddCustomer={() => {
                setEditingCustomer(null);
                setIsAddCustomerOpen(true);
              }}
              onEditCustomer={(cust) => {
                setEditingCustomer(cust);
                setIsAddCustomerOpen(true);
              }}
              onCollectPayment={(s) => setCollectingPaymentSale(s)}
              onDeleteCustomer={handleDeleteCustomer}
            />
          </div>
        )}

        {/* TAB 5: SUPPLIERS */}
        {activeMainTab === 'suppliers' && (
          <div className="animate-fade-in">
            <SuppliersDashboard
              suppliers={suppliers}
              purchases={purchases}
              settings={settings}
              onOpenAddSupplier={() => {
                setEditingSupplier(null);
                setIsAddSupplierOpen(true);
              }}
              onEditSupplier={(sup) => {
                setEditingSupplier(sup);
                setIsAddSupplierOpen(true);
              }}
              onPaySupplier={(p) => setPayingSupplierPurchase(p)}
              onDeleteSupplier={handleDeleteSupplier}
            />
          </div>
        )}

        {/* TAB 6: COMPREHENSIVE REPORTS (Inventory, Sales, Purchases, Suppliers, Customers) */}
        {activeMainTab === 'reports' && (
          <div className="animate-fade-in">
            <ReportsDashboard
              components={components}
              sales={sales}
              purchases={purchases}
              customers={customers}
              suppliers={suppliers}
              settings={settings}
            />
          </div>
        )}

        {/* TAB 7: SETTINGS (Editable Shop Name, Contact, Warranty, Libyan Dinar, Technicians) */}
        {activeMainTab === 'settings' && (
          <div className="animate-fade-in">
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetSettings={handleResetSettings}
              technicians={technicians}
              onOpenAddTechnician={() => {
                setEditingTechnician(null);
                setIsAddTechnicianOpen(true);
              }}
              onEditTechnician={(tech) => {
                setEditingTechnician(tech);
                setIsAddTechnicianOpen(true);
              }}
              onDeleteTechnician={handleDeleteTechnician}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">
              {settings.shopName || 'المتحكمات الكهربائية'}
            </span>
            <span>•</span>
            <span>ElectroCross Pro • منظومة إدارة بدائل وتوافقية القطع والمبيعات والصيانة</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
      </div>

      {/* ALL MODALS */}

      {/* 1. Component Detail Modal */}
      <ComponentDetailModal
        detail={activeComponentDetail}
        isOpen={!!selectedComponentId}
        onClose={() => setSelectedComponentId(null)}
        onUpdateStock={handleUpdateStock}
        onEdit={(comp) => {
          setEditingComponent(comp);
          setIsAddComponentOpen(true);
        }}
        onDelete={handleDeleteComponent}
        onAddEquivalent={(compOriginalId) => {
          setEquivInitialOriginalId(compOriginalId);
          setIsAddEquivalentOpen(true);
        }}
        onAddCompatibility={(compId) => {
          setLinkInitialComponentId(compId);
          setIsAddCompatibilityOpen(true);
        }}
        onSelectComponentById={(id) => setSelectedComponentId(id)}
        onSelectDeviceById={(id) => {
          setSelectedComponentId(null);
          setSelectedDeviceId(id);
        }}
      />

      {/* 2. Device Detail Modal */}
      <DeviceDetailModal
        detail={activeDeviceDetail}
        isOpen={!!selectedDeviceId}
        onClose={() => setSelectedDeviceId(null)}
        onEdit={(dev) => {
          setEditingDevice(dev);
          setIsAddDeviceOpen(true);
        }}
        onDelete={handleDeleteDevice}
        onAddCompatibility={(devId) => {
          setLinkInitialDeviceId(devId);
          setIsAddCompatibilityOpen(true);
        }}
        onSelectComponentById={(compId) => {
          setSelectedDeviceId(null);
          setSelectedComponentId(compId);
        }}
      />

      {/* 3. Direct Sale Modal */}
      <AddDirectSaleModal
        isOpen={isAddDirectSaleOpen}
        onClose={() => setIsAddDirectSaleOpen(false)}
        onSave={handleSaveSale}
        components={components}
        customers={customers}
        currency={settings.currency}
      />

      {/* 4. Maintenance-Linked Sale Modal */}
      <AddMaintenanceSaleModal
        isOpen={isAddMaintenanceSaleOpen || !!editingSale}
        saleToEdit={editingSale}
        onClose={() => {
          setIsAddMaintenanceSaleOpen(false);
          setEditingSale(null);
        }}
        onSave={handleSaveSale}
        onUpdate={handleUpdateSale}
        components={components}
        customers={customers}
        currency={settings.currency}
        technicians={technicians}
        maintenanceOrders={maintenanceOrders}
        onOpenAddTechnician={() => {
          setEditingTechnician(null);
          setIsAddTechnicianOpen(true);
        }}
      />

      {/* 5. Printable Invoice & Maintenance Ticket Modal */}
      <InvoicePrintModal
        isOpen={!!printingSale}
        onClose={() => setPrintingSale(null)}
        sale={printingSale}
        settings={settings}
      />

      {/* 5.1 Collect Customer Payment Modal */}
      <CollectCustomerPaymentModal
        isOpen={!!collectingPaymentSale}
        onClose={() => setCollectingPaymentSale(null)}
        sale={collectingPaymentSale}
        currency={settings.currency}
        onConfirmPayment={handleCollectPayment}
      />

      {/* 6. Purchase & Restocking Modal */}
      <AddPurchaseModal
        isOpen={isAddPurchaseOpen}
        onClose={() => setIsAddPurchaseOpen(false)}
        onSave={handleSavePurchase}
        components={components}
        suppliers={suppliers}
        currency={settings.currency}
      />

      {/* 6.1 Pay Supplier Modal */}
      <PaySupplierModal
        isOpen={!!payingSupplierPurchase}
        onClose={() => setPayingSupplierPurchase(null)}
        purchase={payingSupplierPurchase}
        currency={settings.currency}
        onConfirmPayment={handlePaySupplier}
      />

      {/* 7. Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => {
          setIsAddCustomerOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        customerToEdit={editingCustomer}
      />

      {/* 8. Supplier Modal */}
      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => {
          setIsAddSupplierOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSaveSupplier}
        supplierToEdit={editingSupplier}
      />

      {/* 9. Backup & SQLite Export Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataChanged={refreshDb}
      />

      {/* 10. Packaging Guide Modal */}
      <PackagingGuideModal
        isOpen={isPackagingGuideOpen}
        onClose={() => setIsPackagingGuideOpen(false)}
      />

      {/* 11. Add/Edit Component Modal */}
      <AddEditComponentModal
        isOpen={isAddComponentOpen}
        onClose={() => {
          setIsAddComponentOpen(false);
          setEditingComponent(null);
        }}
        onSave={refreshDb}
        componentToEdit={editingComponent}
      />

      {/* 12. Add/Edit Device Modal */}
      <AddEditDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => {
          setIsAddDeviceOpen(false);
          setEditingDevice(null);
        }}
        onSave={refreshDb}
        deviceToEdit={editingDevice}
      />

      {/* 13. Add Compatibility Modal */}
      <AddCompatibilityModal
        isOpen={isAddCompatibilityOpen}
        onClose={() => {
          setIsAddCompatibilityOpen(false);
          setLinkInitialComponentId(undefined);
          setLinkInitialDeviceId(undefined);
        }}
        onSave={refreshDb}
        initialComponentId={linkInitialComponentId}
        initialDeviceId={linkInitialDeviceId}
      />

      {/* 14. Add Equivalent Modal */}
      <AddEquivalentModal
        isOpen={isAddEquivalentOpen}
        onClose={() => {
          setIsAddEquivalentOpen(false);
          setEquivInitialOriginalId(undefined);
        }}
        onSave={refreshDb}
        initialOriginalId={equivInitialOriginalId}
      />

      {/* 15. Add/Edit Maintenance Technician Modal */}
      <AddTechnicianModal
        isOpen={isAddTechnicianOpen}
        onClose={() => {
          setIsAddTechnicianOpen(false);
          setEditingTechnician(null);
        }}
        onSave={handleSaveTechnician}
        technicianToEdit={editingTechnician}
      />
    </div>
  );
}
