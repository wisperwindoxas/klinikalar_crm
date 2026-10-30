import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Shield, Phone, Mail, CheckCircle2, 
  XCircle, Filter, Building2, RefreshCw, AlertCircle, Pencil, Trash2, Key, Eye, EyeOff, Lock
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editModalUser, setEditModalUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'MANAGER',
    password: '',
    clinicId: ''
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete confirm modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any | null>(null);

  // New user form
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'MANAGER',
    clinicName: 'klinika-admin Markaziy Filiali'
  });

  useEffect(() => {
    loadUsers();
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      const res = await ApiClient.getClinics();
      if (res.data) {
        setClinics(res.data);
      }
    } catch (e) {
      // ignore
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getUsers();
      if (res.data) {
        setUsers(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Foydalanuvchilarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const newStatus = !user.is_active;
      await ApiClient.updateUserStatus(user.id, newStatus);
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
    } catch (e: any) {
      alert(e.message || 'Holatni o‘zgartirishda xatolik');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSaving(true);
      const res = await ApiClient.createUser(form);
      if (res.data) {
        setUsers([res.data, ...users]);
        setShowAddModal(false);
        setForm({ name: '', email: '', phone: '', role: 'MANAGER', clinicName: 'klinika-admin Markaziy Filiali' });
      }
    } catch (e: any) {
      alert(e.message || 'Foydalanuvchi yaratishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditModalUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'MANAGER',
      password: '',
      clinicId: user.clinic_id || ''
    });
    setShowEditPassword(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    try {
      setActionLoading(true);
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        clinicId: editForm.clinicId || undefined
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      const res = await ApiClient.updateUser(editModalUser.id, payload);
      if (res.data) {
        setUsers(users.map(u => u.id === editModalUser.id ? { ...u, ...res.data } : u));
      }
      await loadUsers();
      setEditModalUser(null);
    } catch (e: any) {
      alert(e.message || 'Foydalanuvchini tahrirlashda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      setActionLoading(true);
      await ApiClient.deleteUser(deleteConfirmUser.id);
      setUsers(users.filter(u => u.id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
    } catch (e: any) {
      alert(e.message || 'Foydalanuvchini o‘chirishda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = 
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Super Admin</span>;
      case 'ADMIN':
      case 'CLINIC_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Klinika Admin</span>;
      case 'DOCTOR':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Shifokor</span>;
      case 'CASHIER':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Kassir</span>;
      case 'MANAGER':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Menejer</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Foydalanuvchilar (Global)</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              {users.length} ta real hisob
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platformaning barcha klinikalari, shifokorlari va xodimlarining yagona boshqaruv ro‘yxati
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yangi foydalanuvchi</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ism, email yoki telefon bo‘yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">Barchasi ({users.length})</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Klinika Admin</option>
            <option value="MANAGER">Menejer</option>
            <option value="DOCTOR">Shifokor</option>
            <option value="CASHIER">Kassir</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-medium">Foydalanuvchilar ma‘lumotlar bazasidan yuklanmoqda...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Foydalanuvchilar topilmadi</p>
            <p className="text-xs text-slate-400 mt-0.5">Qidiruv parametrlarini o‘zgartirib ko‘ring</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Foydalanuvchi</th>
                  <th className="py-3 px-4">Aloqa</th>
                  <th className="py-3 px-4">Rol / Lavozim</th>
                  <th className="py-3 px-4">Klinika</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Ro‘yxatdan o‘tgan</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        )}
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[150px]">{u.clinic_name || 'Markaziy Tizim'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                          <XCircle className="w-3.5 h-3.5" /> Bloklangan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            u.is_active
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                          title={u.is_active ? 'Bloklash' : 'Faollashtirish'}
                        >
                          {u.is_active ? 'Bloklash' : 'Faol'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg transition"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Foydalanuvchini tahrirlash</h3>
                  <p className="text-[11px] text-slate-500">ID: {editModalUser.id} ({editModalUser.name})</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ism va familiya (F.I.SH) *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Dr. Sherzod Aliyev"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Telefon raqam *</label>
                  <input
                    type="text"
                    required
                    placeholder="+998 90 123 45 67"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email / Login</label>
                  <input
                    type="text"
                    placeholder="doctor@sadaf.uz"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Lavozimi / Roli *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="MANAGER">Menejer (Boshqaruv)</option>
                    <option value="DOCTOR">Shifokor</option>
                    <option value="CASHIER">Kassir</option>
                    <option value="ADMIN">Klinika Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tegishli Klinika</label>
                  <select
                    value={editForm.clinicId}
                    onChange={(e) => setEditForm({ ...editForm, clinicId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="">(Standart / Sadaf Dental)</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Yangi parol <span className="text-[10px] font-normal text-slate-400">(Bo‘sh qoldirilsa avvalgi parol saqlanadi)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Yangi parol kiriting..."
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20 flex items-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Foydalanuvchini o‘chirish</h3>
              <p className="text-xs text-slate-500">
                Haqiqatan ham <strong className="text-slate-800">{deleteConfirmUser.name}</strong> hisobini o‘chirmoqchimisiz?
              </p>
              <p className="text-[11px] text-rose-500 font-medium pt-1">
                Ushbu foydalanuvchi ma‘lumotlar bazasidan butunlay o‘chiriladi va unga bog‘liq faoliyatlar tozalanadi.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20 flex items-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Ha, o‘chirilsin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Yangi foydalanuvchi</h3>
                  <p className="text-[11px] text-slate-500">PostgreSQL tizimiga yangi hisob qo‘shish</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">F.I.SH *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Dr. Sherzod Aliyev"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="doctor@sadaf.uz"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Telefon</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tizimdagi roli *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                >
                  <option value="MANAGER">Menejer (Boshqaruv)</option>
                  <option value="DOCTOR">Shifokor (Kabinet navbati)</option>
                  <option value="CASHIER">Kassir (To‘lovlar & Qabul)</option>
                  <option value="ADMIN">Klinika Administratori</option>
                  <option value="SUPER_ADMIN">Super Admin (Platforma boshqaruvi)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
