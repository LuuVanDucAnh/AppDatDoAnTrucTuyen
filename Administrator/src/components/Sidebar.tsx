import React from 'react';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  CreditCard,
  Star,
  Flame,
  LogOut,
} from 'lucide-react';
import type { AdminUser } from '../services/types';

export type NavTab =
  | 'dashboard'
  | 'users'
  | 'restaurants'
  | 'orders'
  | 'payments'
  | 'reviews';

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

      {/* Footer Logout Button */}
      <div className="sidebar-footer" style={{ padding: '16px' }}>
        <button
          onClick={onLogout}
          title="Đăng xuất khỏi hệ thống"
          className="sidebar-logout-btn"
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            transition: 'all 0.2s',
          }}
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
