import React, { useState, useMemo, useCallback } from 'react';
import { dbInstance } from './db/sqliteEngine';
import { Component, Device, ComponentDetail, DeviceDetail } from './db/types';

import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { SearchBar } from './components/SearchBar';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ComponentDetailModal } from './components/ComponentDetailModal';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { BackupModal } from './components/BackupModal';
import { PackagingGuideModal } from './components/PackagingGuideModal';
import { AddEditComponentModal } from './components/AddEditComponentModal';
import { AddEditDeviceModal } from './components/AddEditDeviceModal';
import { AddCompatibilityModal } from './components/AddCompatibilityModal';
import { AddEquivalentModal } from './components/AddEquivalentModal';

export default function App() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'components' | 'devices' | 'low_stock'>('all');

  // Selected Entities for Deep Detail Views
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);

  // Entity being edited
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Pre-filled IDs for linking modals
  const [linkInitialComponentId, setLinkInitialComponentId] = useState<number | undefined>(undefined);
  const [linkInitialDeviceId, setLinkInitialDeviceId] = useState<number | undefined>(undefined);
  const [equivInitialOriginalId, setEquivInitialOriginalId] = useState<number | undefined>(undefined);

  // Modal Visibility States
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPackagingGuideOpen, setIsPackagingGuideOpen] = useState(false);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddCompatibilityOpen, setIsAddCompatibilityOpen] = useState(false);
  const [isAddEquivalentOpen, setIsAddEquivalentOpen] = useState(false);

  // Trigger re-render on database changes
  const [dbVersion, setDbVersion] = useState(0);
  const refreshDb = useCallback(() => {
    setDbVersion(v => v + 1);
  }, []);

  // Workshop Stats & Raw Data
  const stats = useMemo(() => {
    return dbInstance.getStats();
  }, [dbVersion]);

  const components = useMemo(() => {
    return dbInstance.getComponents();
  }, [dbVersion]);

  const devices = useMemo(() => {
    return dbInstance.getDevices();
  }, [dbVersion]);

  // Search Results
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200" dir="rtl">
      {/* Top Header */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-400">ElectroCross v1.0 Pro</span>
            <span>•</span>
            <span>منظومة إدارة توافقية وبدائل القطع والمكونات الإلكترونية لورش الصيانة</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      {/* MODALS */}

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

      {/* 3. Backup & SQLite Export Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataChanged={refreshDb}
      />

      {/* 4. Desktop Packaging & Compilation Guide Modal */}
      <PackagingGuideModal
        isOpen={isPackagingGuideOpen}
        onClose={() => setIsPackagingGuideOpen(false)}
      />

      {/* 5. Add/Edit Component Modal */}
      <AddEditComponentModal
        isOpen={isAddComponentOpen}
        onClose={() => {
          setIsAddComponentOpen(false);
          setEditingComponent(null);
        }}
        onSave={refreshDb}
        componentToEdit={editingComponent}
      />

      {/* 6. Add/Edit Device Modal */}
      <AddEditDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => {
          setIsAddDeviceOpen(false);
          setEditingDevice(null);
        }}
        onSave={refreshDb}
        deviceToEdit={editingDevice}
      />

      {/* 7. Add Compatibility (Link Component to Device) Modal */}
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

      {/* 8. Add Equivalent Modal */}
      <AddEquivalentModal
        isOpen={isAddEquivalentOpen}
        onClose={() => {
          setIsAddEquivalentOpen(false);
          setEquivInitialOriginalId(undefined);
        }}
        onSave={refreshDb}
        initialOriginalId={equivInitialOriginalId}
      />
    </div>
  );
}
