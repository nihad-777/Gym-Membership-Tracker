import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  UserX, 
  DollarSign, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/members';

export default function App() {
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, expiredMembers: 0, totalRevenue: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    planType: 'Monthly',
    amountPaid: '',
    healthNotes: ''
  });

  const fetchData = async () => {
    try {
      const [membersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}?search=${search}&status=${filter}`),
        axios.get(`${API_BASE}/stats`)
      ]);
      setMembers(membersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filter]);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_BASE, formData);
      setShowModal(false);
      setFormData({ name: '', phone: '', planType: 'Monthly', amountPaid: '', healthNotes: '' });
      fetchData();
      showAlert('Member enrolled successfully!');
    } catch (err) {
      showAlert('Failed to add member');
    }
  };

  const handleRenew = async (id, planType) => {
    const fee = planType === 'Monthly' ? 1000 : planType === 'Quarterly' ? 2500 : 8000;
    try {
      await axios.put(`${API_BASE}/${id}/renew`, { planType, amountPaid: fee });
      fetchData();
      showAlert('Plan renewed successfully!');
    } catch (err) {
      showAlert('Failed to renew plan');
    }
  };

  const handleCheckIn = async (id, name, status) => {
    if (status === 'Expired') {
      showAlert(`Cannot check in ${name}: Plan is expired!`);
      return;
    }
    try {
      await axios.post(`${API_BASE}/${id}/checkin`);
      fetchData();
      showAlert(` ${name} checked in successfully!`);
    } catch (err) {
      showAlert('Check-in failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await axios.delete(`${API_BASE}/${id}`);
        fetchData();
        showAlert('Member deleted');
      } catch (err) {
        showAlert('Failed to delete');
      }
    }
  };

  // Days Remaining Helper
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

  // Export to CSV
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Toast Notification */}
      {alertMsg && (
        <div className="fixed top-5 right-5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-xl z-50 text-sm font-medium animate-bounce">
          {alertMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gym Member & Facility Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Manage gym enrollments, attendance check-ins, and health records.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium border border-slate-700 transition text-sm"
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium shadow-md transition text-sm"
          >
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold">Total Members</p>
            <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><UserCheck size={24} /></div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold">Active Members</p>
            <p className="text-2xl font-bold text-white">{stats.activeMembers}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg"><UserX size={24} /></div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold">Expired</p>
            <p className="text-2xl font-bold text-white">{stats.expiredMembers}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><DollarSign size={24} /></div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold">Total Revenue</p>
            <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {['All', 'Active', 'Expired'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === tab ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Member Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Member Info</th>
              <th className="px-6 py-4">Plan & Validity</th>
              <th className="px-6 py-4">Health Notes</th>
              <th className="px-6 py-4">Attendance</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {members.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500">No members found.</td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m._id} className="hover:bg-slate-700/30 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{m.planType} (₹{m.amountPaid})</div>
                    <div className="text-xs mt-0.5">{getDaysRemainingText(m.endDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-700/60 px-2.5 py-1 rounded text-slate-300">
                      {m.healthNotes || 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleCheckIn(m._id, m.name, m.status)}
                      title="Mark Check-In"
                      className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-2.5 py-1 rounded-md transition"
                    >
                      <CheckCircle2 size={14} className="text-indigo-400" />
                      {m.lastCheckIn ? new Date(m.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Check In'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleRenew(m._id, m.planType)}
                      title="Renew Subscription"
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-indigo-400 transition"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m._id)}
                      title="Delete Member"
                      className="p-1.5 bg-slate-700 hover:bg-rose-600/20 rounded-md text-rose-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Enroll New Member</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input 
                  required
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Plan Duration</label>
                  <select 
                    value={formData.planType}
                    onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Monthly">Monthly (1 Mo)</option>
                    <option value="Quarterly">Quarterly (3 Mo)</option>
                    <option value="Annual">Annual (12 Mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fee Paid (₹)</label>
                  <input 
                    required
                    type="number" 
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Health & Facility Notes</label>
                <textarea 
                  placeholder="e.g., Lower back injury, Asthma, Locker #4"
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}