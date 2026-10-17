import React, { useState, useMemo } from 'react';
import { 
  Wrench, Package, Clock, CheckCircle, AlertTriangle, 
  DollarSign, TrendingUp, Filter, Printer, FileText, ChevronDown, CheckCircle2
} from 'lucide-react';
import { dbInstance } from '../../db/sqliteEngine';
import { MaintenanceOrder, MaintenanceWorkflowStatus, WorkshopSettings } from '../../db/types';
import { STATUS_CONFIG } from '../maintenance/MaintenanceOrderCard';

interface Props {
  settings: WorkshopSettings;
}

export const MaintenanceReportView: React.FC<Props> = ({ settings }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | MaintenanceWorkflowStatus | 'overdue'>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  const orders = useMemo(() => {
    return dbInstance.getMaintenanceOrders();
  }, []);

  const stats = useMemo(() => {
    return dbInstance.getMaintenanceStats();
  }, [orders]);

  // Unique device types
  const deviceTypes = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.deviceType) set.add(o.deviceType);
    });
    return Array.from(set);
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter === 'overdue') {
      const now = Date.now();
      result = result.filter(o => {
        if (o.status === 'delivered' || o.status === 'returned_no_repair' || o.status === 'rejected_by_customer') return false;
        const days = (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return days >= 7;
      });
    } else if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    if (deviceFilter !== 'all') {
      result = result.filter(o => o.deviceType === deviceFilter);
    }

    return result;
  }, [orders, statusFilter, deviceFilter]);

  // Financial aggregates
  const financialTotals = useMemo(() => {
    const totalPartsCost = filteredOrders.reduce((sum, o) => sum + o.totalCost, 0);
    const totalPartsSales = filteredOrders.reduce((sum, o) => sum + o.partsTotal + o.consumablesTotal, 0);
    const totalLabor = filteredOrders.reduce((sum, o) => sum + o.laborFee, 0);
    const totalBilled = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaid = filteredOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const totalUnpaid = Math.max(0, totalBilled - totalPaid);
    const estimatedProfit = Math.max(0, totalBilled - totalPartsCost);

    return {
      totalPartsCost,
      totalPartsSales,
      totalLabor,
      totalBilled,
      totalPaid,
      totalUnpaid,
      estimatedProfit,
    };
  }, [filteredOrders]);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>إجمالي طلبات الصيانة</span>
            <Wrench className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black font-mono text-white">{orders.length}</span>
          <p className="text-[10px] text-slate-500 mt-0.5">منها {stats.ready + stats.deliveredToday} تم إنجازها</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>إجمالي الفواتير الصادرة</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black font-mono text-emerald-400">
            {financialTotals.totalBilled.toFixed(2)} د.ل
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">أجور فني + قطع غيار</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>المبالغ المحصّلة</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-2xl font-black font-mono text-teal-400">
            {financialTotals.totalPaid.toFixed(2)} د.ل
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">داخل الصندوق فعلياً</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>الذمم المتبقية (غير محصّلة)</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-2xl font-black font-mono text-red-400">
            {financialTotals.totalUnpaid.toFixed(2)} د.ل
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">مستحقة لدى العملاء</p>
        </div>
      </div>

      {/* Filter and controls bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-300">تصفية حسب الحالة:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">جميع الحالات</option>
            <option value="in_safes">في الأمانات</option>
            <option value="under_inspection">قيد الفحص</option>
            <option value="under_repair">قيد الصيانة</option>
            <option value="ready">جاهز للتسليم</option>
            <option value="delivered">تم التسليم</option>
            <option value="overdue">المتأخرات (&gt;7 أيام)</option>
          </select>

          {deviceTypes.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-slate-400">نوع الجهاز:</span>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">كل الأنواع</option>
                {deviceTypes.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <span className="text-slate-400 font-mono">
          عدد السجلات المعروضة: <strong className="text-white">{filteredOrders.length}</strong>
        </span>
      </div>

      {/* Report Orders Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg text-xs">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
              <th className="p-3.5">رقم الصيانة</th>
              <th className="p-3.5">الزبون</th>
              <th className="p-3.5">الجهاز</th>
              <th className="p-3.5">الرف</th>
              <th className="p-3.5">الحالة</th>
              <th className="p-3.5 text-left">قطع الغيار</th>
              <th className="p-3.5 text-left">أجرة الصيانة</th>
              <th className="p-3.5 text-left">الإجمالي</th>
              <th className="p-3.5 text-left">المدفوع</th>
              <th className="p-3.5 text-center">حالة الدفع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  لا توجد طلبات صيانة مطابقة لخيارات الفلترة المحددة.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-cyan-400">{order.orderNumber}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono" dir="ltr">{order.customerPhone}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{order.deviceType} {order.brand}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{order.reportedFault}</div>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-300">{order.shelfLocation || '-'}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-3.5 text-left font-mono">{order.partsTotal.toFixed(2)} د.ل</td>
                    <td className="p-3.5 text-left font-mono text-cyan-400">{order.laborFee.toFixed(2)} د.ل</td>
                    <td className="p-3.5 text-left font-mono font-bold text-white">{order.totalAmount.toFixed(2)} د.ل</td>
                    <td className="p-3.5 text-left font-mono text-emerald-400">{order.paidAmount.toFixed(2)} د.ل</td>
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        order.paymentStatus === 'paid' ? 'bg-emerald-900/40 text-emerald-300' :
                        order.paymentStatus === 'partial' ? 'bg-amber-900/40 text-amber-300' :
                        'bg-red-900/40 text-red-300'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'خالص' : order.paymentStatus === 'partial' ? 'جزئي' : 'متبقي'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
