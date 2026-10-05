import React, { useState } from 'react';
import { Settings, Save, CreditCard } from 'lucide-react';

export function SettingsView() {
  const [platformName, setPlatformName] = useState('Food');
  const [deliveryFee, setDeliveryFee] = useState('15000');
  const [supportPhone, setSupportPhone] = useState('1900 6868');
  const [momoActive, setMomoActive] = useState(true);
  const [vnpayActive, setVnpayActive] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="view-container">
      {saved && (
        <div className="toast-container">
          <div className="toast toast-success">Đã lưu cấu hình hệ thống thành công!</div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Cài Đặt Hệ Thống Sàn</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Thiết lập thông số vận hành, cổng thanh toán và phí dịch vụ
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div className="form-group">
              <label>Tên Thương Hiệu Hệ Thống</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Phí Giao Hàng Mặc Định (VNĐ)</label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Hotline Hỗ Trợ Toàn Sàn</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="#ea580c" />
              <span>Cổng Thanh Toán Online</span>
            </h4>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={momoActive}
                  onChange={(e) => setMomoActive(e.target.checked)}
                />
                <span>Kích hoạt Ví MoMo (MOMO)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={vnpayActive}
                  onChange={(e) => setVnpayActive(e.target.checked)}
                />
                <span>Kích hoạt Cổng VNPay (VNPAY)</span>
              </label>
            </div>
          </div>

          <div>
            <button type="submit" className="btn btn-primary" style={{ height: 42, padding: '0 24px' }}>
              <Save size={16} />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
