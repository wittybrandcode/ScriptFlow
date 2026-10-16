import React, { useState, useMemo } from 'react';
import { X, Heart, Shield, Users, HelpCircle, Sparkles, UserCheck, Flame, Ban, Trash2, Plus, AlertTriangle, Info } from 'lucide-react';
import { biologicalTypes, dramaticTypes } from '../../utils/typeRegistry';

const getRelationIcon = (type, size = 12) => {
  const t = String(type).toUpperCase();
  if (t.includes('LOVE') || t.includes('MARRIAGE') || t.includes('SPOUSE') || t.includes('WIFE') || t.includes('HUSBAND') || t.includes('زوج')) {
    return <Heart size={size} className="fill-rose-500 text-rose-500" />;
  }
  if (t.includes('ENEMY') || t.includes('BETRAYER') || t.includes('عداوة') || t.includes('خائن')) {
    return <Flame size={size} className="text-red-500 fill-red-500" />;
  }
  if (t.includes('ALLY') || t.includes('PROTECT') || t.includes('تحالف') || t.includes('حامي')) {
    return <Shield size={size} className="text-emerald-500 fill-emerald-500" />;
  }
  if (t.includes('SIBLING') || t.includes('أخ') || t.includes('أخت')) {
    return <Users size={size} className="text-emerald-600" />;
  }
  if (t.includes('PARENT') || t.includes('CHILD') || t.includes('MOTHER') || t.includes('FATHER') || t.includes('أب') || t.includes('أم')) {
    return <UserCheck size={size} className="text-blue-500" />;
  }
  if (t.includes('BLACKMAIL') || t.includes('ابتزاز')) {
    return <Ban size={size} className="text-amber-800" />;
  }
  return <Sparkles size={size} className="text-indigo-500" />;
};

export default function CharacterRPGPanel({
  character,
  characters,
  edges,
  warnings = [],
  onClose,
  onAddRelationship,
  onRemoveRelationship,
}) {
  const [newTargetId, setNewTargetId] = useState('');
  const [newRelType, setNewRelType] = useState('MARRIAGE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Direct explicit relationships
  const directRelations = useMemo(() => {
    if (!character || !edges) return [];
    return edges.filter(e => 
      e.data?.category !== 'INFERRED' && 
      e.category !== 'INFERRED' &&
      (String(e.source) === String(character.id) || String(e.target) === String(character.id))
    ).map(e => {
      const isSource = String(e.source) === String(character.id);
      const targetId = isSource ? e.target : e.source;
      const targetChar = characters.find(c => String(c.id) === String(targetId));
      return {
        edgeId: e.id,
        targetId,
        targetName: targetChar?.name || targetId,
        relType: e.data?.relType || e.type,
        category: e.data?.category || e.category,
        color: e.data?.color || '#94a3b8',
        label: e.data?.label || e.label || e.type,
        isOutgoing: isSource
      };
    });
  }, [character, edges, characters]);

  // 2. Inferred relationships
  const inferredRelations = useMemo(() => {
    if (!character || !edges) return [];
    return edges.filter(e => 
      (e.data?.category === 'INFERRED' || e.category === 'INFERRED') && 
      (String(e.source) === String(character.id) || String(e.target) === String(character.id))
    ).map(e => {
      const isSource = String(e.source) === String(character.id);
      const targetId = isSource ? e.target : e.source;
      const targetChar = characters.find(c => String(c.id) === String(targetId));
      return {
        edgeId: e.id,
        targetId,
        targetName: targetChar?.name || targetId,
        relType: e.data?.relType || e.type,
        category: 'INFERRED',
        color: e.data?.color || '#8b5cf6',
        label: e.data?.label || e.label || e.type,
        isOutgoing: isSource
      };
    });
  }, [character, edges, characters]);

  // Filter out characters for the target select list (exclude self and direct relation targets)
  const availableCharacters = useMemo(() => {
    if (!character || !characters) return [];
    const directTargetIds = new Set(directRelations.map(r => String(r.targetId)));
    return characters.filter(c => 
      String(c.id) !== String(character.id) && 
      !directTargetIds.has(String(c.id))
    );
  }, [character, characters, directRelations]);

  // Form submission
  const handleCreateRelation = async (e) => {
    e.preventDefault();
    if (!newTargetId || !newRelType) return;
    setIsSubmitting(true);
    try {
      await onAddRelationship(character.id, newTargetId, newRelType);
      setNewTargetId('');
    } catch (err) {
      console.error('Failed to create relationship:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get active character specific warnings
  const characterWarnings = useMemo(() => {
    if (!character || !warnings) return [];
    return warnings.filter(w => w.includes(character.name));
  }, [character, warnings]);

  if (!character) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in slide-in-from-left-8 duration-300 border-r border-slate-200" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
            {character.name[0]}
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800">{character.name}</h2>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">{character.role || 'شخصية رئيسية'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Validation Warnings Alert Banner */}
        {characterWarnings.length > 0 && (
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 text-red-800 space-y-2 animate-pulse shadow-sm">
            <h4 className="text-[10px] font-black flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle size={14} className="text-red-500 shrink-0" /> تعارضات في العلاقات المكتشفة ({characterWarnings.length})
            </h4>
            <ul className="list-disc list-inside text-[9px] leading-relaxed font-bold space-y-1 pr-1">
              {characterWarnings.map((w, idx) => (
                <li key={idx} className="marker:text-red-400">{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Create Relationship Form */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3.5">
          <h3 className="text-[10px] font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Plus size={14} className="text-indigo-500" /> إضافة رابط أو علاقة جديدة
          </h3>
          <form onSubmit={handleCreateRelation} className="space-y-2.5">
            <div>
              <label className="block text-[8px] font-bold text-slate-400 mb-1">اختر الشخصية الطرف الآخر:</label>
              <select
                value={newTargetId}
                onChange={(e) => setNewTargetId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">-- اختر الشخصية --</option>
                {availableCharacters.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[8px] font-bold text-slate-400 mb-1">نوع العلاقة المباشرة:</label>
              <select
                value={newRelType}
                onChange={(e) => setNewRelType(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <optgroup label="روابط عائلية / بيولوجية">
                  {biologicalTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </optgroup>
                <optgroup label="روابط درامية / قصة">
                  {dramaticTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newTargetId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} /> إضافة الرابط للقصة
            </button>
          </form>
        </div>

        {/* Direct Relationships List */}
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">العلاقات المباشرة ({directRelations.length})</h3>
          <div className="flex flex-col gap-2">
            {directRelations.map((rel) => (
              <div 
                key={rel.edgeId} 
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: `${rel.color}15` }}
                  >
                    {getRelationIcon(rel.relType, 13)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{rel.targetName}</h4>
                    <span 
                      className="text-[9px] font-extrabold flex items-center gap-1"
                      style={{ color: rel.color }}
                    >
                      {rel.label || rel.relType}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveRelationship(rel.edgeId)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="حذف العلاقة"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {directRelations.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-[10px] font-bold bg-white border border-slate-200 rounded-xl shadow-inner">
                لا توجد علاقات مباشرة مسجلة لهذه الشخصية
              </div>
            )}
          </div>
        </div>

        {/* Inferred Relationships List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">العلاقات المستنتجة ذكياً ({inferredRelations.length})</h3>
            <div className="group relative flex items-center">
              <Info size={11} className="text-slate-300 cursor-help" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block bg-slate-800 text-white text-[8px] font-bold p-2 rounded-lg shadow-lg w-[160px] leading-relaxed z-30">
                يقوم محرك الاستنتاج بتحليل الروابط العائلية تلقائياً لاستخلاص الأجداد والأحفاد والأخوة تلقائياً.
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {inferredRelations.map((rel) => (
              <div 
                key={rel.edgeId} 
                className="flex items-center justify-between p-3 rounded-xl border border-dashed border-purple-200 bg-purple-50/20 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shadow-inner">
                    {getRelationIcon(rel.relType, 13)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{rel.targetName}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-extrabold text-purple-700">
                        {rel.label || rel.relType}
                      </span>
                      <span className="text-[7px] bg-purple-100 text-purple-800 px-1 py-0.2 rounded font-black border border-purple-200">
                        مستنتج
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {inferredRelations.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-[10px] font-bold bg-white/40 border border-dashed border-slate-200 rounded-xl">
                لا توجد علاقات قرابة مستنتجة حالياً
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
