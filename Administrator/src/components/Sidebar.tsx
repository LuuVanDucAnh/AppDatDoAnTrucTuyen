import React from 'react';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  CreditCard,
  Star,
  Settings,
  Flame,
  Activity,
  LogOut,
} from 'lucide-react';
import type { AdminUser } from '../services/types';

export type NavTab =
  | 'dashboard'
  | 'users'
  | 'restaurants'
  | 'orders'
  | 'payments'
  | 'reviews'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: AdminUser | null;
  onLogout: () => void;
}

export function Sidebar({ activeTab, onSelectTab, currentUser, onLogout }: SidebarProps) {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard Tổng quan', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'Quản lý Người dùng', icon: <Users size={18} /> },
    { id: 'restaurants', label: 'Quản lý Nhà hàng', icon: <Store size={18} /> },
    { id: 'orders', label: 'Quản lý Đơn hàng', icon: <ShoppingBag size={18} /> },
    { id: 'payments', label: 'Doanh thu & Đối soát', icon: <CreditCard size={18} /> },
    { id: 'reviews', label: 'Đánh giá & Kiểm duyệt', icon: <Star size={18} /> },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Box */}
      <div className="sidebar-brand-box">
        <div className="sidebar-logo">
          <Flame size={24} />
        </div>
        <div className="brand-text">
          <h1>Food</h1>
          <span>ADMIN PORTAL</span>
        </div>
      </div>

      {/* System Status Pill */}
      <div className="system-status-pill">
        <div className="indicator">
          <span className="dot" />
          <span>Hệ thống: Sẵn sàng</span>
        </div>
        <span style={{ color: '#10b981', fontWeight: 700 }}>99.98%</span>
      </div>

      {/* Section Header */}
      <div className="sidebar-section-title">QUẢN TRỊ CỐT LÕI</div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <span>Môi trường</span>
          <span className="env-badge">Production v2.4</span>
        </div>
        <div className="sidebar-footer-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={13} color="#10b981" />
            <span>Phản hồi API: 42ms</span>
          </span>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 2,
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
