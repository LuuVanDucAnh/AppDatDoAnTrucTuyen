import React, { useEffect, useState } from 'react';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { OrdersView } from './views/OrdersView';
import { RestaurantsView } from './views/RestaurantsView';
import { UsersView } from './views/UsersView';
import { PaymentsView } from './views/PaymentsView';
import { ReviewsView } from './views/ReviewsView';
import { SettingsView } from './views/SettingsView';
import { authApi, getStoredToken, getStoredUser, saveSession } from './services/api';
import type { AdminUser } from './services/types';

export function App() {
  // Tự động nhận diện token nếu được chuyển hướng từ màn hình Đăng nhập của Frontend
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

  const getTabFromLocation = (): NavTab => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as NavTab;
      if (tabParam && ['dashboard', 'users', 'restaurants', 'orders', 'payments', 'reviews', 'settings'].includes(tabParam)) {
        return tabParam;
      }
      const hash = window.location.hash.replace('#', '') as NavTab;
      if (hash && ['dashboard', 'users', 'restaurants', 'orders', 'payments', 'reviews', 'settings'].includes(hash)) {
        return hash;
      }
    } catch {
      // ignore
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<NavTab>(getTabFromLocation);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const onHashChange = () => {
      const newTab = getTabFromLocation();
      setActiveTab(newTab);
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
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
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // If not authenticated or not ADMIN
  if (!currentUser || !getStoredToken()) {
    return <LoginView onSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Header
          currentUser={currentUser}
          onCreateNotification={() => alert('Chức năng: Gửi thông báo đẩy đến toàn bộ khách hàng và quán ăn.')}
          onQuickSettlement={() => alert('Chức năng: Kết toán nhanh doanh thu các nhà hàng đối tác hôm nay.')}
        />

        <main key={`${activeTab}-${refreshTrigger}`}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'restaurants' && <RestaurantsView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'payments' && <PaymentsView />}
          {activeTab === 'reviews' && <ReviewsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
