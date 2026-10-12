import React, { useState } from 'react';
import {
  ChevronDown,
  Bell,
  User,
  LayoutGrid,
  Receipt,
  UtensilsCrossed,
  Store,
  Check,
  Plus,
  RefreshCw,
  Smartphone,
  Maximize2,
  ShieldAlert,
} from 'lucide-react';
import type { AdminRestaurant, AdminUser } from '../services/types';
import { ownerApi } from '../services/api';
import '../views/owner/owner-mobile-ui.css';

export type OwnerTab = 'overview' | 'orders' | 'menu' | 'settings' | 'reviews';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. OWNER MOBILE HEADER (Y TRANG OWNER-CHROME.TSX)
// ═══════════════════════════════════════════════════════════════════════════════
interface OwnerMobileHeaderProps {
  restaurant: AdminRestaurant | null;
  restaurants: AdminRestaurant[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectRestaurant: (res: AdminRestaurant) => void;
  onOpenCreateRestaurant: () => void;
  onGoToSettings: () => void;
  notificationCount?: number;
}

export function OwnerMobileHeader({
  restaurant,
  restaurants,
  isOpen,
  onToggleOpen,
  onSelectRestaurant,
  onOpenCreateRestaurant,
  onGoToSettings,
  notificationCount = 1,
}: OwnerMobileHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      <header className="owner-m-header">
        {/* Left: Quán đang quản lý & Dropdown chọn quán */}
        <div
          className="owner-m-header-left"
          onClick={() => {
            if (restaurants.length > 0) setDropdownOpen(!dropdownOpen);
          }}
        >
          <div className="owner-m-title-wrap">
            <span className="owner-m-header-label">Quán đang quản lý</span>
            <div className="owner-m-store-name-row">
              <span className="owner-m-header-store-name">
                {restaurant?.name || 'Đang tải quán...'}
              </span>
              <ChevronDown size={14} color="#64748B" style={{ marginLeft: 3 }} />
            </div>
          </div>
        </div>

        {/* Nút công tắc trạng thái MỞ CỬA / ĐÓNG CỬA (Y TRANG MOBILE statusPill) */}
        <button
          onClick={onToggleOpen}
          className={`owner-m-status-pill ${!isOpen ? 'closed' : ''}`}
          title={isOpen ? 'Bấm để tạm đóng cửa' : 'Bấm để mở cửa trở lại'}
        >
          <div className={`owner-m-status-dot ${!isOpen ? 'closed' : ''}`} />
          <span className={`owner-m-status-text ${!isOpen ? 'closed' : ''}`}>
            {isOpen ? 'MỞ CỬA' : 'ĐÓNG CỬA'}
          </span>
        </button>

        {/* Chuông thông báo (Y TRANG MOBILE bellBtn) */}
        <button
          onClick={() => alert('Bạn không có thông báo đơn hàng mới nào.')}
          className="owner-m-bell-btn"
          title="Thông báo"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <div className="owner-m-bell-badge">
              <div className="owner-m-bell-dot" />
            </div>
          )}
        </button>

        {/* Avatar tài khoản (Y TRANG MOBILE avatar) */}
        <button
          onClick={onGoToSettings}
          className="owner-m-avatar"
          title="Thông tin chủ quán"
        >
          <User size={16} />
        </button>
      </header>

      {/* Dropdown chuyển đổi quán sở hữu */}
      {dropdownOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onClick={() => setDropdownOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 54,
              left: 14,
              width: 290,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0',
              padding: 8,
              zIndex: 999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#64748B',
                padding: '6px 10px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>DANH SÁCH QUÁN ĂN</span>
              <span>{restaurants.length} quán</span>
            </div>

            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
              {restaurants.map((r) => {
                const isSelected = r.id === restaurant?.id;
                const rOpen = r.status === 'OPEN';
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      onSelectRestaurant(r);
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      backgroundColor: isSelected ? '#FFF7ED' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        border: isSelected ? '4px solid #EA580C' : '2px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? '#C2410C' : '#1E293B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {r.name}
                      </div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          color: '#94A3B8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {r.address}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: rOpen ? '#DCFCE7' : '#F1F5F9',
                        color: rOpen ? '#15803D' : '#64748B',
                      }}
                    >
                      {rOpen ? 'Mở' : 'Đóng'}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenCreateRestaurant();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 10px',
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#2563EB',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              <Plus size={14} />
              <span>+ Mở thêm quán ăn mới</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. OWNER MOBILE TAB BAR (Y TRANG OWNER-CHROME.TSX)
// ═══════════════════════════════════════════════════════════════════════════════
interface OwnerMobileTabBarProps {
  activeTab: OwnerTab;
  onSelectTab: (tab: OwnerTab) => void;
  ordersCount?: number;
}

const TABS = [
  { key: 'overview' as const, label: 'Tổng quan', Icon: LayoutGrid },
  { key: 'orders' as const, label: 'Đơn hàng', Icon: Receipt, hasBadge: true },
  { key: 'menu' as const, label: 'Thực đơn', Icon: UtensilsCrossed },
  { key: 'settings' as const, label: 'Cài đặt', Icon: Store },
];

export function OwnerMobileTabBar({
  activeTab,
  onSelectTab,
  ordersCount = 0,
}: OwnerMobileTabBarProps) {
  return (
    <nav className="owner-m-tab-bar">
      {TABS.map((t) => {
        const isActive = activeTab === t.key || (t.key === 'settings' && activeTab === 'reviews');
        const IconComponent = t.Icon;
        return (
          <button
            key={t.key}
            onClick={() => onSelectTab(t.key)}
            className={`owner-m-tab-item ${isActive ? 'active' : ''}`}
          >
            <div className="owner-m-tab-icon-wrap">
              <IconComponent size={21} />
              {Boolean(t.hasBadge && ordersCount > 0) && (
                <div className="owner-m-tab-badge">
                  {ordersCount > 99 ? '99+' : ordersCount}
                </div>
              )}
            </div>
            <span className="owner-m-tab-label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
