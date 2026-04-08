import React, { useState } from 'react';
import { authAPI } from '../../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const showLoader = (message?: string) => {
    window.dispatchEvent(
      new CustomEvent('show-loader', {
        detail: { message: message || 'GİRİŞ YAPILIYOR...' }
      })
    );
  };

  const hideLoader = () => {
    window.dispatchEvent(new Event('hide-loader'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    showLoader('GİRİŞ YAPILIYOR...');

    try {
      const res = await authAPI.login({
        username: username,
        password: password
      });

      localStorage.setItem('erp_token', res.data.access_token);
      localStorage.setItem('erp_user', JSON.stringify(res.data.user));

      window.location.href = '/';

    } catch (err: any) {

  let msg = err.response?.data?.message;

  // Array ise ilk elemanı al
  if (Array.isArray(msg)) {
    msg = msg[0];
  }

  // Object ise stringify et
  if (typeof msg === 'object' && msg !== null) {
    msg = JSON.stringify(msg);
  }

  // Hala string değilse fallback
  if (typeof msg !== 'string') {
    msg = '';
  }

  // Artık güvenli
  if (msg === 'INVALID_USERNAME') {
    setError('Böyle bir kullanıcı bulunmamaktadır. Lütfen "YETKİLİ" ile iletişime geçiniz.');
  } 
  else if (msg === 'INVALID_PASSWORD') {
    setError('Hatalı şifre girişi yaptınız. Lütfen tekrar deneyiniz.');
  } 
  else if (msg.toLowerCase().includes('devre dışı')) {
    setError('Hesabınız pasif duruma alınmıştır.');
  } 
  else {
    setError('Kullanıcı adı veya şifre hatalı.');
  }

}
  };

  return (
  <div className="login-page">

    <div className="login-card">

      <div className="login-header">
        <h1 className="logo">ERMAY</h1>
        <p className="subtitle">
          Yönetim ve Takip Sistemi
        </p>
      </div>

      {error && (
        <div className="login-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="login-form">

        <div className="input-group">
          <label>Kullanıcı Adı</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adı giriniz"
          />
        </div>

        <div className="input-group">
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre giriniz"
          />
        </div>

        <button
          type="submit"
          className="login-button"
        >
          Giriş Yap
        </button>

      </form>

      <div className="login-footer">
        ERP Yönetim Paneli
      </div>

    </div>

  </div>
);
}