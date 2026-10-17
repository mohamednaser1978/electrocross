import React, { useState } from 'react';
import {
  X, Wrench, Package, Clock, CheckCircle, AlertCircle, Phone, MapPin,
  DollarSign, FileText, History, Plus, Trash2, Printer, Check, User,
  MessageSquare, Edit3, ShieldAlert, Sparkles, CreditCard, ChevronDown, RotateCcw
} from 'lucide-react';
import { dbInstance } from '../../db/sqliteEngine';
import {
  MaintenanceOrder, MaintenanceOrderPart, WorkshopSettings, Component, Technician,
  MaintenanceWorkflowStatus, PartDisposition, Sale
} from '../../db/types';
import { STATUS_CONFIG } from './MaintenanceOrderCard';
import { ChangeStatusModal } from './ChangeStatusModal';
import { CustomerApprovalModal } from './CustomerApprovalModal';
import { DeliveryModal } from './DeliveryModal';
import { MaintenanceReceiptModal } from './MaintenanceReceiptModal';
import { MaintenanceInvoicePrint } from './MaintenanceInvoicePrint';

interface Props {
  order: MaintenanceOrder;
  settings: WorkshopSettings;
  onClose: () => void;
  onUpdated: () => void;
  onEditSale?: (sale: Sale) => void;
}

export const MaintenanceOrderDetailModal: React.FC<Props> = ({
  order,
  settings,
  onClose,
  onUpdated,
  onEditSale,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'finance' | 'timeline'>('details');

  // Sub-modals
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isReceiptPrintOpen, setIsReceiptPrintOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);

  // Edit Diagnosis State
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [diagnosedFault, setDiagnosedFault] = useState(order.diagnosedFault || '');
  const [repairCause, setRepairCause] = useState(order.repairCause || '');
  const [technicianName, setTechnicianName] = useState(order.technicianName || '');
  const [technicianNotes, setTechnicianNotes] = useState(order.technicianNotes || '');
  const [shelfLocation, setShelfLocation] = useState(order.shelfLocation || '');

  // Edit Suspension State
  const [isEditingSuspension, setIsEditingSuspension] = useState(false);
  const [editSuspensionReason, setEditSuspensionReason] = useState(order.suspensionReason || 'انتظار وصول قطعة الغيار');
  const [editRequestedParts, setEditRequestedParts] = useState(order.requestedParts || '');

  // Add Part State
  const [showAddPart, setShowAddPart] = useState(false);
  const [partType, setPartType] = useState<'spare' | 'consumable'>('spare');
  const [selectedCompId, setSelectedCompId] = useState<number | ''>('');
  const [partDesc, setPartDesc] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partCost, setPartCost] = useState('0');
  const [partSale, setPartSale] = useState('0');

  // Pricing State
  const [laborFee, setLaborFee] = useState(String(order.laborFee));
  const [discount, setDiscount] = useState(String(order.discount));
  const [isUpdatingPricing, setIsUpdatingPricing] = useState(false);

  // Quick Payment Collection State
  const [showCollectPayment, setShowCollectPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Post-repair checkout dialog state
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  const components = dbInstance.getComponents();
  const technicians = dbInstance.getTechnicians();
  const statusCfg = STATUS_CONFIG[order.status];
  const StatusIcon = statusCfg.icon;

  const handleSaveDiagnosis = () => {
    dbInstance.updateMaintenanceOrder(order.id, {
      diagnosedFault: diagnosedFault.trim() || undefined,
      repairCause: repairCause.trim() || undefined,
      technicianName: technicianName.trim() || undefined,
      technicianNotes: technicianNotes.trim() || undefined,
      shelfLocation: shelfLocation.trim() || undefined,
    });
    setIsEditingDiagnosis(false);
    onUpdated();
  };

  const handleSaveSuspension = () => {
    const reason = editSuspensionReason.trim() || 'قيد الانتظار';
    const parts = editRequestedParts.trim() || undefined;

    dbInstance.updateMaintenanceOrder(order.id, {
      suspensionReason: reason,
      requestedParts: parts,
    });

    const linkedSale = dbInstance.getSales().find(s => s.maintenanceOrderId === order.id || s.invoiceNumber === `MNT-${order.orderNumber}`);
    if (linkedSale) {
      linkedSale.suspensionReason = reason;
      linkedSale.requestedParts = parts;
      if (linkedSale.maintenance) {
        linkedSale.maintenance.suspensionReason = reason;
        linkedSale.maintenance.requestedParts = parts;
      }
      dbInstance.updateSale(linkedSale);
    }

    setIsEditingSuspension(false);
    onUpdated();
  };

  const handleEditFullInvoice = () => {
    let linkedSale = dbInstance.getSales().find(s => s.maintenanceOrderId === order.id || s.invoiceNumber === `MNT-${order.orderNumber}`);

    if (!linkedSale) {
      linkedSale = {
        id: -order.id,
        invoiceNumber: `MNT-${order.orderNumber}`,
        date: order.createdAt ? order.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount || order.estimatedCost || 0,
        paidAmount: order.paidAmount || 0,
        paymentStatus: order.paymentStatus || 'unpaid',
        saleType: 'maintenance',
        notes: order.reportedFault || '',
        isSuspended: true,
        suspensionReason: order.suspensionReason || 'قيد الانتظار',
        requestedParts: order.requestedParts,
        maintenanceOrderId: order.id,
        partsTotal: order.partsTotal || 0,
        totalCost: order.totalCost || 0,
        profit: Math.max(0, (order.totalAmount || 0) - (order.totalCost || 0)),
        discount: order.discount || 0,
        items: (order.parts || []).map((p, idx) => ({
          id: p.id || idx + 1,
          componentId: p.componentId || components[0]?.id || 1,
          partNumber: p.partNumber || p.description,
          quantity: p.quantity,
          unitPrice: p.unitSalePrice,
          unitCost: p.unitCost,
          totalPrice: p.totalSalePrice,
          totalCost: p.totalCost,
        })),
        maintenance: {
          maintenanceOrderId: order.id,
          deviceType: order.deviceType,
          brand: order.brand,
          modelOrBoard: order.model || '',
          serialOrChassis: order.serialNumber,
          faultDescription: order.diagnosedFault || order.reportedFault || 'صيانة إلكترونية',
          technicianName: order.technicianName || 'الفني',
          status: order.status,
          technicianFee: order.laborFee,
          extraServicesFee: 0,
          extraExpensesCost: 0,
          isSuspended: true,
          suspensionReason: order.suspensionReason,
          requestedParts: order.requestedParts,
        }
      };
    }

    if (onEditSale && linkedSale) {
      onEditSale(linkedSale);
      onClose();
    }
  };

  const handleAddPart = () => {
    const qty = Number(partQty) || 1;
    const cost = Number(partCost) || 0;
    const sale = Number(partSale) || 0;

    let partNumber: string | undefined;
    let description = partDesc.trim();
    let compId: number | undefined;

    if (partType === 'spare' && selectedCompId) {
      const comp = components.find(c => c.id === selectedCompId);
      if (comp) {
        compId = comp.id;
        partNumber = comp.part_number;
        description = comp.description || comp.part_number;
      }
    }

    if (!description && !partNumber) return;

    dbInstance.addPartToMaintenanceOrder(order.id, {
      type: partType,
      componentId: compId,
      partNumber,
      description: description || partNumber || 'قطعة غيار',
      quantity: qty,
      unitCost: cost,
      unitSalePrice: sale,
      totalCost: cost * qty,
      totalSalePrice: sale * qty,
    });

    // Reset part inputs
    setSelectedCompId('');
    setPartDesc('');
    setPartQty('1');
    setPartCost('0');
    setPartSale('0');
    setShowAddPart(false);
    onUpdated();
  };

  const handleRemovePart = (partId: number) => {
    if (window.confirm('هل أنت متأكد من إزالة هذا الصنف من أمر الصيانة؟')) {
      dbInstance.removePartFromMaintenanceOrder(order.id, partId);
      onUpdated();
    }
  };

  const handleUpdateDisposition = (partId: number, disposition: PartDisposition) => {
    const isBilled = disposition === 'used' || disposition === 'bill_customer';
    dbInstance.updatePartDisposition(
      order.id,
      partId,
      disposition,
      isBilled,
      disposition === 'return_to_stock' ? 'إرجاع إلى المستودع (معفاة للعميل)' :
      disposition === 'damaged' ? 'تلف أثناء الاختبار (معفاة للعميل)' : 'محتسب على العميل'
    );
    onUpdated();
  };

  const handleSavePricing = () => {
    setIsUpdatingPricing(true);
    const numLabor = Number(laborFee) || 0;
    const numDisc = Number(discount) || 0;
    const totalAmount = Math.max(0, order.partsTotal + order.consumablesTotal + numLabor - numDisc);
    
    dbInstance.updateMaintenanceOrder(order.id, {
      laborFee: numLabor,
      discount: numDisc,
      totalAmount,
    });
    setIsUpdatingPricing(false);
    onUpdated();

    // Show post-repair checkout prompt if device hasn't been delivered yet
    const isActiveRepair = order.status === 'under_repair' || order.status === 'ready' || order.status === 'awaiting_approval';
    if (isActiveRepair) {
      setShowCheckoutDialog(true);
    }
  };

  const handleCollectPayment = () => {
    const amount = Number(paymentAmount) || 0;
    if (amount <= 0) return;
    dbInstance.collectMaintenancePayment(order.id, amount, paymentNotes.trim() || undefined);
    setShowCollectPayment(false);
    setPaymentAmount('');
    setPaymentNotes('');
    onUpdated();
  };

  const cleanPhone = order.customerPhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('218') ? cleanPhone : '218' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(
    `السلام عليكم سيد/ة ${order.customerName}، معكم ورشة ${settings.shopName || 'ElectroCross'}. بخصوص جهازكم (${order.deviceType} ${order.brand}) برقم الصيانة ${order.orderNumber}.`
  )}`;

  const handleQuickStatusChange = (newStatus: MaintenanceWorkflowStatus, actionDesc: string) => {
    dbInstance.changeMaintenanceStatus(order.id, newStatus, order.technicianName || 'المسؤول', actionDesc);
    onUpdated();
  };

  const remainingBalance = Math.max(0, order.totalAmount - order.paidAmount);
  const profit = Math.max(0, order.totalAmount - order.totalCost);

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs transition-all";

  // Calculate current stage index for visual stepper
  // 1: الاستلام والأمانات, 2: الفحص, 3: الصيانة, 4: جاهز للتسليم, 5: تم التسليم
  const getStageIndex = (status: MaintenanceWorkflowStatus): number => {
    switch (status) {
      case 'received':
      case 'in_safes':
        return 1;
      case 'under_inspection':
        return 2;
      case 'under_repair':
      case 'awaiting_part':
      case 'awaiting_approval':
        return 3;
      case 'ready':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 0; // unrepairable, rejected, etc.
    }
  };

  const currentStageIndex = getStageIndex(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6" dir="rtl">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-900/40 text-cyan-400 rounded-xl border border-cyan-800/50">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                  {order.orderNumber}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-bold ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusCfg.label}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 border border-slate-700 font-sans hidden sm:inline-block">
                  ورشة: {settings.shopName || 'المتحكمات الكهربائية'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                {order.customerName} — {[order.deviceType, order.brand, order.model].filter(Boolean).join(' ')}
              </h2>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Context-aware primary forward actions */}
            {(order.status === 'in_safes' || order.status === 'received') && (
              <button
                onClick={() => handleQuickStatusChange('under_inspection', 'بدء الفحص والتشخيص الفني')}
                className="px-3.5 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-yellow-900/30 transition-all cursor-pointer active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" /> بدء الفحص الآن
              </button>
            )}

            {order.status === 'under_inspection' && (
              <>
                <button
                  onClick={() => handleQuickStatusChange('under_repair', 'اعتماد الفحص والبدء بالصيانة والإصلاح')}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-900/30 transition-all cursor-pointer active:scale-95"
                >
                  <Wrench className="w-3.5 h-3.5" /> بدء الصيانة
                </button>
                <button
                  onClick={() => setIsApprovalOpen(true)}
                  className="px-3 py-1.5 bg-pink-600/30 hover:bg-pink-600/40 text-pink-300 border border-pink-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> موافقة الزبون
                </button>
              </>
            )}

            {order.status === 'awaiting_approval' && (
              <button
                onClick={() => handleQuickStatusChange('under_repair', 'وافق الزبون على التكلفة — بدء الصيانة')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" /> وافق الزبون → بدء الصيانة
              </button>
            )}

            {order.status === 'awaiting_part' && (
              <button
                onClick={() => handleQuickStatusChange('under_repair', 'توفرت قطعة الغيار — استئناف الصيانة')}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-900/30 transition-all cursor-pointer active:scale-95"
              >
                <Package className="w-3.5 h-3.5" /> توفرت القطعة → متابعة الصيانة
              </button>
            )}

            {order.status === 'under_repair' && (
              <>
                <button
                  onClick={() => handleQuickStatusChange('ready', 'تم اكتمال الصيانة بنجاح — الجهاز جاهز للتسليم')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> تم الإصلاح (جاهز للتسليم)
                </button>
                <button
                  onClick={() => handleQuickStatusChange('awaiting_part', 'بانتظار توفير قطعة غيار')}
                  className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" /> طلب قطعة
                </button>
              </>
            )}

            {order.status === 'ready' && (
              <button
                onClick={() => setIsDeliveryOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" /> تسليم الجهاز والفوترة
              </button>
            )}

            <button
              onClick={() => setIsChangeStatusOpen(true)}
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" /> تغيير الحالة
            </button>

            <button
              onClick={() => setIsReceiptPrintOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="طباعة وصل استلام الجهاز"
            >
              <Printer className="w-3.5 h-3.5" /> وصل استلام
            </button>

            <button
              onClick={() => setIsInvoicePrintOpen(true)}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="طباعة فاتورة الصيانة والتسليم"
            >
              <FileText className="w-3.5 h-3.5" /> فاتورة التسليم
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        {currentStageIndex > 0 && (
          <div className="bg-slate-950/50 px-5 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between max-w-2xl mx-auto relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 -z-0" />
              {[
                { step: 1, label: 'الأمانات', desc: 'الاستلام' },
                { step: 2, label: 'الفحص', desc: 'التشخيص' },
                { step: 3, label: 'الصيانة', desc: 'الإصلاح' },
                { step: 4, label: 'جاهز', desc: 'للتسليم' },
                { step: 5, label: 'مكتمل', desc: 'تم التسليم' },
              ].map(s => {
                const isPassed = currentStageIndex > s.step;
                const isCurrent = currentStageIndex === s.step;
                return (
                  <div key={s.step} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                          : isCurrent
                          ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 font-black shadow-lg shadow-cyan-900/50'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isPassed ? '✓' : s.step}
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-1 ${
                        isCurrent ? 'text-cyan-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suspended Order Banner (Observation 7 & Edit Support) */}
        {(order.isSuspended || order.status === 'awaiting_part') && (
          <div className="bg-purple-950/70 border-b border-purple-800/80 px-5 py-3 text-xs shrink-0 animate-fade-in space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400 animate-ping" />
                <span className="font-bold text-purple-200">
                  ⏳ الفاتورة والعملية معلقة حالياً (قيد الانتظار)
                </span>
                {order.suspensionReason && (
                  <span className="text-purple-300">
                    — السبب: <strong>{order.suspensionReason}</strong>
                  </span>
                )}
                {order.requestedParts && (
                  <span className="px-2 py-0.5 rounded bg-purple-900/80 text-cyan-300 font-mono text-[11px] border border-purple-700/60">
                    القطع المطلوبة: {order.requestedParts}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Resume Maintenance */}
                <button
                  onClick={() => {
                    dbInstance.resumeMaintenanceOrder(order.id, order.technicianName || 'الفني', 'تم استئناف الصيانة');
                    onUpdated();
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>استئناف الصيانة الآن</span>
                </button>

                {/* Toggle Quick Edit Suspension Info */}
                <button
                  onClick={() => setIsEditingSuspension(!isEditingSuspension)}
                  className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                  <span>{isEditingSuspension ? 'إلغاء التعديل' : 'تعديل سبب التعليق والقطع'}</span>
                </button>

                {/* Edit Full Invoice */}
                {onEditSale && (
                  <button
                    onClick={handleEditFullInvoice}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md shadow-purple-950 transition cursor-pointer flex items-center gap-1.5"
                    title="فتح نافذة الفاتورة وتعديل كافة البنود والقطع المضافة والمحاسبة"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>تعديل الفاتورة بالكامل</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline Suspension Editor Form */}
            {isEditingSuspension && (
              <div className="bg-slate-900/90 border border-purple-600/50 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in shadow-inner">
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    سبب تعليق الفاتورة / أمر الصيانة:
                  </label>
                  <input
                    type="text"
                    value={editSuspensionReason}
                    onChange={(e) => setEditSuspensionReason(e.target.value)}
                    placeholder="مثال: انتظار وصول آيسي الباور أو موافقة الزبون..."
                    className="w-full bg-slate-800 border border-purple-700/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                    قطع الغيار الناقصة / المطلوبة توفيرها:
                  </label>
                  <input
                    type="text"
                    value={editRequestedParts}
                    onChange={(e) => setEditRequestedParts(e.target.value)}
                    placeholder="مثال: شاشة Samsung 55 بوصة، موسفت K2645..."
                    className="w-full bg-slate-800 border border-purple-700/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-1 border-t border-purple-900/50">
                  <button
                    onClick={() => setIsEditingSuspension(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveSuspension}
                    className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ بيانات التعليق</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-900/50 gap-2 shrink-0">
          {[
            { id: 'details', label: '📋 تفاصيل الجهاز والفحص', icon: Wrench },
            { id: 'parts', label: `🔩 قطع الغيار (${order.parts.length})`, icon: Package },
            { id: 'finance', label: '💰 الحسابات والتكلفة', icon: DollarSign },
            { id: 'timeline', label: `📜 السجل الزمني (${order.timeline.length})`, icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: DETAILS & DIAGNOSIS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              
              {/* Customer & Storage Quick Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info Card */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-2">
                    <User className="w-4 h-4 text-cyan-400" /> بيانات الزبون
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاسم:</span>
                    <span className="font-bold text-white">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">رقم الهاتف:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400" dir="ltr">{order.customerPhone}</span>
                      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300" title="واتساب">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <a href={`tel:${order.customerPhone}`} className="text-blue-400 hover:text-blue-300" title="اتصال">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                  {order.customerPhone2 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">هاتف بديل:</span>
                      <span className="font-mono text-slate-300" dir="ltr">{order.customerPhone2}</span>
                    </div>
                  )}
                  {order.customerAddress && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">العنوان:</span>
                      <span className="text-slate-300">{order.customerAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">موقع الرف (الأمانات):</span>
                    <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {order.shelfLocation || 'غير محدد'}
                    </span>
                  </div>
                </div>

                {/* Device Info Card */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-2">
                    <Wrench className="w-4 h-4 text-cyan-400" /> مواصفات الجهاز المستلم
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-400">النوع والمصنع:</span>
                    <span className="font-bold text-white">{order.deviceType} — {order.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الموديل:</span>
                    <span className="font-mono text-slate-200">{order.model || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الرقم التسلسلي (S/N):</span>
                    <span className="font-mono text-slate-300">{order.serialNumber || 'لا يوجد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">اللون:</span>
                    <span className="text-slate-300">{order.color || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تاريخ الاستلام:</span>
                    <span className="text-slate-300 font-mono">
                      {new Date(order.createdAt).toLocaleDateString('ar-LY')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reported Fault & Intake Condition */}
              <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 text-xs space-y-2">
                <span className="font-bold text-amber-300 block">⚠️ العطل الذي ذكره الزبون:</span>
                <p className="text-amber-100/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/30">
                  {order.reportedFault}
                </p>
                {order.conditionFlags && order.conditionFlags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-slate-400 block mb-1">ملاحظات الحالة عند الاستلام:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {order.conditionFlags.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[11px]">
                          • {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {order.conditionNotes && (
                  <p className="text-slate-400 text-[11px] mt-1">
                    {order.conditionNotes}
                  </p>
                )}
              </div>

              {/* Diagnosis & Repair Details Form */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    تقرير الفحص والصيانة الفعلي
                  </h4>
                  {!isEditingDiagnosis ? (
                    <button
                      onClick={() => setIsEditingDiagnosis(true)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> تعديل التقرير
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveDiagnosis}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center gap-1 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> حفظ التعديلات
                    </button>
                  )}
                </div>

                {isEditingDiagnosis ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1">العطل الفعلي بعد الفحص:</label>
                      <input
                        type="text"
                        value={diagnosedFault}
                        onChange={(e) => setDiagnosedFault(e.target.value)}
                        placeholder="مثال: تلف مكثفات الباور واحتراق ترانزستور IGBT"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">سبب العطل:</label>
                      <input
                        type="text"
                        value={repairCause}
                        onChange={(e) => setRepairCause(e.target.value)}
                        placeholder="مثال: ارتفاع مفاجئ في جهد الشبكة الكهربائية"
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">الفني المسؤول:</label>
                        <select
                          value={technicianName}
                          onChange={(e) => setTechnicianName(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">-- اختر الفني --</option>
                          {technicians.map(t => (
                            <option key={t.id} value={t.name}>{t.name} ({t.specialty || 'صيانة'})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">موقع الرف (الأمانات):</label>
                        <input
                          type="text"
                          value={shelfLocation}
                          onChange={(e) => setShelfLocation(e.target.value)}
                          placeholder="مثال: A-07"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">ملاحظات الفني الإضافية:</label>
                      <textarea
                        value={technicianNotes}
                        onChange={(e) => setTechnicianNotes(e.target.value)}
                        rows={2}
                        placeholder="أي ملاحظات فنية أخرى حول عملية الفحص أو التوصيل..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">العطل الفعلي:</span>
                      <span className="font-semibold text-white">{order.diagnosedFault || 'لم يتم تسجيله بعد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">سبب العطل:</span>
                      <span>{order.repairCause || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الفني المسؤول:</span>
                      <span className="font-bold text-cyan-300">{order.technicianName || 'غير مسند'}</span>
                    </div>
                    {order.technicianNotes && (
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 mt-2">
                        {order.technicianNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PARTS & MATERIALS */}
          {activeTab === 'parts' && (
            <div className="space-y-4">
              
              {/* Add Part Button & Form */}
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-cyan-400" />
                  قطع الغيار والمواد المستبدلة في هذا الجهاز
                </h4>
                <button
                  onClick={() => setShowAddPart(!showAddPart)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-cyan-900/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة قطعة / مادة
                </button>
              </div>

              {showAddPart && (
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3 text-xs animate-fade-in">
                  <div className="flex items-center gap-4 border-b border-slate-700 pb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-white font-semibold">
                      <input
                        type="radio"
                        checked={partType === 'spare'}
                        onChange={() => setPartType('spare')}
                        name="partType"
                      />
                      قطعة غيار (من المستودع)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-white font-semibold">
                      <input
                        type="radio"
                        checked={partType === 'consumable'}
                        onChange={() => setPartType('consumable')}
                        name="partType"
                      />
                      مادة استهلاكية (يدوياً)
                    </label>
                  </div>

                  {partType === 'spare' ? (
                    <div>
                      <label className="block text-slate-400 mb-1">اختر القطعة من المستودع:</label>
                      <select
                        value={selectedCompId}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setSelectedCompId(id || '');
                          const found = components.find(c => c.id === id);
                          if (found) {
                            setPartCost(String(found.cost_price || 0));
                            setPartSale(String(found.sale_price || 0));
                          }
                        }}
                        className={inputCls}
                      >
                        <option value="">-- ابحث أو اختر القطعة --</option>
                        {components.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.part_number} — {c.description} (متبقي: {c.stock_quantity}) — {c.sale_price} د.ل
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-400 mb-1">وصف المادة الاستهلاكية:</label>
                      <input
                        type="text"
                        value={partDesc}
                        onChange={(e) => setPartDesc(e.target.value)}
                        placeholder="مثال: قصدير لحام 63/37، معجون حراري، سلك فحص..."
                        className={inputCls}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">الكمية:</label>
                      <input
                        type="number"
                        min="1"
                        value={partQty}
                        onChange={(e) => setPartQty(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">سعر التكلفة (د.ل):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={partCost}
                        onChange={(e) => setPartCost(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">سعر البيع للزبون (د.ل):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={partSale}
                        onChange={(e) => setPartSale(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                    <button
                      onClick={() => setShowAddPart(false)}
                      className="px-3 py-1.5 text-slate-400 hover:text-white"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleAddPart}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow"
                    >
                      إضافة إلى الطلب
                    </button>
                  </div>
                </div>
              )}

              {/* Parts Disposition & Inventory Summary (Observation 8) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-[10px] text-slate-400">إجمالي الأصناف المصروفة</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{order.parts.length} صنف</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                  <div className="text-[10px] text-emerald-400">المحتسبة على الزبون</div>
                  <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                    {order.parts.filter(p => p.isBilledToCustomer !== false && p.disposition !== 'return_to_stock' && p.disposition !== 'damaged').length} صنف ({order.partsTotal.toFixed(2)} د.ل)
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40">
                  <div className="text-[10px] text-blue-400">المرتجعة للمستودع</div>
                  <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">
                    {order.parts.filter(p => p.disposition === 'return_to_stock').length} صنف (معفاة)
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40">
                  <div className="text-[10px] text-red-400">التالفة أثناء الاختبار</div>
                  <div className="text-sm font-bold text-red-300 font-mono mt-0.5">
                    {order.parts.filter(p => p.disposition === 'damaged').length} صنف (تتحملها الورشة)
                  </div>
                </div>
              </div>

              {/* Parts Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                      <th className="p-3">#</th>
                      <th className="p-3">البيان / القطعة</th>
                      <th className="p-3 text-center">النوع</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-left">التكلفة</th>
                      <th className="p-3 text-left">سعر البيع</th>
                      <th className="p-3 text-center">مصير القطعة والاحتساب</th>
                      <th className="p-3 text-left">الإجمالي المحتسب</th>
                      <th className="p-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {order.parts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-500">
                          لم يتم إضافة أي قطع غيار أو مواد بعد. اضغط على زر "إضافة قطعة / مادة" أعلاه.
                        </td>
                      </tr>
                    ) : (
                      order.parts.map((p, idx) => {
                        const isExempt = p.isBilledToCustomer === false || p.disposition === 'return_to_stock' || p.disposition === 'damaged';
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="p-3 text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold font-mono text-white">
                              {p.partNumber || p.description}
                              {p.partNumber && p.description && (
                                <span className="block text-[11px] font-sans font-normal text-slate-400">{p.description}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.type === 'spare' ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-800/50' : 'bg-purple-900/40 text-purple-300 border border-purple-800/50'}`}>
                                {p.type === 'spare' ? 'قطعة غيار' : 'مادة استهلاكية'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-white">{p.quantity}</td>
                            <td className="p-3 text-left font-mono text-slate-400">{p.unitCost.toFixed(2)} د.ل</td>
                            <td className="p-3 text-left font-mono text-cyan-300">{p.unitSalePrice.toFixed(2)} د.ل</td>
                            <td className="p-3 text-center">
                              {p.type === 'spare' ? (
                                <select
                                  value={p.disposition || 'used'}
                                  onChange={(e) => handleUpdateDisposition(p.id, e.target.value as PartDisposition)}
                                  className={`px-2 py-1 text-[11px] rounded-lg font-bold border outline-none cursor-pointer ${
                                    p.disposition === 'return_to_stock'
                                      ? 'bg-blue-900/40 border-blue-600/50 text-blue-300'
                                      : p.disposition === 'damaged'
                                      ? 'bg-red-900/40 border-red-600/50 text-red-300'
                                      : 'bg-emerald-900/40 border-emerald-600/50 text-emerald-300'
                                  }`}
                                >
                                  <option value="used">✅ محتسبة على الزبون</option>
                                  <option value="return_to_stock">↩️ إرجاع للمستودع (معفاة)</option>
                                  <option value="damaged">⚠️ تلفت أثناء الاختبار (معفاة)</option>
                                </select>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">مادة مستهلكة</span>
                              )}
                            </td>
                            <td className="p-3 text-left">
                              {isExempt ? (
                                <div>
                                  <span className="line-through text-slate-500 font-mono text-[11px]">{p.totalSalePrice.toFixed(2)} د.ل</span>
                                  <span className="block text-[10px] font-bold text-amber-400">
                                    {p.disposition === 'return_to_stock' ? '0.00 د.ل (مرتجعة)' : '0.00 د.ل (تالفة معفاة)'}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono font-bold text-white">{p.totalSalePrice.toFixed(2)} د.ل</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemovePart(p.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="حذف القطعة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Labor Fee & Discount Section */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4 text-xs space-y-3">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  أجور الصيانة والخصومات:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">أجرة الصيانة / الفني (د.ل):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={laborFee}
                      onChange={(e) => setLaborFee(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الخصم الممنوح (د.ل):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSavePricing}
                    disabled={isUpdatingPricing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> حفظ واحتساب الإجمالي
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCE & PAYMENT SUMMARY */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl">
                  <span className="text-slate-400 block mb-1">قطع الغيار:</span>
                  <span className="text-lg font-mono font-bold text-white">{order.partsTotal.toFixed(2)} د.ل</span>
                </div>
                <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl">
                  <span className="text-slate-400 block mb-1">أجرة الفني:</span>
                  <span className="text-lg font-mono font-bold text-cyan-400">{order.laborFee.toFixed(2)} د.ل</span>
                </div>
                <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl">
                  <span className="text-slate-400 block mb-1">الإجمالي الكلي:</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{order.totalAmount.toFixed(2)} د.ل</span>
                </div>
                <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl">
                  <span className="text-slate-400 block mb-1">الربح المتوقع:</span>
                  <span className="text-lg font-mono font-bold text-teal-400">{profit.toFixed(2)} د.ل</span>
                </div>
              </div>

              {/* Payment Status & Collection Box */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-cyan-400" /> حالة التحصيل والدفع
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    order.paymentStatus === 'paid' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' :
                    order.paymentStatus === 'partial' ? 'bg-amber-900/50 text-amber-300 border border-amber-700' :
                    'bg-red-900/50 text-red-300 border border-red-700'
                  }`}>
                    {order.paymentStatus === 'paid' ? '✓ مدفوع بالكامل' : order.paymentStatus === 'partial' ? '⚠️ مدفوع جزئياً' : '🔴 غير مدفوع'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">المبلغ الإجمالي:</span>
                    <span className="text-sm font-mono font-bold text-white">{order.totalAmount.toFixed(2)} د.ل</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المسدد حتى الآن:</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{order.paidAmount.toFixed(2)} د.ل</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المتبقي المطلوب:</span>
                    <span className="text-sm font-mono font-bold text-red-400">{remainingBalance.toFixed(2)} د.ل</span>
                  </div>
                </div>

                {remainingBalance > 0 && !showCollectPayment && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setPaymentAmount(String(remainingBalance));
                        setShowCollectPayment(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" /> تحصيل دفعة من الزبون
                    </button>
                  </div>
                )}

                {showCollectPayment && (
                  <div className="p-4 bg-slate-900/80 border border-emerald-700/50 rounded-xl space-y-3 animate-fade-in">
                    <h5 className="font-bold text-emerald-400">تسجيل دفعة نقدية / تحويل:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">المبلغ المحصل (د.ل):</label>
                        <input
                          type="number"
                          step="0.5"
                          max={remainingBalance}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">ملاحظات الإيصال / الحوالة:</label>
                        <input
                          type="text"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="مثلاً: دفعة أولى نقداً عند الفحص"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowCollectPayment(false)}
                        className="px-3 py-1.5 text-slate-400 hover:text-white"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleCollectPayment}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow"
                      >
                        تأكيد التحصيل
                      </button>
                    </div>
                  </div>
                )}

                {/* Delivery Information If Delivered */}
                {order.status === 'delivered' && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1 text-slate-300">
                    <span className="font-bold text-emerald-400 block">✓ بيانات التسليم النهائي:</span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">تاريخ ووقت التسليم:</span>
                      <span className="font-mono">{order.deliveryTimestamp ? new Date(order.deliveryTimestamp).toLocaleString('ar-LY') : 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الموظف المسلّم:</span>
                      <span className="font-bold">{order.deliveredBy || 'المسؤول'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">طريقة الدفع:</span>
                      <span>{order.paymentMethod === 'cash' ? 'نقداً' : order.paymentMethod === 'card' ? 'بطاقة' : 'تحويل بنكي'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                سجل النشاطات والأحداث لأمر الصيانة
              </h4>
              <div className="relative border-r-2 border-slate-800 pr-5 mr-3 space-y-4">
                {order.timeline.map((event) => (
                  <div key={event.id} className="relative group text-xs">
                    {/* Dot */}
                    <div className="absolute -right-[27px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900 group-hover:scale-125 transition-transform" />
                    
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{event.action}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(event.timestamp).toLocaleDateString('ar-LY')} — {new Date(event.timestamp).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {event.performedBy && (
                        <p className="text-[11px] text-cyan-400">
                          بواسطة: <span className="font-semibold">{event.performedBy}</span>
                        </p>
                      )}

                      {event.notes && (
                        <p className="text-slate-300 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-slate-800 mt-1">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            آخر تحديث: {new Date(order.updatedAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Post-Repair Checkout Dialog */}
      {showCheckoutDialog && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckoutDialog(false)} />
          <div className="relative bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-emerald-900/50 border-2 border-emerald-500/60 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-black text-white">تم حفظ بطاقة الصيانة ✅</h3>
              <p className="text-xs text-slate-400">
                ما هي الخطوة التالية لهذا الجهاز؟
              </p>
              <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-800/30 inline-block">
                {order.orderNumber} — {order.customerName}
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowCheckoutDialog(false);
                  // First mark as ready if still under_repair, then open delivery
                  if (order.status === 'under_repair' || order.status === 'awaiting_approval') {
                    dbInstance.changeMaintenanceStatus(order.id, 'ready', order.technicianName || 'المسؤول', 'تم اكتمال الصيانة');
                    onUpdated();
                  }
                  setIsDeliveryOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle className="w-5 h-5 shrink-0" />
                <div className="text-right">
                  <div>تسليم الجهاز الآن للعميل مباشرة</div>
                  <div className="text-[11px] font-normal text-emerald-200 mt-0.5">يفتح نافذة التسليم والدفع النهائي</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCheckoutDialog(false);
                  dbInstance.changeMaintenanceStatus(order.id, 'ready', order.technicianName || 'المسؤول', 'جاهز للاستلام — في انتظار مجيء العميل');
                  onUpdated();
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 shrink-0 text-cyan-400" />
                <div className="text-right">
                  <div>جاهز للاستلام — بانتظار مجيء العميل</div>
                  <div className="text-[11px] font-normal text-slate-400 mt-0.5">يظهر في قائمة الأجهزة الجاهزة للتسليم</div>
                </div>
              </button>

              <button
                onClick={() => setShowCheckoutDialog(false)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                تخطي — سأحدد لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      {isChangeStatusOpen && (
        <ChangeStatusModal
          order={order}
          onClose={() => setIsChangeStatusOpen(false)}
          onUpdated={() => {
            setIsChangeStatusOpen(false);
            onUpdated();
          }}
        />
      )}

      {isApprovalOpen && (
        <CustomerApprovalModal
          order={order}
          onClose={() => setIsApprovalOpen(false)}
          onUpdated={() => {
            setIsApprovalOpen(false);
            onUpdated();
          }}
        />
      )}

      {isDeliveryOpen && (
        <DeliveryModal
          order={order}
          onClose={() => setIsDeliveryOpen(false)}
          onDelivered={() => {
            setIsDeliveryOpen(false);
            onUpdated();
          }}
        />
      )}

      {isReceiptPrintOpen && (
        <MaintenanceReceiptModal
          order={order}
          settings={settings}
          isOpen={isReceiptPrintOpen}
          onClose={() => setIsReceiptPrintOpen(false)}
        />
      )}

      {isInvoicePrintOpen && (
        <MaintenanceInvoicePrint
          order={order}
          settings={settings}
          isOpen={isInvoicePrintOpen}
          onClose={() => setIsInvoicePrintOpen(false)}
        />
      )}
    </div>
  );
};
