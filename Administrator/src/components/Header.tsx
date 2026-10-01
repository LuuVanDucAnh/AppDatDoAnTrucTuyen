import React from 'react';
import {
  Home,
  ChevronRight,
  Search,
  Plus,
  Receipt,
  Bell,
  HelpCircle,
} from 'lucide-react';
import type { AdminUser } from '../services/types';

interface HeaderProps {
  currentUser: AdminUser | null;
  onSearch?: (q: string) => void;
  onCreateNotification?: () => void;
  onQuickSettlement?: () => void;
}

export function Header({
  currentUser,
  onSearch,
  onCreateNotification,
  onQuickSettlement,
}: HeaderProps) {
  const adminName = currentUser?.full_name || 'Lê Hoàng Long';

  return (
    <header className="top-header">
      {/* Left side: Breadcrumb & Search */}
      <div className="header-search-wrap">
        <div className="breadcrumb-trail">
          <Home size={15} style={{ marginRight: 2 }} />
          <span>Trang chủ</span>
          <ChevronRight size={13} />
          <strong>Quản trị</strong>
        </div>

        <div className="search-input-box">
          <Search size={15} className="icon" />
          <input
            type="text"
            placeholder="Tìm đơn hàng, quán ăn, khách..."
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Right side: Quick Action Buttons & Profile */}
      <div className="header-actions">
        <button
          className="btn-header-action btn-header-orange"
          onClick={onCreateNotification}
        >
          <Plus size={15} />
          <span>Tạo thông báo</span>
        </button>

        <button
          className="btn-header-action btn-header-blue"
          onClick={onQuickSettlement}
        >
          <Receipt size={15} />
          <span>Kết toán nhanh</span>
        </button>

        <button className="header-icon-btn" title="Thông báo hệ thống">
          <Bell size={18} />
          <span className="badge-dot" />
        </button>

        <button className="header-icon-btn" title="Trợ giúp & Hướng dẫn">
          <HelpCircle size={18} />
        </button>

        <div className="header-user-profile">
          <div className="header-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="header-user-info">
            <span className="name">{adminName}</span>
            <span className="role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
