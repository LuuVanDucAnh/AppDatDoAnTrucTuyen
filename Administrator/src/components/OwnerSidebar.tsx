import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Star,
  Store,
  Settings,
  LogOut,
  ChevronDown,
  PlusCircle,
  ShieldAlert,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';
import type { AdminRestaurant, AdminUser } from '../services/types';

export type OwnerNavTab = 'overview' | 'orders' | 'menu' | 'reviews' | 'settings';

interface OwnerSidebarProps {
  activeTab: OwnerNavTab;
  onSelectTab: (tab: OwnerNavTab) => void;
  currentUser: AdminUser | null;
  restaurants: AdminRestaurant[];
  selectedRestaurant: AdminRestaurant | null;
  onSelectRestaurant: (restaurant: AdminRestaurant) => void;
  onOpenCreateRestaurant: () => void;
  onLogout: () => void;
  pendingOrdersCount?: number;
  onSwitchToAdminPortal?: () => void;
}

export function OwnerSidebar({
  activeTab,
  onSelectTab,
  currentUser,
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
  onOpenCreateRestaurant,
  onLogout,
  pendingOrdersCount = 0,
  onSwitchToAdminPortal,
}: OwnerSidebarProps) {
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  const menuItems: { id: OwnerNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Tổng quan quán',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'orders',
      label: 'Đơn hàng trực tuyến',
      icon: <ShoppingBag size={18} />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      id: 'menu',
      label: 'Thực đơn & Món ăn',
      icon: <UtensilsCrossed size={18} />,
    },
    {
      id: 'reviews',
      label: 'Đánh giá khách hàng',
      icon: <Star size={18} />,
    },
    {
      id: 'settings',
      label: 'Hồ sơ & Giờ mở cửa',
      icon: <Settings size={18} />,
    },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Đang mở cửa', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'BUSY':
        return { label: 'Quá tải / Bận', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: 'Tạm đóng cửa', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    }
  };

  const statusInfo = getStatusBadge(selectedRestaurant?.status);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <div
          className="sidebar-logo"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
          }}
        >
          <Store size={22} color="#ffffff" />
        </div>
        <div className="brand-text">
          <h1 style={{ color: '#fff', fontSize: '1.15rem' }}>Food Merchant</h1>
          <span style={{ color: '#f97316', letterSpacing: '0.06em', fontWeight: 700 }}>
            KÊNH ĐỐI TÁC NHÀ HÀNG
          </span>
        </div>
      </div>

      {/* Active Restaurant Selector Box */}
      <div style={{ padding: '0 12px 14px 12px', position: 'relative' }}>
        <div
          onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: '10px 12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
              Quán đang quản lý
            </span>
            <ChevronDown size={14} color="#94a3b8" style={{ transform: storeDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {selectedRestaurant?.image ? (
                <img
                  src={selectedRestaurant.image}
                  alt={selectedRestaurant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Store size={18} color="#f97316" />
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={selectedRestaurant?.name || 'Chưa có quán'}
              >
                {selectedRestaurant?.name || 'Chưa có quán ăn'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.7rem',
                    color: statusInfo.color,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: statusInfo.color,
                      boxShadow: `0 0 6px ${statusInfo.color}`,
                    }}
                  />
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {storeDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% - 6px)',
              left: 12,
              right: 12,
              background: '#1a2234',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 100,
              padding: 6,
              maxHeight: 250,
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '6px 8px', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
              CHỌN CHI NHÁNH / QUÁN ĂN ({restaurants.length})
            </div>

            {restaurants.map((res) => {
              const isSelected = res.id === selectedRestaurant?.id;
              return (
                <div
                  key={res.id}
                  onClick={() => {
                    onSelectRestaurant(res);
                    setStoreDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isSelected ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    color: isSelected ? '#f97316' : '#e2e8f0',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 700 : 500,
                    marginBottom: 2,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {res.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {res.address || 'Chưa cập nhật địa chỉ'}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={15} color="#f97316" />}
                </div>
              );
            })}

            <button
              onClick={() => {
                setStoreDropdownOpen(false);
                onOpenCreateRestaurant();
              }}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px dashed rgba(249, 115, 22, 0.4)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={14} />
              <span>Thêm quán ăn mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Section Title */}
      <div className="sidebar-section-title">QUẢN TRỊ BÁN HÀNG</div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`owner-nav-${item.id}`}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 999,
                    animation: 'pulse 2s infinite',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Switch to Admin if current user is ADMIN */}
      {currentUser?.role === 'ADMIN' && onSwitchToAdminPortal && (
        <div style={{ padding: '0 12px 10px 12px' }}>
          <button
            onClick={onSwitchToAdminPortal}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ShieldAlert size={15} />
            <span>Về Cổng Super Admin</span>
          </button>
        </div>
      )}

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.82rem' }}>
              {currentUser?.full_name || 'Đối tác quán ăn'}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
              {currentUser?.phone_number || currentUser?.email || 'RESTAURANT_OWNER'}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
