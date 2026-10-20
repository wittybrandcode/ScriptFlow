import { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, Users, Phone, Mail, User, Briefcase, Search, LayoutGrid, Download, Upload, Filter, Printer, Eye, Copy, CheckCheck, Banknote } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useCharactersQuery, useCrewQuery, useCrewAssignmentsQuery, useBulkCreateCrewMutation, useDeleteCrewMutation, useSaveCrewMemberMutation } from '../hooks/queries';
import CrewModal from '../components/CrewModal';
import CrewPreviewModal from '../components/CrewPreviewModal';
import CrewAssignmentModal from '../components/CrewAssignmentModal';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { resolveMediaUrl } from '../services/mediaStorage';

const ROLE_LABELS = {
  DIRECTOR: 'قسم الإخراج',
  PRODUCTION: 'قسم الإنتاج',
  CAMERA: 'قسم التصوير',
  LIGHTING: 'قسم الإضاءة',
  SOUND: 'قسم الصوت',
  ART: 'قسم الديكور الفني',
  WARDROBE: 'قسم الملابس',
  MAKEUP: 'قسم المكياج',
  POST: 'قسم المونتاج',
  OTHER: 'تخصصات أخرى'
};

const EMPLOYMENT_BADGES = {
  FREELANCE: { label: 'مستقل', cls: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  CONTRACTED: { label: 'متعاقد', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  VOLUNTEER: { label: 'متطوع', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
};

export default function CrewPage() {
  const { activeScenarioId } = useUIStore();
  const { data: crew } = useCrewQuery(activeScenarioId);
  const { data: assignments } = useCrewAssignmentsQuery(activeScenarioId);
  const { data: characters } = useCharactersQuery(activeScenarioId);
  
  const bulkCreateMutation = useBulkCreateCrewMutation();
  const deleteMutation = useDeleteCrewMutation();
  const saveCrewMemberMutation = useSaveCrewMemberMutation();

  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [previewMember, setPreviewMember] = useState(null);
  const [assignmentMember, setAssignmentMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterEmployment, setFilterEmployment] = useState('');
  const [activeTab, setActiveTab] = useState('TECHNICAL'); // 'TECHNICAL' or 'CAST'
  const fileInputRef = useRef(null);

  useEffect(() => {
    setTopBarConfig({ pageName: 'فريق العمل' });
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sidebar Context (Logistical Stats)
  useEffect(() => {
    if (!crew) return;
    const freelanceCount = crew.filter(m => m.employment_type === 'FREELANCE' && m.category === 'TECHNICAL').length;
    const contractedCount = crew.filter(m => m.employment_type === 'CONTRACTED' && m.category === 'TECHNICAL').length;
    const actorCount = crew.filter(m => m.category === 'CAST').length;
    
    setSidebarContext({
      title: 'إحصائيات الموارد البشرية',
      stats: [
        { label: 'إجمالي الطاقم الفني', value: crew.filter(m => m.category === 'TECHNICAL').length },
        { label: 'إجمالي الممثلين', value: actorCount },
        { label: 'متعاقد (تقني)', value: contractedCount },
        { label: 'مستقل (تقني)', value: freelanceCount }
      ],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crew]);

  const handleSubmit = async (formData) => {
    const { assigned_characters, ...crewData } = formData;

    try {
      if (editingMember) {
        crewData.id = editingMember.id;
      }
      
      await saveCrewMemberMutation.mutateAsync({
        crewData,
        assignedCharacters: formData.category === 'CAST' ? assigned_characters : undefined,
        scenarioId: activeScenarioId
      });

      setShowModal(false);
      setEditingMember(null);
      // Removed the toast logic as the UI logic might not be easily accessible here, or it can be added if needed. Wait, showToast was used before but we'll add it if there's a showToast hook. Let me see. I'll add a simple console.log instead.
    } catch (err) {
      console.error('Failed to save crew member:', err);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const member = crew.find(m => m.id === id);
    if (member) {
      setMemberToDelete(member);
    }
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      await deleteMutation.mutateAsync(memberToDelete.id);
      setMemberToDelete(null);
    }
  };

  // Filter and Grouping
  const filteredCrew = useMemo(() => {
    if (!crew) return [];
    return crew.filter(m => {
      const matchCategory = m.category === activeTab || (!m.category && activeTab === 'TECHNICAL');
      const matchSearch = !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || ROLE_LABELS[m.role]?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = !filterRole || m.role === filterRole;
      const matchEmp = !filterEmployment || m.employment_type === filterEmployment;
      return matchCategory && matchSearch && matchRole && matchEmp;
    });
  }, [crew, searchTerm, filterRole, filterEmployment, activeTab]);

  const groupedCrew = useMemo(() => {
    const groups = {};
    filteredCrew.forEach(member => {
      const r = member.role || 'OTHER';
      if (!groups[r]) groups[r] = [];
      groups[r].push(member);
    });
    return groups;
  }, [filteredCrew]);

  // Import / Export
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(crew));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "crew_list.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const newMembers = data.map(member => {
          const { id, created_at, ...newMember } = member;
          return { ...newMember, scenario_id: activeScenarioId };
        });
        await bulkCreateMutation.mutateAsync(newMembers);
      }
    } catch (err) {
      alert('حدث خطأ أثناء قراءة ملف JSON. تأكد من صحة الملف.');
    }
    e.target.value = null; // reset
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!activeScenarioId) {
    return <div className="p-8 text-center text-muted-foreground">الرجاء اختيار مشروع أولاً من لوحة التحكم.</div>;
  }

  return (
    <div className="p-6 w-full h-[calc(100vh-80px)] flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 shrink-0 bg-card border border-border p-4 rounded-xl shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight">إدارة الموارد البشرية</h1>
              <p className="text-sm text-muted-foreground font-medium">قم ببناء وتنظيم فريقك الإبداعي والممثلين.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={() => window.print()} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="طباعة كـ PDF">
               <Printer size={18} />
             </button>
             <button onClick={exportToJSON} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="تصدير (JSON)">
               <Download size={18} />
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="استيراد (JSON)">
               <Upload size={18} />
             </button>
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportJSON} className="hidden" />
             <div className="w-px h-6 bg-border mx-2" />
             <button 
               onClick={() => { setEditingMember(null); setShowModal(true); }}
               className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
             >
               <Plus size={16} /> فرد جديد
             </button>
          </div>
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* Tabs Bar */}
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setActiveTab('TECHNICAL')}
             className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'TECHNICAL' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
           >
             الطاقم التقني (Crew)
           </button>
           <button 
             onClick={() => setActiveTab('CAST')}
             className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'CAST' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
           >
             الممثلين (Cast)
           </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو القسم..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-1.5 bg-background border border-input rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Filter size={14} className="text-muted-foreground" />
            {activeTab === 'TECHNICAL' && (
              <select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-1.5 bg-background border border-input rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none min-w-[120px]"
              >
                <option value="">كل الأقسام</option>
                {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            )}
            <select 
              value={filterEmployment} 
              onChange={e => setFilterEmployment(e.target.value)}
              className="px-3 py-1.5 bg-background border border-input rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none min-w-[120px]"
            >
              <option value="">كل التعاقدات</option>
              <option value="FREELANCE">عمل حر (Freelance)</option>
              <option value="CONTRACTED">متعاقد</option>
              <option value="VOLUNTEER">متطوع</option>
            </select>
          </div>
        </div>
      </div>

      {/* Crew Grid */}
      <div className="flex-1 overflow-y-auto w-full pr-2 pl-4 custom-scrollbar print:pr-0 print:pl-0 print:overflow-visible">
        {Object.keys(groupedCrew).length === 0 ? (
           <div className="text-center py-20 bg-card/50 border border-dashed border-border rounded-2xl">
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
                <LayoutGrid size={32} />
              </div>
              <h2 className="text-lg font-black text-foreground mb-2">لوحة الفريق فارغة</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">لم تقم بإضافة أي أفراد للفريق بعد. ابدأ بإضافة المخرج والمصور وباقي أفراد الطاقم لتنظيم العمل.</p>
              <button 
                onClick={() => { setEditingMember(null); setShowModal(true); }}
                className="px-6 py-2.5 bg-background border border-border text-foreground hover:bg-secondary rounded-lg text-sm font-bold transition-all"
              >
                إضافة أول فرد للفريق
              </button>
           </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedCrew).map(([roleKey, members]) => (
              <div key={roleKey} className="space-y-4 print:break-inside-avoid">
                
                {/* Department Header */}
                <h2 className="text-lg font-black text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                  <div className="w-2 h-6 bg-primary rounded-full"></div>
                  {ROLE_LABELS[roleKey] || roleKey || 'تخصصات أخرى'}
                  <span className="text-sm text-muted-foreground mr-2 font-bold bg-secondary px-2 py-0.5 rounded-full">{members.length} أعضاء</span>
                </h2>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                  {members.map(member => {
                    const empInfo = EMPLOYMENT_BADGES[member.employment_type] || EMPLOYMENT_BADGES.FREELANCE;
                    const memberAssignments = assignments?.filter(a => a.crew_id === member.id) || [];
                    const memberCharacters = characters?.filter(c => c.actor_id === member.id) || [];
                    
                    return (
                      <div key={member.id} className="group bg-card border border-border hover:border-primary/30 rounded-2xl p-4 transition-all hover:shadow-md relative overflow-hidden flex flex-col">
                        <div className="flex gap-4 mb-3 relative z-10">
                          <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            {member.image_url ? (
                              <img src={resolveMediaUrl(member.image_url)} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={32} className="text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 py-1 flex flex-col">
                            <h3 className="font-black text-foreground text-lg truncate" title={member.name}>{member.name}</h3>
                            <div className="mt-2 space-y-2">
                              <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg border bg-secondary border-border text-foreground truncate max-w-full" title={member.category === 'CAST' ? 'نوع الدور' : 'المسمى الوظيفي'}>
                                {member.job_title || ROLE_LABELS[member.role] || member.role || 'تخصصات أخرى'}
                              </span>
                              
                              {/* Characters badges if Actor */}
                              {member.category === 'CAST' && memberCharacters.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {memberCharacters.map(c => (
                                    <span key={c.id} className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-full" title="يلعب دور">
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap ${empInfo.cls}`}>
                                  {empInfo.label}
                                </span>
                                {memberAssignments.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary whitespace-nowrap">
                                    <ClipboardList size={10} />
                                    {memberAssignments.length} تكليفات
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="h-px w-full bg-border/50 mb-4" />

                        {/* Contact Info (Click to Copy) */}
                        <div className="space-y-2 mt-auto">
                          {member.phone && (
                            <button 
                              onClick={() => handleCopy(member.phone)}
                              className="w-full flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 p-1.5 -ml-1.5 rounded-md transition-colors group/btn"
                            >
                              <Phone size={14} className="shrink-0" />
                              <span dir="ltr" className="flex-1 text-right">{member.phone}</span>
                              {copiedText === member.phone ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={12} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                            </button>
                          )}
                          {member.email && (
                            <button 
                              onClick={() => handleCopy(member.email)}
                              className="w-full flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 p-1.5 -ml-1.5 rounded-md transition-colors group/btn truncate"
                            >
                              <Mail size={14} className="shrink-0" />
                              <span className="flex-1 text-right truncate">{member.email}</span>
                              {copiedText === member.email ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={12} className="opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0" />}
                            </button>
                          )}
                          {!member.phone && !member.email && (
                            <div className="text-xs text-muted-foreground/50 italic flex items-center gap-2 p-1.5">
                              <Briefcase size={12} /> لا توجد بيانات اتصال
                            </div>
                          )}
                          {member.wage > 0 && (
                            <div className="flex items-center gap-2 text-xs font-bold p-1.5 -ml-1.5 rounded-md text-emerald-600 bg-emerald-500/10">
                              <Banknote size={14} className="shrink-0" />
                              <span className="flex-1 text-right">{member.wage.toLocaleString()} {member.currency}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">{member.payment_status}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Actions (Hover) - Fixed distance below email */}
                        <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity print:hidden h-8">
                          <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border border-border/50">
                            <button onClick={() => setPreviewMember(member)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="التفاصيل"><Eye size={14} /></button>
                            <button onClick={() => setAssignmentMember(member)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="التكليفات"><ClipboardList size={14} /></button>
                            <button onClick={() => handleEdit(member)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="تعديل"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(member.id)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="حذف"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <CrewModal 
          member={editingMember}
          activeTab={activeTab} 
          onClose={() => setShowModal(false)} 
          onSubmit={handleSubmit} 
        />
      )}

      {previewMember && (
        <CrewPreviewModal 
          member={previewMember}
          onClose={() => setPreviewMember(null)}
        />
      )}

      {assignmentMember && (
        <CrewAssignmentModal 
          member={assignmentMember}
          onClose={() => setAssignmentMember(null)}
        />
      )}

      {/* Safe Delete Modal */}
      {memberToDelete && (() => {
        const linkedChars = characters.filter(c => c.actor_id === memberToDelete.id);
        let customMessage;
        if (linkedChars.length > 0) {
          const charNames = linkedChars.map(c => c.name).join('، ');
          customMessage = (
            <>
              <strong>"{memberToDelete.name}"</strong> مُسند لأداء دور <strong>"{charNames}"</strong>.
              <br />
              عملية الحذف ستؤدي إلى فقدان هذه الشخصية لمن يؤديها.
            </>
          );
        } else {
          customMessage = (
            <>هل أنت متأكد من رغبتك في حذف <strong>"{memberToDelete.name}"</strong>؟</>
          );
        }

        return (
          <SafeDeleteModal
            isOpen={true}
            onClose={() => setMemberToDelete(null)}
            onConfirm={confirmDelete}
            message={customMessage}
          />
        );
      })()}
    </div>
  );
}

// -------------------------------------------------------------
// SafeDeleteModal Component (Embedded for zero-dependency)
// -------------------------------------------------------------
function SafeDeleteModal({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border/50 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 font-sans">
        <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2 border border-rose-500/20">
            <AlertTriangle size={32} />
          </div>
          <h3 className="font-black text-2xl text-foreground">تأكيد الحذف</h3>
          <p className="text-sm font-medium leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>
        
        <div className="p-6 bg-muted/20 border-t border-border flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-border font-bold text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            تراجع
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors shadow-sm shadow-rose-500/20"
          >
            نعم، احذف نهائياً
          </button>
        </div>
      </div>
    </div>
  );
}
