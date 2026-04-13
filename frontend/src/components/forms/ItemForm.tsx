import React, { useState, useEffect } from 'react';
import { itemsAPI, currenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';

interface ItemFormProps {
  initialData?: any;
  editingId?: number | null;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [itemCodeGroups, setItemCodeGroups] = useState<any[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState(initialData || {
    name: '',
    itemTypeId: '',
    itemCodeGroupId: '',
    criticalLimit: 0,
    purchasePrice: 0,
    salePrice: 0,
    currencyId: '',
    quantityTypeId: '',
    kdv: 20 as number | string,
    image: '',
    description: '',
    notes: ''
  });

  const [customKdv, setCustomKdv] = useState<number | null>(
    [0, 1, 10, 20].includes(Number(formData.kdv)) ? null : Number(formData.kdv)
  );

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [types, groups, qtys, curs] = await Promise.all([
          itemsAPI.getTypes(),
          itemsAPI.getCodeGroups(),
          itemsAPI.getQuantityTypes(),
          currenciesAPI.getAll()
        ]);
        setItemTypes(types.data);
        setItemCodeGroups(groups.data);
        setQuantityTypes(qtys.data);
        setCurrencies(curs.data);

        if (!formData.currencyId) {
          const def = curs.data.find((c: any) => c.isDefault === 1);
          if (def) setFormData((p: any) => ({ ...p, currencyId: String(def.id) }));
        }
      } catch (error) {
        console.error("Dependency loading failed", error);
      }
    };
    loadDependencies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      itemTypeId: Number(formData.itemTypeId),
      itemCodeGroupId: Number(formData.itemCodeGroupId),
      kdv: formData.kdv === 'custom' ? Number(customKdv) : Number(formData.kdv),
      currencyId: Number(formData.currencyId),
      quantityTypeId: Number(formData.quantityTypeId),
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      criticalLimit: Number(formData.criticalLimit)
    };

    try {
      if (editingId) {
        const res = await itemsAPI.update(editingId, payload);
        onSuccess(res.data);
      } else {
        const res = await itemsAPI.create(payload);
        onSuccess(res.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "İşlem başarısız");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Ürün Türü</label>
          <select required value={formData.itemTypeId} onChange={e => setFormData({ ...formData, itemTypeId: e.target.value })}>
            <option value="">Seçiniz</option>
            {itemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Ürün Adı</label>
          <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toLocaleUpperCase('tr-TR').replace(/[0-9]/g, '') })} />
        </div>
        <div className="form-group">
          <label>Kod Grubu</label>
          <select required value={formData.itemCodeGroupId} onChange={e => setFormData({ ...formData, itemCodeGroupId: e.target.value })}>
            <option value="">Seçiniz</option>
            {itemCodeGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.prefix})</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Alış Fiyatı</label>
          <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Satış Fiyatı</label>
          <input type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Döviz</label>
          <select required value={formData.currencyId} onChange={e => setFormData({ ...formData, currencyId: e.target.value })}>
            <option value="">Seçiniz</option>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px' }}>
        <div className="form-group">
          <label>Birim</label>
          <select required value={formData.quantityTypeId} onChange={e => setFormData({ ...formData, quantityTypeId: e.target.value })}>
            <option value="">Seçiniz</option>
            {quantityTypes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>KDV (%)</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <select style={{ flex: 1 }} value={formData.kdv} onChange={e => {
              const val = e.target.value;
              setFormData({ ...formData, kdv: val });
              if (val !== 'custom') setCustomKdv(null);
            }}>
              <option value={0}>%0</option><option value={1}>%1</option><option value={10}>%10</option><option value={20}>%20</option>
              <option value="custom">Özel</option>
            </select>
            {formData.kdv === 'custom' && (
              <input type="number" style={{ width: '60px' }} value={customKdv || ''} onChange={e => setCustomKdv(Number(e.target.value))} placeholder="%" />
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Kritik Limit</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-container-low)', padding: '5px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-icon" onClick={() => setFormData((p: any) => ({ ...p, criticalLimit: Math.max(0, Number(p.criticalLimit) - 10) }))}>-10</button>
            <input type="number" className="uppercase-input tabular-nums" style={{ flex: 1, textAlign: 'center', margin: 0, border: 'none', background: 'transparent', fontWeight: 800 }} value={formData.criticalLimit} onChange={e => setFormData({ ...formData, criticalLimit: e.target.value })} />
            <button type="button" className="btn btn-icon" onClick={() => setFormData((p: any) => ({ ...p, criticalLimit: Number(p.criticalLimit) + 10 }))}>+10</button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Görsel URL</label>
        <input type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'ÜRÜNÜ KAYDET'}
        </button>
        <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
