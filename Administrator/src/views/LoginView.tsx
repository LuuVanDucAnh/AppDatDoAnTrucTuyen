import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Store,
  Sparkles,
  Check,
} from 'lucide-react';
import { authApi } from '../services/api';
import type { AdminUser } from '../services/types';

interface LoginViewProps {
  onSuccess: (user: AdminUser) => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('owner1@datdoan.vn');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'RESTAURANT_OWNER',
      name: 'Chủ Quán Cơm Tấm (Ba Ghiền)',
      email: 'owner1@datdoan.vn',
      icon: '🍛',
      desc: 'Quản lý 2 nhà hàng, thực đơn, đơn hàng trực tuyến',
    },
    {
      role: 'RESTAURANT_OWNER',
      name: 'Chủ Quán KOI Thé & Popeyes',
      email: 'owner2@datdoan.vn',
      icon: '🧋',
      desc: 'Quản lý trà sữa, gà rán, theo dõi doanh thu',
    },
    {
      role: 'ADMIN',
      name: 'Quản Trị Viên Toàn Hệ Thống',
      email: 'admin@datdoan.vn',
      icon: '👑',
      desc: 'Kiểm soát toàn sàn, đối soát tài chính, người dùng',
    },
  ];

  const handleSelectDemo = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('123456');
    setError(null);
  };

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
          maxWidth: '480px',
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

        {/* Quick Demo Account Selector */}
        <div>
          <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>
            TÀI KHOẢN MẪU ĐĂNG NHẬP NHANH (MẬT KHẨU: 123456)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {demoAccounts.map((acc) => {
              const isSelected = email.toLowerCase() === acc.email.toLowerCase();
              return (
                <div
                  key={acc.email}
                  onClick={() => handleSelectDemo(acc.email)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid rgba(249, 115, 22, 0.6)' : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>{acc.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#fb923c' : '#f1f5f9' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="#fb923c" />}
                </div>
              );
            })}
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
                placeholder="chuan@datdoan.vn"
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

        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
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
            <span style={{ color: '#cbd5e1' }}>
              Hỗ trợ cả <strong>Chủ Nhà Hàng (RESTAURANT_OWNER)</strong> và <strong>Quản Trị Viên (ADMIN)</strong>.
            </span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
            💡 Hệ thống tự động chuyển vào đúng phân hệ: Kênh Đối Tác Quán Ăn hoặc Cổng Super Admin.
          </div>
        </div>
      </div>
    </div>
  );
}
