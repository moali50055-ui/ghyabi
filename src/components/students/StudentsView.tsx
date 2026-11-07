import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  FileSpreadsheet,
  Edit2,
  ArrowRightLeft,
  Archive,
  RotateCcw,
  Trash2,
  Phone,
  School,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { exportStudentsToExcel } from '../../services/excelService';
import { LinkParentPhonesModal } from './LinkParentPhonesModal';

export const StudentsView: React.FC = () => {
  const {
    students,
    classes,
    addStudent,
    updateStudent,
    transferStudent,
    archiveStudent,
    unarchiveStudent,
    deleteStudentPermanently,
    currentUser,
    records,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkPhonesModalOpen, setIsLinkPhonesModalOpen] = useState(false);
  const [isQuickDeleteStudentModalOpen, setIsQuickDeleteStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [archivingStudent, setArchivingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    schoolId: '',
    classId: classes[0]?.id || '',
    gender: 'بنين' as 'بنين' | 'بنات',
    guardianPhone: '',
    guardianName: '',
    notes: '',
  });

  const [transferTargetClassId, setTransferTargetClassId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [archiveReason, setArchiveReason] = useState<string>('انتقال إلى مدرسة أخرى');

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.schoolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.guardianPhone && s.guardianPhone.includes(searchQuery));

      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;

      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = !s.isArchived;
      if (statusFilter === 'archived') matchStatus = s.isArchived;

      return matchSearch && matchClass && matchStatus;
    });
  }, [students, searchQuery, selectedClassId, statusFilter]);

  // Counts
  const activeCount = useMemo(() => students.filter((s) => !s.isArchived).length, [students]);
  const archivedCount = useMemo(() => students.filter((s) => s.isArchived).length, [students]);

  const handleOpenAddModal = () => {
    setFormData({
      fullName: '',
      schoolId: `2024${Math.floor(100000 + Math.random() * 900000)}`,
      classId: selectedClassId !== 'all' ? selectedClassId : classes[0]?.id || '',
      gender: 'بنين',
      guardianPhone: '',
      guardianName: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName,
      schoolId: student.schoolId,
      classId: student.classId,
      gender: student.gender,
      guardianPhone: student.guardianPhone,
      guardianName: student.guardianName || '',
      notes: student.notes || '',
    });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.classId) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        fullName: formData.fullName.trim(),
        schoolId: formData.schoolId.trim(),
        classId: formData.classId,
        gender: formData.gender,
        guardianPhone: formData.guardianPhone.trim(),
        guardianName: formData.guardianName.trim(),
        notes: formData.notes.trim(),
      });
      setEditingStudent(null);
    } else {
      addStudent({
        fullName: formData.fullName.trim(),
        schoolId: formData.schoolId.trim(),
        classId: formData.classId,
        gender: formData.gender,
        guardianPhone: formData.guardianPhone.trim(),
        guardianName: formData.guardianName.trim(),
        notes: formData.notes.trim(),
        isArchived: false,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !transferTargetClassId) return;
    transferStudent(transferringStudent.id, transferTargetClassId, transferReason);
    setTransferringStudent(null);
    setTransferReason('');
  };

  const handleConfirmArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivingStudent) return;
    archiveStudent(archivingStudent.id, archiveReason);
    setArchivingStudent(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    deleteStudentPermanently(deletingStudent.id);
    setDeletingStudent(null);
  };

  const handleExportExcel = () => {
    exportStudentsToExcel(filteredStudents, classes, `قائمة_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            إدارة بيانات الطلاب وقوائم الفصول
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إجمالي الطلاب النشطين: <span className="font-bold text-emerald-700">{activeCount} طالب</span> • المؤرشفين:{' '}
            <span className="font-bold text-slate-600">{archivedCount} طالب</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Link Parent Phones Button */}
          <button
            onClick={() => setIsLinkPhonesModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition cursor-pointer shadow-xs"
            title="ربط وتحديث أرقام هواتف أولياء الأمور بالطلاب"
          >
            <Phone className="w-4 h-4 text-indigo-600" />
            <span>ربط أرقام أولياء الأمور</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            title="إضافة طالب جديد للقوائم المدرسية"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب</span>
          </button>

          {/* Quick Delete Student Button */}
          <button
            onClick={() => setIsQuickDeleteStudentModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition cursor-pointer"
            title="حذف طالب من المدرسة"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>حذف طالب</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالاسم أو الرقم المدرسي أو الهاتف..."
            className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Filter Dropdown (all 29 classes) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">الصف:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer max-w-[180px]"
            >
              <option value="all">جميع الصفوف (٢٩ صفاً)</option>
              {classes.map((c) => {
                const count = students.filter((s) => s.classId === c.id && !s.isArchived).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count} طالب)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المنتظمون ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'archived' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المؤرشفون ({archivedCount})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({students.length})
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">م</th>
                <th className="py-3 px-3">الرقم المدرسي</th>
                <th className="py-3 px-4">اسم الطالب رباعي</th>
                <th className="py-3 px-3">الصف الدراسي</th>
                <th className="py-3 px-3">هاتف ولي الأمر</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3 text-center">الغيابات المسجلة</th>
                <th className="py-3 px-4 text-center">الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد بيانات مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const studentAbsences = records.filter(
                    (r) => r.studentId === student.id && r.status === 'absent'
                  ).length;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition ${
                        student.isArchived ? 'bg-slate-50/40 text-slate-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-400">{index + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {student.schoolId}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full inline-block ${student.isArchived ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                          {student.fullName}
                        </div>
                        {student.notes && (
                          <div className="text-[10px] text-slate-400 font-normal pr-4 truncate max-w-xs">
                            {student.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-700">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100">
                          {classMap.get(student.classId) || student.classId}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{student.guardianPhone || 'غير متوفر'}</span>
                          {!student.guardianPhone ? (
                            <button
                              onClick={() => {
                                setSelectedClassId(student.classId);
                                setIsLinkPhonesModalOpen(true);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-1.5 py-0.5 rounded mr-1 cursor-pointer"
                              title="ربط رقم هاتف ولي الأمر"
                            >
                              ربط
                            </button>
                          ) : (
                            <a
                              href={`https://wa.me/968${student.guardianPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-800 p-0.5"
                              title="مراسلة ولي الأمر عبر واتساب"
                            >
                              📱
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {student.isArchived ? (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]"
                            title={student.archiveReason || 'طالب مؤرشف'}
                          >
                            مؤرشف ({student.archiveReason || 'منقول'})
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            منتظم
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {studentAbsences > 0 ? (
                          <span className={`inline-block px-2 py-0.5 rounded-md font-black text-[11px] ${
                            studentAbsences >= 5 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {studentAbsences} حصة غياب
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">٠</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="تعديل بيانات الطالب"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Transfer button */}
                          {!student.isArchived && (
                            <button
                              onClick={() => {
                                setTransferringStudent(student);
                                setTransferTargetClassId(classes.find((c) => c.id !== student.classId)?.id || '');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="نقل الطالب إلى صف آخر"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}

                          {/* Archive / Unarchive */}
                          {student.isArchived ? (
                            <button
                              onClick={() => unarchiveStudent(student.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                              title="إلغاء الأرشفة واستعادة الطالب"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setArchivingStudent(student)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                              title="أرشفة الطالب (للحفاظ على سجلات غيابه)"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Student Button */}
                          <button
                            onClick={() => setDeletingStudent(student)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                            title="حذف الطالب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطالب رباعي *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="محمد بن سالم بن علي البلوشي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرقم المدرسي / المدني *</label>
                  <input
                    type="text"
                    required
                    value={formData.schoolId}
                    onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                    placeholder="2024050101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي المسجل به *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">هاتف ولي الأمر</label>
                  <input
                    type="text"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    placeholder="91234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="سالم بن علي البلوشي"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات صحية أو متابعات خاصة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
                >
                  {editingStudent ? 'حفظ التعديلات' : 'إضافة الطالب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Student Modal */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-indigo-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                نقل طالب بين الصفوف
              </h3>
              <button onClick={() => setTransferringStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div>
                  <span className="text-slate-500">اسم الطالب:</span>{' '}
                  <span className="font-bold text-slate-900">{transferringStudent.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500">الصف الحالي:</span>{' '}
                  <span className="font-bold text-blue-700">{classMap.get(transferringStudent.classId)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي المنقول إليه *</label>
                <select
                  required
                  value={transferTargetClassId}
                  onChange={(e) => setTransferTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-hidden focus:border-blue-500"
                >
                  {classes
                    .filter((c) => c.id !== transferringStudent.classId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب النقل / ملاحظة إدارية</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="مثال: إعادة توزيع الفصول بناء على طلب ولي الأمر"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
                >
                  تأكيد نقل الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archivingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-600" />
                أرشفة سجل الطالب
              </h3>
              <button onClick={() => setArchivingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmArchive} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                أرشفة الطالب <strong className="text-slate-900">{archivingStudent.fullName}</strong> تتيح إخفاءه من كشوفات
                الحضور اليومية النشطة مع <span className="text-emerald-700 font-bold">الحفاظ الكامل على كافة سجلات غيابه السابقة</span> للرجوع إليها في أي وقت.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب الأرشفة</label>
                <select
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-500 mb-2"
                >
                  <option value="انتقال إلى مدرسة أخرى">انتقال إلى مدرسة أخرى</option>
                  <option value="سفر خارج السلطنة">سفر خارج السلطنة</option>
                  <option value="انقطاع عن الدراسة">انقطاع عن الدراسة</option>
                  <option value="ظروف صحية خاصة">ظروف صحية خاصة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setArchivingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition"
                >
                  أرشفة الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              تأكيد حذف بيانات الطالب
            </h3>
            
            <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">اسم الطالب:</span>
                <span className="font-black text-slate-900">{deletingStudent.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الصف الدراسي:</span>
                <span className="font-bold text-blue-700">{classMap.get(deletingStudent.classId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الرقم المدرسي:</span>
                <span className="font-mono text-slate-700">{deletingStudent.schoolId}</span>
              </div>
              {deletingStudent.guardianPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">هاتف ولي الأمر:</span>
                  <span className="font-mono text-slate-700">{deletingStudent.guardianPhone}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center leading-relaxed">
              اختر نوع الحذف المناسب: الأرشفة تُبقي سجلات الغياب السابقة في الإحصائيات، بينما الحذف النهائي يمسح الطالب وسجلاته بالكامل.
            </p>

            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={() => {
                  archiveStudent(deletingStudent.id, 'حذف/أرشفة بطلب المستخدم');
                  setDeletingStudent(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Archive className="w-4 h-4" />
                أرشفة الطالب (موصى به - للحفاظ على سجلات الغياب)
              </button>

              <button
                onClick={handleConfirmDelete}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                حذف نهائي مسح تام من النظام
              </button>

              <button
                onClick={() => setDeletingStudent(null)}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Delete Student Selector Modal */}
      {isQuickDeleteStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">حذف طالب من المدرسة</h3>
              </div>
              <button
                onClick={() => setIsQuickDeleteStudentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              ابحث عن الطالب الذي تريد حذفه من القائمة، ثم اضغط على أيقونة الحذف:
            </p>

            <div className="relative my-3">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الطالب أو الرقم المدرسي..."
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-72">
              {filteredStudents.slice(0, 30).map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition"
                >
                  <div>
                    <div className="font-black text-xs text-slate-900">{st.fullName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {classMap.get(st.classId)} • الرقم: {st.schoolId} • الهاتف: {st.guardianPhone || 'لا يوجد'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsQuickDeleteStudentModalOpen(false);
                      setDeletingStudent(st);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsQuickDeleteStudentModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Parent Phones Modal */}
      <LinkParentPhonesModal
        isOpen={isLinkPhonesModalOpen}
        onClose={() => setIsLinkPhonesModalOpen(false)}
        defaultClassId={selectedClassId !== 'all' ? selectedClassId : undefined}
      />
    </div>
  );
};
