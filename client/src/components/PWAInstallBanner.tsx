import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { X, Download } from 'lucide-react';

const SESSION_KEY = 'revisio_pwa_banner_dismissed';
const AUTO_DISMISS_MS = 8000;

export function PWAInstallBanner() {
  const { canInstall, triggerInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [canInstall]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible]);

  const dismiss = () => {
    setExiting(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
    setTimeout(() => setVisible(false), 350);
  };

  const handleInstall = async () => {
    const accepted = await triggerInstall();
    if (accepted) dismiss();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        padding: '10px 16px 0',
        pointerEvents: 'none',
      }}
    >
      <div
        role="banner"
        aria-label="Install Revisio app"
        style={{
          pointerEvents: 'all',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 10px 8px 14px',
          borderRadius: '999px',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(99, 179, 237, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)',
          animation: exiting
            ? 'pwa-out 0.35s ease-in forwards'
            : 'pwa-in 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
          maxWidth: '360px',
          width: '100%',
        }}
      >
        {/* Text */}
        <span
          style={{
            flex: 1,
            fontSize: '12.5px',
            fontWeight: 500,
            color: '#cbd5e1',
            fontFamily: 'Montserrat, sans-serif',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#f8fafc', fontWeight: 700 }}>Install Revisio</span>
          <span style={{ color: '#475569', margin: '0 6px' }}>·</span>
          Add to home screen
        </span>

        {/* Install button */}
        <button
          id="pwa-install-btn"
          onClick={handleInstall}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 11px',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            fontSize: '11.5px',
            fontWeight: 600,
            fontFamily: 'Montserrat, sans-serif',
            transition: 'opacity 0.15s',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Download size={11} strokeWidth={2.5} />
          Install
        </button>

        {/* Dismiss */}
        <button
          id="pwa-banner-dismiss"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      <style>{`
        @keyframes pwa-in {
          from { opacity: 0; transform: translateY(-120%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pwa-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-120%); }
        }
      `}</style>
    </div>
  );
}
