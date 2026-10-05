import React, { useState } from 'react';
import { UtensilsCrossed, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import type { AdminUser } from '../services/types';

interface LoginViewProps {
  onSuccess: (user: AdminUser) => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('quantri@datdoan.vn');
  const [password, setPassword] = useState('123456');
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
        padding: '24px',
        background: 'radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.12) 0%, transparent 60%), #070a12',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 10px 25px rgba(249, 115, 22, 0.4)',
            }}
          >
            <UtensilsCrossed size={30} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Quản Trị Viên Food
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: 4 }}>
              Hệ thống quản lý sàn đặt đồ ăn Food (Admin Portal)
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label>Địa chỉ Email</label>
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
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
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
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: 46, fontSize: '0.95rem', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span>Đang kiểm tra quyền...</span>
            ) : (
              <>
                <span>Đăng nhập Quản Trị</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.78rem',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Chỉ tài khoản mang quyền <strong>ADMIN</strong> mới có thể truy cập phân hệ này.</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
            💡 Mẹo: Khi bạn đăng nhập tài khoản Admin tại ứng dụng Frontend, hệ thống sẽ tự động đăng nhập và đưa bạn vào thẳng trang quản trị này.
          </div>
        </div>
      </div>
    </div>
  );
}
