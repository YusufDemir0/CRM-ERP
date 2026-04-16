import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiArrowLeft } from 'react-icons/fi';

const UnauthorizedPage = () => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--on-surface)',
      color: 'white',
      textAlign: 'center',
      padding: '40px'
    }}>
      <div className="animate-in" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px',
        maxWidth: '500px'
      }}>
        <div style={{ 
          width: '120px', height: '120px', borderRadius: '40px', 
          background: 'var(--error-glow)', color: 'var(--error)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '60px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <FiShield />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.06em', margin: 0 }}>
            Erişim <span style={{ color: 'var(--error)' }}>Engellendi!</span>
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', fontWeight: 600, 
            lineHeight: '1.6', letterSpacing: '-0.02em'
          }}>
            Bu protokolü veya departmanı görüntülemek için gerekli yetki seviyesine sahip değilsiniz.
          </p>
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontWeight: 700,
          color: 'rgba(255,255,255,0.5)'
        }}>
          Lütfen sistem yöneticinizden yetkilerinizin (Capability Matrix) revize edilmesini talep edin.
        </div>

        <Link to="/" style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 32px',
          background: 'var(--primary)',
          color: 'white',
          borderRadius: '16px',
          textDecoration: 'none',
          fontWeight: 800,
          fontSize: '15px',
          boxShadow: '0 10px 30px var(--primary-glow)',
          transition: '0.2s'
        }}>
          <FiArrowLeft /> Dashboard'a Güvenli Dönüş Yap
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
