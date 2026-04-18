import { useState, useEffect, useCallback } from 'react';
import { bomsAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiPlus } from 'react-icons/fi';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Item, Bom } from '../../types';

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
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemId: Number(itemsList[0]?.id) || 0, quantity: 1, description: '' }]
    }));
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
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="login-form">
      <div className="grid grid-cols-[2fr_1.5fr] gap-4">
        <div className="form-group">
          <label>Reçete Adı (Zorunlu)</label>
          <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="ÖR: ÖZEL ÜRETİM REÇETESİ" />
        </div>
        <div className="form-group">
          <label>Hedef Ürün (Üretilecek)</label>
          <select className="uppercase-input" value={formData.targetItemId} onChange={e => setFormData({ ...formData, targetItemId: Number(e.target.value) })}>
            <option value="">Seçiniz</option>
            {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Açıklama</label>
        <input className="uppercase-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="..." />
      </div>

      <div className="mt-5 p-4 bg-[var(--surface-container-low)] rounded-xl border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <label className="text-[var(--primary)] font-extrabold">Kullanılacak Bileşenler</label>
          <button type="button" className="btn btn-primary btn-sm" onClick={addBomItem}>
            <FiPlus /> Kalem Ekle
          </button>
        </div>

        {formData.items.map((item, idx: number) => (
          <div key={idx} className="grid grid-cols-[2.5fr_1fr_1.5fr_auto] gap-2.5 mb-2.5 items-center">
            <select required className="uppercase-input h-10 text-xs" value={item.itemId} onChange={e => updateBomItem(idx, 'itemId', Number(e.target.value))}>
              <option value="">Ürün Seç</option>
              {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
            </select>
            <input type="number" required step="0.0001" className="uppercase-input tabular-nums h-10" value={item.quantity} onChange={e => updateBomItem(idx, 'quantity', Number(e.target.value))} placeholder="Mkt" />
            <input type="text" className="uppercase-input h-10 text-xs" value={item.description} onChange={e => updateBomItem(idx, 'description', e.target.value.toLocaleUpperCase('tr-TR'))} placeholder="Not..." />
            <button type="button" className="btn-icon circle text-[var(--error)] bg-[var(--error-glow)]" onClick={() => removeBomItem(idx)}>
              <FiX />
            </button>
          </div>
        ))}

        {formData.items.length === 0 && (
          <div className="text-center text-gray-500 py-2.5">Henüz bileşen eklenmedi.</div>
        )}
      </div>

      <div className="flex gap-4 mt-5">
        <button type="submit" className="btn btn-primary flex-1 h-[50px]">
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'REÇETEYİ KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-200 flex-[0.4] h-[50px]" onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
