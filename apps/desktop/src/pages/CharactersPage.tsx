import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users2, Search, ShieldCheck, AlertTriangle, UserCheck } from 'lucide-react';
import AdvancedFilterBar from '../components/ui/AdvancedFilterBar';
import { useUIStore } from '../store/useUIStore';
import { useCharactersQuery, useCharacterStatsQuery, useDeleteCharacterMutation } from '../hooks/queries';
import { useToast } from '../hooks/useToast';
import CharacterCard from '../components/dashboard/CharacterCard';
import CharacterModal from '../components/CharacterModal';
import ConfirmModal from '../components/common/ConfirmModal';
import type { ICharacter } from '@scriptflow/core';

const SafeFilterBar = AdvancedFilterBar as React.ComponentType<any>;
const SafeCharacterModal = CharacterModal as React.ComponentType<any>;

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
  const { data: characters } = useCharactersQuery(activeScenarioId || '');
  const { data: charStatsMap = {} } = useCharacterStatsQuery(activeScenarioId || '');
  const deleteMutation = useDeleteCharacterMutation();
  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showCharModal, setShowCharModal] = useState<boolean>(false);
  const [editingChar, setEditingChar] = useState<ICharacter | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [completionFilter, setCompletionFilter] = useState<string>('');

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
  }, [setTopBarConfig, clearSidebarContext]);

  // Register sidebar context
  useEffect(() => {
    if (!characters) return;
    setSidebarContext({
      title: 'إحصائيات الشخصيات',
      stats: [
        { label: 'إجمالي', value: characters.length || 0 },
        { label: 'تم التعاقد', value: characters.filter((c: any) => c.status === 'CASTED').length || 0 },
        { label: 'جاري البحث', value: characters.filter((c: any) => c.status === 'SEARCHING' || !c.status).length || 0 },
      ]
    });
  }, [characters, setSidebarContext]);

  const [charToDelete, setCharToDelete] = useState<{ id: string; name: string } | null>(null);

  function deleteCharacter(id: string, name?: string) {
    setCharToDelete({ id, name: name || '' });
  }

  async function confirmDeleteCharacter() {
    if (!charToDelete) return;
    try {
      await deleteMutation.mutateAsync(charToDelete.id);
      showToast('تم حذف الشخصية بنجاح', 'success');
      setCharToDelete(null);
    } catch {
      showToast('فشل حذف الشخصية', 'error');
    }
  }

  const charList: ICharacter[] = (characters as ICharacter[]) || [];

  const filteredChars = useMemo(() => {
    return charList.filter((c: any) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchActor = c.actor_name?.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);
        if (!matchName && !matchActor && !matchDesc) return false;
      }

      // 2. Role Filter
      if (roleFilter) {
        if (roleFilter === '__none__') {
          if (c.role) return false;
        } else if (c.role !== roleFilter) {
          return false;
        }
      }

      // 3. Status Filter
      if (statusFilter && c.status !== statusFilter) {
        return false;
      }

      // 4. Completion Filter
      if (completionFilter) {
        const isComplete = Boolean(c.role && c.description);
        if (completionFilter === 'complete' && !isComplete) return false;
        if (completionFilter === 'incomplete' && isComplete) return false;
      }

      return true;
    });
  }, [charList, searchQuery, roleFilter, statusFilter, completionFilter]);

  // Quick Stat Badges
  const stats = useMemo(() => {
    const total = charList.length;
    const casted = charList.filter((c: any) => c.status === 'CASTED').length;
    const incomplete = charList.filter((c: any) => !c.role && !c.description).length;
    const withActor = charList.filter((c: any) => c.actor_name).length;
    return { total, casted, incomplete, withActor };
  }, [charList]);

  const hasActiveFilters = searchQuery || roleFilter || statusFilter || completionFilter;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground custom-scrollbar px-6 py-4">
      {/* Quick Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 shrink-0">
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
        <SafeFilterBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="بحث بالاسم، الممثل، أو الوصف..."
          hasActiveFilters={Boolean(hasActiveFilters)}
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
              type: 'pills',
              value: completionFilter,
              onChange: setCompletionFilter,
              options: [
                { value: 'complete', label: 'مكتملة البيانات', count: stats.total - stats.incomplete },
                { value: 'incomplete', label: 'غير مكتملة', count: stats.incomplete },
              ]
            }
          ]}
        />
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
            {filteredChars.map((char: any) => (
              <CharacterCard 
                key={char.id} 
                character={char} 
                onPreview={() => setEditingChar(char)}
                onOpenFull={() => navigate(`/characters/${char.id}`)}
                onDelete={() => deleteCharacter(char.id, char.name)}
                charStats={charStatsMap[char.id] || {}}
              />
            ))}
          </div>
        )}
      </div>

      {showCharModal && (
        <SafeCharacterModal 
          onClose={() => setShowCharModal(false)}
          onCharacterAdded={() => {}}
        />
      )}

      {editingChar && (
        <SafeCharacterModal 
          character={editingChar}
          onClose={() => setEditingChar(null)}
          onCharacterUpdated={() => {}}
        />
      )}

      <ConfirmModal
        isOpen={!!charToDelete}
        onClose={() => setCharToDelete(null)}
        onConfirm={confirmDeleteCharacter}
        title="حذف الشخصية"
        message={
          <span>
            هل أنت متأكد من حذف الشخصية {charToDelete?.name ? <strong className="text-foreground">«{charToDelete.name}»</strong> : ''} نهائياً؟ سيتم إزالة كافة البيانات المرتبطة بها.
          </span>
        }
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
