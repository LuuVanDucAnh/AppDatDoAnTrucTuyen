import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useApp } from '@/context/AppContext';
import { ApiError, ownerApi } from '@/services/api';
import type { ApiRestaurant } from '@/services/types';

interface OwnerContextType {
  /** Danh sách nhà hàng user này sở hữu (GET /owner/my-restaurants) */
  restaurants: ApiRestaurant[];
  /** Nhà hàng đang được quản lý, dùng chung cho cả 3 màn chủ quán */
  restaurant: ApiRestaurant | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  selectRestaurant: (id: number) => void;
  toggleOpen: () => Promise<void>;
  reload: () => Promise<void>;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await ownerApi.getMyRestaurants();
      setRestaurants(list);
      setSelectedId((prev) => (prev && list.some((r) => r.id === prev) ? prev : (list[0]?.id ?? null)));
      if (list.length === 0) setError('Tài khoản này chưa được gán nhà hàng nào.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách nhà hàng');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) {
        if (alive) {
          setLoading(false);
          setError('Bạn cần đăng nhập bằng tài khoản chủ quán.');
        }
        return;
      }
      if (user.role !== 'RESTAURANT_OWNER') {
        if (alive) {
          setLoading(false);
          setError(`Tài khoản "${user.fullName}" có role ${user.role}, không phải chủ quán.`);
        }
        return;
      }
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user, load]);

  const restaurant = restaurants.find((r) => r.id === selectedId) ?? null;

  const toggleOpen = useCallback(async () => {
    if (!restaurant) return;
    try {
      const updated = await ownerApi.toggleRestaurantStatus(restaurant.id);
      setRestaurants((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      Alert.alert(
        updated.status === 'OPEN' ? 'Đã mở cửa' : 'Đã đóng cửa',
        updated.status === 'OPEN'
          ? 'Quán đang nhận đơn trở lại và hiển thị cho khách.'
          : 'Quán ngừng nhận đơn mới và bị ẩn khỏi danh sách của khách.'
      );
    } catch (err) {
      Alert.alert('Không đổi được trạng thái', err instanceof Error ? err.message : String(err));
    }
  }, [restaurant]);

  const value: OwnerContextType = {
    restaurants,
    restaurant,
    loading,
    error,
    isOpen: restaurant?.status === 'OPEN',
    selectRestaurant: setSelectedId,
    toggleOpen,
    reload: load,
  };

  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>;
}

export const useOwner = () => {
  const ctx = useContext(OwnerContext);
  if (!ctx) throw new Error('useOwner must be used within an OwnerProvider');
  return ctx;
};
