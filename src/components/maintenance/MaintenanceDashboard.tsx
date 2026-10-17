import React, { useState, useMemo } from 'react';
import {
  Wrench, Package, Clock, CheckCircle, AlertCircle, Search, Plus,
  Filter, Sparkles, AlertTriangle, ArrowUpDown, DollarSign,
  TrendingUp, CheckCircle2, ShieldAlert, Smartphone, FileText, Printer,
  ChevronLeft, Check, List, LayoutGrid, Edit3
} from 'lucide-react';
import { dbInstance } from '../../db/sqliteEngine';
import {
  MaintenanceOrder, MaintenanceWorkflowStatus, WorkshopSettings, Sale
} from '../../db/types';
import { MaintenanceOrderCard, STATUS_CONFIG } from './MaintenanceOrderCard';
import { NewMaintenanceOrderModal } from './NewMaintenanceOrderModal';
import { MaintenanceOrderDetailModal } from './MaintenanceOrderDetailModal';
import { MaintenanceReceiptModal } from './MaintenanceReceiptModal';

interface Props {
  settings: WorkshopSettings;
  onRefresh: () => void;
  dbVersion?: number;
  requestNewOrder?: boolean;
  onNewOrderRequestHandled?: () => void;
  onEditSale?: (sale: Sale) => void;
}

type FilterStatusType = 'all' | MaintenanceWorkflowStatus | 'overdue' | 'active_repair' | 'suspended';

export const MaintenanceDashboard: React.FC<Props> = ({
  settings,
  onRefresh,
  dbVersion = 0,
  requestNewOrder,
  onNewOrderRequestHandled,
  onEditSale
}) => {
  const [localVersion, setLocalVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatusType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'shelf'>('newest');
  const [suspendedViewMode, setSuspendedViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [receiptPrintOrder, setReceiptPrintOrder] = useState<MaintenanceOrder | null>(null);

  // Handle external open request
  React.useEffect(() => {
    if (requestNewOrder) {
      setIsNewOrderOpen(true);
      onNewOrderRequestHandled?.();
    }
  }, [requestNewOrder]);

  const orders = useMemo(() => {
    return dbInstance.getMaintenanceOrders();
  }, [onRefresh, dbVersion, localVersion]);

  const stats = useMemo(() => {
    return dbInstance.getMaintenanceStats();
  }, [orders]);

  const deliveredTotalCount = useMemo(() => {
    return orders.filter(o => o.status === 'delivered').length;
  }, [orders]);

  const suspendedOrdersCount = useMemo(() => {
    return orders.filter(o => Boolean(o.isSuspended || (o.status === 'awaiting_part' && o.isSuspended !== false))).length;
  }, [orders]);

  // Overdue count (> 7 days and not delivered/rejected)
  const overdueOrdersCount = useMemo(() => {
    const now = Date.now();
    return orders.filter(o => {
      if (o.status === 'delivered' || o.status === 'returned_no_repair' || o.status === 'rejected_by_customer') return false;
      const days = (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return days >= 7;
    }).length;
  }, [orders]);

  // Filter and sort logic
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (selectedStatus === 'overdue') {
      const now = Date.now();
      result = result.filter(o => {
        if (o.status === 'delivered' || o.status === 'returned_no_repair' || o.status === 'rejected_by_customer') return false;
        const days = (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return days >= 7;
      });
    } else if (selectedStatus === 'suspended') {
      result = result.filter(o => Boolean(o.isSuspended || (o.status === 'awaiting_part' && o.isSuspended !== false)));
    } else if (selectedStatus === 'in_safes') {
      result = result.filter(o => o.status === 'in_safes' || o.status === 'received');
    } else if (selectedStatus === 'active_repair') {
      result = result.filter(o => o.status === 'under_repair' || o.status === 'awaiting_part' || o.status === 'awaiting_approval');
    } else if (selectedStatus !== 'all') {
      result = result.filter(o => o.status === selectedStatus);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.deviceType.toLowerCase().includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        (o.model && o.model.toLowerCase().includes(q)) ||
        (o.shelfLocation && o.shelfLocation.toLowerCase().includes(q)) ||
        o.reportedFault.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'shelf') {
        return (a.shelfLocation || '').localeCompare(b.shelfLocation || '');
      }
      return 0;
    });

    return result;
  }, [orders, selectedStatus, searchQuery, sortBy]);

  const handleOrderCreated = (newOrder: MaintenanceOrder) => {
    setIsNewOrderOpen(false);
    setLocalVersion(v => v + 1);
    onRefresh();
    // Offer quick print of the receipt immediately after intake
    setReceiptPrintOrder(newOrder);
  };

  const handleOrderUpdated = () => {
    setLocalVersion(v => v + 1);
    onRefresh();
    if (selectedOrder) {
      const updated = dbInstance.getMaintenanceOrder(selectedOrder.id);
      setSelectedOrder(updated);
    }
  };

  const handleQuickResume = (orderId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    dbInstance.resumeMaintenanceOrder(orderId, 'الفني', 'استئناف العمل من قائمة قيد الانتظار');
    setLocalVersion(v => v + 1);
    onRefresh();
  };

  const getSuspendedDuration = (order: MaintenanceOrder) => {
    const timeStr = order.suspendedAt || order.updatedAt;
    if (!timeStr) return { text: 'غير محدد', isLong: false };
    const diffMs = Date.now() - new Date(timeStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      return { text: `منذ ${weeks} أسبوع (${diffDays} يوم)`, isLong: true };
    }
    if (diffDays >= 3) {
      return { text: `منذ ${diffDays} أيام`, isLong: true };
    }
    if (diffDays >= 1) {
      return { text: `منذ ${diffDays} يوم`, isLong: false };
    }
    if (diffHours >= 1) {
      return { text: `منذ ${diffHours} ساعة`, isLong: false };
    }
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return { text: `منذ ${diffMins} دقيقة`, isLong: false };
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Banner / Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-2xl shadow-lg shadow-cyan-900/40">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                إدارة الصيانة والأمانات
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {orders.length} جهاز
                </span>
              </h1>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-xl bg-slate-800/90 text-cyan-300 border border-cyan-500/30 shadow-sm hidden sm:inline-block">
                ورشة: {settings.shopName || 'المتحكمات الكهربائية'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              استلام الأجهزة • تتبع الفحص والإصلاح • إدارة قطع الغيار والأمانات • التسليم والفوترة
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewOrderOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white text-sm font-black shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            استلام جهاز جديد للصيانة
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {[
          {
            key: 'in_safes' as FilterStatusType,
            label: 'في الأمانات',
            count: stats.inSafes,
            color: 'text-blue-400',
            bg: 'bg-blue-900/20 border-blue-800/40',
            icon: Package,
          },
          {
            key: 'under_inspection' as FilterStatusType,
            label: 'قيد الفحص',
            count: stats.underInspection,
            color: 'text-yellow-400',
            bg: 'bg-yellow-900/20 border-yellow-800/40',
            icon: Wrench,
          },
          {
            key: 'under_repair' as FilterStatusType,
            label: 'قيد الصيانة',
            count: stats.underRepair,
            color: 'text-orange-400',
            bg: 'bg-orange-900/20 border-orange-800/40',
            icon: Wrench,
          },
          {
            key: 'suspended' as FilterStatusType,
            label: 'فواتير معلقة',
            count: suspendedOrdersCount,
            color: 'text-purple-400',
            bg: 'bg-purple-900/30 border-purple-700/50',
            icon: Clock,
          },
          {
            key: 'awaiting_approval' as FilterStatusType,
            label: 'بانتظار موافقة',
            count: stats.awaitingApproval,
            color: 'text-pink-400',
            bg: 'bg-pink-900/20 border-pink-800/40',
            icon: Clock,
          },
          {
            key: 'ready' as FilterStatusType,
            label: 'جاهز للتسليم',
            count: stats.ready,
            color: 'text-emerald-400',
            bg: 'bg-emerald-900/20 border-emerald-800/40',
            icon: CheckCircle2,
          },
          {
            key: 'delivered' as FilterStatusType,
            label: 'تم التسليم اليوم',
            count: stats.deliveredToday,
            color: 'text-teal-400',
            bg: 'bg-teal-900/20 border-teal-800/40',
            icon: CheckCircle,
          },
          {
            key: 'overdue' as FilterStatusType,
            label: 'أجهزة متأخرة',
            count: overdueOrdersCount,
            color: 'text-red-400',
            bg: 'bg-red-900/20 border-red-800/40',
            icon: AlertTriangle,
          },
        ].map(item => {
          const Icon = item.icon;
          const isSelected = selectedStatus === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSelectedStatus(selectedStatus === item.key ? 'all' : item.key)}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${item.bg} ${
                isSelected ? 'ring-2 ring-cyan-500 scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-bold ${item.color}`}>{item.label}</span>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <span className="text-xl font-black font-mono text-white block">
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5-Stage Interactive Lifecycle Pipeline */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>مسار دورة الصيانة والإصلاح المتكاملة</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(الاستلام ← الأمانات ← الفحص ← الصيانة ← جاهز ← تم التسليم)</span>
            </h2>
          </div>
          {selectedStatus !== 'all' && (
            <button
              onClick={() => setSelectedStatus('all')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
            >
              عرض جميع الأجهزة (إلغاء الفلتر)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {[
            {
              id: 'in_safes' as FilterStatusType,
              stepNum: '1',
              title: 'الاستلام والأمانات',
              desc: 'الجهاز بالرف بانتظار الفحص',
              count: stats.inSafes,
              color: 'text-blue-400',
              border: 'border-blue-500/40',
              bgActive: 'bg-blue-950/60 ring-2 ring-blue-500',
              bgIdle: 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800',
              icon: Package,
            },
            {
              id: 'under_inspection' as FilterStatusType,
              stepNum: '2',
              title: 'الفحص والتشخيص',
              desc: 'تحديد العطل وتقدير التكلفة',
              count: stats.underInspection,
              color: 'text-yellow-400',
              border: 'border-yellow-500/40',
              bgActive: 'bg-yellow-950/60 ring-2 ring-yellow-500',
              bgIdle: 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800',
              icon: Search,
            },
            {
              id: 'active_repair' as FilterStatusType,
              stepNum: '3',
              title: 'قيد الصيانة والإصلاح',
              desc: 'استبدال القطع والتركيب الفني',
              count: stats.underRepair + stats.awaitingPart + stats.awaitingApproval,
              color: 'text-orange-400',
              border: 'border-orange-500/40',
              bgActive: 'bg-orange-950/60 ring-2 ring-orange-500',
              bgIdle: 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800',
              icon: Wrench,
            },
            {
              id: 'ready' as FilterStatusType,
              stepNum: '4',
              title: 'جاهز للتسليم',
              desc: 'تم الإصلاح وبانتظار العميل',
              count: stats.ready,
              color: 'text-emerald-400',
              border: 'border-emerald-500/40',
              bgActive: 'bg-emerald-950/60 ring-2 ring-emerald-500',
              bgIdle: 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800',
              icon: CheckCircle2,
            },
            {
              id: 'delivered' as FilterStatusType,
              stepNum: '5',
              title: 'تم التسليم والأرشيف',
              desc: 'سُلم للزبون وحُصّل الحساب',
              count: deliveredTotalCount,
              color: 'text-teal-400',
              border: 'border-teal-500/40',
              bgActive: 'bg-teal-950/60 ring-2 ring-teal-500',
              bgIdle: 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800',
              icon: Check,
            },
          ].map(stage => {
            const Icon = stage.icon;
            const isCurrentSelected = selectedStatus === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStatus(isCurrentSelected ? 'all' : stage.id)}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative group ${
                  isCurrentSelected ? stage.bgActive : stage.bgIdle
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                      {stage.stepNum}
                    </span>
                    <span className={`text-xs font-bold ${stage.color}`}>{stage.title}</span>
                  </div>
                  <Icon className={`w-4 h-4 ${stage.color}`} />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-black font-mono text-white">
                    {stage.count} <span className="text-[10px] text-slate-400 font-normal">جهاز</span>
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {stage.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالرقم، الزبون، الهاتف، الموديل، الرف..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs transition-all"
          />
        </div>

        {/* Quick Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: 'all' as FilterStatusType, label: 'الكل', count: orders.length },
            { id: 'in_safes' as FilterStatusType, label: 'الأمانات', count: stats.inSafes },
            { id: 'under_inspection' as FilterStatusType, label: 'قيد الفحص', count: stats.underInspection },
            { id: 'under_repair' as FilterStatusType, label: 'قيد الصيانة', count: stats.underRepair },
            { id: 'suspended' as FilterStatusType, label: '⏳ المعلقة (قيد الانتظار)', count: suspendedOrdersCount },
            { id: 'awaiting_approval' as FilterStatusType, label: 'بانتظار الموافقة', count: stats.awaitingApproval },
            { id: 'ready' as FilterStatusType, label: 'جاهز للتسليم', count: stats.ready },
            { id: 'delivered' as FilterStatusType, label: 'تم التسليم', count: deliveredTotalCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === tab.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="newest">الأحدث استلاماً</option>
            <option value="oldest">الأقدم استلاماً</option>
            <option value="shelf">حسب رقم الرف</option>
          </select>
        </div>
      </div>

      {/* Suspended Dedicated Banner when selectedStatus === 'suspended' */}
      {selectedStatus === 'suspended' && (
        <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-800/60 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">قائمة الفواتير والأجهزة المعلقة (قيد الانتظار)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                  {filteredOrders.length} جهاز معلق
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                أجهزة وفواتير متوقفة مؤقتاً بانتظار توفير قطع غيار غير متوفرة بالمستودع أو انتظار موافقة العميل. يمكنك استئناف العمل ومتابعة الفاتورة فوراً بنقرة زر.
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0 self-end md:self-center">
            <button
              onClick={() => setSuspendedViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                suspendedViewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>جدول المتابعة</span>
            </button>
            <button
              onClick={() => setSuspendedViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                suspendedViewMode === 'cards'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>عرض البطاقات</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders Content Area */}
      {filteredOrders.length === 0 ? (
        <div className={`border border-dashed rounded-3xl p-12 text-center space-y-4 ${
          selectedStatus === 'suspended'
            ? 'bg-purple-950/20 border-purple-800/40'
            : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center ${
            selectedStatus === 'suspended'
              ? 'bg-purple-900/30 text-emerald-400 border border-purple-700/40'
              : 'bg-slate-800 text-slate-500'
          }`}>
            {selectedStatus === 'suspended' ? <CheckCircle2 className="w-8 h-8" /> : <Wrench className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {selectedStatus === 'suspended' ? 'لا توجد فواتير أو أجهزة معلقة حالياً' : 'لا توجد أجهزة مطابقة لخيارات البحث أو التصفية'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {selectedStatus === 'suspended'
                ? 'كافة أجهزة الصيانة تسير بانتظام دون توقف بانتظار قطع أو موافقات زبائن.'
                : (searchQuery ? 'جرّب البحث بكلمة مختلفة أو إلغاء فلتر الحالة الحالية' : 'ابدأ باستلام أول جهاز معطل للزبائن عبر الضغط على الزر أدناه')}
            </p>
          </div>
          {selectedStatus !== 'suspended' && (
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> استلام جهاز جديد الآن
            </button>
          )}
        </div>
      ) : selectedStatus === 'suspended' && suspendedViewMode === 'table' ? (
        /* Dedicated Suspended Invoices & Orders Table (Observation 7) */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 font-bold border-b border-slate-800">
                  <th className="p-4">رقم الإيصال والرف</th>
                  <th className="p-4">الزبون ورقم الهاتف</th>
                  <th className="p-4">الجهاز والعطل</th>
                  <th className="p-4">القطع المطلوبة غير المتوفرة</th>
                  <th className="p-4">سبب التعليق والمدة</th>
                  <th className="p-4">التكلفة التقديرية</th>
                  <th className="p-4 text-center">إجراءات المتابعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOrders.map(order => {
                  const duration = getSuspendedDuration(order);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      {/* Order # & Shelf */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-cyan-400 group-hover:underline">
                          {order.orderNumber}
                        </div>
                        {order.shelfLocation && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono border border-slate-700">
                            رف: {order.shelfLocation}
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div className="font-bold text-white">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{order.customerPhone}</div>
                      </td>

                      {/* Device */}
                      <td className="p-4 max-w-xs">
                        <div className="font-semibold text-slate-200">
                          {order.brand} {order.deviceType} {order.model ? `• ${order.model}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5" title={order.reportedFault}>
                          {order.reportedFault}
                        </div>
                      </td>

                      {/* Missing Requested Parts */}
                      <td className="p-4">
                        {order.requestedParts ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                            <span>⚠️</span>
                            <span>{order.requestedParts}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">بانتظار موافقة الزبون</span>
                        )}
                      </td>

                      {/* Suspension Reason & Duration */}
                      <td className="p-4">
                        <div className="text-xs font-semibold text-purple-300">
                          {order.suspensionReason || 'قيد الانتظار'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className={duration.isLong ? 'text-rose-400 font-bold' : 'text-slate-400 font-mono'}>
                            {duration.text}
                          </span>
                          {duration.isLong && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">
                              متأخر
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="p-4 font-mono">
                        <div className="font-bold text-white">
                          {(order.totalAmount || order.estimatedCost || 0).toFixed(2)} د.ل
                        </div>
                        {order.laborFee > 0 && (
                          <div className="text-[10px] text-slate-400">
                            أجرة: {order.laborFee.toFixed(2)} د.ل
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleQuickResume(order.id, e)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs transition shadow-md shadow-orange-950 active:scale-95 cursor-pointer"
                            title="استئناف الصيانة ونقل الجهاز مباشرة إلى قيد الصيانة"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>استئناف</span>
                          </button>

                          <button
                            onClick={() => {
                              const linkedSale = dbInstance.getSales().find(s => s.maintenanceOrderId === order.id || (s.invoiceNumber === `MNT-${order.orderNumber}`));
                              if (linkedSale && onEditSale) {
                                onEditSale(linkedSale);
                              } else {
                                setSelectedOrder(order);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/50 hover:border-purple-600 font-bold text-xs transition cursor-pointer"
                            title="تعديل بيانات الفاتورة المعلقة والقطع المطلوبة"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                            <span>تعديل الفاتورة</span>
                          </button>

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="عرض تفاصيل كرت الصيانة الكامل"
                          >
                            <FileText className="w-4 h-4 text-cyan-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Standard Orders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrders.map(order => (
            <MaintenanceOrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}

      {/* New Maintenance Order Modal */}
      {isNewOrderOpen && (
        <NewMaintenanceOrderModal
          onClose={() => setIsNewOrderOpen(false)}
          onSaved={handleOrderCreated}
        />
      )}

      {/* Full Order Detail Modal */}
      {selectedOrder && (
        <MaintenanceOrderDetailModal
          order={selectedOrder}
          settings={settings}
          onClose={() => setSelectedOrder(null)}
          onUpdated={handleOrderUpdated}
          onEditSale={onEditSale}
        />
      )}

      {/* Instant Intake Receipt Modal (after order creation) */}
      {receiptPrintOrder && (
        <MaintenanceReceiptModal
          order={receiptPrintOrder}
          settings={settings}
          isOpen={!!receiptPrintOrder}
          onClose={() => setReceiptPrintOrder(null)}
        />
      )}
    </div>
  );
};
