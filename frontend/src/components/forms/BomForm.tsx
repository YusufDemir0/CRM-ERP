import { useState, useEffect, useCallback, useMemo } from 'react';
import { bomsAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiPlus, FiBox } from 'react-icons/fi';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Item, Bom } from '../../types';
import { FormField } from '../common/FormField';
import { PremiumNumberInput } from '../common/PremiumNumberInput';
import { SearchableSelect } from '../common/SearchableSelect';

export interface BomItemData {
  itemId: string | number;
  quantity: number;
  description: string;
}

interface BomFormProps {
  initialData?: Partial<Bom>;
  editingId?: string | number | null;
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

  // Transform items for SearchableSelect
  const itemOptions = useMemo(() => 
    itemsList.map(i => ({
      id: i.id,
      label: `${i.code} - ${i.name.toUpperCase()}`,
      type: i.itemType?.name,
      name: i.name
    })),
    [itemsList]
  );

  // Filter for Target Product (Manufactured)
  const targetOptions = itemOptions;

  // Filter for Components (Consumed)
  // [RULE]: Cannot add target item to its own BOM.
  // [RULE]: Commercial Goods (Ticari Mal) cannot be components.
  const componentOptions = useMemo(() => 
    itemOptions.filter(o => {
      const isSelf = String(o.id) === String(formData.targetItemId);
      const originalItem = itemsList.find(i => String(i.id) === String(o.id));
      const isExcluded = originalItem?.itemType?.isExcludedFromBom;
      const isCommercial = originalItem?.itemType?.name?.toUpperCase().includes('TİCARİ');
      return !isSelf && !isExcluded && !isCommercial;
    }),
    [itemOptions, formData.targetItemId, itemsList]
  );

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
      targetItemId: formData.targetItemId ? String(formData.targetItemId) : undefined
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
      const usedIds = new Set(prev.items.map(i => String(i.itemId)));
      if (prev.targetItemId) usedIds.add(String(prev.targetItemId));

      const nextCandidate = componentOptions.find(o => !usedIds.has(String(o.id)));
      const finalItem = nextCandidate || componentOptions[0];

      if (!finalItem) {
        toast.error("Eklenebilir uygun ürün kalmadı.");
        return prev;
      }

      return {
        ...prev,
        items: [...prev.items, { itemId: String(finalItem.id), quantity: 1, description: '' }]
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
        <SearchableSelect 
          label="Hedef Ürün (Üretilecek)"
          placeholder="Üretilecek ürünü seçin..."
          options={targetOptions}
          value={formData.targetItemId}
          onChange={(opt) => {
            if (opt) {
              const targetId = String(opt.id);
              const selectedItem = itemsList.find(i => String(i.id) === targetId);
              setFormData(prev => ({ 
                ...prev, 
                targetItemId: targetId,
                name: selectedItem?.name ? selectedItem.name.toLocaleUpperCase('tr-TR') : prev.name,
                // 🔥 Eğer seçilen ürün bileşen listesinde varsa onu oradan kaldır
                items: prev.items.filter(i => String(i.itemId) !== targetId)
              }));
            } else {
              setFormData(prev => ({ ...prev, targetItemId: '' }));
            }
          }}
        />
        <FormField label="Reçete Adı" required>
          <input required className="input-premium uppercase-input font-black tracking-tight" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="ÖR: ÖZEL ÜRETİM REÇETESİ" />
        </FormField>
      </div>

      <FormField label="Genel Operasyonel Açıklama">
        <input className="input-premium uppercase-input font-medium h-12" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="..." />
      </FormField>

      <div className="mt-4 p-5 bg-[var(--primary-glow)] rounded-2xl border border-[var(--primary-glow)]">
        <div className="flex justify-between items-center mb-4 px-2">
          <label className="text-[var(--primary)] font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
            <FiBox /> Kullanılacak Bileşen Listesi
          </label>
          <button type="button" className="btn btn-primary btn-sm px-4 rounded-xl shadow-lg" onClick={addBomItem}>
            <FiPlus /> KALEM EKLE
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {formData.items.map((item, idx: number) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[3fr_1.5fr_2fr_auto] gap-4 items-end bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition-all hover:border-primary/20">
              <SearchableSelect 
                placeholder="Bileşen seç..."
                options={componentOptions}
                value={String(item.itemId)}
                onChange={(opt) => updateBomItem(idx, 'itemId', opt ? String(opt.id) : '')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Miktar</label>
                <PremiumNumberInput 
                  value={item.quantity} 
                  onChange={val => updateBomItem(idx, 'quantity', val)} 
                  min={0.0001}
                  className="h-12"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İşlem Notu</label>
                <input type="text" className="input-premium font-medium h-12 text-xs" value={item.description} onChange={e => updateBomItem(idx, 'description', e.target.value.toLocaleUpperCase('tr-TR'))} placeholder="..." />
              </div>
              <button type="button" className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--error)] bg-[var(--error-glow)] hover:bg-[var(--error)] hover:text-white transition-all shadow-sm" onClick={() => removeBomItem(idx)}>
                <FiX />
              </button>
            </div>
          ))}
        </div>

        {formData.items.length === 0 && (
          <div className="text-center text-slate-400 font-black uppercase tracking-widest text-[10px] py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
            <FiBox size={24} className="opacity-20" />
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
