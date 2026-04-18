import toast from 'react-hot-toast';


export const confirmDialog = (message: string, isDestructive: boolean = false): Promise<boolean> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{isDestructive ? '⚠️' : '❓'}</span>
          <span className="text-[0.95rem] font-semibold text-gray-800 leading-snug">{message}</span>
        </div>
        <div className="flex gap-2.5 justify-end mt-2.5">
          <button 
            className="btn py-2 px-4 bg-gray-100 text-gray-700 text-[0.85rem] rounded-lg hover:bg-gray-200 transition-colors" 
            onClick={() => { toast.dismiss(t.id); resolve(false); }}
          >
            Vazgeç
          </button>
          <button 
            className={`btn btn-primary py-2 px-4 text-white text-[0.85rem] rounded-lg transition-colors ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--primary)] hover:opacity-90'}`}
            onClick={() => { toast.dismiss(t.id); resolve(true); }}
          >
            Onayla ve Devam Et
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity, 
      position: 'top-center', 
      style: { 
        minWidth: '350px', 
        maxWidth: '500px', 
        padding: '20px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)' 
      } 
    });
  });
};
