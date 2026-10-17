import React from 'react';
import {
  Clock, MapPin, Phone, Wrench, Package, CheckCircle, AlertCircle,
  Hourglass, ChevronLeft, MessageSquare, DollarSign
} from 'lucide-react';
import { MaintenanceOrder, MaintenanceWorkflowStatus } from '../../db/types';

interface Props {
  order: MaintenanceOrder;
  onClick: () => void;
}

export const STATUS_CONFIG: Record<MaintenanceWorkflowStatus, {
  label: string; color: string; bg: string; border: string; icon: React.FC<{ className?: string }>;
}> = {
  received:            { label: 'تم الاستلام',          color: 'text-slate-300',  bg: 'bg-slate-700/50',    border: 'border-slate-600',   icon: Clock       },
  in_safes:            { label: 'في الأمانات',          color: 'text-blue-300',   bg: 'bg-blue-900/30',     border: 'border-blue-700/50', icon: Package     },
  under_inspection:    { label: 'قيد الفحص',            color: 'text-yellow-300', bg: 'bg-yellow-900/30',   border: 'border-yellow-700/50', icon: Wrench    },
  under_repair:        { label: 'قيد الصيانة',          color: 'text-orange-300', bg: 'bg-orange-900/30',   border: 'border-orange-700/50', icon: Wrench    },
  awaiting_part:       { label: 'بانتظار قطعة',         color: 'text-purple-300', bg: 'bg-purple-900/30',   border: 'border-purple-700/50', icon: Hourglass },
  awaiting_approval:   { label: 'بانتظار موافقة الزبون', color: 'text-pink-300', bg: 'bg-pink-900/30',     border: 'border-pink-700/50',   icon: MessageSquare },
  ready:               { label: 'جاهز للتسليم',         color: 'text-emerald-300', bg: 'bg-emerald-900/30', border: 'border-emerald-700/50', icon: CheckCircle },
  delivered:           { label: 'تم التسليم',           color: 'text-teal-300',   bg: 'bg-teal-900/30',     border: 'border-teal-700/50', icon: CheckCircle },
  unrepairable:        { label: 'تعذر الإصلاح',        color: 'text-red-300',    bg: 'bg-red-900/30',      border: 'border-red-700/50',   icon: AlertCircle },
  returned_no_repair:  { label: 'تم الإرجاع بدون إصلاح', color: 'text-slate-400', bg: 'bg-slate-800/50',  border: 'border-slate-700',   icon: AlertCircle },
  rejected_by_customer:{ label: 'رفض الزبون الإصلاح', color: 'text-red-400',    bg: 'bg-red-900/20',      border: 'border-red-800/50',   icon: AlertCircle },
};

export const MaintenanceOrderCard: React.FC<Props> = ({ order, onClick }) => {
  const cfg = STATUS_CONFIG[order.status];
  const StatusIcon = cfg.icon;

  const createdDate = new Date(order.createdAt);
  const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = daysAgo === 0 ? 'اليوم' : daysAgo === 1 ? 'أمس' : `منذ ${daysAgo} يوم`;

  const isAlert = daysAgo >= 7 && order.status !== 'delivered' && order.status !== 'returned_no_repair' && order.status !== 'rejected_by_customer';

  return (
    <button
      onClick={onClick}
      className={`w-full text-right p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-lg group ${cfg.bg} ${cfg.border} border`}
      dir="rtl"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded-lg border border-cyan-800/50">
              {order.orderNumber}
            </span>
            {(order.isSuspended || order.status === 'awaiting_part') && (
              <span className="text-[10px] font-bold text-purple-300 bg-purple-900/40 border border-purple-700/50 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                ⏳ قيد الانتظار
              </span>
            )}
            {isAlert && (
              <span className="text-[10px] font-bold text-red-400 bg-red-900/30 border border-red-700/40 px-1.5 py-0.5 rounded-lg animate-pulse">
                ⚠️ متأخر
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mt-1 truncate">{order.customerName}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3" /> {order.customerPhone}
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
      </div>

      {/* Device info */}
      <div className="flex items-center gap-3 mb-3 p-2.5 bg-black/20 rounded-xl">
        <div className="p-1.5 bg-slate-800 rounded-lg">
          <Wrench className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {[order.deviceType, order.brand, order.model].filter(Boolean).join(' • ')}
          </p>
          <p className="text-[11px] text-slate-400 line-clamp-1">{order.reportedFault}</p>
          {order.requestedParts && (
            <p className="text-[10px] text-purple-300 font-mono mt-0.5 line-clamp-1">
              ⏳ مطلوب: {order.requestedParts}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {dateLabel}
          </span>
          {order.shelfLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {order.shelfLocation}
            </span>
          )}
          {order.technicianName && (
            <span className="text-slate-500">🔧 {order.technicianName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {order.totalAmount > 0 && (
            <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-400' : order.paymentStatus === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
              <DollarSign className="inline w-3 h-3" />
              {order.totalAmount.toFixed(1)} د.ل
            </span>
          )}
          <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
    </button>
  );
};
