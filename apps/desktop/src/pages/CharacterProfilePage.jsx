import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { 
  useCharactersQuery, 
  useCharacterDetailQuery, 
  useUpdateCharacterMutation 
} from '../hooks/queries';
import { useCrewQuery } from '../hooks/queries/useCrew';
import { 
  ArrowRight, User, Image as ImageIcon, FileText, 
  Brain, UserCircle, Activity, Users, Film, 
  Loader2, Save, Upload, Plus, X, Camera, Edit3 
} from 'lucide-react';
import RichTextEditor from '../components/ui/RichTextEditor';
import { saveMediaFile, resolveMediaUrl } from '../services/mediaStorage';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CharacterProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeScenarioId } = useUIStore();
  const { data: characterDetail, isLoading: charLoading } = useCharacterDetailQuery(id);
  const { data: allCharacters = [] } = useCharactersQuery(activeScenarioId);
  const { data: crew = [] } = useCrewQuery(activeScenarioId);
  const updateMutation = useUpdateCharacterMutation();

  const [character, setCharacter] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('backstory');
  const [nasabData, setNasabData] = useState(null);
  
  // Local state for auto-save fields
  const [formData, setFormData] = useState({
    name: '',
    full_name: '',
    role: '',
    age: '',
    color: '#6366f1',
    actor_id: '',
    description: '',
    backstory: '',
    psychology: '',
    physical_traits: '',
    arc: '',
    relationships: '',
    gender: 'MALE',
    father_id: '',
    mother_id: '',
    birth_date: '',
    death_date: '',
    is_deceased: 0
  });

  // Derived state for the actor to ensure reactivity
  const actor = useMemo(() => {
    if (character?.actor_id && crew?.length > 0) {
      return crew.find(c => String(c.id) === String(character.actor_id)) || null;
    }
    return null;
  }, [character?.actor_id, crew]);

  // File Upload Reference
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Set loading from react-query status
  useEffect(() => {
    setLoading(charLoading);
  }, [charLoading]);

  // Handle setting character detail when query loads
  useEffect(() => {
    if (characterDetail) {
      setCharacter(characterDetail);
      setFormData({
        name: characterDetail.name || '',
        full_name: characterDetail.full_name || '',
        role: characterDetail.role || '',
        age: characterDetail.age || '',
        color: characterDetail.color || '#6366f1',
        actor_id: characterDetail.actor_id || '',
        description: characterDetail.description || '',
        backstory: characterDetail.backstory || '',
        psychology: characterDetail.psychology || '',
        physical_traits: characterDetail.physical_traits || '',
        arc: characterDetail.arc || '',
        relationships: characterDetail.relationships || '',
        gender: characterDetail.gender || 'MALE',
        father_id: characterDetail.father_id || '',
        mother_id: characterDetail.mother_id || '',
        birth_date: characterDetail.birth_date || '',
        death_date: characterDetail.death_date || '',
        is_deceased: characterDetail.is_deceased || 0
      });
      
      if (characterDetail.scenario_id) {
        import('../hooks/queries/useScenes').then(({ sceneApi }) => {
          sceneApi.getByScenarioId(characterDetail.scenario_id).then(scenesData => {
            setScenes(scenesData || []);
          });
        });
      }
    }
  }, [characterDetail]);

  // Fetch nasab chain data when the family tab is active
  useEffect(() => {
    if (activeTab !== 'family' || !characterDetail?.scenario_id || !allCharacters.length) return;
    const fetchNasab = async () => {
      try {
        const { charRelApi } = await import('../hooks/queries/useCharacters');
        const edges = await charRelApi.getByScenarioId(characterDetail.scenario_id);
        
        let currentId = characterDetail.id;
        const chain = [characterDetail.name];
        let kunya = null;
        let lineageId = `LIN-${characterDetail.id.toString().padStart(4, '0')}`;
        
        // Find children to determine Kunya (Abu/Um X)
        const children = edges.filter(e => 
          (e.character_id === currentId && (e.relationship_type === 'CHILD' || e.relationship_type === 'SON' || e.relationship_type === 'DAUGHTER')) ||
          (e.partner_id === currentId && (e.relationship_type === 'PARENT' || e.relationship_type === 'FATHER' || e.relationship_type === 'MOTHER'))
        );
        
        if (children.length > 0) {
          const firstChildId = children[0].character_id === currentId ? children[0].partner_id : children[0].character_id;
          const firstChild = allCharacters.find(c => c.id === firstChildId);
          if (firstChild) {
            const prefix = characterDetail.role === 'FEMALE' ? 'أم' : 'أبو'; // Assuming role or explicit gender
            kunya = `${prefix} ${firstChild.name.split(' ')[0]}`;
          }
        }
        
        // Build Nasab chain (up to 7 ancestors to prevent infinite loops)
        let safeCounter = 0;
        while (safeCounter < 7) {
          // Find father
          const fatherEdge = edges.find(e => 
            (e.character_id === currentId && (e.relationship_type === 'FATHER' || e.relationship_type === 'PARENT')) ||
            (e.partner_id === currentId && (e.relationship_type === 'CHILD' || e.relationship_type === 'SON' || e.relationship_type === 'DAUGHTER'))
          );
          
          if (!fatherEdge) break;
          
          const fatherId = fatherEdge.character_id === currentId ? fatherEdge.partner_id : fatherEdge.character_id;
          const father = allCharacters.find(c => c.id === fatherId);
          if (!father) break;
          
          chain.push(`بن ${father.name}`);
          currentId = father.id;
          safeCounter++;
        }
        
        setNasabData({
          kunya: kunya,
          lineageId: lineageId,
          nasabChain: chain.length > 1 ? chain : [] // Only show if there is actually a lineage
        });
      } catch (e) {
        console.error('Failed to fetch nasab data:', e);
      }
    };
    fetchNasab();
  }, [activeTab, characterDetail?.scenario_id, characterDetail?.id, allCharacters]);

  const handleSaveAndClose = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Image Upload Logic
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          
          // Add to reference_images
          const currentImages = Array.isArray(character.reference_images) 
            ? character.reference_images 
            : JSON.parse(character.reference_images || '[]');
          
          const extMatch = base64Data.match(/data:image\/([a-zA-Z]+);/);
          let ext = extMatch ? extMatch[1] : 'png';
          if (ext === 'jpeg') ext = 'jpg';
          const fileName = `char_${id}_ref_${Date.now()}.${ext}`;
          
          const mediaUri = await saveMediaFile(activeScenarioId, fileName, base64Data);
          const updatedImages = [...currentImages, mediaUri || base64Data];
          
          await updateMutation.mutateAsync({ id, data: { reference_images: JSON.stringify(updatedImages) } });
        } catch (err) {
          console.error('Failed to process image:', err);
          alert('فشل رفع الصورة');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('فشل رفع الصورة');
      setUploadingImage(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = async (indexToRemove) => {
    const currentImages = Array.isArray(character.reference_images) 
      ? character.reference_images 
      : JSON.parse(character.reference_images || '[]');
    const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
    await updateMutation.mutateAsync({ id, data: { reference_images: JSON.stringify(updatedImages) } });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full">
        <User size={64} className="text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">لم يتم العثور على الشخصية</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80">
          العودة
        </button>
      </div>
    );
  }

  // Determine scenes where character appears
  const characterScenes = scenes.filter(sc => {
    try {
      const pc = JSON.parse(sc.present_characters || '[]');
      return pc.includes(character.id);
    } catch (e) {
      return false;
    }
  });

  const referenceImages = Array.isArray(character.reference_images) 
    ? character.reference_images 
    : (() => {
        try {
          return JSON.parse(character.reference_images || '[]');
        } catch (e) {
          return [];
        }
      })();

  const TABS = [
    { id: 'backstory', label: 'الخلفية والقصة (Backstory)', icon: <Activity size={16} /> },
    { id: 'psychology', label: 'السيكولوجية (Psychology)', icon: <Brain size={16} /> },
    { id: 'physical_traits', label: 'المواصفات الجسدية (Physical)', icon: <UserCircle size={16} /> },
    { id: 'arc', label: 'مسار التطور (Character Arc)', icon: <ArrowRight size={16} /> },
    { id: 'relationships', label: 'ديناميكية العلاقات العامة', icon: <Users size={16} /> },
    { id: 'family', label: 'شجرة العائلة (النسب)', icon: <Users size={16} /> }
  ];

  return (
    <div className="flex-1 flex flex-col bg-background h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-secondary text-muted-foreground hover:bg-secondary/80 rounded-full transition-colors flex items-center justify-center"
          >
            <ArrowRight size={20} />
          </button>
          
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
            style={{ backgroundColor: `${character.color}20`, color: character.color }}
          >
            <User size={24} />
          </div>
          
          <div>
            {isEditing ? (
              <div className="flex flex-col gap-3 bg-secondary/20 border border-border p-4 rounded-xl mt-2 w-[400px]">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground font-bold">الاسم (المستخدم في السيناريو)</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="text-lg font-black bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    placeholder="اسم الشخصية"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground font-bold">الاسم الكامل (يستخدم للترابط مع شخصيات أخرى)</label>
                  <input 
                    type="text" 
                    name="full_name" 
                    value={formData.full_name} 
                    onChange={handleChange} 
                    className="text-sm font-bold bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    placeholder="الاسم الكامل للشخصية (اختياري)"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs text-muted-foreground font-bold">الدور</label>
                    <input 
                      type="text" 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange} 
                      className="text-sm font-bold bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full"
                      placeholder="بطل، مساعد..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-24">
                    <label className="text-xs text-muted-foreground font-bold">العمر</label>
                    <input 
                      type="text" 
                      name="age" 
                      value={formData.age} 
                      onChange={handleChange} 
                      className="text-sm font-bold bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full text-center"
                      placeholder="العمر"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 items-center">
                    <label className="text-[10px] text-muted-foreground font-bold">اللون المرجعي</label>
                    <input 
                      type="color" 
                      name="color" 
                      value={formData.color} 
                      onChange={handleChange} 
                      title="يستخدم هذا اللون لتمييز الشخصية في الجدول والسيناريو"
                      className="w-8 h-8 rounded-lg border border-border p-0.5 cursor-pointer bg-background"
                    />
                  </div>
                </div>

                {/* ═══ NASAB Fields Row ═══ */}
                <div className="flex items-end gap-3 mt-1">
                  <div className="flex flex-col gap-1.5 w-28">
                    <label className="text-xs text-muted-foreground font-bold">الجنس</label>
                    <select 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleChange} 
                      className="text-sm font-bold bg-background border border-border rounded-lg px-2 py-2 focus:outline-none focus:border-primary w-full"
                    >
                      <option value="MALE">♂ ذكر</option>
                      <option value="FEMALE">♀ أنثى</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs text-muted-foreground font-bold">تاريخ الميلاد</label>
                    <input 
                      type="text" 
                      name="birth_date" 
                      value={formData.birth_date} 
                      onChange={handleChange} 
                      className="text-sm font-bold bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full"
                      placeholder="مثال: 1980"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-24">
                    <label className="text-xs text-muted-foreground font-bold">الحالة</label>
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_deceased: prev.is_deceased ? 0 : 1, death_date: prev.is_deceased ? '' : prev.death_date }))}
                      className={`text-xs font-black px-3 py-2 rounded-lg border transition-colors ${
                        formData.is_deceased 
                          ? 'bg-red-500/10 border-red-500/40 text-red-400' 
                          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      {formData.is_deceased ? '🕊️ متوفى' : '💚 حي'}
                    </button>
                  </div>
                  {formData.is_deceased ? (
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs text-muted-foreground font-bold">تاريخ الوفاة</label>
                      <input 
                        type="text" 
                        name="death_date" 
                        value={formData.death_date} 
                        onChange={handleChange} 
                        className="text-sm font-bold bg-background border border-red-500/30 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 w-full"
                        placeholder="مثال: 2020"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
                  {character.name}
                  {saving && <Loader2 size={16} className="text-muted-foreground animate-spin" />}
                </h1>
                {character.full_name && (
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">{character.full_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${character.gender === 'FEMALE' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {character.gender === 'FEMALE' ? '♀ أنثى' : '♂ ذكر'}
                  </span>
                  {character.role && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      {character.role}
                    </span>
                  )}
                  {character.age && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      العمر: {character.age}
                    </span>
                  )}
                  {character.is_deceased ? (
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-red-500/10 text-red-400">
                      🕊️ متوفى {character.death_date ? `(${character.death_date})` : ''}
                    </span>
                  ) : null}
                  {character.birth_date ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      مواليد: {character.birth_date}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveAndClose}
                disabled={saving}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                حفظ التعديلات
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              <Edit3 size={16} /> تعديل وبناء الشخصية
            </button>
          )}

        {/* Actor Badge */}
        {isEditing ? (
          <div className="flex items-center gap-2 bg-secondary/50 border border-border/50 p-2 rounded-xl shadow-sm">
            <User size={18} className="text-muted-foreground" />
            <select
              name="actor_id"
              value={formData.actor_id || ''}
              onChange={handleChange}
              className="bg-background border border-border text-sm font-bold rounded-lg p-1.5 focus:outline-none focus:border-primary"
            >
              <option value="">-- بدون ممثل --</option>
              {crew.filter(c => c.category === 'CAST').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : actor ? (
          <div className="flex items-center gap-3 bg-secondary/50 border border-border/50 p-2 rounded-xl pr-4 shadow-sm cursor-pointer hover:bg-secondary transition-colors">
            <div className="text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">الممثل المرشح</p>
              <p className="text-sm font-bold text-foreground">{actor.name}</p>
            </div>
            {actor.image_url ? (
              <img src={actor.image_url} alt={actor.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <User size={20} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
            <User size={18} />
            لم يتم اختيار ممثل بعد
          </div>
        )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Deep Development (Tabs + Textareas) */}
        <div className="w-2/3 flex flex-col border-l border-border bg-background">
          <div className="flex border-b border-border bg-card shrink-0 px-2 pt-2 gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-primary bg-background text-primary' 
                    : 'border-transparent text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'family' ? (
              <div className="space-y-6 max-w-2xl mx-auto mt-4">
                <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                    <Users size={20} />
                    الروابط البيولوجية
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-2">الجنس (مطلوب لرسم الشجرة)</label>
                      {isEditing ? (
                        <select 
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="MALE">ذكر</option>
                          <option value="FEMALE">أنثى</option>
                        </select>
                      ) : (
                        <div className="p-3 bg-background rounded-xl border border-border text-foreground">
                          {formData.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2">الأب البيولوجي</label>
                        {isEditing ? (
                          <select 
                            name="father_id"
                            value={formData.father_id || ''}
                            onChange={handleChange}
                            className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value="">-- غير محدد --</option>
                            {allCharacters.filter(c => c.id !== character?.id).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-3 bg-background rounded-xl border border-border text-foreground">
                            {allCharacters.find(c => String(c.id) === String(formData.father_id))?.name || 'غير محدد'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2">الأم البيولوجية</label>
                        {isEditing ? (
                          <select 
                            name="mother_id"
                            value={formData.mother_id || ''}
                            onChange={handleChange}
                            className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value="">-- غير محدد --</option>
                            {allCharacters.filter(c => c.id !== character?.id).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-3 bg-background rounded-xl border border-border text-foreground">
                            {allCharacters.find(c => String(c.id) === String(formData.mother_id))?.name || 'غير محدد'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ NASAB CHAIN CARD ═══ */}
                {nasabData && (
                  <div className="bg-gradient-to-br from-amber-500/5 via-secondary/20 to-emerald-500/5 p-6 rounded-2xl border border-amber-500/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/40 via-emerald-500/40 to-amber-500/40" />
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-400">
                      🧬 سلسلة النسب
                      {nasabData.lineageId && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                          سلالة #{nasabData.lineageId}
                        </span>
                      )}
                    </h3>

                    {nasabData.kunya && (
                      <div className="mb-4 flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground">الكنية:</span>
                        <span className="text-base font-black text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                          {nasabData.kunya}
                        </span>
                      </div>
                    )}

                    {nasabData.nasabChain && nasabData.nasabChain.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 py-3" dir="rtl">
                        {nasabData.nasabChain.map((ancestor, idx) => (
                          <React.Fragment key={idx}>
                            <span className={`text-sm font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              idx === 0
                                ? 'bg-primary/15 text-primary border-primary/30 shadow-sm shadow-primary/10'
                                : 'bg-secondary/60 text-foreground/80 border-border hover:bg-secondary'
                            }`}>
                              {ancestor}
                            </span>
                            {idx < nasabData.nasabChain.length - 1 && (
                              <span className="text-muted-foreground/40 text-lg font-light">‹</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic py-2">
                        لا توجد سلسلة نسب محسوبة. تأكد من ربط الأب أو الأم في خريطة العلاقات.
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-primary">
                    <UserCircle size={20} />
                    شجرة العائلة الكاملة
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">لإضافة الزيجات والشركاء واستعراض شجرة العائلة البيولوجية بصرياً لجميع شخصيات السيناريو، يرجى التوجه لصفحة شجرة العائلة.</p>
                  
                  <button 
                    onClick={() => navigate('/relationships')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Users size={18} />
                    فتح شجرة العائلة
                  </button>
                </div>
              </div>
            ) : isEditing ? (
              <RichTextEditor
                value={formData[activeTab]}
                onChange={(html) => setFormData(prev => ({ ...prev, [activeTab]: html }))}
                placeholder={`اكتب هنا تفاصيل ${TABS.find(t => t.id === activeTab)?.label} الخاص بـ ${character.name}...`}
                className="text-lg"
                minHeight="400px"
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                {formData[activeTab] ? (
                  <div 
                    className="text-lg leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: formData[activeTab] }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 pt-20">
                    <FileText size={48} className="mb-4" />
                    <p>لم تتم كتابة تفاصيل لـ {TABS.find(t => t.id === activeTab)?.label} بعد.</p>
                    <p className="text-sm mt-2">انقر على "تعديل وبناء الشخصية" للبدء.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: References & Meta */}
        <div className="w-1/3 flex flex-col bg-card overflow-y-auto">
          {/* Brief Description */}
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              الوصف المختصر (نبذة)
            </h3>
            {isEditing ? (
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                placeholder="وصف سريع للشخصية..."
                className="text-sm"
                minHeight="80px"
              />
            ) : (
              <div className="text-sm text-muted-foreground leading-relaxed">
                {formData.description ? (
                  <div dangerouslySetInnerHTML={{ __html: formData.description }} />
                ) : (
                  'لا يوجد وصف.'
                )}
              </div>
            )}
          </div>

          {/* Reference Images Gallery */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ImageIcon size={16} className="text-muted-foreground" />
                الصور المرجعية (References)
              </h3>
              {isEditing && (
                <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-foreground p-2 rounded-lg transition-colors">
                  {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
            
            {referenceImages.length === 0 ? (
              <div className="text-center py-6 bg-background rounded-xl border border-dashed border-border text-muted-foreground flex flex-col items-center gap-2">
                <Camera size={24} className="opacity-50" />
                <span className="text-xs font-bold">لا توجد صور مرجعية</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {referenceImages.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-background border border-border">
                    <img src={resolveMediaUrl(url)} alt="Reference" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                    {isEditing && (
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scenes List */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Film size={16} className="text-muted-foreground" />
              تظهر في المشاهد ({characterScenes.length})
            </h3>
            
            {characterScenes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-background rounded-xl border border-dashed border-border">
                هذه الشخصية غير مرتبطة بأي مشهد بعد.
              </p>
            ) : (
              <div className="space-y-2">
                {characterScenes.map(sc => (
                  <a 
                    key={sc.id} 
                    href={`/scene/${sc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Film size={14} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-foreground truncate">
                        مشهد {sc.scene_number || sc.id}: {sc.title || sc.location_name || 'بدون عنوان'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {sc.location_type} • {sc.time_of_day}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
