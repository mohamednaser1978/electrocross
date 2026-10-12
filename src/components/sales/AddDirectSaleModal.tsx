import React, { useState, useMemo } from 'react';
import { 
  X, Plus, Trash2, ShoppingBag, User, Calendar, 
  DollarSign, AlertCircle, CheckCircle, Package
} from 'lucide-react';
import { Component, Customer, Sale, SaleItem } from '../../db/types';
import { ComponentSearchSelect } from '../ComponentSearchSelect';

interface AddDirectSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saleData: Omit<Sale, 'id'>) => void;
  components: Component[];
  customers: Customer[];
  currency: string;
}

export const AddDirectSaleModal: React.FC<AddDirectSaleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  components,
  customers,
  currency,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber] = useState(() => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Cart items
  const [items, setItems] = useState<SaleItem[]>([
    {
      id: 1,
      componentId: components[0]?.id || 1,
      partNumber: components[0]?.part_number || '',
      quantity: 1,
      unitPrice: components[0]?.sale_price || 2000,
      unitCost: components[0]?.cost_price || 1000,
      totalPrice: components[0]?.sale_price || 2000,
      totalCost: components[0]?.cost_price || 1000,
    }
  ]);

  // Handle component selection change for an item
  const handleComponentChange = (index: number, compId: number) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    setItems(prev => {
      const updated = [...prev];
      const qty = updated[index].quantity;
      const unitPrice = comp.sale_price ?? 2000;
      const unitCost = comp.cost_price ?? 1000;
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
    setItems(prev => {
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
    setItems(prev => {
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

  const handleAddItem = () => {
    const defaultComp = components[0];
    if (!defaultComp) return;

    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        componentId: defaultComp.id,
        partNumber: defaultComp.part_number,
        quantity: 1,
        unitPrice: defaultComp.sale_price ?? 2000,
        unitCost: defaultComp.cost_price ?? 1000,
        totalPrice: defaultComp.sale_price ?? 2000,
        totalCost: defaultComp.cost_price ?? 1000,
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const partsTotal = useMemo(() => items.reduce((s, i) => s + i.totalPrice, 0), [items]);
  const partsCost = useMemo(() => items.reduce((s, i) => s + i.totalCost, 0), [items]);
  const totalAmount = Math.max(0, partsTotal - discount);
  const totalProfit = Math.max(0, totalAmount - partsCost);

  // Auto-sync paid amount on initial load or if user hasn't modified it
  const handleSetFullPayment = () => {
    setPaidAmount(totalAmount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let customerName = 'عميل نقدي / عام';
    let customerPhone = '—';

    if (isNewCustomer) {
      customerName = customCustomerName.trim() || 'عميل نقدي / عام';
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
      saleType: 'direct',
      customerId: isNewCustomer ? undefined : selectedCustomerId,
      customerName,
      customerPhone,
      date,
      items,
      partsTotal,
      discount,
      totalAmount,
      totalCost: partsCost,
      profit: totalProfit,
      paidAmount: Math.min(totalAmount, paidAmount || totalAmount),
      paymentStatus: (paidAmount === 0 && totalAmount > 0) ? 'paid' : paymentStatus, // default to paid for direct walk-in
      notes,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">تسجيل بيع مباشر لقطع إلكترونية</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                بيع فوري لقطع الغيار والمكونات (بدون ارتباط بعملية صيانة جهاز) مع خصم فوري من المخزون
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
          {/* Customer & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  بيانات العميل
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(prev => !prev)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-semibold"
                >
                  {isNewCustomer ? 'اختر من قائمة العملاء المسجلين' : '+ عميل جديد / غير مسجل'}
                </button>
              </div>

              {isNewCustomer ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="اسم العميل (مثال: م. علي حسن)"
                    value={customCustomerName}
                    onChange={e => setCustomCustomerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="رقم الهاتف (اختياري)"
                    value={customCustomerPhone}
                    onChange={e => setCustomCustomerPhone(e.target.value)}
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
                      {c.name} {c.phone && c.phone !== '—' ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                تاريخ العملية
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Line Items (Spare Parts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                قائمة القطع والمكونات المباعة
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة قطعة أخرى
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const currentComp = components.find(c => c.id === item.componentId);
                const isOverStock = currentComp && item.quantity > currentComp.stock_quantity;

                return (
                  <div 
                    key={item.id} 
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-center gap-3"
                  >
                    {/* Component selector */}
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="text-[10px] text-slate-400 block mb-1">القطعة الإلكترونية من المستودع (بحث فوري بالرمز أو الاسم)</label>
                      <ComponentSearchSelect
                        components={components}
                        selectedComponentId={item.componentId}
                        onSelectComponent={comp => handleComponentChange(idx, comp.id)}
                        currency={currency}
                      />
                      {isOverStock && (
                        <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          تنبيه: الكمية المطلوبة أكبر من المتوفر بالمخزون ({currentComp?.stock_quantity})
                        </span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-full sm:w-24">
                      <label className="text-[10px] text-slate-400 block mb-1">الكمية</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-center rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-full sm:w-28">
                      <label className="text-[10px] text-slate-400 block mb-1">سعر البيع للقطعة</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={item.unitPrice}
                        onChange={e => handlePriceChange(idx, Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-emerald-400 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    {/* Total Price */}
                    <div className="w-full sm:w-28 text-left sm:text-right">
                      <label className="text-[10px] text-slate-400 block mb-1">الإجمالي</label>
                      <div className="text-xs font-black text-cyan-300 font-mono pt-1">
                        {item.totalPrice.toLocaleString()} {currency}
                      </div>
                    </div>

                    {/* Delete button */}
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
                        title="حذف القطعة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">خصم خاص (إن وُجد)</label>
              <input
                type="number"
                min="0"
                step="250"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">ملاحظات الفاتورة</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="مثال: تم فحص القطعة بالملتيميتر قبل التسليم"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Financial Engineering Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-3">
            <div className="text-xs font-bold text-cyan-400 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                ملخص الحسابات المالية والأرباح
              </span>
              <button
                type="button"
                onClick={handleSetFullPayment}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                دفع المبلغ بالكامل نقدياً ({totalAmount.toLocaleString()} {currency})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">إجمالي قطع الغيار</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">
                  {partsTotal.toLocaleString()} {currency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">تكلفة الشراء (المخزون)</div>
                <div className="text-sm font-bold text-slate-400 font-mono mt-0.5">
                  {partsCost.toLocaleString()} {currency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 font-semibold">المجموع بعد الخصم</div>
                <div className="text-sm font-black text-emerald-300 font-mono mt-0.5">
                  {totalAmount.toLocaleString()} {currency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400 font-semibold">صافي الربح المحقق</div>
                <div className="text-sm font-black text-cyan-300 font-mono mt-0.5">
                  +{totalProfit.toLocaleString()} {currency}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Button */}
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
              حفظ وطباعة الفاتورة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
