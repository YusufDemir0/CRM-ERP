import { memo, useMemo } from 'react';
import { Decimal } from 'decimal.js';
import { CartItem, Item } from '../../../types';

interface StockGroup {
  item: Item;
  details: {
    deptId: number;
    deptName: string;
    qty: string | number;
    itemCode: string;
  }[];
}

interface Props {
  cart: CartItem[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  searchResults: string[];
  groupedStocks: Record<string, StockGroup>;
  handleAddToCart: (group: StockGroup) => void;
  updateCartItem: (itemId: number, field: keyof CartItem, val: CartItem[keyof CartItem]) => void;
  removeCartItem: (itemId: number) => void;
  getStockAlert: (itemId: number, requestedQty: number) => { isOver: boolean; totalAvailable: number };
  selectedCurrencySymbol: string;
  onBack: () => void;
  onNext: () => void;
}

// FE-08: Memoized Cart Row to prevent Decimal reallocation and unnecessary re-renders
const CartRow = memo(({ 
  item: c, 
  selectedCurrencySymbol, 
  updateCartItem, 
  removeCartItem, 
  getStockAlert 
}: { 
  item: CartItem; 
  selectedCurrencySymbol: string;
  updateCartItem: (itemId: number, field: keyof CartItem, val: CartItem[keyof CartItem]) => void;
  removeCartItem: (itemId: number) => void;
  getStockAlert: (itemId: number, requestedQty: number) => { isOver: boolean; totalAvailable: number };
}) => {
  // FE-10: Memoize calculations per row
  const calculations = useMemo(() => {
    const price = new Decimal(c.price || 0);
    const discountValue = new Decimal(c.discountValue || 0);
    const qty = new Decimal(c.qty || 1);
    const kdvRate = new Decimal(c.kdvRate || 20);

    let netP = price;
    if (c.discountType === 'amount') {
      netP = price.sub(discountValue);
    } else if (c.discountType === 'percent') {
      const multiplier = new Decimal(1).sub(discountValue.div(100));
      netP = price.mul(multiplier);
    }

    const subtotal = qty.mul(netP);
    const kdv = subtotal.mul(kdvRate.div(100));
    const lineTotal = subtotal.add(kdv);
    return { 
      lineTotalStr: lineTotal.toFixed(2).replace('.', ','), 
      qtyNumber: qty.toNumber() 
    };
  }, [c.price, c.discountValue, c.qty, c.kdvRate, c.discountType]);

  const stockAlert = getStockAlert(c.item.id, calculations.qtyNumber);

  return (
    <tr className={`${stockAlert.isOver ? 'bg-danger/5' : 'hover:bg-slate-50/50'} transition-colors group`}>
      <td className="px-5 py-4">
        <div className="font-black text-slate-800 text-sm leading-tight mb-0.5">{c.item.name}</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">STOK: {c.maxQtyDesc}</span>
          {stockAlert.isOver && (
             <span className="bg-danger text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase animate-pulse">
                ⚠️ KRİTİK SEVİYE
             </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <input 
          type="number" 
          value={c.qty} 
          min={1} 
          className={`w-20 h-10 px-3 rounded-xl border-2 font-bold text-sm outline-none transition-colors ${
            stockAlert.isOver ? 'border-danger/30 bg-danger/5 text-danger' : 'border-slate-100 bg-slate-50/50 focus:border-primary/30 focus:bg-white'
          }`}
          onChange={(e) => updateCartItem(c.item.id, 'qty', e.target.value)} 
        />
      </td>
      <td className="px-5 py-4 text-slate-600 font-bold">
        <div className="relative group/input">
          <input 
            type="number" 
            step="0.01" 
            value={c.price} 
            className="w-24 h-10 px-3 pr-2 border-2 border-slate-100 bg-slate-50/50 rounded-xl font-bold text-sm outline-none focus:border-primary/30 focus:bg-white transition-colors"
            onChange={(e) => updateCartItem(c.item.id, 'price', e.target.value)} 
          />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex h-10 border-2 border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 focus-within:border-primary/30 focus-within:bg-white transition-colors max-w-[120px]">
          <input 
            type="number" 
            step="0.0001" 
            value={c.discountValue} 
            onChange={e => updateCartItem(c.item.id, 'discountValue', e.target.value)} 
            className="flex-1 px-3 bg-transparent outline-none text-slate-700 font-bold text-sm w-full"
            placeholder="0" 
          />
          <select 
            value={c.discountType} 
            onChange={e => updateCartItem(c.item.id, 'discountType', e.target.value)} 
            className="bg-slate-100/50 px-2 outline-none text-[10px] font-black cursor-pointer hover:bg-slate-200/50 transition-colors border-l border-slate-100"
          >
            <option value="amount">{selectedCurrencySymbol}</option>
            <option value="percent">%</option>
          </select>
        </div>
      </td>
      <td className="px-5 py-4">
         <div className="relative">
           <select 
             value={c.kdvRate} 
             onChange={e => updateCartItem(c.item.id, 'kdvRate', e.target.value)} 
             className="w-20 h-10 px-3 appearance-none rounded-xl border-2 border-slate-100 bg-slate-50/50 font-bold text-sm outline-none cursor-pointer hover:bg-slate-100/50 focus:border-primary/30 focus:bg-white transition-colors"
           >
             <option value="0">%0</option><option value="1">%1</option><option value="10">%10</option><option value="20">%20</option>
           </select>
           <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] opacity-20">▼</div>
         </div>
      </td>
      <td className="px-5 py-4 tabular-nums text-success font-black text-sm tracking-tighter">
        {calculations.lineTotalStr} {selectedCurrencySymbol}
      </td>
      <td className="px-5 py-4 text-right">
        <button 
          className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
          onClick={() => removeCartItem(c.item.id)}
        >
          ✕
        </button>
      </td>
    </tr>
  );
});

const Step3Cart: React.FC<Props> = memo(({
  cart, searchTerm, setSearchTerm, searchResults, groupedStocks,
  handleAddToCart, updateCartItem, removeCartItem, getStockAlert,
  selectedCurrencySymbol, onBack, onNext
}) => {
  return (
    <div className="wizard-step animate-in w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
        <div>
          <h3 className="text-primary text-2xl font-black tracking-tight mb-1">3. Ürün Listesi ve Sepet</h3>
          <p className="text-slate-500 text-sm font-medium">Satılacak ürünleri ekleyin ve fiyatları düzenleyin.</p>
        </div>
        {cart.length > 0 && (
          <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 backdrop-blur-sm">
            <span className="text-primary font-black text-sm uppercase tracking-tighter">Sepet: {cart.length} Kalem</span>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="bg-slate-50/50 p-1.5 rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto rounded-[1.8rem] bg-white">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">ÜRÜN BİLGİSİ</th>
                  <th className="px-5 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">ADET</th>
                  <th className="px-5 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">BİRİM FİYAT</th>
                  <th className="px-5 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">İNDİRİM</th>
                  <th className="px-5 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">KDV</th>
                  <th className="px-5 py-4 text-left font-black text-primary uppercase tracking-widest text-[10px]">SATIR TOPLAMI ({selectedCurrencySymbol})</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cart.map((c) => (
                  <CartRow 
                    key={c.item.id}
                    item={c}
                    selectedCurrencySymbol={selectedCurrencySymbol}
                    updateCartItem={updateCartItem}
                    removeCartItem={removeCartItem}
                    getStockAlert={getStockAlert}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="form-group relative group">
        <label className="text-slate-500 font-bold text-xs uppercase tracking-widest pl-1 mb-2">Ürün Arama (Stoktan)</label>
        <div className="relative">
          <input 
            type="text" 
            className="w-full h-15 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-colors outline-none text-slate-700 font-bold" 
            placeholder="Ürün ismi, kod veya kategori ile arayın..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl grayscale opacity-30 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-colors">🔍</div>
        </div>
      </div>

      <div className="max-h-[350px] overflow-y-auto border-2 border-slate-100 rounded-3xl bg-white shadow-xl shadow-slate-200/50 p-2 flex flex-col gap-1">
        {searchResults.map((itemName: string) => {
          const group = groupedStocks[itemName];
          if (!group) return null;
          return (
            <div key={group.item.id} className="p-4 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-colors group/result border border-transparent hover:border-slate-100">
              <div className="flex flex-col gap-1">
                <strong className="text-base text-slate-800 font-black tracking-tight group-hover/result:text-primary transition-colors">{itemName}</strong>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {group.details.map((d: { deptId: number; deptName: string; qty: string | number; itemCode: string }, i: number) => (
                    <span key={i} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-slate-500 hover:text-primary transition-colors">
                      {d.deptName}: <span className="text-slate-800 font-black tabular-nums">{d.qty}</span>
                    </span>
                  ))}
                </div>
              </div>
              <button 
                className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-6 h-10 rounded-xl font-black text-xs uppercase tracking-widest transition-colors active:scale-90 shadow-sm" 
                onClick={() => handleAddToCart(group)}
              >
                EKLE +
              </button>
            </div>
          )
        })}
        {searchResults.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
            <div className="text-5xl">📦</div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Aradığınız ürün şuan stoklarda yok.</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-4 pt-6">
        <button 
          className="flex-1 h-14 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-colors active:scale-95" 
          onClick={onBack}
        >
          GERİ DÖN
        </button>
        <button 
          className="flex-[2] h-14 bg-primary text-white text-base font-black shadow-lg shadow-primary/25 rounded-2xl disabled:opacity-30 disabled:shadow-none transition-colors active:scale-[0.98] flex items-center justify-center gap-2" 
          disabled={cart.length === 0} 
          onClick={onNext}
        >
          ÖDEME & SİPARİŞ ÖZETİ ➔
        </button>
      </div>
    </div>
  );
});

Step3Cart.displayName = 'Step3Cart';

export default Step3Cart;
