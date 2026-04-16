import React from 'react';
import { useLoaderStore, selectIsLoading, selectMessage } from '../store/useLoaderStore';

const GlobalLoader: React.FC = () => {
  const visible = useLoaderStore(selectIsLoading);
  const message = useLoaderStore(selectMessage);

  if (!visible) return null;

  return (
    <div 
      id="global-loader"
      className="animate-in"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        color: 'white',
        fontWeight: 'bold'
      }}
    >
      <div 
        style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTop: '4px solid #ffcc00',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <div style={{ 
        textShadow: '0 2px 10px rgba(0,0,0,0.5)', 
        letterSpacing: '1px',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.5,
        fontSize: '13px'
      }}>
        {message}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoader;