import { useState, useEffect, useCallback } from 'react';
import { bomsAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiPlus } from 'react-icons/fi';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Item, Bom } from '../../types';
import { FormField } from '../common/FormField';
import { PremiumNumberInput } from '../common/PremiumNumberInput';

export interface BomItemData {
  itemId: number;
  quantity: number;
  description: string;
}

interface BomFormProps {
  initialData?: Partial<Bom>;
  editingId?: number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

export const BomForm: React.FC<BomFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `bom_edit_${editingId}` : 'bom_create';

  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [formData, setFormData] = useState(() => {
    const cached = getCache(cacheKey) as { name: string, targetItemId: string | number, description: string, items: BomItemData[] } | null;
    return cached || {
      name: initialData?.name || '',
      targetItemId: initialData?.targetItemId || '',
      description: initialData?.description || '',
      items: (initialData?.items?.map(i => ({ itemId: i.itemId, quantity: Number(i.quantity), description: i.description })) || []) as BomItemData[]
    };
  });

  // Caching strategy: Update only on blur or unmount to prevent re-render loops
  const saveDraft = useCallback(() => {
    updateCache(cacheKey, formData);
  }, [formData, cacheKey, updateCache]);

  useEffect(() => {
    const controller = new AbortController();
    itemsAPI.getAll({ limit: 1000, state: 1 }, { signal: controller.signal })
      .then(res => setItemsList(res.data.data))
      .catch(err => {
        if (err instanceof Error && err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error("Failed to load items for BOM", err);
        }
      });
    return () => controller.abort();
  }, []);

  // Form kapandığında (unmount) taslağı temizle (X, Esc, İptal hepsini kapsar)
  useEffect(() => {
    return () => {
      if (!editingId) {
        clearCache('bom_create');
      } else {
        clearCache(`bom_edit_${editingId}`);
      }
    };
  }, [editingId, clearCache]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error("Reçeteye en az 1 hammadde / bileşen eklemelisiniz.");
      return;
    }
    const payload = {
      ...formData,
      targetItemId: formData.targetItemId ? Number(formData.targetItemId) : undefined
    };
    try {
      if (editingId) {
        const res = await bomsAPI.update(editingId, payload as Partial<Bom>);
        clearCache(cacheKey);
        onSuccess(res.data);
      } else {
        const res = await bomsAPI.create(payload as Partial<Bom>);
        clearCache(cacheKey);
        onSuccess(res.data);
      }
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const addBomItem = () => {
    setFormData((prev) => {
      // 1. Mevcut ekli kalemlerin ID'lerini topla (Tip güvenliği için Number zorlamasıyla)
      const usedIds = new Set(prev.items.map(i => Number(i.itemId)));
      
      // 2. Eğer bir hedef ürün (üretilen ürün) seçiliyse onu da öneriler arasından çıkar
      if (prev.targetItemId) {
        usedIds.add(Number(prev.targetItemId));
      }

      // 3. Henüz eklenmemiş ilk ürünü bul
      const nextCandidate = itemsList.find(i => !usedIds.has(Number(i.id)));
      
      // 4. Eğer hepsi eklenmişse mecburen listenin ilkini al (Fallback)
      const finalItem = nextCandidate || itemsList[0];

      // 5. Eğer ürün listesi henüz yüklenmemişse (veya boşsa) state'i değiştirme
      if (!finalItem) return prev;

      return {
        ...prev,
        items: [
          ...prev.items, 
          { 
            itemId: Number(finalItem.id), 
            quantity: 1, 
            description: '' 
          }
        ]
      };
    });
  };

  const removeBomItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i: number) => i !== index)
    }));
  };

  const updateBomItem = (index: number, field: keyof BomItemData, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value } as BomItemData;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in pb-4">
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-5">
        <FormField label="Hedef Ürün (Üretilecek)" required>
          <select 
            required 
            className="input-premium font-black" 
            value={formData.targetItemId} 
            onChange={e => {
              const val = Number(e.target.value);
              const selectedItem = itemsList.find(i => Number(i.id) === val);
              setFormData(prev => ({ 
                ...prev, 
                targetItemId: val,
                name: selectedItem ? selectedItem.name.toLocaleUpperCase('tr-TR') : prev.name
              }));
            }}
          >
            <option value="">Seçiniz...</option>
            {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name.toUpperCase()}</option>)}
          </select>
        </FormField>
        <FormField label="Reçete Adı" required>
          <input required className="input-premium uppercase-input font-black tracking-tight" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="ÖR: ÖZEL ÜRETİM REÇETESİ" />
        </FormField>
      </div>

      <FormField label="Genel Operasyonel Açıklama">
        <input className="input-premium uppercase-input font-medium h-12" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="..." />
      </FormField>

      <div className="mt-4 p-5 bg-[var(--primary-glow)] rounded-2xl border border-[var(--primary-glow)]">
        <div className="flex justify-between items-center mb-4 px-2">
          <label className="text-[var(--primary)] font-black uppercase tracking-widest text-[10px]">Kullanılacak Bileşen Listesi</label>
          <button type="button" className="btn btn-primary btn-sm px-4 rounded-xl shadow-lg" onClick={addBomItem}>
            <FiPlus /> KALEM EKLE
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {formData.items.map((item, idx: number) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[2.5fr_1.5fr_2fr_auto] gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <select required className="input-premium font-black text-xs h-10" value={item.itemId} onChange={e => updateBomItem(idx, 'itemId', Number(e.target.value))}>
                <option value="">Ürün Seç...</option>
                {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name.toUpperCase()}</option>)}
              </select>
              <PremiumNumberInput 
                value={item.quantity} 
                onChange={val => updateBomItem(idx, 'quantity', val)} 
                min={0.0001}
                className="h-12"
              />
              <input type="text" className="input-premium font-medium h-10 text-xs" value={item.description} onChange={e => updateBomItem(idx, 'description', e.target.value.toLocaleUpperCase('tr-TR'))} placeholder="İşlem notu..." />
              <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--error)] bg-[var(--error-glow)] hover:bg-[var(--error)] hover:text-white transition-all" onClick={() => removeBomItem(idx)}>
                <FiX />
              </button>
            </div>
          ))}
        </div>

        {formData.items.length === 0 && (
          <div className="text-center text-slate-400 font-black uppercase tracking-widest text-[10px] py-6 bg-white/50 rounded-2xl border border-dashed border-slate-200">
            Henüz bir bileşen tanımlanmadı.
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-slate-100">
        <button type="submit" className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]">
          <FiCheck size={20} /> {editingId ? 'GÜNCELLEMELERİ KAYDET' : 'REÇETEYİ SİSTEME KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all" onClick={() => { clearCache(cacheKey); onCancel(); }}>
          İPTAL
        </button>
      </div>
    </form>
  );
};
