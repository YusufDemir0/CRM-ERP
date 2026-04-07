import React, { useState } from 'react';
import { authAPI } from '../../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await authAPI.login({
        username: username,
        password: password
      });

      localStorage.setItem('erp_token', res.data.access_token);
      localStorage.setItem('erp_user', JSON.stringify(res.data.user));
      window.location.href = '/';

    } catch (err: any) {
      const msg = err.response?.data?.message || '';

      if (msg === 'INVALID_USERNAME') {
        setError('Lütfen "YETKİLİ" ile iletişime geçiniz.');
      } else if (msg === 'INVALID_PASSWORD') {
        setError('Hatalı şifre girişi yaptınız. Lütfen tekrar deneyiniz.');
      } else if (msg.includes('devre dışı')) {
        setError('Hesabınız pasif duruma alınmıştır. "YETKİLİ" ile görüşünüz.');
      } else {
        setError('Bağlantı veya sistem hatası oluştu.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <h2>ERMAY</h2>
          <p>Yönetim ve Takip Sistemi</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="KULLANICI ADI"
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ŞİFRE"
              required
              className="input"
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn">
            SİSTEME GİRİŞ YAP
          </button>
        </form>
      </div>
    </div>
  );
}