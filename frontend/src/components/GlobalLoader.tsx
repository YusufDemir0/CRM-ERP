import React, { useEffect, useState, useRef } from 'react';

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(
    'İŞLEM YAPILIYOR. LÜTFEN KLAVYE MOUSE İLE TIKLAMA YAPMAYINIZ.'
  );

  // Loader'ın açıldığı zamanı tut
  const startTimeRef = useRef<number>(0);

  // Minimum gösterim süresi (ms)
  const MIN_DURATION = 3000;

  useEffect(() => {
    const handleShow = (e: any) => {
      startTimeRef.current = Date.now();
      setIsLoading(true);

      if (e.detail?.message) {
        setMessage(e.detail.message);
      }
    };

    const handleHide = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = MIN_DURATION - elapsed;

      if (remaining > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      } else {
        setIsLoading(false);
      }
    };

    window.addEventListener('show-loader', handleShow);
    window.addEventListener('hide-loader', handleHide);

    return () => {
      window.removeEventListener('show-loader', handleShow);
      window.removeEventListener('hide-loader', handleHide);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="spinner"></div>
        <h3>{message}</h3>
      </div>
    </div>
  );
}