import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, RefreshCw, Film, Users, MapPin, Tv, UserSquare2, 
  ArrowLeft, Search, Loader2, AlertTriangle, Check, ShieldAlert
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useUIStore } from '../store/useUIStore';
import { useTrashQuery, useRestoreItemMutation, usePurgeItemMutation } from '../hooks/queries/useTrash';
import { formatDate } from '../utils/dateUtils';

export default function TrashPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setTopBarConfig } = useUIStore();
  
  const { data: trashItems = [], isLoading: loading, refetch } = useTrashQuery();
  const restoreItemMutation = useRestoreItemMutation();
  const purgeItemMutation = usePurgeItemMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [actioningId, setActioningId] = useState(null); // type-id e.g., 'character-5'
  const [purgeConfirmItem, setPurgeConfirmItem] = useState(null); // Item to purge

  // Top Bar configuration
  useEffect(() => {
    setTopBarConfig({
      title: 'سلة المحذوفات',
      subtitle: 'استرجاع أو حذف نهائي للعناصر المؤرشفة',
      actions: [
        {
          id: 'go-back',
          label: 'العودة للرئيسية',
          icon: ArrowLeft,
          variant: 'outline',
          onClick: () => navigate('/')
        }
      ]
    });
  }, [setTopBarConfig]);

  function fetchTrash() {
    refetch();
    showToast('تم تحديث سلة المحذوفات', 'info');
  }

  async function handleRestore(item) {
    const actionId = `${item.type}-${item.id}`;
    setActioningId(actionId);
    try {
      await restoreItemMutation.mutateAsync({ type: item.type, id: item.id });
      showToast('تم استعادة العنصر بنجاح', 'success');
    } catch (err) {
      console.error('Failed to restore item:', err);
      showToast(err.message || 'فشل استعادة العنصر', 'error');
    } finally {
      setActioningId(null);
    }
  }

  async function handlePurge(item) {
    const actionId = `${item.type}-${item.id}`;
    setActioningId(actionId);
    setPurgeConfirmItem(null);
    try {
      await purgeItemMutation.mutateAsync({ type: item.type, id: item.id });
      showToast('تم حذف العنصر نهائياً', 'success');
    } catch (err) {
      console.error('Failed to purge item:', err);
      showToast(err.message || 'فشل الحذف النهائي', 'error');
    } finally {
      setActioningId(null);
    }
  }

  // Filter items
  const normalizeArabic = (text) => {
    if (!text) return '';
    return text
      .replace(/[أإآا]/g, 'ا')
      .replace(/[ةه]/g, 'ه')
      .replace(/[يى]/g, 'ي')
      .toLowerCase();
  };

  const filteredItems = trashItems.filter(item => {
    const query = normalizeArabic(searchQuery);
    const nameMatch = normalizeArabic(item.name).includes(query);
    const typeMatch = normalizeArabic(getTypeLabel(item.type)).includes(query);
    const scenarioMatch = normalizeArabic(item.scenario_title).includes(query);
    return nameMatch || typeMatch || scenarioMatch;
  });

  function getTypeIcon(type) {
    switch(type) {
      case 'scenario': return <Film className="text-sky-400" size={16} />;
      case 'character': return <UserSquare2 className="text-pink-400" size={16} />;
      case 'scene': return <Tv className="text-amber-400" size={16} />;
      case 'location': return <MapPin className="text-emerald-400" size={16} />;
      case 'crew': return <Users className="text-purple-400" size={16} />;
      default: return <Trash2 className="text-neutral-400" size={16} />;
    }
  }

  function getTypeLabel(type) {
    switch(type) {
      case 'scenario': return 'مشروع سيناريو';
      case 'character': return 'شخصية';
      case 'scene': return 'مشهد سينمائي';
      case 'location': return 'موقع تصوير';
      case 'crew': return 'عضو طاقم';
      default: return 'عنصر';
    }
  }

  function getFormattedDate(dateStr) {
    if (!dateStr) return '';
    return formatDate(date, 'd MMMM yyyy, HH:mm');
  }

  return (
    <div className="p-6 w-full" dir="rtl">
      
      {/* Header section with search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في العناصر المحذوفة..."
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl py-2.5 pr-10 pl-4 text-sm text-foreground focus:outline-none transition-all placeholder:text-neutral-500 font-bold"
          />
        </div>
        <button 
          onClick={fetchTrash}
          className="flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-foreground px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          تحديث السلة
        </button>
      </div>

      {/* Main Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="text-primary animate-spin" size={36} />
          <p className="text-xs text-muted-foreground font-bold tracking-wider">جارٍ تحميل سلة المحذوفات...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-card/40 border border-border/80 backdrop-blur-md rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900/60 flex items-center justify-center text-neutral-600 border border-neutral-800/80 mb-2">
            <Trash2 size={28} />
          </div>
          <h3 className="text-base font-black text-foreground">سلة المحذوفات فارغة</h3>
          <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
            {searchQuery ? 'لا توجد نتائج تطابق بحثك الحالي.' : 'ممتاز! لا توجد عناصر محذوفة حالياً. العناصر التي يتم حذفها ستظهر هنا للاسترجاع لاحقاً.'}
          </p>
        </div>
      ) : (
        <div className="bg-card/30 border border-border/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-white/[0.02]">
                  <th className="py-4 px-6 text-xs font-black text-muted-foreground/80 uppercase">العنصر</th>
                  <th className="py-4 px-6 text-xs font-black text-muted-foreground/80 uppercase">النوع</th>
                  <th className="py-4 px-6 text-xs font-black text-muted-foreground/80 uppercase">المشروع المرتبط</th>
                  <th className="py-4 px-6 text-xs font-black text-muted-foreground/80 uppercase">تاريخ الحذف</th>
                  <th className="py-4 px-6 text-xs font-black text-muted-foreground/80 uppercase text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredItems.map((item) => {
                  const actionId = `${item.type}-${item.id}`;
                  const isActioning = actioningId === actionId;

                  return (
                    <tr key={actionId} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center shrink-0">
                            {getTypeIcon(item.type)}
                          </div>
                          <span className="text-sm font-black text-foreground truncate max-w-xs">{item.name || 'غير مسمى'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold bg-white/[0.03] text-neutral-300 border border-white/5 py-1 px-2.5 rounded-lg">
                          {getTypeLabel(item.type)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs text-neutral-400 font-bold truncate max-w-xs block">
                          {item.scenario_title || 'مشروع مستقل / أساسي'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs text-neutral-500 font-bold">
                          {getFormattedDate(item.deleted_at)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isActioning}
                            onClick={() => handleRestore(item)}
                            className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-emerald-500/20"
                            title="استعادة العنصر"
                          >
                            <RefreshCw size={12} className={isActioning ? 'animate-spin' : ''} />
                            استعادة
                          </button>
                          <button
                            disabled={isActioning}
                            onClick={() => setPurgeConfirmItem(item)}
                            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-50 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-rose-500/20"
                            title="حذف نهائي"
                          >
                            <Trash2 size={12} />
                            حذف نهائي
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purge Confirmation Modal */}
      {purgeConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">تأكيد الحذف النهائي</h3>
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">تحذير أمني هام</p>
                </div>
              </div>
              
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 mb-4 text-center">
                <p className="text-[11px] text-rose-300 font-bold leading-relaxed">
                  أنت على وشك حذف العنصر <strong className="text-white">"{purgeConfirmItem.name}"</strong> نهائياً من قاعدة البيانات. لن تتمكن من استعادته لاحقاً أبداً!
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePurge(purgeConfirmItem)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/10"
                >
                  <Trash2 size={14} /> نعم، احذف نهائياً
                </button>
                <button
                  onClick={() => setPurgeConfirmItem(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-black py-2.5 rounded-xl text-xs transition-all"
                >
                  إلغاء التراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
