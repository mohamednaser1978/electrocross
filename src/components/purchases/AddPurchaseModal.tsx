import React, { useState, useMemo } from 'react';
import { 
  X, Plus, Trash2, Truck, Calendar, Building2, 
  DollarSign, CheckCircle, PackagePlus
} from 'lucide-react';
import { Component, Supplier, Purchase, PurchaseItem } from '../../db/types';
import { ComponentSearchSelect } from '../ComponentSearchSelect';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchaseData: Omit<Purchase, 'id'>) => void;
  components: Component[];
  suppliers: Supplier[];
  currency: string;
}

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  components,
  suppliers,
  currency,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [customSupplierName, setCustomSupplierName] = useState('');
  const [customSupplierCompany, setCustomSupplierCompany] = useState('');
  const [isNewSupplier, setIsNewSupplier] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber] = useState(() => `PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState('');

  // Payment to supplier states
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'unpaid'>('full');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Purchase items
  const [items, setItems] = useState<Omit<PurchaseItem, 'id' | 'purchaseId'>[]>([
    {
      componentId: components[0]?.id || 1,
      partNumber: components[0]?.part_number || '',
      quantity: 10,
      unitCost: components[0]?.cost_price ?? 5,
      salePrice: components[0]?.sale_price ?? 12,
      totalCost: (components[0]?.cost_price ?? 5) * 10,
    }
  ]);

  const totalAmount = useMemo(() => items.reduce((s, i) => s + i.totalCost, 0), [items]);

  // Keep paidAmount synced if full payment selected
  React.useEffect(() => {
    if (paymentType === 'full') {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount, paymentType]);

  const handleComponentChange = (index: number, compId: number) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    setItems(prev => {
      const updated = [...prev];
      const qty = updated[index].quantity;
      const unitCost = comp.cost_price ?? 5;
      const salePrice = comp.sale_price ?? Math.round(unitCost * 1.5);
      updated[index] = {
        componentId: comp.id,
        partNumber: comp.part_number,
        quantity: qty,
        unitCost,
        salePrice,
        totalCost: unitCost * qty,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    setItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: safeQty,
        totalCost: item.unitCost * safeQty,
      };
      return updated;
    });
  };

  const handleCostChange = (index: number, cost: number) => {
    const safeCost = Math.max(0, cost);
    setItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        unitCost: safeCost,
        totalCost: safeCost * item.quantity,
      };
      return updated;
    });
  };

  const handleSalePriceChange = (index: number, price: number) => {
    const safePrice = Math.max(0, price);
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        salePrice: safePrice,
      };
      return updated;
    });
  };

  const handleAddItem = () => {
    const defaultComp = components[0];
    if (!defaultComp) return;

    const unitCost = defaultComp.cost_price ?? 5;
    const salePrice = defaultComp.sale_price ?? Math.round(unitCost * 1.5);

    setItems(prev => [
      ...prev,
      {
        componentId: defaultComp.id,
        partNumber: defaultComp.part_number,
        quantity: 10,
        unitCost,
        salePrice,
        totalCost: unitCost * 10,
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaidAmountChange = (val: number) => {
    const safeVal = Math.max(0, Math.min(val, totalAmount));
    setPaidAmount(safeVal);
    if (safeVal >= totalAmount) {
      setPaymentType('full');
    } else if (safeVal === 0) {
      setPaymentType('unpaid');
    } else {
      setPaymentType('partial');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let supplierName = 'مورد عام';
    if (isNewSupplier) {
      supplierName = customSupplierName.trim() || 'مورد عام';
    } else {
      const sup = suppliers.find(s => s.id === selectedSupplierId);
      if (sup) {
        supplierName = sup.name;
      }
    }

    const finalItems: PurchaseItem[] = items.map((it, idx) => ({
      ...it,
      id: idx + 1,
      purchaseId: 0,
    }));

    const finalPaid = Math.max(0, Math.min(paidAmount, totalAmount));
    const paymentStatus: 'paid' | 'partial' | 'unpaid' = 
      finalPaid >= totalAmount ? 'paid' : (finalPaid > 0 ? 'partial' : 'unpaid');

    onSave({
      invoiceNumber,
      supplierId: isNewSupplier ? undefined : selectedSupplierId,
      supplierName,
      date,
      totalAmount,
      paidAmount: finalPaid,
      paymentStatus,
      items: finalItems,
      notes,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">تسجيل فاتورة شراء وتوريد قطع للمستودع</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                يتم زيادة كميات المخزون للقطع المشتراة وتحديث سعر التكلفة تلقائياً بمجرد الحفظ
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Supplier & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  المورد / شركة التوريد
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewSupplier(prev => !prev)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-semibold"
                >
                  {isNewSupplier ? 'اختر من قائمة الموردين' : '+ مورد جديد'}
                </button>
              </div>

              {isNewSupplier ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="اسم المورد أو المسؤول"
                    value={customSupplierName}
                    onChange={e => setCustomSupplierName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="اسم الشركة (اختياري)"
                    value={customSupplierCompany}
                    onChange={e => setCustomSupplierCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              ) : (
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.company ? `(${s.company})` : ''} - {s.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                تاريخ الشراء والتوريد
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <PackagePlus className="w-4 h-4 text-emerald-400" />
                القطع الموردة لزيادة رصيد المستودع
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة صنف آخر
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-center gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="text-[10px] text-slate-400 block mb-1">القطعة الإلكترونية المراد توريدها (بحث فوري بالرمز أو الاسم)</label>
                    <ComponentSearchSelect
                      components={components}
                      selectedComponentId={item.componentId}
                      onSelectComponent={comp => handleComponentChange(idx, comp.id)}
                      currency={currency}
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="text-[10px] text-slate-400 block mb-1">الكمية (+)</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs font-bold text-center text-emerald-400 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="text-[10px] text-slate-400 block mb-1">سعر الشراء</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.unitCost}
                      onChange={e => handleCostChange(idx, Number(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs font-bold text-white rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="text-[10px] text-cyan-400 block mb-1 font-semibold">سعر البيع 🏷️</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.salePrice ?? 0}
                      onChange={e => handleSalePriceChange(idx, Number(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs font-bold text-cyan-300 rounded-lg bg-cyan-950/40 border border-cyan-500/40 focus:border-cyan-400 outline-none"
                      title="سعر البيع المقترح بالمستودع الذي سيتم تحديثه تلقائياً في المخزون"
                    />
                  </div>

                  <div className="w-full sm:w-24 text-left sm:text-right">
                    <label className="text-[10px] text-slate-400 block mb-1">الإجمالي</label>
                    <div className="text-xs font-black text-emerald-300 font-mono pt-1">
                      {item.totalCost.toLocaleString()} {currency}
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className={`p-2 rounded-lg transition ${
                        items.length <= 1 
                          ? 'text-slate-600 cursor-not-allowed' 
                          : 'text-rose-400 hover:bg-rose-950/40 cursor-pointer'
                      }`}
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment to Supplier Section */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-white">سداد قيمة الفاتورة للمورد (المدفوع والآجل)</span>
              </div>
              {/* Quick action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { setPaymentType('full'); setPaidAmount(totalAmount); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    paymentType === 'full' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  سداد كامل نقدياً
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentType('partial'); setPaidAmount(Math.round(totalAmount / 2)); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    paymentType === 'partial' 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  دفعة جزئية
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentType('unpaid'); setPaidAmount(0); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    paymentType === 'unpaid' 
                      ? 'bg-rose-500 text-white shadow-sm' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  آجل بالكامل (ذمة)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">المبلغ المدفوع للمورد الآن</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    step="1"
                    value={paidAmount}
                    onChange={e => handlePaidAmountChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold text-emerald-400 rounded-lg bg-slate-900 border border-emerald-500/40 focus:border-emerald-400 outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">{currency}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">المتبقي بذمتنا للمورد (دين آجل)</label>
                <div className="px-3 py-2 text-xs font-black font-mono rounded-lg bg-slate-900 border border-slate-700 text-amber-400 flex items-center justify-between">
                  <span>{Math.max(0, totalAmount - paidAmount).toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500">{currency}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">حالة سداد الفاتورة</label>
                <div className="pt-0.5">
                  {paidAmount >= totalAmount ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold w-full justify-center">
                      ✓ مسددة بالكامل نقدياً
                    </span>
                  ) : paidAmount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold w-full justify-center">
                      ⏳ سداد جزئي (عربون / دفعة)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold w-full justify-center">
                      ⚠️ غير مسددة (آجل بذمة الورشة)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">ملاحظات الفاتورة والشحن</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: شحنة آي سيهات أصلية من دبي، بوليصة شحن رقم 8872"
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">إجمالي قيمة فاتورة الشراء والتوريد</span>
              <span className="text-xl font-black text-emerald-300 font-mono">
                {totalAmount.toLocaleString()} {currency}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              عدد الأصناف المضافة: <strong className="text-white font-mono">{items.length}</strong>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              حفظ وتغذية المخزون
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
