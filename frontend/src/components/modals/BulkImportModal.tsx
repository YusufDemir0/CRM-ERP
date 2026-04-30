import React, { useState } from 'react';
import { FiX, FiUploadCloud, FiDownload, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { itemsAPI } from '../../services/api';

interface BulkImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ imported: number; updated: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    // In a real app, this would be a static file or an API call
    // For now, we'll simulate the header structure
    const headers = "ÜRÜN_KODU,ÜRÜN_ADI,BİRİM,SATIŞ_FİYATI,ALIŞ_FİYATI,STOK_MİKTARI,KDV_ORANI\n";
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "urun_yukleme_sablonu.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Lütfen bir dosya seçin.");
      return;
    }

    setIsUploading(true);
    try {
      // Basic CSV Parser (for demo, real one should use a library or handle Excel)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const items = [];
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length < 2 || !cols[0]) continue;
          
          items.push({
            code: cols[0].trim(),
            name: cols[1].trim(),
            unit: cols[2]?.trim() || 'ADET',
            salePrice: Number(cols[3]) || 0,
            purchasePrice: Number(cols[4]) || 0,
            initialStock: Number(cols[5]) || 0,
            taxRate: Number(cols[6]) || 20
          });
        }

        if (items.length === 0) {
          toast.error("Dosyada geçerli veri bulunamadı.");
          setIsUploading(false);
          return;
        }

        const res = await itemsAPI.import(items);
        setResults(res.data);
        toast.success("Yükleme işlemi tamamlandı.");
        onSuccess();
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      toast.error("Yükleme sırasında bir hata oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Toplu Ürün Aktarımı</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Excel veya CSV ile veri yönetimi</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white text-slate-400 rounded-2xl hover:text-rose-500 transition-all shadow-sm">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-8">
          {!results ? (
            <div className="flex flex-col gap-6">
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-primary text-sm uppercase tracking-wider">Şablon Dosyası</h4>
                  <p className="text-xs text-slate-500 font-medium">Hatalı yükleme yapmamak için önce şablonu indirin.</p>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="btn btn-primary btn-sm px-6 rounded-xl"
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
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Max: 10MB (.CSV, .XLSX)</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                  className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-primary/20"
                >
                  {isUploading ? <><FiLoader className="animate-spin" /> YÜKLENİYOR...</> : 'VERİLERİ İŞLE VE AKTAR'}
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
                  <div className="max-h-32 overflow-y-auto text-[11px] font-bold text-rose-600 space-y-1 custom-scrollbar">
                    {results.errors.map((err, i) => <div key={i}>• {err}</div>)}
                  </div>
                </div>
              )}

              <button onClick={onClose} className="btn bg-slate-100 text-slate-500 w-full mt-8 rounded-2xl h-14 font-black">
                PENCEREYİ KAPAT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
