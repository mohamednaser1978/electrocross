import React, { useState, useMemo } from 'react';
import { 
  X, Plus, Trash2, Wrench, User, Calendar, 
  DollarSign, AlertCircle, CheckCircle, Cpu, Tv,
  Activity, Shield, Sparkles, FileText
} from 'lucide-react';
import { Component, Customer, Sale, SaleItem, MaintenanceStatus, Technician } from '../../db/types';
import { ComponentSearchSelect } from '../ComponentSearchSelect';

interface AddMaintenanceSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saleData: Omit<Sale, 'id'>) => void;
  components: Component[];
  customers: Customer[];
  currency: string;
  technicians?: Technician[];
  onOpenAddTechnician?: () => void;
}

export const AddMaintenanceSaleModal: React.FC<AddMaintenanceSaleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  components,
  customers,
  currency,
  technicians = [],
  onOpenAddTechnician,
}) => {
  // Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Maintenance Ticket Metadata
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber] = useState(() => `MNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Device Details
  const [deviceType, setDeviceType] = useState('شاشة تلفزيون LED');
  const [brand, setBrand] = useState('Samsung');
  const [modelOrBoard, setModelOrBoard] = useState('');
  const [serialOrChassis, setSerialOrChassis] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [technicianName, setTechnicianName] = useState(() => technicians[0]?.name || 'م. عمر الليبي');
  const [isCustomTechnician, setIsCustomTechnician] = useState(false);
  const [status, setStatus] = useState<MaintenanceStatus>('ready');

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
  const [technicianFee, setTechnicianFee] = useState<number>(20000);

  // 3. Extra Services & Expenses
  const [extraServicesDescription, setExtraServicesDescription] = useState('فحص مجهري وتنظيف مسارات الباور ومعجون حراري');
  const [extraServicesFee, setExtraServicesFee] = useState<number>(5000);
  const [extraExpensesCost, setExtraExpensesCost] = useState<number>(1000);

  // Discounts & Payment
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let customerName = 'عميل نقدي / عام';
    let customerPhone = '—';

    if (isNewCustomer) {
      customerName = customCustomerName.trim() || 'عميل صيانة';
      customerPhone = customCustomerPhone.trim() || '—';
    } else {
      const selected = customers.find(c => c.id === selectedCustomerId);
      if (selected) {
        customerName = selected.name;
        customerPhone = selected.phone;
      }
    }

    const paymentStatus: 'paid' | 'partial' | 'unpaid' = 
      paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    onSave({
      invoiceNumber,
      saleType: 'maintenance',
      customerId: isNewCustomer ? undefined : selectedCustomerId,
      customerName,
      customerPhone,
      date,
      items: spareParts,
      partsTotal,
      maintenance: {
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
        status,
        receivedDate: date,
        deliveryDate: status === 'delivered' ? date : undefined,
      },
      discount,
      totalAmount,
      totalCost,
      profit: netProfit,
      paidAmount: Math.min(totalAmount, paidAmount),
      paymentStatus,
      notes,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">تسجيل مبيعات وعملية صيانة متكاملة</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تشمل: قطع الغيار المستبدلة + أجرة الفني والتركيب + الخدمات الإضافية مع حساب دقيق للتكلفة والربح
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Customer & Ticket Date */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                بيانات صاحب الجهاز والعملية
              </span>
              <button
                type="button"
                onClick={() => setIsNewCustomer(prev => !prev)}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-semibold"
              >
                {isNewCustomer ? 'اختر من قائمة العملاء المسجلين' : '+ عميل جديد / غير مسجل'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                {isNewCustomer ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="اسم العميل (مثال: م. أحمد السعدي)"
                      value={customCustomerName}
                      onChange={e => setCustomCustomerName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="رقم هاتف العميل"
                      value={customCustomerPhone}
                      onChange={e => setCustomCustomerPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone && c.phone !== '—' ? `(${c.phone})` : ''} - {c.address || ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
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
                <label className="text-[10px] text-slate-400 block mb-1">حالة عملية الصيانة</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as MaintenanceStatus)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 focus:border-cyan-500 outline-none"
                >
                  <option value="received">استلام وقيد الفحص</option>
                  <option value="in_progress">قيد الإصلاح على طاولة الصيانة</option>
                  <option value="ready">تم الإصلاح وجاهز للتسليم</option>
                  <option value="delivered">تم التسليم للعميل بالكامل</option>
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
                          step="100"
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
                  step="1000"
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
                    step="500"
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
                    step="500"
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
                step="500"
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

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              حفظ بطاقة الصيانة والفاتورة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
