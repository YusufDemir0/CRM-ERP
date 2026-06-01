import React, { useState, useEffect } from 'react';
import { FiX, FiUploadCloud, FiDownload, FiCheckCircle, FiAlertCircle, FiLoader, FiList, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { itemsAPI, currenciesAPI } from '../../services/api';
import { ItemCodeGroup, Currency, ItemType, QuantityType, Item } from '../../types';

interface BulkImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ imported: number; updated: number; errors: string[] } | null>(null);
  
  // Reference States
  const [codeGroups, setCodeGroups] = useState<ItemCodeGroup[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [cgRes, curRes, typeRes, qtyRes] = await Promise.all([
          itemsAPI.getCodeGroups(),
          currenciesAPI.getAll({ limit: 100 }),
          itemsAPI.getTypes(),
          itemsAPI.getQuantityTypes()
        ]);
        setCodeGroups(cgRes.data || []);
        // Handle pagination data
        setCurrencies(curRes.data?.data || curRes.data || []);
        setItemTypes(typeRes.data || []);
        setQuantityTypes(qtyRes.data || []);
      } catch (err) {
        console.error("Referans veriler yüklenirken hata oluştu:", err);
        toast.error("Referans listeler yüklenemedi, ancak aktarım yapmayı deneyebilirsiniz.");
      } finally {
        setLoadingRefs(false);
      }
    };
    fetchReferences();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await itemsAPI.downloadImportTemplate();
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "urun_toplu_aktarim_sablonu.xlsx");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel (.xlsx) şablonu indirildi.");
    } catch (err) {
      console.error(err);
      toast.error("Şablon indirilirken bir hata oluştu.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Lütfen bir dosya seçin.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await itemsAPI.importExcel(formData);
      setResults({
        imported: res.data.insertedCount || 0,
        updated: res.data.updatedCount || 0,
        errors: res.data.errors || []
      });

      if ((res.data.errors || []).length > 0) {
        toast.error("İçe aktarım tamamlandı ancak bazı uyarılar/hatalar oluştu.");
      } else {
        toast.success("Yükleme işlemi başarıyla tamamlandı.");
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Yükleme sırasında bir hata oluştu.";
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Upload & Results */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Header */}
          <div className="pb-6 border-b border-slate-100 flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Toplu Ürün Aktarımı</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Excel veya CSV ile veri yönetimi</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl hover:text-rose-500 transition-all shadow-sm">
              <FiX size={24} />
            </button>
          </div>

          {!results ? (
            <div className="flex flex-col gap-6">
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-primary text-sm uppercase tracking-wider">Şablon Dosyası</h4>
                  <p className="text-xs text-slate-500 font-medium">Hatalı yükleme yapmamak için yeni formatta şablonu indirin.</p>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="btn btn-primary btn-sm px-6 rounded-xl flex items-center gap-2"
                >
                  <FiDownload /> İNDİR
                </button>
              </div>

              <div 
                className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-primary/40'}`}
              >
                <input 
                  type="file" 
                  id="bulk-file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".csv,.xlsx"
                />
                <label htmlFor="bulk-file" className="cursor-pointer flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl ${file ? 'bg-emerald-500 text-white' : 'bg-white text-primary'}`}>
                    <FiUploadCloud size={32} />
                  </div>
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tight">
                    {file ? file.name : 'Dosyayı Sürükleyin veya Seçin'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Max: 10MB (.XLSX)</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                  className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-primary/20 h-14"
                >
                  {isUploading ? <><FiLoader className="animate-spin mr-2" /> YÜKLENİYOR...</> : 'VERİLERİ İŞLE VE AKTAR'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-6 animate-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <FiCheckCircle size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">İŞLEM BAŞARIYLA TAMAMLANDI</h3>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">YENİ ÜRÜN</span>
                  <span className="text-2xl font-black text-slate-800">{results.imported}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">GÜNCELLENEN</span>
                  <span className="text-2xl font-black text-slate-800">{results.updated}</span>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="w-full mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-left">
                  <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest mb-2">
                    <FiAlertCircle /> Bazı Hatalar Oluştu ({results.errors.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto text-[11px] font-bold text-rose-600 space-y-1 custom-scrollbar">
                    {results.errors.map((err, i) => <div key={i}>• {err}</div>)}
                  </div>
                </div>
              )}

              <button onClick={onClose} className="btn bg-slate-100 hover:bg-slate-200 text-slate-500 w-full mt-8 rounded-2xl h-14 font-black">
                PENCEREYİ KAPAT
              </button>
            </div>
          )}
        </div>

        {/* Right Side: References Sidebar */}
        <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-8 overflow-y-auto max-h-[50vh] md:max-h-none flex flex-col gap-6 custom-scrollbar">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FiList className="text-primary" /> Referans Kod & Türler
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Excel dosyasında kullanabileceğiniz değerler</p>
          </div>

          {loadingRefs ? (
            <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
              <FiLoader className="animate-spin text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Kod Grupları */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mevcut Kod Grupları</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {codeGroups.map(cg => (
                    <div key={cg.id} className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">{cg.prefix}</span>
                      <span className="text-xs font-bold text-slate-600 truncate flex-1 text-right ml-2">{cg.name}</span>
                    </div>
                  ))}
                  {codeGroups.length === 0 && (
                    <span className="text-xs font-bold text-slate-400 italic">Kod grubu tanımlanmamış.</span>
                  )}
                </div>
              </div>

              {/* Ürün Türleri */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ürün Türleri</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {itemTypes.map(it => (
                    <div key={it.id} className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <span className="text-xs font-black text-slate-600">{it.name}</span>
                      {it.abbreviation && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{it.abbreviation}</span>
                      )}
                    </div>
                  ))}
                  {itemTypes.length === 0 && (
                    <span className="text-xs font-bold text-slate-400 italic">Ürün tipi tanımlanmamış.</span>
                  )}
                </div>
              </div>

              {/* Para Birimleri */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Para Birimleri</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {currencies.map(c => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FiDollarSign size={10} /> {c.code}
                      </span>
                      <span className="text-xs font-bold text-slate-600 truncate flex-1 text-right ml-2">{c.name}</span>
                    </div>
                  ))}
                  {currencies.length === 0 && (
                    <span className="text-xs font-bold text-slate-400 italic">Para birimi tanımlanmamış.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
