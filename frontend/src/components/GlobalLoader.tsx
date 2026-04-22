import React, { useEffect } from 'react';
import { useLoaderStore, selectIsLoading, selectMessage } from '../store/useLoaderStore';

interface GlobalLoaderProps {
  mode?: 'render' | 'trigger';
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ mode = 'render', message: propMessage }) => {
  const show = useLoaderStore(s => s.show);
  const hide = useLoaderStore(s => s.hide);

  useEffect(() => {
    if (mode === 'trigger') {
      show(propMessage);
      return () => hide();
    }
  }, [mode, propMessage, show, hide]);

  const visible = useLoaderStore(selectIsLoading);
  const storeMessage = useLoaderStore(selectMessage);

  if (mode === 'trigger') return null;
  if (!visible) return null;

  const message = propMessage || storeMessage || 'İŞLEM YAPILIYOR...';

  return (
    <div 
      id="global-loader"
      className="fixed inset-0 bg-black/60 z-[99999] flex flex-col items-center justify-center gap-5 text-white font-bold animate-fade-in"
    >
      <div className="w-12 h-12 border-4 border-white/10 border-t-amber-400 rounded-full animate-spin" />
      <div className="text-center max-w-[400px] leading-relaxed text-[13px] tracking-wide drop-shadow-lg">
        {message}
      </div>
    </div>
  );
};

export default GlobalLoader;