import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FiEye, FiEyeOff, FiPhone, FiAlertCircle } from 'react-icons/fi';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorType, setErrorType] = useState<'password' | 'general' | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorType(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || '';
      if (message === 'INVALID_PASSWORD') {
        setErrorType('password');
      } else {
        setErrorType('general');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>Ermay ERP</h1>
          <p>Kurumsal Kaynak Planlama Sistemi</p>
        </div>

        {errorType === 'password' && (
          <div className="login-error login-error--password">
            <div className="login-error-icon">
              <FiAlertCircle />
            </div>
            <div className="login-error-content">
              <p className="login-error-title">Şifreniz yanlış</p>
              <p className="login-error-desc">
                Sıfırlamak isterseniz yetkiliyle iletişime geçin.
              </p>
              <a
                href={`tel:${settings.authorizedPhone.replace(/\s/g, '')}`}
                className="login-error-phone"
              >
                <FiPhone />
                <span>{settings.authorizedPhone}</span>
              </a>
            </div>
          </div>
        )}

        {errorType === 'general' && (
          <div className="login-error login-error--general">
            <div className="login-error-icon">
              <FiAlertCircle />
            </div>
            <div className="login-error-content">
              <p className="login-error-title">Girdiğiniz bilgiler yanlış.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Kullanıcı Adı</label>
            <input
              id="login-username"
              className="form-input form-input--lg"
              type="text"
              placeholder="Kullanıcı adınızı girin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Şifre</label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                className="form-input form-input--lg"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" />
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
