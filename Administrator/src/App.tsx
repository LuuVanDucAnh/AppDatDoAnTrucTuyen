import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OwnerSidebar, type OwnerNavTab } from './components/OwnerSidebar';
import { OwnerHeader } from './components/OwnerHeader';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { OrdersView } from './views/OrdersView';
import { RestaurantsView } from './views/RestaurantsView';
import { UsersView } from './views/UsersView';
import { PaymentsView } from './views/PaymentsView';
import { ReviewsView } from './views/ReviewsView';
import { SettingsView } from './views/SettingsView';

// Owner Views
import { OwnerDashboardView } from './views/owner/OwnerDashboardView';
import { OwnerOrdersView } from './views/owner/OwnerOrdersView';
import { OwnerMenuView } from './views/owner/OwnerMenuView';
import { OwnerReviewsView } from './views/owner/OwnerReviewsView';
import { OwnerSettingsView } from './views/owner/OwnerSettingsView';

import { authApi, ownerApi, getStoredToken, getStoredUser, saveSession } from './services/api';
import type { AdminRestaurant, AdminUser } from './services/types';

export function App() {
  // ── 1. Quản lý phiên đăng nhập ──────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const urlRefreshToken = urlParams.get('refreshToken');
      const urlUserRaw = urlParams.get('user');

      if (urlToken) {
        let parsedUser: AdminUser | undefined = undefined;
        if (urlUserRaw) {
          try {
            parsedUser = JSON.parse(decodeURIComponent(urlUserRaw));
          } catch {
            // ignore
          }
        }
        saveSession(urlToken, urlRefreshToken || undefined, parsedUser);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (parsedUser) return parsedUser;
      }
    } catch {
      // ignore
    }
    return getStoredUser();
  });

  // Chế độ cổng: 'admin' (Sàn) hay 'owner' (Kênh quán ăn)
  const isOwnerRole = currentUser?.role === 'RESTAURANT_OWNER' || (currentUser?.role as any) === 'OWNER';
  const [portalMode, setPortalMode] = useState<'admin' | 'owner'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const p = urlParams.get('portal');
    if (p === 'owner' || p === 'admin') return p;
    return isOwnerRole ? 'owner' : 'admin';
  });

  // Cập nhật portalMode khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'RESTAURANT_OWNER' || (currentUser.role as any) === 'OWNER') {
        setPortalMode('owner');
      }
    }
  }, [currentUser]);

  // ── 2. Điều hướng Tab Admin ─────────────────────────────────────────────
  const getAdminTabFromLocation = (): NavTab => {
    try {
      const hash = window.location.hash.replace('#', '') as NavTab;
      if (['dashboard', 'users', 'restaurants', 'orders', 'payments', 'reviews', 'settings'].includes(hash)) {
        return hash;
      }
    } catch {
      // ignore
    }
    return 'dashboard';
  };

  const [activeAdminTab, setActiveAdminTab] = useState<NavTab>(getAdminTabFromLocation);

  // ── 3. Điều hướng Tab Owner ─────────────────────────────────────────────
  const getOwnerTabFromLocation = (): OwnerNavTab => {
    try {
      const hash = window.location.hash.replace('#owner-', '') as OwnerNavTab;
      if (['overview', 'orders', 'menu', 'reviews', 'settings'].includes(hash)) {
        return hash;
      }
    } catch {
      // ignore
    }
    return 'overview';
  };

  const [activeOwnerTab, setActiveOwnerTab] = useState<OwnerNavTab>(getOwnerTabFromLocation);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── 4. Dữ liệu Nhà Hàng của Chủ Quán ────────────────────────────────────
  const [myRestaurants, setMyRestaurants] = useState<AdminRestaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [loadingStores, setLoadingStores] = useState(false);

  // Tải danh sách nhà hàng nếu ở chế độ Owner
  const fetchMyRestaurants = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoadingStores(true);
      const list = await ownerApi.getMyRestaurants();
      setMyRestaurants(list);

      // Chọn nhà hàng đã lưu hoặc nhà hàng đầu tiên
      const savedId = localStorage.getItem('merchant_selected_restaurant_id');
      const found = list.find((r) => String(r.id) === savedId) || list[0] || null;
      setSelectedRestaurant(found);

      // Nếu có nhà hàng, kiểm tra đơn PENDING
      if (found) {
        ownerApi
          .getOrders(found.id, { status: 'PENDING', limit: 50 })
          .then((res) => {
            setPendingOrdersCount(res.data?.length || 0);
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error('Không thể tải danh sách nhà hàng của chủ quán:', err);
    } finally {
      setLoadingStores(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && (portalMode === 'owner' || isOwnerRole)) {
      fetchMyRestaurants();
    }
  }, [currentUser, portalMode, isOwnerRole, fetchMyRestaurants]);

  // Cập nhật số đơn PENDING định kỳ
  const refreshPendingCount = useCallback(() => {
    if (!selectedRestaurant) return;
    ownerApi
      .getOrders(selectedRestaurant.id, { status: 'PENDING', limit: 50 })
      .then((res) => {
        setPendingOrdersCount(res.data?.length || 0);
      })
      .catch(() => {});
  }, [selectedRestaurant]);

  // Chọn quán ăn khác
  const handleSelectRestaurant = (res: AdminRestaurant) => {
    setSelectedRestaurant(res);
    localStorage.setItem('merchant_selected_restaurant_id', String(res.id));
    setRefreshTrigger((prev) => prev + 1);
    refreshPendingCount();
  };

  // Cập nhật nhà hàng sau khi đổi thông tin hoặc trạng thái
  const handleRestaurantUpdated = (updated: AdminRestaurant) => {
    setSelectedRestaurant(updated);
    setMyRestaurants((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Thêm nhà hàng mới tạo
  const handleRestaurantCreated = (newRes: AdminRestaurant) => {
    setMyRestaurants((prev) => [newRes, ...prev]);
    setSelectedRestaurant(newRes);
    localStorage.setItem('merchant_selected_restaurant_id', String(newRes.id));
    setRefreshTrigger((prev) => prev + 1);
  };

  // Hash listener
  useEffect(() => {
    const onHashChange = () => {
      if (portalMode === 'admin') {
        setActiveAdminTab(getAdminTabFromLocation());
      } else {
        setActiveOwnerTab(getOwnerTabFromLocation());
      }
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, [portalMode]);

  const handleSelectAdminTab = (tab: NavTab) => {
    setActiveAdminTab(tab);
    window.location.hash = tab;
  };

  const handleSelectOwnerTab = (tab: OwnerNavTab) => {
    setActiveOwnerTab(tab);
    window.location.hash = `owner-${tab}`;
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener('admin:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('admin:unauthorized', handleUnauthorized);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    localStorage.removeItem('merchant_selected_restaurant_id');
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    if (portalMode === 'owner') {
      refreshPendingCount();
    }
  };

  // Nếu chưa đăng nhập
  if (!currentUser || !getStoredToken()) {
    return <LoginView onSuccess={(user) => setCurrentUser(user)} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GIAO DIỆN 1: KÊNH ĐỐI TÁC NHÀ HÀNG (MERCHANT / OWNER PORTAL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (portalMode === 'owner') {
    const tabTitles: Record<OwnerNavTab, string> = {
      overview: 'Tổng quan kinh doanh',
      orders: 'Quản lý đơn hàng',
      menu: 'Thực đơn & Món ăn',
      reviews: 'Đánh giá khách hàng',
      settings: 'Cài đặt quán ăn',
    };

    return (
      <div className="app-container">
        <OwnerSidebar
          activeTab={activeOwnerTab}
          onSelectTab={handleSelectOwnerTab}
          currentUser={currentUser}
          restaurants={myRestaurants}
          selectedRestaurant={selectedRestaurant}
          onSelectRestaurant={handleSelectRestaurant}
          onOpenCreateRestaurant={() => {
            setActiveOwnerTab('settings');
            window.location.hash = 'owner-settings';
          }}
          onLogout={handleLogout}
          pendingOrdersCount={pendingOrdersCount}
          onSwitchToAdminPortal={currentUser.role === 'ADMIN' ? () => setPortalMode('admin') : undefined}
        />

        <div className="main-wrapper">
          <OwnerHeader
            currentUser={currentUser}
            selectedRestaurant={selectedRestaurant}
            onRefresh={handleRefresh}
            onRestaurantUpdated={handleRestaurantUpdated}
            activeTabTitle={tabTitles[activeOwnerTab] || 'Quản lý quán'}
          />

          <main key={`owner-${activeOwnerTab}-${selectedRestaurant?.id}-${refreshTrigger}`}>
            {activeOwnerTab === 'overview' && (
              <OwnerDashboardView
                restaurant={selectedRestaurant}
                onGoToOrders={() => handleSelectOwnerTab('orders')}
                onGoToMenu={() => handleSelectOwnerTab('menu')}
                onGoToSettings={() => handleSelectOwnerTab('settings')}
              />
            )}
            {activeOwnerTab === 'orders' && (
              <OwnerOrdersView
                restaurant={selectedRestaurant}
                onRefreshStats={refreshPendingCount}
              />
            )}
            {activeOwnerTab === 'menu' && (
              <OwnerMenuView
                restaurant={selectedRestaurant}
                onRefreshStats={handleRefresh}
              />
            )}
            {activeOwnerTab === 'reviews' && (
              <OwnerReviewsView restaurant={selectedRestaurant} />
            )}
            {activeOwnerTab === 'settings' && (
              <OwnerSettingsView
                restaurant={selectedRestaurant}
                currentUser={currentUser}
                onRestaurantUpdated={handleRestaurantUpdated}
                onRestaurantCreated={handleRestaurantCreated}
                onLogout={handleLogout}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GIAO DIỆN 2: CỔNG SUPER ADMIN (ADMIN PORTAL)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeAdminTab}
        onSelectTab={handleSelectAdminTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Header
          currentUser={currentUser}
          onCreateNotification={() => alert('Chức năng: Gửi thông báo đẩy đến toàn bộ khách hàng và quán ăn.')}
          onQuickSettlement={() => alert('Chức năng: Kết toán nhanh doanh thu các nhà hàng đối tác hôm nay.')}
          onSwitchToOwnerPortal={() => setPortalMode('owner')}
        />

        <main key={`admin-${activeAdminTab}-${refreshTrigger}`}>
          {activeAdminTab === 'dashboard' && <DashboardView />}
          {activeAdminTab === 'users' && <UsersView />}
          {activeAdminTab === 'restaurants' && <RestaurantsView />}
          {activeAdminTab === 'orders' && <OrdersView />}
          {activeAdminTab === 'payments' && <PaymentsView />}
          {activeAdminTab === 'reviews' && <ReviewsView />}
          {activeAdminTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
