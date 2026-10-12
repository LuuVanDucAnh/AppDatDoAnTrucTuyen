import React, { useState } from 'react';
import {
  Home,
  ChevronRight,
  RotateCw,
  Store,
  Bell,
  Power,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { AdminRestaurant, AdminUser, RestaurantStatus } from '../services/types';
import { ownerApi } from '../services/api';
import { resolveImageUrl, DEFAULT_RESTAURANT_IMAGE } from '../services/utils';

interface OwnerHeaderProps {
  currentUser: AdminUser | null;
  selectedRestaurant: AdminRestaurant | null;
  onRefresh: () => void;
  onRestaurantUpdated: (updated: AdminRestaurant) => void;
  activeTabTitle: string;
}

export function OwnerHeader({
  currentUser,
  selectedRestaurant,
  onRefresh,
  onRestaurantUpdated,
  activeTabTitle,
}: OwnerHeaderProps) {
  const [changingStatus, setChangingStatus] = useState(false);
  const ownerName = currentUser?.full_name || 'Đối tác quán ăn';

  const handleSetStatus = async (status: RestaurantStatus) => {
    if (!selectedRestaurant || changingStatus) return;
    try {
      setChangingStatus(true);
      const updated = await ownerApi.setRestaurantStatus(selectedRestaurant.id, status);
      onRestaurantUpdated(updated);
    } catch (err: any) {
      alert(`Không thể đổi trạng thái quán: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      setChangingStatus(false);
    }
  };

  const currentStatus = selectedRestaurant?.status || 'OPEN';

  // Chữ cái viết tắt nhận diện quán ăn
  const initials = selectedRestaurant?.name
    ? selectedRestaurant.name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'QA';

  return (
    <header className="top-header">
      {/* Left side: Restaurant Brand Identity & Active Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {selectedRestaurant ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo Thương Hiệu Quán Ăn */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
                border: '1.5px solid #FDBA74',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)',
                flexShrink: 0,
              }}
            >
              {selectedRestaurant.image ? (
                <img
                  src={resolveImageUrl(selectedRestaurant.image, DEFAULT_RESTAURANT_IMAGE)}
                  alt={selectedRestaurant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const parent = (e.target as HTMLElement).parentElement;
                    (e.target as HTMLElement).style.display = 'none';
                    if (parent) {
                      const badge = document.createElement('span');
                      badge.style.fontWeight = '900';
                      badge.style.color = '#EA580C';
                      badge.style.fontSize = '0.92rem';
                      badge.innerText = initials;
                      parent.appendChild(badge);
                    }
                  }}
                />
              ) : (
                <span style={{ fontWeight: 900, color: '#EA580C', fontSize: '0.92rem' }}>
                  {initials}
                </span>
              )}
            </div>

            {/* Tên quán & Phân mục */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {selectedRestaurant.name}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    background: '#F1F5F9',
                    color: '#64748B',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  #RES-{selectedRestaurant.id}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 2,
                }}
              >
                <span>Kênh Quán Ăn</span>
                <ChevronRight size={11} color="#94A3B8" />
                <strong style={{ color: '#EA580C' }}>{activeTabTitle}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="breadcrumb-trail">
            <Store size={15} style={{ marginRight: 2, color: '#f97316' }} />
            <span>Kênh Quán Ăn</span>
            <ChevronRight size={13} />
            <strong style={{ color: '#ea580c' }}>{activeTabTitle}</strong>
          </div>
        )}
      </div>

      {/* Right side: Quick Status Pill Switcher & Profile */}
      <div className="header-actions">
        {/* Restaurant Status Fast-Switch Pill Group */}
        {selectedRestaurant && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '3px 4px',
              borderRadius: 999,
              border: '1px solid #e2e8f0',
              gap: 2,
            }}
          >
            <button
              onClick={() => handleSetStatus('OPEN')}
              disabled={changingStatus}
              title="Khách hàng có thể tìm kiếm và đặt món bình thường"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: 'none',
                padding: '5px 11px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: currentStatus === 'OPEN' ? '#10b981' : 'transparent',
                color: currentStatus === 'OPEN' ? '#ffffff' : '#64748b',
                boxShadow: currentStatus === 'OPEN' ? '0 2px 6px rgba(16, 185, 129, 0.35)' : 'none',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: currentStatus === 'OPEN' ? '#ffffff' : '#10b981',
                }}
              />
              <span>Mở cửa</span>
            </button>

            <button
              onClick={() => handleSetStatus('BUSY')}
              disabled={changingStatus}
              title="Quán đang quá tải đơn hàng"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: 'none',
                padding: '5px 11px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: currentStatus === 'BUSY' ? '#f59e0b' : 'transparent',
                color: currentStatus === 'BUSY' ? '#ffffff' : '#64748b',
                boxShadow: currentStatus === 'BUSY' ? '0 2px 6px rgba(245, 158, 11, 0.35)' : 'none',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: currentStatus === 'BUSY' ? '#ffffff' : '#f59e0b',
                }}
              />
              <span>Quá tải</span>
            </button>

            <button
              onClick={() => handleSetStatus('CLOSED')}
              disabled={changingStatus}
              title="Quán tạm đóng cửa, không nhận đơn mới"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: 'none',
                padding: '5px 11px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: currentStatus === 'CLOSED' ? '#ef4444' : 'transparent',
                color: currentStatus === 'CLOSED' ? '#ffffff' : '#64748b',
                boxShadow: currentStatus === 'CLOSED' ? '0 2px 6px rgba(239, 68, 68, 0.35)' : 'none',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: currentStatus === 'CLOSED' ? '#ffffff' : '#ef4444',
                }}
              />
              <span>Đóng cửa</span>
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <button
          className="header-icon-btn"
          onClick={onRefresh}
          title="Làm mới dữ liệu quán ăn"
        >
          <RotateCw size={16} />
        </button>

        {/* Profile Info */}
        <div className="header-user-profile">
          <div
            className="header-avatar"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
            }}
          >
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="header-user-info">
            <span className="name">{ownerName}</span>
            <span className="role" style={{ color: '#ea580c', fontWeight: 600 }}>
              Chủ Nhà Hàng
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
