import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  Download,
  Zap,
  TrendingUp,
  Percent,
  Wallet,
  Lock,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Eye,
  Check,
  ChevronDown,
  X,
  ArrowUpRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { paymentsApi } from '../services/api';
import type { AdminPayment } from '../services/types';

const money = (val: number | string) =>
  Number(val || 0).toLocaleString('vi-VN') + 'đ';

interface PartnerSettlement {
  id: string;
  resId: string;
  name: string;
  ordersCount: number;
  gmv: number;
  commission: number;
  voucherSupport: number;
  netPayout: number;
  bankInfo: string;
  status: 'SETTLED' | 'PENDING' | 'ESCROW_HOLD';
  dueDate: string;
}

export function PaymentsView() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SETTLED' | 'PENDING' | 'ESCROW'>('ALL');
  const [chartMetric, setChartMetric] = useState<'GMV' | 'NET_FEE' | 'VOUCHER'>('GMV');
  const [search, setSearch] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('Tuần 2 - Tháng 11/2024 (11/11 - 17/11)');

  // Modals
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [detailSettlement, setDetailSettlement] = useState<PartnerSettlement | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Mock list of partner settlements based on real platform partners
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([
    {
      id: 'SET-9901',
      resId: 'RES-1001',
      name: 'Cơm Tấm Ba Ghiền - Đặng Văn Ngữ',
      ordersCount: 420,
      gmv: 48500000,
      commission: 7275000,
      voucherSupport: 1200000,
      netPayout: 42425000,
      bankInfo: 'Vietcombank • 0071000892xxx',
      status: 'SETTLED',
      dueDate: '19/11/2024',
    },
    {
      id: 'SET-9902',
      resId: 'RES-1002',
      name: 'Bún Chả Hà Nội Phố Cổ - Huỳnh Thúc Kháng',
      ordersCount: 310,
      gmv: 35200000,
      commission: 5280000,
      voucherSupport: 950000,
      netPayout: 30870000,
      bankInfo: 'Techcombank • 1903456781xxx',
      status: 'SETTLED',
      dueDate: '19/11/2024',
    },
    {
      id: 'SET-9903',
      resId: 'RES-1003',
      name: 'Phở Thìn Lò Đúc - Cơ sở TP.HCM',
      ordersCount: 265,
      gmv: 29800000,
      commission: 4470000,
      voucherSupport: 720000,
      netPayout: 26050000,
      bankInfo: 'MBBank • 0918234888xxx',
      status: 'PENDING',
      dueDate: '19/11/2024',
    },
    {
      id: 'SET-9904',
      resId: 'RES-1004',
      name: 'Trà Sữa Gong Cha - Nguyễn Tri Phương',
      ordersCount: 540,
      gmv: 32400000,
      commission: 4860000,
      voucherSupport: 1500000,
      netPayout: 29040000,
      bankInfo: 'ACB • 23489102xxx',
      status: 'PENDING',
      dueDate: '19/11/2024',
    },
    {
      id: 'SET-9905',
      resId: 'RES-1005',
      name: 'Bánh Mì Huỳnh Hoa - Lê Thị Riêng',
      ordersCount: 680,
      gmv: 51000000,
      commission: 7650000,
      voucherSupport: 800000,
      netPayout: 44150000,
      bankInfo: 'VietinBank • 102839485xxx',
      status: 'ESCROW_HOLD',
      dueDate: 'Đang giữ xử lý',
    },
    {
      id: 'SET-9906',
      resId: 'RES-1006',
      name: 'Pizza 4P’s - Ben Thanh',
      ordersCount: 180,
      gmv: 62500000,
      commission: 9375000,
      voucherSupport: 2100000,
      netPayout: 55225000,
      bankInfo: 'Standard Chartered • 882930xxx',
      status: 'SETTLED',
      dueDate: '19/11/2024',
    },
  ]);

  const handleExecuteBatchPayout = () => {
    setPayoutLoading(true);
    setTimeout(() => {
      setPayoutLoading(false);
      setShowPayoutModal(false);
      setSettlements((prev) =>
        prev.map((s) => (s.status === 'PENDING' ? { ...s, status: 'SETTLED' } : s))
      );
      showToast('success', '🎉 Đã hoàn tất lệnh Quyết toán tự động qua Napas 24/7 cho toàn bộ 18 quán chờ chốt!');
    }, 1800);
  };

  const filteredSettlements = settlements.filter((s) => {
    if (activeTab === 'SETTLED' && s.status !== 'SETTLED') return false;
    if (activeTab === 'PENDING' && s.status !== 'PENDING') return false;
    if (activeTab === 'ESCROW' && s.status !== 'ESCROW_HOLD') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.resId.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="dashboard-content">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROLS (MATCHING IMAGE 1 & 3)
         ───────────────────────────────────────────────────────────── */}
      <div className="dashboard-title-bar">
        <div className="title-details">
          <div className="status-tag-row" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#ea580c',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                padding: '3px 9px',
                borderRadius: 9999,
              }}
            >
              ● MỤC 3.5 • ĐỐI SOÁT &amp; TÀI CHÍNH TOÀN SÀN
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#059669',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '3px 9px',
                borderRadius: 9999,
              }}
            >
              ● Kỳ đối soát hợp lệ
            </span>
          </div>

          <h2>Doanh thu Toàn sàn &amp; Đối soát Nhà hàng</h2>
          <p className="title-subtext">
            (Settlement &amp; Reconciliation) — Tổng hợp dòng tiền GMV, doanh thu hoa hồng sàn (Commission Fee), quản lý chu kỳ quyết toán và xử lý giải ngân cho các đối tác nhà hàng toàn hệ thống.
          </p>
        </div>

        <div className="dashboard-actions-right" style={{ alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Chu kỳ sao kê:</span>
            <select
              className="select-styled"
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              style={{ height: 36, fontSize: '0.78rem', fontWeight: 600, background: '#ffffff' }}
            >
              <option value="Tuần 2 - Tháng 11/2024 (11/11 - 17/11)">
                Tuần 2 - Tháng 11/2024 (11/11 - 17/11)
              </option>
              <option value="Tuần 1 - Tháng 11/2024 (04/11 - 10/11)">
                Tuần 1 - Tháng 11/2024 (04/11 - 10/11)
              </option>
              <option value="Tuần 4 - Tháng 10/2024 (28/10 - 03/11)">
                Tuần 4 - Tháng 10/2024 (28/10 - 03/11)
              </option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="btn-header-action"
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
              onClick={() => alert('Đang kết xuất báo cáo thuế VAT & Báo cáo Lãi Lỗ (P&L) kỳ sao kê...')}
            >
              <FileSpreadsheet size={15} color="#ea580c" />
              <span>Xuất báo cáo thuế &amp; P&amp;L</span>
            </button>

            <button
              className="btn-export-bi"
              style={{ background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)' }}
              onClick={() => setShowPayoutModal(true)}
            >
              <Zap size={16} />
              <span>⚡ Thực hiện Quyết toán Kỳ này</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 FINANCIAL STAT CARDS (EXACT NUMBERS FROM IMAGE 1/3)
         ───────────────────────────────────────────────────────────── */}
      <div className="metrics-row">
        {/* Card 1: Tổng GMV */}
        <div className="metric-card card-revenue">
          <div className="card-top">
            <span className="card-top-title">TỔNG GIÁ TRỊ GIAO DỊCH (GMV)</span>
            <div className="card-top-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="card-big-value">2.450.000.000đ</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#16a34a',
                  background: '#ecfdf5',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <TrendingUp size={12} />
                +16.8% so với kỳ trước
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              21.400 đơn hoàn tất • AOV: 114.500đ
            </div>
          </div>
        </div>

        {/* Card 2: Doanh thu hoa hồng sàn */}
        <div className="metric-card card-orders">
          <div className="card-top">
            <span className="card-top-title">DOANH THU HOA HỒNG SÀN</span>
            <div className="card-top-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Percent size={18} />
            </div>
          </div>
          <div className="card-big-value">367.500.000đ</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>15.0% phí thu thực tế</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>+14.2% gộp</span>
            </div>
            <div style={{ color: '#64748b' }}>
              Đã cấn trừ 35.000.000đ voucher sàn tài trợ
            </div>
          </div>
        </div>

        {/* Card 3: Dòng tiền cần thanh toán */}
        <div className="metric-card card-restaurants">
          <div className="card-top">
            <span className="card-top-title">DÒNG TIỀN CẦN THANH TOÁN</span>
            <div className="card-top-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#059669' }}>2.047.500.000đ</div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>128 / 150 quán đã chốt số</span>
              <span style={{ color: '#d97706', fontWeight: 700 }}>18 chờ chốt</span>
            </div>
            <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 99, marginBottom: 4 }}>
              <div style={{ width: '85%', height: '100%', background: '#059669', borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Hạn thanh toán: Thứ 3 (19/11/2024)
            </div>
          </div>
        </div>

        {/* Card 4: Tài khoản giữ chờ xử lý */}
        <div className="metric-card card-users">
          <div className="card-top">
            <span className="card-top-title">TÀI KHOẢN GIỮ CHỜ XỬ LÝ</span>
            <div className="card-top-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <Lock size={18} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#dc2626' }}>35.000.000đ</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.73rem' }}>
            <div style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <AlertTriangle size={13} />
              <span>12 vụ tranh chấp &amp; kiểm tra VSATTP</span>
            </div>
            <div style={{ color: '#64748b' }}>
              Cần rà soát gian lận voucher...
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span
                style={{ color: '#0284c7', cursor: 'pointer', fontWeight: 700 }}
                onClick={() => setActiveTab('ESCROW')}
              >
                Xem danh sách chặn
              </span>
              <span style={{ color: '#94a3b8' }}>Escrow v2.1</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MIDDLE SECTION: COMBO CHART & PAYMENT GATEWAY BREAKDOWN
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Left: Combo Bar + Spline Chart (Image 1/3 exact match) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                BIỂU ĐỒ TÀI CHÍNH KỲ HIỆN TẠI
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                Diễn biến GMV &amp; Phí Sàn 7 Ngày Gần Nhất
              </h3>
            </div>

            {/* Toggle chart tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
              <button
                className={`filter-chip ${chartMetric === 'GMV' ? 'active' : ''}`}
                style={{ height: 28, fontSize: '0.72rem', padding: '0 10px' }}
                onClick={() => setChartMetric('GMV')}
              >
                Doanh thu GMV
              </button>
              <button
                className={`filter-chip ${chartMetric === 'NET_FEE' ? 'active' : ''}`}
                style={{ height: 28, fontSize: '0.72rem', padding: '0 10px' }}
                onClick={() => setChartMetric('NET_FEE')}
              >
                Hoa hồng ròng
              </button>
              <button
                className={`filter-chip ${chartMetric === 'VOUCHER' ? 'active' : ''}`}
                style={{ height: 28, fontSize: '0.72rem', padding: '0 10px' }}
                onClick={() => setChartMetric('VOUCHER')}
              >
                Chi phí Voucher
              </button>
            </div>
          </div>

          {/* SVG Custom Combo Chart */}
          <div style={{ position: 'relative', width: '100%', height: 260, margin: '10px 0 16px' }}>
            <svg viewBox="0 0 650 250" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Y Axis Grid lines */}
              <line x1="45" y1="20" x2="630" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x="40" y="24" textAnchor="end" fontSize="11" fill="#94a3b8">500tr</text>

              <line x1="45" y1="70" x2="630" y2="70" stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x="40" y="74" textAnchor="end" fontSize="11" fill="#94a3b8">375tr</text>

              <line x1="45" y1="120" x2="630" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x="40" y="124" textAnchor="end" fontSize="11" fill="#94a3b8">250tr</text>

              <line x1="45" y1="170" x2="630" y2="170" stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x="40" y="174" textAnchor="end" fontSize="11" fill="#94a3b8">125tr</text>

              <line x1="45" y1="220" x2="630" y2="220" stroke="#e2e8f0" />
              <text x="40" y="224" textAnchor="end" fontSize="11" fill="#94a3b8">0</text>

              {/* 7 Vertical GMV Bars (Orange/brown rounded) */}
              {/* Mon (Thứ 2): 280tr -> height 112 -> y = 220 - 112 = 108 */}
              <rect x="75" y="112" width="36" height="108" rx="5" fill="#f97316" fillOpacity="0.85" />
              {/* Tue (Thứ 3): 310tr -> height 124 -> y = 96 */}
              <rect x="155" y="96" width="36" height="124" rx="5" fill="#f97316" fillOpacity="0.85" />
              {/* Wed (Thứ 4): 340tr -> height 136 -> y = 84 */}
              <rect x="235" y="84" width="36" height="136" rx="5" fill="#f97316" fillOpacity="0.85" />
              {/* Thu (Thứ 5): 370tr -> height 148 -> y = 72 */}
              <rect x="315" y="72" width="36" height="148" rx="5" fill="#f97316" fillOpacity="0.85" />
              {/* Fri (Thứ 6): 420tr -> height 168 -> y = 52 */}
              <rect x="395" y="52" width="36" height="168" rx="5" fill="#f97316" fillOpacity="0.85" />
              {/* Sat (Thứ 7 - Đỉnh): 480tr -> height 192 -> y = 28 */}
              <rect x="475" y="28" width="36" height="192" rx="5" fill="#c2410c" />
              {/* Sun (Chủ nhật): 440tr -> height 176 -> y = 44 */}
              <rect x="555" y="44" width="36" height="176" rx="5" fill="#f97316" fillOpacity="0.85" />

              {/* Sat Peak Tooltip Badge: 480tr (Đỉnh) */}
              <rect x="450" y="6" width="86" height="20" rx="10" fill="#0f172a" />
              <text x="493" y="19" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#ffffff">
                480tr (Đỉnh)
              </text>

              {/* Overlay Polyline: Hoa hồng sàn ròng (Net Fee) Line (Green) */}
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="3"
                points="
                  93,205
                  173,201
                  253,196
                  333,190
                  413,180
                  493,164
                  573,172
                "
              />

              {/* Data points (circles) for Net Fee */}
              <circle cx="93" cy="205" r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
              <circle cx="173" cy="201" r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
              <circle cx="253" cy="196" r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
              <circle cx="333" cy="190" r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
              <circle cx="413" cy="180" r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
              <circle cx="493" cy="164" r="5" fill="#ffffff" stroke="#059669" strokeWidth="3" />
              <circle cx="573" cy="172" r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />

              {/* X Axis Labels */}
              <text x="93" y="238" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">Thứ 2</text>
              <text x="173" y="238" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">Thứ 3</text>
              <text x="253" y="238" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">Thứ 4</text>
              <text x="333" y="238" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">Thứ 5</text>
              <text x="413" y="238" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">Thứ 6</text>
              <text x="493" y="238" textAnchor="middle" fontSize="11" fill="#c2410c" fontWeight="800">Thứ 7</text>
              <text x="573" y="238" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">Chủ nhật</text>
            </svg>
          </div>

          {/* Legend & Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: '#c2410c', borderRadius: 3, display: 'inline-block' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>GMV Thực tế</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 3, background: '#059669', display: 'inline-block' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>Hoa hồng sàn ròng (Net Fee)</span>
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Tỷ lệ tăng trưởng doanh số cuối tuần đạt <strong style={{ color: '#059669' }}>+28.4%</strong> so với các ngày trong tuần.
            </div>
          </div>
        </div>

        {/* Right: Payment Gateway & Reconciliation Structure (Image 1/3 exact match) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CƠ CẤU THANH TOÁN
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                Cổng thanh toán &amp; Đối chiếu
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '2px 0 0' }}>
                Dòng tiền thu qua các cổng thanh toán và phí tích hợp trung gian.
              </p>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart size={18} color="#ea580c" />
            </div>
          </div>

          {/* Breakdown items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
            {/* 1. Ví MoMo (48%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: '#a855f7' }} />
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Ví MoMo (48%)</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 14 }}>
                    Phí cổng: 1.1% (12.936.000đ)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>1.176.000.000đ</div>
                  <span style={{ fontSize: '0.68rem', color: '#059669', background: '#ecfdf5', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                    Đã đối soát 100%
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: 5, background: '#f3e8ff', borderRadius: 99 }}>
                <div style={{ width: '48%', height: '100%', background: '#a855f7', borderRadius: 99 }} />
              </div>
            </div>

            {/* 2. VNPay QR / Thẻ (28%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: '#0284c7' }} />
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>VNPay QR / Thẻ (28%)</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 14 }}>
                    Phí cổng: 1.0% (6.860.000đ)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>686.000.000đ</div>
                  <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#f0f9ff', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                    Khớp số tự động
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: 5, background: '#e0f2fe', borderRadius: 99 }}>
                <div style={{ width: '28%', height: '100%', background: '#0284c7', borderRadius: 99 }} />
              </div>
            </div>

            {/* 3. Tiền mặt COD (20%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: '#b45309' }} />
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Tiền mặt COD (20%)</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 14 }}>
                    Thu hộ Shipper đối soát
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>490.000.000đ</div>
                  <span style={{ fontSize: '0.68rem', color: '#b45309', background: '#fef3c7', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                    99.2% hoàn tất
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: 5, background: '#fef3c7', borderRadius: 99 }}>
                <div style={{ width: '20%', height: '100%', background: '#b45309', borderRadius: 99 }} />
              </div>
            </div>

            {/* 4. Visa / Master (4%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: '#475569' }} />
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Visa / Master (4%)</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 14 }}>
                    Phí cổng: 2.2% (2.156.000đ)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>98.000.000đ</div>
                  <span style={{ fontSize: '0.68rem', color: '#475569', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                    Đang xử lý T+1
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 99 }}>
                <div style={{ width: '4%', height: '100%', background: '#475569', borderRadius: 99 }} />
              </div>
            </div>
          </div>

          {/* Footer summary matching image */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 16,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tổng chi phí cổng:</span>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                21.952.000đ
              </div>
            </div>

            <button
              className="btn-action-sm"
              style={{ fontSize: '0.75rem', height: 32 }}
              onClick={() => alert('Đang xuất file đối soát cổng thanh toán (MoMo, VNPay, COD)...')}
            >
              <Download size={13} />
              <span>Xuất file đối chiếu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. PARTNER SETTLEMENT & RECONCILIATION TABLE
         ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel">
        <div className="filter-bar">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-styled"
              placeholder="Tìm theo Tên quán, Mã đối tác (#RES-xxxx)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginRight: 4 }}>Bộ lọc:</span>
            <button
              className={`filter-chip ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả (150)
            </button>
            <button
              className={`filter-chip ${activeTab === 'SETTLED' ? 'active' : ''}`}
              onClick={() => setActiveTab('SETTLED')}
            >
              Đã chốt đối soát (128)
            </button>
            <button
              className={`filter-chip ${activeTab === 'PENDING' ? 'active' : ''}`}
              onClick={() => setActiveTab('PENDING')}
            >
              Chờ xác nhận (18)
            </button>
            <button
              className={`filter-chip ${activeTab === 'ESCROW' ? 'active' : ''}`}
              onClick={() => setActiveTab('ESCROW')}
            >
              Đang giữ tiền (4)
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Bảng Kê</th>
                <th>Nhà Hàng Đối Tác</th>
                <th>Tổng Đơn</th>
                <th>Doanh Thu GMV</th>
                <th>Phí Sàn (15%)</th>
                <th>Voucher Sàn</th>
                <th>Thực Nhận Chuyển Khoản</th>
                <th>Trạng Thái Quyết Toán</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                    Không tìm thấy bản ghi quyết toán nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ea580c', fontSize: '0.85rem' }}>
                        #{item.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#0f172a' }}>{item.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {item.resId} • {item.bankInfo}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{item.ordersCount}</strong> đơn
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{money(item.gmv)}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>-{money(item.commission)}</span>
                    </td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: 600 }}>+{money(item.voucherSupport)}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                        {money(item.netPayout)}
                      </strong>
                    </td>
                    <td>
                      {item.status === 'SETTLED' && (
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Đã giải ngân
                        </span>
                      )}
                      {item.status === 'PENDING' && (
                        <span style={{ background: '#fff7ed', color: '#ea580c', padding: '4px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> Chờ giải ngân
                        </span>
                      )}
                      {item.status === 'ESCROW_HOLD' && (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Lock size={12} /> Tạm giữ Escrow
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn-action-sm"
                          title="Xem chi tiết bảng kê"
                          onClick={() => setDetailSettlement(item)}
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </button>

                        {item.status === 'PENDING' && (
                          <button
                            className="btn-action-sm"
                            style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontWeight: 700 }}
                            onClick={() => {
                              setSettlements((prev) =>
                                prev.map((s) => (s.id === item.id ? { ...s, status: 'SETTLED' } : s))
                              );
                              showToast('success', `Đã giải ngân thành công ${money(item.netPayout)} cho "${item.name}"`);
                            }}
                          >
                            <Zap size={13} />
                            <span>Giải ngân</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL: EXECUTE BATCH PAYOUT (QUYẾT TOÁN KỲ)
         ───────────────────────────────────────────────────────────── */}
      {showPayoutModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#9a3412',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    Thực Hiện Quyết Toán Kỳ Này
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {selectedCycle} • Tự động giải ngân Napas 24/7
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowPayoutModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Số lượng đối tác giải ngân đợt này:</span>
                  <strong style={{ color: '#0f172a' }}>18 nhà hàng</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Cổng ngân hàng liên kết:</span>
                  <strong style={{ color: '#0284c7' }}>Vietcombank Corporate Payout API</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Tổng tiền chuyển khoản:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                    2.047.500.000đ
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#9a3412',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ShieldCheck size={18} color="#ea580c" style={{ flexShrink: 0 }} />
                <span>
                  Lệnh giải ngân sẽ được ký số bằng chứng thư số doanh nghiệp và gửi biến động số dư tức thì qua SMS/Email cho chủ nhà hàng.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-action-sm"
                style={{ height: 38 }}
                onClick={() => setShowPayoutModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="btn btn-primary"
                style={{ height: 38, background: '#9a3412', display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={payoutLoading}
                onClick={handleExecuteBatchPayout}
              >
                {payoutLoading ? <RotateCw size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>{payoutLoading ? 'Đang gửi lệnh Bank...' : 'Xác nhận Quyết toán ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: DETAILED PARTNER SETTLEMENT
         ───────────────────────────────────────────────────────────── */}
      {detailSettlement && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  Bảng Kê Chi Tiết #{detailSettlement.id}
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {detailSettlement.name} ({detailSettlement.resId})
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailSettlement(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tài khoản nhận tiền</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{detailSettlement.bankInfo}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tổng đơn hoàn tất</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{detailSettlement.ordersCount} đơn</div>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                  <span>Tổng doanh số gộp (GMV):</span>
                  <strong>{money(detailSettlement.gmv)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem', color: '#ea580c' }}>
                  <span>Chiết khấu hoa hồng sàn (15%):</span>
                  <strong>-{money(detailSettlement.commission)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem', color: '#059669' }}>
                  <span>Voucher sàn Warm Feast đồng tài trợ:</span>
                  <strong>+{money(detailSettlement.voucherSupport)}</strong>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <strong>Thực nhận chuyển khoản:</strong>
                  <strong style={{ color: '#059669' }}>{money(detailSettlement.netPayout)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-action-sm"
                style={{ height: 38 }}
                onClick={() => setDetailSettlement(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Clock({ size, color }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
