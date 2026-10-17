import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Plus, Trash2, Wrench, User, Calendar,
  DollarSign, AlertCircle, CheckCircle, Cpu, Tv,
  Activity, Shield, Sparkles, FileText, Package, Check, Clock, Edit3, Save
} from 'lucide-react';
import {
  Component, Customer, Sale, SaleItem, MaintenanceWorkflowStatus, Technician, MaintenanceOrder
} from '../../db/types';
import { ComponentSearchSelect } from '../ComponentSearchSelect';

interface AddMaintenanceSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saleData: Omit<Sale, 'id'>) => void;
  onUpdate?: (updatedSale: Sale) => void;
  saleToEdit?: Sale | null;
  components: Component[];
  customers: Customer[];
  currency: string;
  technicians?: Technician[];
  maintenanceOrders?: MaintenanceOrder[];
  onOpenAddTechnician?: () => void;
}

export const WORKFLOW_STAGES: { id: MaintenanceWorkflowStatus; label: string; color: string; bg: string }[] = [
  { id: 'in_safes', label: '📦 في الأمانات (محفوظ بالرف)', color: 'text-blue-300', bg: 'bg-blue-900/40 border-blue-600/50' },
  { id: 'under_inspection', label: '🔬 قيد الفحص والتشخيص', color: 'text-yellow-300', bg: 'bg-yellow-900/40 border-yellow-600/50' },
  { id: 'under_repair', label: '🔧 قيد الصيانة والإصلاح', color: 'text-orange-300', bg: 'bg-orange-900/40 border-orange-600/50' },
  { id: 'awaiting_part', label: '⏳ بانتظار توفير قطعة غيار', color: 'text-purple-300', bg: 'bg-purple-900/40 border-purple-600/50' },
  { id: 'awaiting_approval', label: '📋 بانتظار موافقة الزبون', color: 'text-pink-300', bg: 'bg-pink-900/40 border-pink-600/50' },
  { id: 'ready', label: '✨ تم الإصلاح (جاهز للتسليم)', color: 'text-emerald-300', bg: 'bg-emerald-900/40 border-emerald-600/50' },
  { id: 'delivered', label: '🤝 تم التسليم للزبون والفوترة', color: 'text-teal-300', bg: 'bg-teal-900/40 border-teal-600/50' },
];

export const AddMaintenanceSaleModal: React.FC<AddMaintenanceSaleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  saleToEdit,
  components,
  customers,
  currency,
  technicians = [],
  maintenanceOrders = [],
  onOpenAddTechnician,
}) => {
  // Source Mode: 'maintenance_order' | 'customer_list' | 'manual'
  const [sourceMode, setSourceMode] = useState<'maintenance_order' | 'customer_list' | 'manual'>(() => {
    return maintenanceOrders && maintenanceOrders.length > 0 ? 'maintenance_order' : 'customer_list';
  });
  const [selectedMaintenanceOrderId, setSelectedMaintenanceOrderId] = useState<number | ''>('');

  // Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(customers[0]?.id || 1);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');

  // Maintenance Ticket Metadata
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(() => `MNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Device Details
  const [deviceType, setDeviceType] = useState('شاشة تلفزيون LED');
  const [brand, setBrand] = useState('Samsung');
  const [modelOrBoard, setModelOrBoard] = useState('');
  const [serialOrChassis, setSerialOrChassis] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [technicianName, setTechnicianName] = useState(() => technicians[0]?.name || 'م. عمر الليبي');
  const [isCustomTechnician, setIsCustomTechnician] = useState(false);
  const [status, setStatus] = useState<MaintenanceWorkflowStatus>('ready');

  // Suspension / Pending Invoice (Observation 7)
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('انتظار وصول قطعة الغيار غير المتوفرة');
  const [requestedParts, setRequestedParts] = useState('');

  // Financial Breakdown Components
  // 1. Spare parts
  const [spareParts, setSpareParts] = useState<SaleItem[]>([
    {
      id: 1,
      componentId: components[0]?.id || 1,
      partNumber: components[0]?.part_number || '',
      quantity: 1,
      unitPrice: components[0]?.sale_price || 3000,
      unitCost: components[0]?.cost_price || 1500,
      totalPrice: components[0]?.sale_price || 3000,
      totalCost: components[0]?.cost_price || 1500,
    }
  ]);

  // 2. Labor & Technician Fee
  const [technicianFee, setTechnicianFee] = useState<number>(0);

  // 3. Extra Services & Expenses
  const [extraServicesDescription, setExtraServicesDescription] = useState('');
  const [extraServicesFee, setExtraServicesFee] = useState<number>(0);
  const [extraExpensesCost, setExtraExpensesCost] = useState<number>(0);

  // Discounts & Payment
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Synchronize state when editing an existing invoice or creating a new one
  useEffect(() => {
    if (!isOpen) return;

    if (saleToEdit) {
      setInvoiceNumber(saleToEdit.invoiceNumber);
      setDate(saleToEdit.date || new Date().toISOString().split('T')[0]);

      if (saleToEdit.maintenanceOrderId) {
        setSourceMode('maintenance_order');
        setSelectedMaintenanceOrderId(saleToEdit.maintenanceOrderId);
      } else if (saleToEdit.customerId) {
        setSourceMode('customer_list');
        setSelectedCustomerId(saleToEdit.customerId);
      } else {
        setSourceMode('manual');
      }

      setCustomCustomerName(saleToEdit.customerName || '');
      setCustomCustomerPhone(saleToEdit.customerPhone && saleToEdit.customerPhone !== '—' ? saleToEdit.customerPhone : '');

      if (saleToEdit.maintenance) {
        setDeviceType(saleToEdit.maintenance.deviceType || 'شاشة تلفزيون LED');
        setBrand(saleToEdit.maintenance.brand || 'Samsung');
        setModelOrBoard(saleToEdit.maintenance.modelOrBoard || '');
        setSerialOrChassis(saleToEdit.maintenance.serialOrChassis || '');
        setFaultDescription(saleToEdit.maintenance.faultDescription || '');
        setTechnicianName(saleToEdit.maintenance.technicianName || (technicians[0]?.name || 'م. عمر الليبي'));
        setStatus(saleToEdit.maintenance.status || 'awaiting_part');
        setTechnicianFee(saleToEdit.maintenance.technicianFee || 0);
        setExtraServicesDescription(saleToEdit.maintenance.extraServicesDescription || '');
        setExtraServicesFee(saleToEdit.maintenance.extraServicesFee || 0);
        setExtraExpensesCost(saleToEdit.maintenance.extraExpensesCost || 0);
      }

      const isSusp = Boolean(saleToEdit.isSuspended || saleToEdit.maintenance?.isSuspended || saleToEdit.maintenance?.status === 'awaiting_part');
      setIsSuspended(isSusp);
      setSuspensionReason(saleToEdit.suspensionReason || saleToEdit.maintenance?.suspensionReason || 'انتظار وصول قطعة الغيار غير المتوفرة');
      setRequestedParts(saleToEdit.requestedParts || saleToEdit.maintenance?.requestedParts || '');

      setSpareParts(saleToEdit.items && saleToEdit.items.length > 0 ? [...saleToEdit.items] : []);
      setDiscount(saleToEdit.discount || 0);
      setPaidAmount(saleToEdit.paidAmount || 0);
      setNotes(saleToEdit.notes || '');
    } else {
      setInvoiceNumber(`MNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setDate(new Date().toISOString().split('T')[0]);
      if (maintenanceOrders && maintenanceOrders.length > 0) {
        setSourceMode('maintenance_order');
      } else {
        setSourceMode('customer_list');
      }
      setSelectedMaintenanceOrderId('');
      setCustomCustomerName('');
      setCustomCustomerPhone('');
      setIsSuspended(false);
      setSuspensionReason('انتظار وصول قطعة الغيار غير المتوفرة');
      setRequestedParts('');
      setSpareParts(components.length > 0 ? [
        {
          id: 1,
          componentId: components[0]?.id || 1,
          partNumber: components[0]?.part_number || '',
          quantity: 1,
          unitPrice: components[0]?.sale_price || 3000,
          unitCost: components[0]?.cost_price || 1500,
          totalPrice: components[0]?.sale_price || 3000,
          totalCost: components[0]?.cost_price || 1500,
        }
      ] : []);
      setTechnicianFee(0);
      setExtraServicesDescription('');
      setExtraServicesFee(0);
      setExtraExpensesCost(0);
      setDiscount(0);
      setPaidAmount(0);
      setNotes('');
    }
  }, [isOpen, saleToEdit]);

  // Handle Spare Part Changes
  const handlePartChange = (index: number, compId: number) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    setSpareParts(prev => {
      const updated = [...prev];
      const qty = updated[index].quantity;
      const unitPrice = comp.sale_price ?? 3000;
      const unitCost = comp.cost_price ?? 1500;
      updated[index] = {
        ...updated[index],
        componentId: comp.id,
        partNumber: comp.part_number,
        unitPrice,
        unitCost,
        totalPrice: unitPrice * qty,
        totalCost: unitCost * qty,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    setSpareParts(prev => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: safeQty,
        totalPrice: item.unitPrice * safeQty,
        totalCost: item.unitCost * safeQty,
      };
      return updated;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    const safePrice = Math.max(0, price);
    setSpareParts(prev => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        unitPrice: safePrice,
        totalPrice: safePrice * item.quantity,
      };
      return updated;
    });
  };

  const handleAddSparePart = () => {
    const defaultComp = components[0];
    if (!defaultComp) return;

    setSpareParts(prev => [
      ...prev,
      {
        id: Date.now(),
        componentId: defaultComp.id,
        partNumber: defaultComp.part_number,
        quantity: 1,
        unitPrice: defaultComp.sale_price ?? 3000,
        unitCost: defaultComp.cost_price ?? 1500,
        totalPrice: defaultComp.sale_price ?? 3000,
        totalCost: defaultComp.cost_price ?? 1500,
      }
    ]);
  };

  const handleRemoveSparePart = (index: number) => {
    setSpareParts(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const partsTotal = useMemo(() => spareParts.reduce((s, i) => s + i.totalPrice, 0), [spareParts]);
  const partsCost = useMemo(() => spareParts.reduce((s, i) => s + i.totalCost, 0), [spareParts]);

  // Total Customer Revenue = Spare parts price + Technician labor fee + Extra services fee - Discount
  const totalAmount = Math.max(0, partsTotal + technicianFee + extraServicesFee - discount);
  // Total Workshop Direct Cost = Spare parts cost + Extra expenses cost
  const totalCost = partsCost + extraExpensesCost;
  // Net Profit = Total Revenue - Total Cost
  const netProfit = Math.max(0, totalAmount - totalCost);
  const profitMargin = totalAmount > 0 ? Math.round((netProfit / totalAmount) * 100) : 0;

  const handleSetFullPayment = () => {
    setPaidAmount(totalAmount);
  };

  // Active maintenance orders
  const activeMaintenanceOrders = useMemo(() => {
    return (maintenanceOrders || []).filter(o =>
      o.status !== 'returned_no_repair' &&
      o.status !== 'rejected_by_customer' &&
      o.status !== 'delivered' &&
      o.status !== 'unrepairable'
    );
  }, [maintenanceOrders]);

  const selectedMaintenanceOrder = useMemo(() => {
    if (!selectedMaintenanceOrderId) return null;
    return (maintenanceOrders || []).find(o => o.id === selectedMaintenanceOrderId) || null;
  }, [selectedMaintenanceOrderId, maintenanceOrders]);

  const handleSelectMaintenanceOrder = (orderId: number | '') => {
    setSelectedMaintenanceOrderId(orderId);
    if (!orderId) return;

    const order = (maintenanceOrders || []).find(o => o.id === orderId);
    if (!order) return;

    // Customer
    setCustomCustomerName(order.customerName);
    setCustomCustomerPhone(order.customerPhone);
    if (order.customerId) {
      setSelectedCustomerId(order.customerId);
    }

    // Device
    setDeviceType(order.deviceType || 'شاشة تلفزيون LED');
    setBrand(order.brand || '');
    setModelOrBoard(order.model || '');
    setSerialOrChassis(order.serialNumber || '');
    setFaultDescription(order.diagnosedFault || order.reportedFault || '');
    if (order.technicianName) {
      setTechnicianName(order.technicianName);
    }

    // Status
    setStatus(order.status);

    // Labor fee
    if (order.laborFee > 0) {
      setTechnicianFee(order.laborFee);
    }

    // Spare parts from order
    if (order.parts && order.parts.length > 0) {
      const convertedParts: SaleItem[] = order.parts.map((p, idx) => ({
        id: p.id || idx + 1,
        componentId: p.componentId || components[0]?.id || 1,
        partNumber: p.partNumber || p.description,
        quantity: p.quantity,
        unitPrice: p.unitSalePrice,
        unitCost: p.unitCost,
        totalPrice: p.totalSalePrice,
        totalCost: p.totalCost,
      }));
      setSpareParts(convertedParts);
    }

    // Discount
    if (order.discount > 0) {
      setDiscount(order.discount);
    }

    // Suspension state
    if (order.isSuspended) {
      setIsSuspended(true);
      setSuspensionReason(order.suspensionReason || 'انتظار وصول قطعة الغيار غير المتوفرة');
      setRequestedParts(order.requestedParts || '');
    } else if (order.status === 'awaiting_part') {
      setIsSuspended(true);
      setSuspensionReason('انتظار توفير قطعة غيار');
      setRequestedParts(order.requestedParts || '');
    } else {
      setIsSuspended(false);
      setSuspensionReason('انتظار وصول قطعة الغيار غير المتوفرة');
      setRequestedParts('');
    }

    // Paid amount
    if (order.paidAmount > 0) {
      setPaidAmount(order.paidAmount);
    }
  };

  const handleSaveForm = (asSuspended: boolean = false) => {
    let customerName = 'عميل نقدي / عام';
    let customerPhone = '—';

    if (sourceMode === 'maintenance_order') {
      customerName = customCustomerName.trim() || 'عميل صيانة';
      customerPhone = customCustomerPhone.trim() || '—';
    } else if (sourceMode === 'manual') {
      customerName = customCustomerName.trim() || 'عميل صيانة';
      customerPhone = customCustomerPhone.trim() || '—';
    } else {
      const selected = customers.find(c => c.id === selectedCustomerId);
      if (selected) {
        customerName = selected.name;
        customerPhone = selected.phone;
      }
    }

    // Determine effectiveStatus:
    // If saving as suspended -> must be 'awaiting_part'
    // If saving as finished/approved (asSuspended === false):
    //    if status is still 'awaiting_part', auto-transition to 'ready' (or 'delivered' if paid in full)
    let effectiveStatus: MaintenanceWorkflowStatus = asSuspended ? 'awaiting_part' : status;
    if (!asSuspended && effectiveStatus === 'awaiting_part') {
      effectiveStatus = (paidAmount >= totalAmount && totalAmount > 0) ? 'delivered' : 'ready';
    }

    const paymentStatus: 'paid' | 'partial' | 'unpaid' =
      paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const cleanNotes = notes.replace(/^\[فاتورة معلقة - قيد الانتظار:[^\]]*\]\s*/, '').trim();

    const salePayload = {
      invoiceNumber,
      saleType: 'maintenance' as const,
      maintenanceOrderId: sourceMode === 'maintenance_order' && selectedMaintenanceOrderId ? Number(selectedMaintenanceOrderId) : (saleToEdit?.maintenanceOrderId || undefined),
      customerId: sourceMode === 'customer_list' ? selectedCustomerId : (saleToEdit?.customerId || undefined),
      customerName,
      customerPhone,
      date,
      items: spareParts,
      partsTotal,
      isSuspended: asSuspended,
      suspensionReason: asSuspended ? (suspensionReason.trim() || 'انتظار وصول قطعة الغيار') : undefined,
      requestedParts: asSuspended ? (requestedParts.trim() || undefined) : undefined,
      maintenance: {
        maintenanceOrderId: sourceMode === 'maintenance_order' && selectedMaintenanceOrderId ? Number(selectedMaintenanceOrderId) : (saleToEdit?.maintenanceOrderId || undefined),
        deviceType,
        brand,
        modelOrBoard,
        serialOrChassis,
        faultDescription: faultDescription || 'تم الفحص الشامل والإصلاح',
        technicianName,
        technicianFee,
        extraServicesDescription,
        extraServicesFee,
        extraExpensesCost,
        status: effectiveStatus,
        isSuspended: asSuspended,
        suspensionReason: asSuspended ? (suspensionReason.trim() || 'انتظار وصول قطعة الغيار') : undefined,
        requestedParts: asSuspended ? (requestedParts.trim() || undefined) : undefined,
        receivedDate: date,
        deliveryDate: effectiveStatus === 'delivered' ? date : undefined,
      },
      discount,
      totalAmount,
      totalCost,
      profit: netProfit,
      paidAmount: Math.min(totalAmount, paidAmount),
      paymentStatus,
      notes: asSuspended
        ? `[فاتورة معلقة - قيد الانتظار: ${suspensionReason.trim() || 'انتظار توفير القطعة'}${requestedParts.trim() ? ` | القطع المطلوبة: ${requestedParts.trim()}` : ''}] ${cleanNotes}`.trim()
        : cleanNotes,
    };

    if (saleToEdit && onUpdate) {
      onUpdate({
        ...saleToEdit,
        ...salePayload,
        id: saleToEdit.id,
        isSuspended: asSuspended,
        suspensionReason: asSuspended ? (suspensionReason.trim() || 'انتظار وصول قطعة الغيار') : undefined,
        requestedParts: asSuspended ? (requestedParts.trim() || undefined) : undefined,
      });
    } else {
      onSave(salePayload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          saleToEdit
            ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-purple-500/30'
            : 'bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-cyan-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border shadow-inner ${
              saleToEdit
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              {saleToEdit ? <Edit3 className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {saleToEdit ? 'تعديل الفاتورة المعلقة / عملية الصيانة' : 'تسجيل مبيعات وعملية صيانة متكاملة'}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  saleToEdit
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {invoiceNumber}
                </span>
                {saleToEdit && (saleToEdit.isSuspended || saleToEdit.maintenance?.isSuspended) && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    ⏳ قيد الانتظار
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {saleToEdit
                  ? 'يمكنك تعديل قطع الغيار المستخدمة، تحديث النواقص وسبب التعليق، أو استئناف الفاتورة وإنهاؤها مباشرة.'
                  : 'تشمل: قطع الغيار المستبدلة + أجرة الفني والتركيب + الخدمات الإضافية مع حساب دقيق للتكلفة والربح'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={(e) => { e.preventDefault(); handleSaveForm(false); }} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Customer & Ticket Date */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                بيانات صاحب الجهاز والعملية
              </span>

              {/* Source Mode Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setSourceMode('maintenance_order')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${sourceMode === 'maintenance_order'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  أجهزة الصيانة والأمانات
                  {activeMaintenanceOrders.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                      {activeMaintenanceOrders.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode('customer_list')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${sourceMode === 'customer_list'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  دليل العملاء
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode('manual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${sourceMode === 'manual'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  عميل جديد / يدوي
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-2">
                {sourceMode === 'maintenance_order' && (
                  <div>
                    <label className="text-[10px] text-cyan-400 font-bold block mb-1">
                      اختر الجهاز المستلم (مربوط بقسم الصيانة والأمانات):
                    </label>
                    <select
                      value={selectedMaintenanceOrderId}
                      onChange={e => handleSelectMaintenanceOrder(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-cyan-500/60 text-white focus:border-cyan-400 outline-none cursor-pointer"
                    >
                      <option value="">-- اضغط لاختيار جهاز مستلم من الصيانة والأمانات --</option>
                      {activeMaintenanceOrders.map(order => {
                        const statusObj = WORKFLOW_STAGES.find(s => s.id === order.status);
                        const statusLabel = statusObj ? statusObj.label : order.status;
                        return (
                          <option key={order.id} value={order.id}>
                            [{order.orderNumber}] {order.customerName} — {order.deviceType} {order.brand} ({statusLabel}) {order.shelfLocation ? `[الرف: ${order.shelfLocation}]` : ''}
                          </option>
                        );
                      })}
                    </select>

                    {selectedMaintenanceOrder && (
                      <div className="mt-2.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-xs space-y-1.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="text-cyan-400">العميل:</span>
                            {selectedMaintenanceOrder.customerName}
                            <span className="text-cyan-400 font-mono" dir="ltr">({selectedMaintenanceOrder.customerPhone})</span>
                          </span>
                          {selectedMaintenanceOrder.shelfLocation && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                              📦 الرف: {selectedMaintenanceOrder.shelfLocation}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400">الجهاز:</span>
                          <span className="font-semibold">{[selectedMaintenanceOrder.deviceType, selectedMaintenanceOrder.brand, selectedMaintenanceOrder.model].filter(Boolean).join(' - ')}</span>
                          {selectedMaintenanceOrder.reportedFault && (
                            <span className="text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                              العطل: {selectedMaintenanceOrder.reportedFault}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-cyan-900/50 flex items-center gap-1">
                          <Check className="w-3 h-3" /> تم جلب بيانات العميل وتفاصيل الجهاز وقطع الغيار المسجلة تلقائياً.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {sourceMode === 'customer_list' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">اختر من قائمة العملاء المسجلين:</label>
                    <select
                      value={selectedCustomerId}
                      onChange={e => {
                        const id = Number(e.target.value);
                        setSelectedCustomerId(id);
                        const c = customers.find(item => item.id === id);
                        if (c) {
                          setCustomCustomerName(c.name);
                          setCustomCustomerPhone(c.phone);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone && c.phone !== '—' ? `(${c.phone})` : ''} - {c.address || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {sourceMode === 'manual' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">اسم العميل:</label>
                      <input
                        type="text"
                        placeholder="اسم العميل (مثال: م. أحمد السعدي)"
                        value={customCustomerName}
                        onChange={e => setCustomCustomerName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">رقم الهاتف:</label>
                      <input
                        type="text"
                        placeholder="09xxxxxxxx"
                        value={customCustomerPhone}
                        onChange={e => setCustomCustomerPhone(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">تاريخ العملية:</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Device & Diagnosis Details */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              بيانات الجهاز المشخص وحالة الصيانة
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">نوع الجهاز / اللوحة</label>
                <input
                  type="text"
                  value={deviceType}
                  onChange={e => setDeviceType(e.target.value)}
                  placeholder="شاشة، كارت غسالة، مكيف..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">الماركة / الشركة</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Samsung, LG, Media..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">الموديل أو رقم البوردة</label>
                <input
                  type="text"
                  value={modelOrBoard}
                  onChange={e => setModelOrBoard(e.target.value)}
                  placeholder="مثال: BN41-02568B"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">مرحلة الصيانة الحالية:</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as MaintenanceWorkflowStatus)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-slate-900 border border-cyan-500 text-cyan-300 focus:border-cyan-400 outline-none cursor-pointer"
                >
                  {WORKFLOW_STAGES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 block mb-1">تشخيص العطل والقطع التالفة</label>
                <input
                  type="text"
                  value={faultDescription}
                  onChange={e => setFaultDescription(e.target.value)}
                  placeholder="مثال: شورت في دائرة التغذية النبضية، تلف آي سي الباور VIPer ومكثف 450V"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-400">المهندس المسؤول عن الصيانة</label>
                  {onOpenAddTechnician && (
                    <button
                      type="button"
                      onClick={onOpenAddTechnician}
                      className="text-[10px] text-purple-400 hover:text-purple-300 hover:underline cursor-pointer font-bold"
                    >
                      + مهندس جديد
                    </button>
                  )}
                </div>
                {isCustomTechnician ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={technicianName}
                      onChange={e => setTechnicianName(e.target.value)}
                      placeholder="اكتب اسم المهندس أو الفني"
                      required
                      className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-900 border border-purple-500 text-white focus:border-purple-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTechnician(false);
                        if (technicians.length > 0) {
                          setTechnicianName(technicians[0].name);
                        }
                      }}
                      className="px-2 py-1 text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer shrink-0 font-bold"
                    >
                      القائمة
                    </button>
                  </div>
                ) : (
                  <select
                    value={technicians.some(t => t.name === technicianName) ? technicianName : '__custom__'}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomTechnician(true);
                      } else {
                        setTechnicianName(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-purple-500 outline-none"
                  >
                    {technicians.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.specialty ? `— ${t.specialty}` : ''}
                      </option>
                    ))}
                    <option value="__custom__">+ إدخال اسم فني آخر / يدوي...</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Suspension & Pending Invoice Card (Observation 7) */}
          <div className={`p-4 rounded-xl border transition-all ${isSuspended || status === 'awaiting_part'
              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/50'
              : 'bg-slate-800/40 border-slate-700/60'
            }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isSuspended || status === 'awaiting_part' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-white">
                  تعليق الفاتورة والعملية (قيد الانتظار)
                </span>
                {(isSuspended || status === 'awaiting_part') && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                    قيد الانتظار
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextState = !isSuspended;
                  setIsSuspended(nextState);
                  if (nextState) {
                    setStatus('awaiting_part');
                  } else if (status === 'awaiting_part') {
                    setStatus((paidAmount >= totalAmount && totalAmount > 0) ? 'delivered' : 'ready');
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSuspended || status === 'awaiting_part'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
              >
                {isSuspended || status === 'awaiting_part' ? '✓ الفاتورة معلقة حالياً (انقر للإلغاء)' : '+ تفعيل تعليق الفاتورة مؤقتاً'}
              </button>
            </div>

            {(isSuspended || status === 'awaiting_part') ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs animate-fade-in">
                <div>
                  <label className="text-[10px] text-purple-300 font-bold block mb-1">
                    القطع المطلوبة وغير المتوفرة (التي يُنتظر وصولها):
                  </label>
                  <input
                    type="text"
                    value={requestedParts}
                    onChange={e => setRequestedParts(e.target.value)}
                    placeholder="مثال: IC Power TPS51125 أو شاشة 32 بوصة أصلية..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-purple-500/50 text-white focus:border-purple-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-300 font-bold block mb-1">
                    سبب التعليق:
                  </label>
                  <input
                    type="text"
                    value={suspensionReason}
                    onChange={e => setSuspensionReason(e.target.value)}
                    placeholder="مثال: انتظار شحن وتوريد القطعة من المورد..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-purple-500/50 text-white focus:border-purple-400 outline-none"
                  />
                </div>
                <div className="sm:col-span-2 text-[11px] text-purple-200/90 bg-purple-900/30 p-2.5 rounded-lg border border-purple-800/40">
                  ℹ️ يتم حفظ كافة البيانات المدخلة وتظل الفاتورة مفتوحة وقابلة للتعديل والاستكمال بمجرد توفر القطعة أو حضور الزبون، وتظهر ضمن قائمة الفواتير المعلقة.
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 pt-2">
                إذا كانت هناك قطع مطلوبة غير متوفرة حالياً أو تنتظر شحنها أو موافقة العميل، يمكنك تفعيل هذا الخيار لحفظ الفاتورة معلقة وقابلة للاستكمال لاحقاً.
              </p>
            )}
          </div>

          {/* Section 3: Spare Parts Used in Repair */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                1. قطع الغيار والمكونات المستخدمة في الإصلاح (تخصم تلقائياً من المستودع)
              </span>
              <button
                type="button"
                onClick={handleAddSparePart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة قطعة غيار
              </button>
            </div>

            {spareParts.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-slate-400 text-xs">
                لم يتم إضافة قطع غيار (صيانة برمجية أو إعادة لحام بدون استبدال قطع). انقر على "إضافة قطعة غيار" إن تم تركيب قطع جديدة.
              </div>
            ) : (
              <div className="space-y-2">
                {spareParts.map((item, idx) => {
                  const currentComp = components.find(c => c.id === item.componentId);
                  const isOverStock = currentComp && item.quantity > currentComp.stock_quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex flex-col sm:flex-row items-center gap-3"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="text-[10px] text-slate-400 block mb-1">القطعة الإلكترونية من المستودع (بحث فوري بالرمز أو الاسم)</label>
                        <ComponentSearchSelect
                          components={components}
                          selectedComponentId={item.componentId}
                          onSelectComponent={comp => handlePartChange(idx, comp.id)}
                          currency={currency}
                        />
                        {isOverStock && (
                          <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            تنبيه: الكمية المطلوبة تفوق المتوفر ({currentComp?.stock_quantity})
                          </span>
                        )}
                      </div>

                      <div className="w-full sm:w-20">
                        <label className="text-[10px] text-slate-400 block mb-1">الكمية</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-bold text-center rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="text-[10px] text-slate-400 block mb-1">سعر البيع للعميل</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => handlePriceChange(idx, Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-bold text-emerald-400 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-28 text-left sm:text-right">
                        <label className="text-[10px] text-slate-400 block mb-1">الإجمالي</label>
                        <div className="text-xs font-black text-cyan-300 font-mono pt-1">
                          {item.totalPrice.toLocaleString()} {currency}
                        </div>
                      </div>

                      <div className="pt-4 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveSparePart(idx)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                          title="حذف القطعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Technician Labor Fee & Extra Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Technician Fee */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                <Sparkles className="w-4 h-4" />
                2. أجرة الفني أو أجرة التركيب والإصلاح
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">أجرة اليد / أتعاب الإصلاح المحتسبة للعميل</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={technicianFee}
                  onChange={e => setTechnicianFee(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 text-sm font-black text-amber-300 rounded-lg bg-slate-900 border border-slate-700 focus:border-amber-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                تسجل بالكامل كإيراد خدمات ومهارة مهنية لصالح ورشة الصيانة
              </p>
            </div>

            {/* Extra Services & Expenses */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                <Activity className="w-4 h-4" />
                3. خدمات ومصاريف إضافية مرتبطة بالصيانة
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">بيان الخدمة الإضافية</label>
                <input
                  type="text"
                  value={extraServicesDescription}
                  onChange={e => setExtraServicesDescription(e.target.value)}
                  placeholder="فحص مجهري، تنظيف كيميائي، معجون تبريد..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">الرسوم على العميل</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={extraServicesFee}
                    onChange={e => setExtraServicesFee(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-bold text-cyan-300 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">التكلفة الفعلية (المباشرة)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={extraExpensesCost}
                    onChange={e => setExtraExpensesCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-bold text-slate-400 rounded-lg bg-slate-900 border border-slate-700 focus:border-slate-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Discount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">خصم تشجيعي للعميل (إن وُجد)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">المبلغ المدفوع (عربون أو كامل المبلغ)</label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                placeholder={`0 أو كامل المبلغ (${totalAmount})`}
                className="w-full px-3 py-2 text-xs font-bold text-emerald-400 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Real-time Financial Breakdown Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                المعادلة المالية الشاملة لعملية الصيانة
              </span>
              <button
                type="button"
                onClick={handleSetFullPayment}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                تسجيل سداد الفاتورة بالكامل نقدياً ({totalAmount.toLocaleString()} {currency})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">قطع الغيار (بيع)</div>
                <div className="text-xs font-bold text-white font-mono mt-0.5">
                  {partsTotal.toLocaleString()} {currency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-amber-400 font-semibold">أجرة الفني والتركيب</div>
                <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">
                  {technicianFee.toLocaleString()} {currency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-cyan-400 font-semibold">خدمات إضافية</div>
                <div className="text-xs font-bold text-cyan-300 font-mono mt-0.5">
                  {extraServicesFee.toLocaleString()} {currency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                <div className="text-[10px] text-emerald-400 font-bold">إجمالي الفاتورة للعميل</div>
                <div className="text-sm font-black text-emerald-300 font-mono mt-0.5">
                  {totalAmount.toLocaleString()} {currency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/40">
                <div className="text-[10px] text-blue-400 font-bold">صافي الربح ({profitMargin}%)</div>
                <div className="text-sm font-black text-blue-300 font-mono mt-0.5">
                  +{netProfit.toLocaleString()} {currency}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>التكلفة المباشرة الإجمالية على الورشة: {totalCost.toLocaleString()} {currency}</span>
              <span>المتبقي في ذمة العميل: {Math.max(0, totalAmount - paidAmount).toLocaleString()} {currency}</span>
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/60 text-xs font-bold shadow-md shadow-purple-950 transition active:scale-95 cursor-pointer"
                title={saleToEdit ? "حفظ التعديلات مع إبقاء الفاتورة معلقة وقيد الانتظار" : "حفظ الفاتورة مع إبقائها مفتوحة وقابلة للتعديل والاستكمال لاحقاً"}
              >
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{saleToEdit ? 'حفظ كـ معلقة (قيد الانتظار)' : 'تعليق الفاتورة (قيد الانتظار)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveForm(false)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition active:scale-95 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {saleToEdit
                    ? (status === 'delivered' ? 'حفظ وإنهاء الفاتورة وتسليم الجهاز' : 'حفظ الفاتورة واعتماد الصيانة')
                    : (status === 'delivered' ? 'إنهاء الفاتورة وتسليم الجهاز' : 'إنهاء الفاتورة واعتماد الصيانة')
                  }
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
