import React, { useEffect, useState } from 'react';

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('İŞLENİYOR LÜTFEN BEKLEYİNİZ.');

  useEffect(() => {
    const handleShow = (e: any) => {
      setIsLoading(true);
      if (e.detail?.message) setMessage(e.detail.message);
    };
    
    const handleHide = () => setIsLoading(false);

    window.addEventListener('show-loader', handleShow);
    window.addEventListener('hide-loader', handleHide);

    return () => {
      window.removeEventListener('show-loader', handleShow);
      window.removeEventListener('hide-loader', handleHide);
    };
  },[]);

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