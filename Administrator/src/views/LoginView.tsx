import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '../services/api';
import type { AdminUser } from '../services/types';

interface LoginViewProps {
  onSuccess: (user: AdminUser) => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await authApi.login(email.trim(), password);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: 'radial-gradient(circle at 50% 20%, rgba(234, 88, 12, 0.15) 0%, transparent 60%), #0b0f19',
        fontFamily: 'inherit',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          background: 'rgba(19, 25, 38, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: 24,
        }}
      >
        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 10px 25px rgba(249, 115, 22, 0.45)',
            }}
          >
            <UtensilsCrossed size={30} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Cổng Quản Trị & Nhà Hàng
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: 4 }}>
              Hệ thống Kênh Đối Tác Quán Ăn & Quản Trị Sàn Food
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>Địa chỉ Email</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={17}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="email"
                placeholder="Nhập email tài khoản..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  paddingLeft: 42,
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingLeft: 42,
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              height: 48,
              fontSize: '0.98rem',
              marginTop: 6,
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              borderColor: '#ea580c',
              boxShadow: '0 8px 20px rgba(234, 88, 12, 0.35)',
            }}
            disabled={loading}
          >
            {loading ? (
              <span>Đang kiểm tra thông tin...</span>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
