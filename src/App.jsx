import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import QRScannerModal from './components/QRScannerModal';
import {
  Users, UserCheck, UserX, DollarSign, Plus, Trash2, RefreshCw, Search,
  Download, CheckCircle2, Dumbbell, Apple, Activity, Shield, Settings,
  CreditCard, Calendar, FileText, AlertTriangle, LogOut, Lock, Mail, 
  Dumbbell as GymIcon, QrCode, Bell, Send, CheckCircle, Receipt, TrendingUp, Trophy,
  KeyRound, Wrench, Check, Gauge, Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gym_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeModule, setActiveModule] = useState(0);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, expiredMembers: 0, totalRevenue: 0 });
  const [expiringAlerts, setExpiringAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState({ name: 'Monthly', fee: 1000 });
  const [alertMsg, setAlertMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Feature 6: Live Occupancy & Crowd Capacity Metrics
  const maxCapacity = 50;
  const [currentOccupancy, setCurrentOccupancy] = useState(28); // 28 out of 50 active inside
  const occupancyPercentage = Math.round((currentOccupancy / maxCapacity) * 100);

  const hourlyCrowdData = [
    { hour: '6 AM', count: 18 },
    { hour: '7 AM', count: 38 },
    { hour: '8 AM', count: 42 },
    { hour: '9 AM', count: 25 },
    { hour: '12 PM', count: 12 },
    { hour: '4 PM', count: 20 },
    { hour: '6 PM', count: 46 },
    { hour: '7 PM', count: 48 },
    { hour: '8 PM', count: 35 },
    { hour: '9 PM', count: 15 }
  ];

  // Smart Lockers
  const [lockers, setLockers] = useState([
    { id: 'L-01', status: 'Occupied', assignedTo: 'Rahul Sharma', pinSet: true },
    { id: 'L-02', status: 'Occupied', assignedTo: 'John Member', pinSet: true },
    { id: 'L-03', status: 'Available', assignedTo: null, pinSet: false },
    { id: 'L-04', status: 'Maintenance', assignedTo: null, pinSet: false },
    { id: 'L-05', status: 'Available', assignedTo: null, pinSet: false },
    { id: 'L-06', status: 'Occupied', assignedTo: 'Sneha Patel', pinSet: true },
    { id: 'L-07', status: 'Available', assignedTo: null, pinSet: false },
    { id: 'L-08', status: 'Available', assignedTo: null, pinSet: false }
  ]);

  const [equipmentList, setEquipmentList] = useState([
    { name: 'Treadmill #2 (Matrix)', status: 'Operational', lastCheck: '2026-08-15', floor: 'Cardio Zone' },
    { name: 'Cable Cross Machine', status: 'Maintenance Required', lastCheck: '2026-08-20', floor: 'Main Floor' },
    { name: 'Olympic Smith Machine', status: 'Operational', lastCheck: '2026-08-10', floor: 'Free Weights' },
    { name: 'Leg Press 45°', status: 'Operational', lastCheck: '2026-08-18', floor: 'Leg Area' }
  ]);

  const [weightHistory, setWeightHistory] = useState([
    { month: 'Mar', weight: 82, bmi: 26.5 },
    { month: 'Apr', weight: 80.5, bmi: 26.0 },
    { month: 'May', weight: 79, bmi: 25.4 },
    { month: 'Jun', weight: 77.5, bmi: 24.9 },
    { month: 'Jul', weight: 76, bmi: 24.4 },
    { month: 'Aug', weight: 74.5, bmi: 23.9 }
  ]);

  const [prRecords, setPrRecords] = useState([
    { lift: 'Bench Press', pr: '100 kg', date: '2026-08-10' },
    { lift: 'Barbell Squat', pr: '140 kg', date: '2026-08-18' },
    { lift: 'Deadlift', pr: '175 kg', date: '2026-08-22' },
    { lift: 'Overhead Press', pr: '65 kg', date: '2026-07-30' }
  ]);

  const [workoutList, setWorkoutList] = useState([
    { day: 'Monday', exercise: 'Bench Press', sets: 4, reps: 10 },
    { day: 'Wednesday', exercise: 'Barbell Squats', sets: 4, reps: 8 },
    { day: 'Friday', exercise: 'Deadlifts', sets: 3, reps: 6 }
  ]);
  const [dietNote, setDietNote] = useState('2200 kcal/day: 160g Protein, 200g Carbs, 60g Fats. Drink 3.5L water.');

  const [formData, setFormData] = useState({
    name: '', phone: '', planType: 'Monthly', amountPaid: '', healthNotes: ''
  });

  const fetchData = async () => {
    try {
      const [membersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/members?search=${search}&status=${filter}`),
        axios.get(`${API_BASE}/members/stats`)
      ]);
      setMembers(membersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/members/alerts/expiring?days=7`);
      setExpiringAlerts(res.data);
    } catch (err) {
      setExpiringAlerts([]);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      fetchAlerts();
    }
  }, [search, filter, currentUser]);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 3500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });
      setCurrentUser(res.data);
      localStorage.setItem('gym_user', JSON.stringify(res.data));
      setActiveModule(0);
      showAlert(`Welcome back, ${res.data.name}!`);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gym_user');
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setActiveModule(0);
  };

  const fillCredentials = (email, pass) => {
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  const handleQRScanned = async (memberId) => {
    setIsScannerOpen(false);
    try {
      await axios.post(`${API_BASE}/members/${memberId}/checkin`);
      fetchData();
      setCurrentOccupancy(prev => Math.min(maxCapacity, prev + 1));
      showAlert('✅ Attendance recorded via QR pass! (Occupancy +1)');
    } catch (err) {
      showAlert(err.response?.data?.error || 'QR check-in failed or invalid ID');
    }
  };

  const toggleLocker = (id) => {
    setLockers(prev => prev.map(l => {
      if (l.id === id) {
        if (l.status === 'Available') {
          return { ...l, status: 'Occupied', assignedTo: currentUser.name, pinSet: true };
        } else if (l.status === 'Occupied') {
          return { ...l, status: 'Available', assignedTo: null, pinSet: false };
        } else {
          return { ...l, status: 'Available', assignedTo: null };
        }
      }
      return l;
    }));
    showAlert(`Updated status for Locker ${id}`);
  };

  const generatePDFInvoice = (item) => {
    const doc = new jsPDF();
    const invoiceNo = `INV-${item._id ? item._id.slice(-6).toUpperCase() : '2026-01'}`;
    const invoiceDate = new Date().toLocaleDateString();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('FITCORE GYM & FITNESS CLUB', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Official Fee Receipt & Tax Invoice', 14, 28);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoiceNo}`, 14, 50);
    doc.text(`Date of Issue: ${invoiceDate}`, 14, 56);
    doc.text(`Payment Mode: Online Gateway (Verified)`, 14, 62);

    doc.text(`Billed To:`, 140, 50);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.name || currentUser.name}`, 140, 56);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Phone: ${item.phone || currentUser.phone || '9876543210'}`, 140, 62);

    doc.autoTable({
      startY: 72,
      head: [['Description', 'Plan Validity', 'Health Flags', 'Amount Paid']],
      body: [
        [
          `Gym Membership (${item.planType || 'Monthly'})`,
          item.endDate ? new Date(item.endDate).toLocaleDateString() : '30 Days Access',
          item.healthNotes || 'Standard Clearance',
          `INR ${item.amountPaid || 1000}`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Amount: INR ${item.amountPaid || 1000}`, 14, finalY);
    doc.setTextColor(16, 185, 129);
    doc.text(`Status: PAID (Thank you for training with us!)`, 14, finalY + 7);

    doc.save(`FitCore_Receipt_${invoiceNo}.pdf`);
    showAlert('PDF receipt generated & downloaded!');
  };

  const processOnlinePayment = async () => {
    setShowPaymentModal(false);
    showAlert('Processing payment...');
    setTimeout(() => {
      showAlert(`Payment of ₹${selectedPlanForPayment.fee} Successful! Membership Renewed.`);
      generatePDFInvoice({
        name: currentUser.name,
        phone: currentUser.phone,
        planType: selectedPlanForPayment.name,
        amountPaid: selectedPlanForPayment.fee,
        healthNotes: currentUser.healthNotes
      });
      fetchData();
    }, 1200);
  };

  const getDaysRemainingText = (endDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return <span className="text-emerald-400 font-semibold">{diffDays} days left</span>;
    } else if (diffDays === 0) {
      return <span className="text-amber-400 font-semibold">Expires today</span>;
    } else {
      return <span className="text-rose-400 font-semibold">{Math.abs(diffDays)} days overdue</span>;
    }
  };

  const exportToCSV = () => {
    if (members.length === 0) return alert('No data to export');
    const headers = ['Name,Phone,Plan,Amount Paid,Status,Expires On,Health Notes'];
    const rows = members.map(m => 
      `"${m.name}","${m.phone}","${m.planType}","${m.amountPaid}","${m.status}","${new Date(m.endDate).toLocaleDateString()}","${m.healthNotes || 'None'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gym_Members_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const revenueChartData = [
    { month: 'May', revenue: 14000 },
    { month: 'Jun', revenue: 18500 },
    { month: 'Jul', revenue: 22000 },
    { month: 'Aug', revenue: stats.totalRevenue || 27000 }
  ];

  const planTierPieData = [
    { name: 'Monthly', count: members.filter(m => m.planType === 'Monthly').length || 4, color: '#6366f1' },
    { name: 'Quarterly', count: members.filter(m => m.planType === 'Quarterly').length || 3, color: '#10b981' },
    { name: 'Annual', count: members.filter(m => m.planType === 'Annual').length || 2, color: '#f59e0b' }
  ];

  const adminModules = [
    'Dashboard & Analytics',
    'Member Management',
    'Subscription Plans',
    'Billing & Invoices',
    'Staff & Trainers',
    'Facility, Lockers & Assets',
    'Reports & Export',
    'System Settings'
  ];

  const trainerModules = [
    'Attendance Check-In',
    'Assigned Trainees',
    'Health Flags',
    'Workout Builder',
    'Diet Planner',
    'Progress Tracker',
    'Equipment & Locker Grid',
    'Live Crowd & Slot Schedule'
  ];

  const memberModules = [
    'Profile & ID Card',
    'My Subscription',
    'Payment Receipts',
    'Attendance History',
    'Workout Routine',
    'Diet & Nutrition',
    'Progress Stats & PRs',
    'Live Crowd Meter & Feedback'
  ];

  const currentModulesList = 
    currentUser?.role === 'admin' ? adminModules :
    currentUser?.role === 'trainer' ? trainerModules : memberModules;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-400 rounded-xl mb-1 border border-indigo-500/20">
              <GymIcon size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">FitCore Portal</h1>
            <p className="text-xs text-slate-400">Sign in to access your role-specific dashboard</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={15} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input
                  required
                  type="email"
                  placeholder="name@gym.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition text-xs shadow-md mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wider">Quick Fill Demo Roles</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => fillCredentials('admin@gym.com', 'admin123')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-center transition"
              >
                <p className="text-xs font-bold text-indigo-400">Admin</p>
                <p className="text-[10px] text-slate-500">Owner</p>
              </button>
              <button
                onClick={() => fillCredentials('trainer@gym.com', 'trainer123')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-center transition"
              >
                <p className="text-xs font-bold text-emerald-400">Trainer</p>
                <p className="text-[10px] text-slate-500">Coach</p>
              </button>
              <button
                onClick={() => fillCredentials('member@gym.com', 'member123')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-center transition"
              >
                <p className="text-xs font-bold text-amber-400">Member</p>
                <p className="text-[10px] text-slate-500">Client</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {alertMsg && (
        <div className="fixed top-5 right-5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-2xl z-50 text-sm font-medium animate-bounce flex items-center gap-2">
          <span>{alertMsg}</span>
        </div>
      )}

      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg font-black tracking-widest text-white text-xs">FITCORE</div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">Gym & Facility Manager</h1>
            <p className="text-[11px] text-slate-400">Signed in as <span className="text-indigo-400 font-semibold uppercase">{currentUser.role}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400">{currentUser.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">
            {currentUser.role} Modules (8)
          </div>
          {currentModulesList.map((modName, idx) => (
            <button
              key={modName}
              onClick={() => setActiveModule(idx)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                activeModule === idx ? 'bg-indigo-600 text-white font-semibold shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span>{idx + 1}. {modName}</span>
              {activeModule === idx && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto max-w-6xl">
          <div className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{currentModulesList[activeModule]}</h2>
              <p className="text-slate-400 text-xs mt-0.5">Module {activeModule + 1} of 8 • Active Workspace</p>
            </div>
            
            <div className="flex items-center gap-2">
              {(currentUser.role === 'admin' || currentUser.role === 'trainer') && (
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
                >
                  <QrCode size={15} className="text-indigo-400" /> Open QR Scanner
                </button>
              )}
              {currentUser.role === 'admin' && activeModule === 1 && (
                <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
                >
                  <Plus size={15} /> Add Member
                </button>
              )}
            </div>
          </div>

          {/* ROLE 1: ADMIN */}
          {currentUser.role === 'admin' && (
            <div className="space-y-6">
              {expiringAlerts.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-300">
                        {expiringAlerts.length} Membership(s) Expiring Within 7 Days
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {expiringAlerts.map(m => m.name).join(', ')} require automated renewal follow-up.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => showAlert(`Dispatched automated WhatsApp/SMS payment reminders to ${expiringAlerts.length} members!`)}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow"
                  >
                    <Send size={13} /> Send Reminders
                  </button>
                </div>
              )}

              {/* Module 1: Dashboard Stats, Revenue, and Feature 6 Live Crowd Gauge */}
              {activeModule === 0 && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={22} /></div>
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase">Total Members</p>
                          <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg"><UserCheck size={22} /></div>
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase">Active</p>
                          <p className="text-2xl font-bold text-white">{stats.activeMembers}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg"><UserX size={22} /></div>
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase">Expired</p>
                          <p className="text-2xl font-bold text-white">{stats.expiredMembers}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg"><DollarSign size={22} /></div>
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase">Revenue</p>
                          <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature 6: Real-Time Gym Floor Crowd Gauge */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Gauge size={18} className="text-indigo-400" /> Live Facility Crowd Density Gauge
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Currently <span className="text-white font-bold">{currentOccupancy} of {maxCapacity}</span> active members on floor
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                        occupancyPercentage > 80 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        occupancyPercentage > 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {occupancyPercentage > 80 ? 'Peak Rush (Crowded)' : occupancyPercentage > 50 ? 'Moderate Occupancy' : 'Quiet / Ideal Slot'} ({occupancyPercentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          occupancyPercentage > 80 ? 'bg-rose-500' : occupancyPercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Revenue Growth (₹)</h3>
                        <TrendingUp size={16} className="text-indigo-400" />
                      </div>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueChartData}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }} />
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hourly Peak-Time Rush Breakdown</h3>
                        <Clock size={16} className="text-amber-400" />
                      </div>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={hourlyCrowdData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Members Present" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Module 2: Member Management */}
              {activeModule === 1 && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      placeholder="Search member by name or phone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase">
                        <tr>
                          <th className="p-3">Member</th>
                          <th className="p-3">Plan & Expiry</th>
                          <th className="p-3">Health Notes</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Invoice / Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {members.map(m => (
                          <tr key={m._id}>
                            <td className="p-3 font-semibold text-white">{m.name} <span className="block text-[10px] text-slate-400">{m.phone}</span></td>
                            <td className="p-3">
                              <div className="text-white font-medium">{m.planType} (₹{m.amountPaid})</div>
                              <div className="text-[11px] mt-0.5">{getDaysRemainingText(m.endDate)}</div>
                            </td>
                            <td className="p-3">{m.healthNotes || 'None'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button 
                                onClick={() => generatePDFInvoice(m)} 
                                title="Download PDF Tax Invoice"
                                className="text-indigo-400 hover:text-indigo-300 p-1"
                              >
                                <Receipt size={14} />
                              </button>
                              <button onClick={() => axios.delete(`${API_BASE}/members/${m._id}`).then(fetchData)} className="text-rose-400 hover:text-rose-300 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Module 3: Plan Config */}
              {activeModule === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[{ name: 'Monthly', fee: '₹1,000', period: '30 Days' }, { name: 'Quarterly', fee: '₹2,500', period: '90 Days' }, { name: 'Annual', fee: '₹8,000', period: '365 Days' }].map(p => (
                    <div key={p.name} className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                      <h4 className="text-base font-bold text-white">{p.name}</h4>
                      <p className="text-2xl font-extrabold text-indigo-400 mt-2">{p.fee}</p>
                      <p className="text-xs text-slate-400 mt-1">Validity: {p.period}</p>
                      <button onClick={() => showAlert('Plan settings updated')} className="mt-4 w-full bg-slate-800 hover:bg-slate-700 py-1.5 rounded text-xs font-medium">Edit Tier</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Module 4: Invoices & Tax Receipts */}
              {activeModule === 3 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h3 className="text-sm font-semibold text-white mb-3">Recent Transactions & Official Tax Invoices</h3>
                  <div className="divide-y divide-slate-800 text-xs">
                    {members.map(m => (
                      <div key={m._id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{m.name}</p>
                          <p className="text-[10px] text-slate-400">Invoice #INV-{m._id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-emerald-400 font-bold">+₹{m.amountPaid}</span>
                          <button
                            onClick={() => generatePDFInvoice(m)}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-[11px] text-indigo-300 transition"
                          >
                            <Download size={12} /> PDF Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Module 5: Staff */}
              {activeModule === 4 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-white">Active Floor Trainers</h3>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-white">Coach Alex</p>
                      <p className="text-[10px] text-slate-400">Specialization: Strength & Conditioning</p>
                    </div>
                    <span className="text-[10px] bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded">Shift: Morning (06:00 - 14:00)</span>
                  </div>
                </div>
              )}

              {/* Module 6: Lockers & Assets */}
              {activeModule === 5 && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <KeyRound size={16} className="text-indigo-400" /> Smart Locker Allocation Matrix
                        </h3>
                        <p className="text-[11px] text-slate-400">Click any locker block to allocate or release</p>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Available</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-600"></span> Occupied</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Maintenance</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {lockers.map(l => (
                        <div
                          key={l.id}
                          onClick={() => toggleLocker(l.id)}
                          className={`p-4 rounded-xl border transition cursor-pointer select-none text-center ${
                            l.status === 'Available'
                              ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500'
                              : l.status === 'Occupied'
                              ? 'bg-indigo-600/10 border-indigo-500/30 hover:border-indigo-500'
                              : 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                            <span className="font-mono font-bold text-white">{l.id}</span>
                            <span className={`text-[10px] font-bold ${
                              l.status === 'Available' ? 'text-emerald-400' : l.status === 'Occupied' ? 'text-indigo-400' : 'text-rose-400'
                            }`}>{l.status}</span>
                          </div>
                          <p className="text-xs font-semibold text-white truncate">{l.assignedTo || 'Unassigned'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Wrench size={16} className="text-amber-400" /> Gym Equipment Health Status
                    </h3>
                    <div className="space-y-2">
                      {equipmentList.map(eq => (
                        <div key={eq.name} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-white">{eq.name}</p>
                            <p className="text-[10px] text-slate-400">Zone: {eq.floor} • Last Inspection: {eq.lastCheck}</p>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded font-semibold ${eq.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {eq.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 6 && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 text-center">
                  <FileText className="mx-auto text-indigo-400" size={36} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Download System Report</h3>
                    <p className="text-xs text-slate-400 mt-1">Export full database logs with timestamps, fees, and health status.</p>
                  </div>
                  <button onClick={exportToCSV} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-2">
                    <Download size={14} /> Download CSV Export
                  </button>
                </div>
              )}

              {activeModule === 7 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
                  <h3 className="text-sm font-semibold text-white">RBAC Security Settings</h3>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span>Enforce Daily Automated Expiration (Cron)</span>
                    <span className="text-emerald-400 font-semibold">Active (00:00 UTC)</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span>MongoDB Atlas Connection Whitelist</span>
                    <span className="text-emerald-400 font-semibold">Configured</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROLE 2: TRAINER */}
          {currentUser.role === 'trainer' && (
            <div className="space-y-4">
              {activeModule === 0 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Attendance Marker</h3>
                    <button
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow"
                    >
                      <QrCode size={14} /> Scan Pass
                    </button>
                  </div>
                  {members.map(m => (
                    <div key={m._id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                      <div>
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.planType} • {m.status}</p>
                      </div>
                      <button 
                        onClick={() => showAlert(`${m.name} checked in!`)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-1 rounded text-xs font-medium"
                      >
                        Manual Entry
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeModule === 1 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h3 className="text-sm font-semibold text-white mb-2">My Direct Trainees</h3>
                  <p className="text-xs text-slate-400">Total assigned clients: {members.length}</p>
                </div>
              )}

              {activeModule === 2 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2 text-xs">
                  <h3 className="text-sm font-semibold text-white mb-2">Member Medical Precaution List</h3>
                  {members.map(m => (
                    <div key={m._id} className="p-2.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="font-bold text-white">{m.name}</span>
                      <span className="text-rose-400">{m.healthNotes || 'None'}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeModule === 3 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 text-xs">
                  <h3 className="text-sm font-semibold text-white">Active Workout Routine Split</h3>
                  {workoutList.map((w, i) => (
                    <div key={i} className="p-3 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="font-bold text-indigo-400">{w.day}</span>
                      <span>{w.exercise}</span>
                      <span>{w.sets} Sets x {w.reps} Reps</span>
                    </div>
                  ))}
                </div>
              )}

              {activeModule === 4 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2 text-xs">
                  <h3 className="text-sm font-semibold text-white">Client Nutrition Guidelines</h3>
                  <textarea 
                    value={dietNote} 
                    onChange={(e) => setDietNote(e.target.value)} 
                    className="w-full bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 text-xs h-24 focus:outline-none"
                  />
                  <button onClick={() => showAlert('Diet instructions updated')} className="bg-indigo-600 px-3 py-1.5 rounded text-white font-medium">Save Meal Plan</button>
                </div>
              )}

              {activeModule === 5 && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Weight Loss Trajectory (kg)</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                          <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="weight" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 6 && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <KeyRound size={16} className="text-indigo-400" /> Floor Locker Availability
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {lockers.map(l => (
                        <div key={l.id} className={`p-2 rounded-lg text-center text-xs font-mono font-bold ${
                          l.status === 'Available' ? 'bg-emerald-500/20 text-emerald-300' : l.status === 'Occupied' ? 'bg-indigo-600/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {l.id}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 text-xs">
                    <h3 className="text-sm font-semibold text-white">Report Gym Floor Issue</h3>
                    <input type="text" placeholder="e.g. Cable Cross frayed wire on Left Pulley" className="w-full bg-slate-950 p-2.5 rounded border border-slate-800 text-white" />
                    <button onClick={() => showAlert('Issue ticket logged for Admin')} className="bg-rose-600 px-3 py-1.5 rounded text-white font-semibold">Submit Floor Alert</button>
                  </div>
                </div>
              )}

              {/* Module 8: Feature 6 - Trainer Crowd Overview & Slot Schedule */}
              {activeModule === 7 && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Gauge size={16} className="text-indigo-400" /> Gym Floor Occupancy
                    </h3>
                    <p className="text-slate-300">
                      Currently <span className="font-bold text-white">{currentOccupancy} of {maxCapacity} slots</span> filled ({occupancyPercentage}% capacity).
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                    <h3 className="text-sm font-semibold text-white">Personal Training Slots</h3>
                    <div className="divide-y divide-slate-800">
                      <div className="py-2 flex justify-between"><span>07:00 AM - 08:00 AM</span><span className="text-rose-400 font-semibold">Booked (Rahul Sharma)</span></div>
                      <div className="py-2 flex justify-between"><span>09:00 AM - 10:00 AM</span><span className="text-emerald-400 font-semibold">Available</span></div>
                      <div className="py-2 flex justify-between"><span>05:30 PM - 06:30 PM</span><span className="text-rose-400 font-semibold">Booked (John Member)</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROLE 3: MEMBER */}
          {currentUser.role === 'member' && (
            <div className="space-y-4">
              {activeModule === 0 && (
                <div className="max-w-sm bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 rounded-2xl shadow-xl space-y-5 text-center">
                  <div className="flex justify-between items-center text-left">
                    <span className="text-[11px] font-bold tracking-widest text-indigo-300">FITCORE DIGITAL PASS</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">VERIFIED</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl inline-block shadow-lg">
                    <QRCodeSVG value={currentUser._id || 'sample_member_id'} size={140} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Scan at reception for entry</p>
                  </div>

                  <div className="text-xs text-slate-400 border-t border-indigo-800/40 pt-3 flex justify-between">
                    <span>Plan: {currentUser.planType || 'Quarterly'}</span>
                    <span className="text-emerald-400 font-semibold">{currentUser.status || 'Active'}</span>
                  </div>
                </div>
              )}

              {activeModule === 1 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-xs space-y-4">
                  <h3 className="text-sm font-semibold text-white">Subscription & Instant Renewal</h3>
                  
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Current Plan: {currentUser.planType || 'Quarterly'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Status: Active</p>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow transition flex items-center gap-1.5"
                    >
                      <CreditCard size={14} /> Renew Online (Instant)
                    </button>
                  </div>
                </div>
              )}

              {activeModule === 2 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-xs space-y-3">
                  <h3 className="text-sm font-semibold text-white">Payment Receipts & Tax Invoices</h3>
                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white text-xs">Official Fee Receipt #INV-2026-01</p>
                      <p className="text-[10px] text-slate-400">Paid: ₹2,500 via Online Gateway</p>
                    </div>
                    <button
                      onClick={() => generatePDFInvoice({
                        name: currentUser.name,
                        phone: currentUser.phone,
                        planType: currentUser.planType || 'Quarterly',
                        amountPaid: 2500,
                        healthNotes: currentUser.healthNotes
                      })}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow transition"
                    >
                      <Download size={13} /> Download PDF
                    </button>
                  </div>
                </div>
              )}

              {activeModule === 3 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-xs">
                  <h3 className="text-sm font-semibold text-white mb-2">My Attendance Check-ins</h3>
                  <p className="text-slate-400">Total Check-ins this month: 14 sessions (Consistency: 85%)</p>
                </div>
              )}

              {activeModule === 4 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-xs space-y-2">
                  <h3 className="text-sm font-semibold text-white">Assigned Daily Plan</h3>
                  <p className="text-indigo-400 font-semibold">Today's Focus: Chest & Triceps</p>
                  <ul className="list-disc pl-4 text-slate-300 space-y-1">
                    <li>Bench Press - 4 Sets x 10 Reps</li>
                    <li>Incline Dumbbell Press - 3 Sets x 12 Reps</li>
                    <li>Tricep Rope Pushdowns - 4 Sets x 15 Reps</li>
                  </ul>
                </div>
              )}

              {activeModule === 5 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-xs space-y-2">
                  <h3 className="text-sm font-semibold text-white">Diet & Meal Target</h3>
                  <p className="text-slate-300">{dietNote}</p>
                </div>
              )}

              {activeModule === 6 && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-white">6-Month Body Transformation Trend</h3>
                        <p className="text-[11px] text-slate-400">Weight drop from 82 kg to 74.5 kg (-7.5 kg)</p>
                      </div>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded font-bold border border-emerald-500/20">BMI: 23.9 (Healthy)</span>
                    </div>

                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightHistory}>
                          <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                          <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" name="Bodyweight (kg)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy size={18} className="text-amber-400" />
                      <h3 className="text-sm font-bold text-white">Personal Records (1-Rep Max)</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {prRecords.map(pr => (
                        <div key={pr.lift} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                          <p className="text-[11px] text-slate-400 font-medium">{pr.lift}</p>
                          <p className="text-lg font-black text-indigo-400 mt-1">{pr.pr}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Set: {pr.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Module 8: Feature 6 - Member's Live Crowd Meter & Feedback */}
              {activeModule === 7 && (
                <div className="space-y-4 text-xs">
                  {/* Live Crowd Meter */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Gauge size={16} className="text-indigo-400" /> Real-Time Gym Floor Crowd Meter
                      </h3>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {occupancyPercentage}% Full
                      </span>
                    </div>
                    <p className="text-slate-400">
                      Currently <span className="text-white font-bold">{currentOccupancy} / {maxCapacity}</span> people working out right now. Ideal time to train!
                    </p>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${occupancyPercentage}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/30 p-5 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-[11px]">My Allocated Locker</p>
                      <h3 className="text-xl font-black text-white mt-0.5">Locker #L-02</h3>
                      <p className="text-emerald-400 text-[10px] mt-1">Smart Electronic Key PIN Active</p>
                    </div>
                    <KeyRound size={28} className="text-indigo-400" />
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                    <h3 className="text-sm font-semibold text-white">Facility Inquiries & Feedback</h3>
                    <textarea placeholder="Submit locker reassignment request or report broken gym fixture..." className="w-full bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 h-20 focus:outline-none" />
                    <button onClick={() => showAlert('Feedback submitted to management')} className="bg-indigo-600 px-3 py-1.5 rounded text-white font-medium">Send Feedback</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleQRScanned} 
      />

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-400" /> Secure Payment Gateway
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Select Renewal Tier</label>
                <select 
                  onChange={(e) => {
                    const plan = e.target.value;
                    const fee = plan === 'Monthly' ? 1000 : plan === 'Quarterly' ? 2500 : 8000;
                    setSelectedPlanForPayment({ name: plan, fee });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="Monthly">Monthly Plan - ₹1,000 (30 Days)</option>
                  <option value="Quarterly">Quarterly Plan - ₹2,500 (90 Days)</option>
                  <option value="Annual">Annual Plan - ₹8,000 (365 Days)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Subscription Tier:</span>
                  <span className="text-white font-medium">{selectedPlanForPayment.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST & Platform Charges:</span>
                  <span className="text-emerald-400 font-medium">₹0 (Waived)</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Total Payable:</span>
                  <span className="text-indigo-400">₹{selectedPlanForPayment.fee}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dummy Card Number (Auto-Approved for Demo)</label>
                <input 
                  type="text" 
                  disabled 
                  value="•••• •••• •••• 4242" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-400 font-mono"
                />
              </div>

              <button
                onClick={processOnlinePayment}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition text-xs shadow-lg mt-2 flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={15} /> Confirm & Pay ₹{selectedPlanForPayment.fee}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-white">Enroll New Gym Member</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await axios.post(`${API_BASE}/members`, formData);
                setShowModal(false);
                setFormData({ name: '', phone: '', planType: 'Monthly', amountPaid: '', healthNotes: '' });
                fetchData();
                showAlert('Member created successfully!');
              } catch (err) {
                showAlert('Failed to save');
              }
            }} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Phone</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Plan Duration</label>
                  <select value={formData.planType} onChange={(e) => setFormData({ ...formData, planType: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fee (₹)</label>
                  <input required type="number" value={formData.amountPaid} onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Health Notes</label>
                <input type="text" placeholder="e.g. Asthma, Back pain" value={formData.healthNotes} onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-800 text-white rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded font-bold">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}