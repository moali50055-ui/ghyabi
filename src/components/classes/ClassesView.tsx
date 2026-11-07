import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ClassRoom, Student } from '../../types';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
  BookOpenCheck,
  DoorClosed,
} from 'lucide-react';

export const ClassesView: React.FC = () => {
  const { classes, students, addClass, updateClass, deleteClass, setActiveTab, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickDeleteModalOpen, setIsQuickDeleteModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [viewingClassRoster, setViewingClassRoster] = useState<ClassRoom | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null);
  const [deleteTransferClassId, setDeleteTransferClassId] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    grade: 5,
    section: 1,
    stage: 'التعليم الأساسي (٥-١٠)',
    roomNumber: '',
    supervisorTeacherName: '',
  });

  const totalSchoolStudents = useMemo(() => {
    return students.filter((s) => !s.isArchived).length;
  }, [students]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.supervisorTeacherName && c.supervisorTeacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.roomNumber && c.roomNumber.includes(searchQuery));
      
      const matchGrade =
        selectedGradeFilter === 'all' || String(c.grade) === selectedGradeFilter;

      return matchSearch && matchGrade;
    });
  }, [classes, searchQuery, selectedGradeFilter]);

  const handleOpenAddModal = () => {
    setFormData({
      name: `الصف ٩/${classes.filter(c => c.grade === 9).length + 1}`,
      grade: 9,
      section: classes.filter(c => c.grade === 9).length + 1,
      stage: 'التعليم الأساسي (٩-١٠)',
      roomNumber: `قاعة ${900 + classes.filter(c => c.grade === 9).length + 1}`,
      supervisorTeacherName: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: ClassRoom) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      grade: c.grade,
      section: c.section,
      stage: c.stage,
      roomNumber: c.roomNumber || '',
      supervisorTeacherName: c.supervisorTeacherName || '',
    });
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClass) {
      updateClass(editingClass.id, {
        name: formData.name.trim(),
        grade: Number(formData.grade),
        section: Number(formData.section),
        stage: formData.stage,
        roomNumber: formData.roomNumber.trim(),
        supervisorTeacherName: formData.supervisorTeacherName.trim(),
      });
      setEditingClass(null);
    } else {
      addClass({
        name: formData.name.trim(),
        grade: Number(formData.grade),
        section: Number(formData.section),
        stage: formData.stage,
        roomNumber: formData.roomNumber.trim(),
        supervisorTeacherName: formData.supervisorTeacherName.trim(),
      });
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingClass) return;
    deleteClass(deletingClass.id, deleteTransferClassId || undefined);
    setDeletingClass(null);
    setDeleteTransferClassId('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header bar with summary stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" />
            إدارة الصفوف الدراسية بالمدرسة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تحتوي المدرسة على <span className="font-bold text-blue-700">{classes.length} صفاً دراسياً معتمداً</span> بإجمالي{' '}
            <span className="font-bold text-emerald-700">{totalSchoolStudents} طالباً منتظماً</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            title="إضافة صف دراسي جديد للمدرسة"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صف دراسي</span>
          </button>

          <button
            onClick={() => setIsQuickDeleteModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition cursor-pointer"
            title="حذف صف دراسي من المدرسة"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>حذف صف دراسي</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم الصف أو المشرف أو القاعة..."
            className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
          />
        </div>

        {/* Grade Filter Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 shrink-0 ml-1">تصفية المرحلة:</span>
          {[
            { id: 'all', label: 'كافة الصفوف (٢٧)' },
            { id: '9', label: 'تاسع (٥ شعب)' },
            { id: '10', label: 'عاشر (٥ شعب)' },
            { id: '11', label: 'حادي عشر (٨ شعب)' },
            { id: '12', label: 'ثاني عشر (٩ شعب)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedGradeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedGradeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredClasses.map((cls) => {
          const classStudents = students.filter((s) => s.classId === cls.id && !s.isArchived);
          const archivedInClass = students.filter((s) => s.classId === cls.id && s.isArchived).length;

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-sm">
                      {cls.grade}/{cls.section}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition">
                        {cls.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">{cls.stage}</span>
                    </div>
                  </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEditModal(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="تعديل اسم وبيانات الصف"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingClass(cls);
                          setDeleteTransferClassId('');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="حذف الصف الدراسي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 py-2 border-y border-slate-100 my-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">القاعة الدراسية:</span>
                    <span className="font-semibold text-slate-800">{cls.roomNumber || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">مشرف الصف:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {cls.supervisorTeacherName || 'غير مسجل'}
                    </span>
                  </div>
                </div>

                {/* Student Count Badge */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{classStudents.length} طالباً منتظماً</span>
                  </div>
                  {archivedInClass > 0 && (
                    <span className="text-[10px] text-slate-400">
                      ({archivedInClass} مؤرشف)
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setViewingClassRoster(cls)}
                  className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  قائمة الطلاب
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  تسجيل الغياب
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Class Modal */}
      {(isAddModalOpen || editingClass) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                {editingClass ? 'تعديل بيانات الصف الدراسي' : 'إضافة صف دراسي جديد'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClass(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصف (مثال: الصف ٥/١)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="الصف ٥/١"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المستوى الدراسي (الصف)</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    {[9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        الصف {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الشعبة</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة الدراسية</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="التعليم الأساسي (٩-١٠)">التعليم الأساسي (٩-١٠)</option>
                  <option value="التعليم ما بعد الأساسي (١١-١٢)">التعليم ما بعد الأساسي (١١-١٢)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم القاعة / الجناح</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="قاعة ١٠١"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مشرف الصف المعين</label>
                  <input
                    type="text"
                    value={formData.supervisorTeacherName}
                    onChange={(e) => setFormData({ ...formData, supervisorTeacherName: e.target.value })}
                    placeholder="أ. المعلم المشرف"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingClass(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
                >
                  {editingClass ? 'حفظ التعديلات' : 'إضافة الصف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClass && (() => {
        const studentsInDeletingClass = students.filter(
          (s) => s.classId === deletingClass.id && !s.isArchived
        );
        const hasStudents = studentsInDeletingClass.length > 0;
        const otherClasses = classes.filter((c) => c.id !== deletingClass.id);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 text-center">
                تأكيد حذف {deletingClass.name}
              </h3>

              {hasStudents ? (
                <div className="my-4 space-y-3">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold block mb-1">⚠️ تنبيه هام:</span>
                    يحتوي هذا الصف حالياً على <strong>{studentsInDeletingClass.length} طالباً منتظماً</strong>. لحذف الصف دون فقدان الطلاب، يرجى تحديد الصف البديل لنقلهم إليه تلقائياً:
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الصف البديل لنقل الطلاب ({studentsInDeletingClass.length} طالب):
                    </label>
                    <select
                      value={deleteTransferClassId}
                      onChange={(e) => setDeleteTransferClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="">-- اختر الصف البديل لنقل الطلاب --</option>
                      {otherClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({students.filter((s) => s.classId === c.id && !s.isArchived).length} طالب)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center mt-3 leading-relaxed">
                  هذا الصف فارغ ولا يحتوي على أي طلاب نشطين. هل أنت متأكد من رغبتك في حذفه نهائياً من المدرسة؟
                </p>
              )}

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setDeletingClass(null);
                    setDeleteTransferClassId('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={hasStudents && !deleteTransferClassId}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {hasStudents ? 'نقل الطلاب وحذف الصف' : 'نعم، احذف الصف الآن'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Class Deletion Selector Modal */}
      {isQuickDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">حذف صف دراسي من المدرسة</h3>
              </div>
              <button
                onClick={() => setIsQuickDeleteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              اختر الصف الذي تريد حذفه من القائمة:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 my-3 pr-1">
              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id && !s.isArchived).length;
                return (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition"
                  >
                    <div>
                      <span className="font-black text-xs text-slate-900 block">{cls.name}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {cls.stage} • القاعة: {cls.roomNumber || 'غير محدد'} • الطلاب: {count} طالب
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsQuickDeleteModalOpen(false);
                        setDeletingClass(cls);
                        setDeleteTransferClassId('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsQuickDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster View Modal for a Class */}
      {viewingClassRoster && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  قائمة طلاب {viewingClassRoster.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  إجمالي الطلاب المسجلين بالصف: {students.filter((s) => s.classId === viewingClassRoster.id && !s.isArchived).length} طالب
                </p>
              </div>
              <button
                onClick={() => setViewingClassRoster(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {students.filter((s) => s.classId === viewingClassRoster.id).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا يوجد طلاب مسجلون في هذا الصف حتى الآن.
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2">م</th>
                      <th className="p-2">الرقم المدرسي</th>
                      <th className="p-2">اسم الطالب</th>
                      <th className="p-2">هاتف ولي الأمر</th>
                      <th className="p-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students
                      .filter((s) => s.classId === viewingClassRoster.id)
                      .map((st, i) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-400">{i + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-700">{st.schoolId}</td>
                          <td className="p-2 font-bold text-slate-900">{st.fullName}</td>
                          <td className="p-2 text-slate-600">{st.guardianPhone}</td>
                          <td className="p-2">
                            {st.isArchived ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                                مؤرشف
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                منتظم
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingClassRoster(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
