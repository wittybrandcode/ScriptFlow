import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users2, Search, Filter, ShieldCheck, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import AdvancedFilterBar from '../components/ui/AdvancedFilterBar';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useCharactersQuery, useCharacterStatsQuery, useDeleteCharacterMutation } from '../hooks/queries';
import { useToast } from '../hooks/useToast';
import CharacterCard from '../components/dashboard/CharacterCard';
import CharacterModal from '../components/CharacterModal';

const ROLE_FILTERS = [
  { value: '', label: 'جميع الأدوار' },
  { value: 'بطل رئيسي', label: 'بطل رئيسي' },
  { value: 'بطل مساعد', label: 'بطل مساعد' },
  { value: 'شرير', label: 'شرير / خصم' },
  { value: 'ثانوي', label: 'ثانوي' },
  { value: 'كومبارس', label: 'كومبارس' },
  { value: '__none__', label: 'غير محدد' },
];

const STATUS_FILTERS = [
  { value: '', label: 'جميع الحالات' },
  { value: 'SEARCHING', label: 'جاري البحث' },
  { value: 'SHORTLISTED', label: 'مرشح' },
  { value: 'CASTED', label: 'تم التعاقد' },
  { value: 'REPLACED', label: 'مستبدل' },
];

/**
 * CharactersPage - صفحة إدارة شخصيات المشروع والكاستينج
 */
export default function CharactersPage() {
  const { activeScenarioId } = useUIStore();
  const { data: characters } = useCharactersQuery(activeScenarioId);
  const { data: charStatsMap = {} } = useCharacterStatsQuery(activeScenarioId);
  const deleteMutation = useDeleteCharacterMutation();
  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showCharModal, setShowCharModal] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [completionFilter, setCompletionFilter] = useState('');

  useEffect(() => {
    setTopBarConfig({ 
      pageName: 'مكتبة الشخصيات',
      actions: [
        {
          label: 'شخصية جديدة',
          icon: Plus,
          variant: 'primary',
          onClick: () => setShowCharModal(true)
        }
      ]
    });
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register sidebar context
  useEffect(() => {
    if (!characters) return;
    setSidebarContext({
      title: 'إحصائيات الشخصيات',
      stats: [
        { label: 'إجمالي', value: characters.length || 0 },
        { label: 'تم التعاقد', value: characters.filter(c => c.status === 'CASTED').length || 0 },
      ],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters]);



  async function deleteCharacter(id) {
    if (!confirm('هل تريد حذف هذه الشخصية؟')) return;
    try {
      await deleteMutation.mutateAsync(id);

      showToast('تم حذف الشخصية', 'info');
    } catch (err) {
      showToast('خطأ في الحذف', 'error');
    }
  }

  const charList = useMemo(() => Array.isArray(characters) ? characters : [], [characters]);

  const filteredChars = useMemo(() => {
    return charList.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (c.name || '').toLowerCase().includes(q) 
          || (c.actor_name || '').toLowerCase().includes(q)
          || (c.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (roleFilter === '__none__') {
        if (c.role) return false;
      } else if (roleFilter && c.role !== roleFilter) {
        return false;
      }
      if (statusFilter && (c.status || 'SEARCHING') !== statusFilter) return false;
      if (completionFilter === 'incomplete' && (c.role && c.description)) return false;
      if (completionFilter === 'complete' && (!c.role || !c.description)) return false;
      return true;
    });
  }, [charList, searchQuery, roleFilter, statusFilter, completionFilter]);

  // Page-level stats
  const stats = useMemo(() => {
    const total = charList.length;
    const casted = charList.filter(c => c.status === 'CASTED').length;
    const incomplete = charList.filter(c => !c.role && !c.description).length;
    const withActor = charList.filter(c => c.actor_name).length;
    return { total, casted, incomplete, withActor };
  }, [charList]);

  const hasActiveFilters = searchQuery || roleFilter || statusFilter || completionFilter;

  return (
    <div className="p-4 mx-auto h-[calc(100vh-80px)] flex flex-col gap-4 animate-in fade-in duration-500">
      
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Users2 size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.total}</div>
            <div className="text-xs text-muted-foreground font-medium">إجمالي الشخصيات</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"><UserCheck size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.casted}</div>
            <div className="text-xs text-muted-foreground font-medium">تم التعاقد</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600"><ShieldCheck size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.withActor}</div>
            <div className="text-xs text-muted-foreground font-medium">لديها ممثل</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600"><AlertTriangle size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.incomplete}</div>
            <div className="text-xs text-muted-foreground font-medium">غير مكتملة</div>
          </div>
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className="shrink-0 mb-4">
        <AdvancedFilterBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="بحث بالاسم، الممثل، أو الوصف..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSearchQuery('');
            setRoleFilter('');
            setStatusFilter('');
            setCompletionFilter('');
          }}
          filters={[
            {
              type: 'select',
              value: roleFilter,
              onChange: setRoleFilter,
              options: ROLE_FILTERS
            },
            {
              type: 'select',
              value: statusFilter,
              onChange: setStatusFilter,
              options: STATUS_FILTERS
            },
            {
              type: 'select',
              value: completionFilter,
              onChange: setCompletionFilter,
              options: [
                { value: '', label: 'اكتمال البيانات' },
                { value: 'complete', label: 'مكتملة' },
                { value: 'incomplete', label: 'غير مكتملة' }
              ]
            }
          ]}
        />
        {hasActiveFilters && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground font-medium px-2">
            <Filter size={12} />
            <span>عرض {filteredChars.length} من أصل {charList.length} شخصية</span>
          </div>
        )}
      </div>

      {/* Characters Grid - Full Width */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        {charList.length === 0 ? (
          <div className="py-20 text-center bg-card border border-dashed border-border rounded-lg">
             <Users2 size={32} className="mx-auto mb-3 text-muted-foreground/30" />
             <div className="text-sm text-muted-foreground font-medium">لم يتم تسجيل أي شخصيات لهذا المشروع بعد.</div>
          </div>
        ) : filteredChars.length === 0 ? (
          <div className="py-16 text-center bg-card border border-dashed border-border rounded-lg">
             <Search size={28} className="mx-auto mb-3 text-muted-foreground/30" />
             <div className="text-sm text-muted-foreground font-medium">لا توجد شخصيات تطابق معايير الفلترة الحالية.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {filteredChars.map(char => (
              <CharacterCard 
                key={char.id} 
                character={char} 
                onPreview={() => setEditingChar(char)}
                onOpenFull={() => navigate(`/characters/${char.id}`)}
                onDelete={() => deleteCharacter(char.id)}
                charStats={charStatsMap[char.id] || {}}
              />
            ))}
          </div>
        )}
      </div>

      {showCharModal && (
        <CharacterModal 
          onClose={() => setShowCharModal(false)}
          onCharacterAdded={() => {}}
        />
      )}

      {editingChar && (
        <CharacterModal 
          character={editingChar}
          onClose={() => setEditingChar(null)}
          onCharacterUpdated={() => {}}
        />
      )}
    </div>
  );
}
