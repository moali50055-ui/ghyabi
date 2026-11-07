import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  UserCog,
  UserPlus,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  History,
  Lock,
  Mail,
  School,
  Key,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    users,
    classes,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    auditLogs,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'teacher' as UserRole,
    jobTitle: '',
    assignedClassIds: [] as string[],
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      role: 'teacher',
      jobTitle: 'معلم مادة',
      assignedClassIds: [classes[0]?.id || ''],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      jobTitle: user.jobTitle || '',
      assignedClassIds: user.assignedClassIds || [],
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        jobTitle: formData.jobTitle.trim(),
        assignedClassIds: formData.role === 'teacher' ? formData.assignedClassIds : undefined,
      });
      setEditingUser(null);
    } else {
      addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        jobTitle: formData.jobTitle.trim(),
        assignedClassIds: formData.role === 'teacher' ? formData.assignedClassIds : undefined,
      });
      setIsAddModalOpen(false);
    }
  };

  const toggleClassAssignment = (classId: string) => {
    setFormData((prev) => {
      const exists = prev.assignedClassIds.includes(classId);
      if (exists) {
        return { ...prev, assignedClassIds: prev.assignedClassIds.filter((id) => id !== classId) };
      } else {
        return { ...prev, assignedClassIds: [...prev.assignedClassIds, classId] };
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            إدارة المستخدمين والصلاحيات وسجل التدقيق
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة حسابات مديري النظام والإدارة المدرسية والمعلمين وإسناد الصفوف الدراسية
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Roles & Permissions Explanation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Admin Card */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
          <div className="flex items-center gap-2 text-purple-700 font-black text-sm mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            مدير النظام (System Admin)
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>إدارة كافة الصفوف الـ ٢٩ والطلاب.</li>
            <li>إدارة حسابات المعلمين وإسناد الصفوف.</li>
            <li>تعديل سجلات الغياب مع التسجيل في سجل التدقيق.</li>
            <li>النسخ الاحتياطي واستعادة البيانات وتصفير النظام.</li>
          </ul>
        </div>

        {/* Management Card */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 font-black text-sm mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            الإدارة المدرسية (Management)
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>متابعة مباشرة لجميع الـ ٢٩ صفاً بالمدرسة.</li>
            <li>الاطلاع على كافة إحصائيات الغياب الحصصي واليومي.</li>
            <li>استخراج وتصدير تقارير Excel والطباعة.</li>
            <li>متابعة المعلمين الذين لم يرصدوا حصصهم.</li>
          </ul>
        </div>

        {/* Teacher Card */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-black text-sm mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            المعلم (Teacher)
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>تسجيل حضور وغياب الصفوف والحصص المخصصة له.</li>
            <li>تعديل تسجيلاته الخاصة فوراً.</li>
            <li>الاطلاع على بيانات طلاب صفوفه فقط.</li>
            <li>حفظ بيانات الحصص مباشرة في النظام.</li>
          </ul>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            قائمة المستخدمين المعرفين في النظام ({users.length} مستخدمين)
          </h3>
          <span className="text-xs text-slate-400">
            يمكنك التبديل إلى أي مستخدم بنقرة واحدة لاختبار الصلاحيات
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">اسم المستخدم</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-3">المسمى الوظيفي</th>
                <th className="py-3 px-3">الدور / الصلاحية</th>
                <th className="py-3 px-4">الصفوف المسندة</th>
                <th className="py-3 px-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const assignedClassNames = (u.assignedClassIds || [])
                  .map((id) => classes.find((c) => c.id === id)?.name)
                  .filter(Boolean);

                return (
                  <tr key={u.id} className={`hover:bg-slate-50 ${isCurrent ? 'bg-blue-50/40' : ''}`}>
                    <td className="py-3 px-4 font-black text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-600 text-white font-bold">
                            أنت الآن
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{u.jobTitle || '-'}</td>
                    <td className="py-3 px-3">
                      {u.role === 'admin' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px]">
                          مدير النظام
                        </span>
                      ) : u.role === 'management' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px]">
                          الإدارة المدرسية
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                          معلم
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'teacher' ? (
                        assignedClassNames.length > 0 ? (
                          <span className="text-blue-700 font-bold">
                            {assignedClassNames.join('، ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">لم تسند صفوف بعد</span>
                        )
                      ) : (
                        <span className="text-slate-500 font-semibold">كافة الصفوف الـ ٢٩</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!isCurrent && (
                          <button
                            onClick={() => setCurrentUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                          >
                            تبديل الدخول
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="تعديل المستخدم"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {users.length > 1 && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="حذف المستخدم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log (سجل التدقيق) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            سجل التدقيق والتتبع الأمني لجميع العمليات (Audit Trail)
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            يوثق اسم المستخدم والتاريخ والإجراء لضمان الشفافية
          </span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0">
              <tr>
                <th className="py-2.5 px-3">التوقيت</th>
                <th className="py-2.5 px-4">المستخدم</th>
                <th className="py-2.5 px-3">الدور</th>
                <th className="py-2.5 px-3">العملية</th>
                <th className="py-2.5 px-4">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('ar-OM')}
                  </td>
                  <td className="py-2 px-4 font-bold text-slate-900">{log.userName}</td>
                  <td className="py-2 px-3 font-semibold text-slate-600">{log.userRole}</td>
                  <td className="py-2 px-3 font-black text-blue-700">{log.action}</td>
                  <td className="py-2 px-4 text-slate-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-blue-600" />
                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم الكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أ. محمد بن سالم البلوشي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="m.albalushi@school.om"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="معلم مادة الرياضيات"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="teacher">معلم (تسجيل غياب صفوفه المخصصة فقط)</option>
                  <option value="management">الإدارة المدرسية (متابعة كافة الصفوف والتقارير)</option>
                  <option value="admin">مدير النظام (كامل الصلاحيات والإعدادات)</option>
                </select>
              </div>

              {formData.role === 'teacher' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصفوف المسندة لهذا المعلم لرصد غيابها:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                    {classes.map((cls) => {
                      const isAssigned = formData.assignedClassIds.includes(cls.id);
                      return (
                        <button
                          type="button"
                          key={cls.id}
                          onClick={() => toggleClassAssignment(cls.id)}
                          className={`p-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            isAssigned
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cls.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
