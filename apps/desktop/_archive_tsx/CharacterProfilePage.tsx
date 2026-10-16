import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
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

export default function CharacterProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeScenarioId } = useUIStore();
  const { data: characterDetail, isLoading: charLoading } = useCharacterDetailQuery(id);
  const { data: allCharacters = [] } = useCharactersQuery(activeScenarioId);
  const { data: crew = [] } = useCrewQuery(activeScenarioId);
  const updateMutation = useUpdateCharacterMutation();

  const [character, setCharacter] = useState<any>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('backstory');
  const [nasabData, setNasabData] = useState<any>(null);
  
  // Local state for auto-save fields
  const [formData, setFormData] = useState<Record<string, any>>({
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

  const actor = useMemo(() => {
    if (character?.actor_id && crew?.length > 0) {
      return crew.find((c: any) => String(c.id) === String(character.actor_id)) || null;
    }
    return null;
  }, [character?.actor_id, crew]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    setLoading(charLoading);
  }, [charLoading]);

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
          sceneApi.getByScenarioId(characterDetail.scenario_id).then((scenesData: any) => {
            setScenes(scenesData || []);
          });
        });
      }
    }
  }, [characterDetail]);

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
        
        const children = edges.filter((e: any) => 
          (e.character_id === currentId && (e.relationship_type === 'CHILD' || e.relationship_type === 'SON' || e.relationship_type === 'DAUGHTER')) ||
          (e.partner_id === currentId && (e.relationship_type === 'PARENT' || e.relationship_type === 'FATHER' || e.relationship_type === 'MOTHER'))
        );
        
        if (children.length > 0) {
          const firstChildId = children[0].character_id === currentId ? children[0].partner_id : children[0].character_id;
          const firstChild = allCharacters.find((c: any) => c.id === firstChildId);
          if (firstChild) {
            const prefix = characterDetail.role === 'FEMALE' ? 'أم' : 'أبو';
            kunya = `${prefix} ${firstChild.name.split(' ')[0]}`;
          }
        }
        
        let safeCounter = 0;
        while (safeCounter < 7) {
          const fatherEdge = edges.find((e: any) => 
            (e.character_id === currentId && (e.relationship_type === 'FATHER' || e.relationship_type === 'PARENT')) ||
            (e.partner_id === currentId && (e.relationship_type === 'CHILD' || e.relationship_type === 'SON' || e.relationship_type === 'DAUGHTER'))
          );
          
          if (!fatherEdge) break;
          
          const fatherId = fatherEdge.character_id === currentId ? fatherEdge.partner_id : fatherEdge.character_id;
          const father = allCharacters.find((c: any) => c.id === fatherId);
          if (!father) break;
          
          chain.push(`بن ${father.name}`);
          currentId = father.id;
          safeCounter++;
        }
        
        setNasabData({
          kunya: kunya,
          lineageId: lineageId,
          nasabChain: chain.length > 1 ? chain : []
        });
      } catch (e) {
        console.error('Failed to fetch nasab data:', e);
      }
    };
    fetchNasab();
  }, [activeTab, characterDetail?.scenario_id, characterDetail?.id, allCharacters]);

  const handleSaveAndClose = async () => {
    if (!id) return;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !activeScenarioId) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          
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

  const removeImage = async (indexToRemove: number) => {
    if (!id) return;
    const currentImages = Array.isArray(character.reference_images) 
      ? character.reference_images 
      : JSON.parse(character.reference_images || '[]');
    const updatedImages = currentImages.filter((_: any, idx: number) => idx !== indexToRemove);
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
      <div className="bg-card border-b border-border p-4 shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowRight size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: formData.color || '#6366f1' }}
            >
              {formData.name?.[0] || 'ش'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground">{formData.name || 'شخصية بدون عنوان'}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {formData.role || 'دورت غير محدد'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {formData.full_name ? `${formData.full_name} • ` : ''} العمر: {formData.age || 'غير محدد'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSaveAndClose}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              حفظ التغييرات
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg font-bold text-xs hover:bg-secondary/80 transition-all"
            >
              <Edit3 size={16} />
              تعديل الشخصية
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side (Tabs + Form/View) */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border shrink-0 pb-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {activeTab === 'family' ? (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                    <Users className="text-primary" size={20} />
                    شجرة النسب والقرابة الدرامية
                  </h3>
                  
                  {nasabData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                          <span className="text-xs text-muted-foreground font-bold">الكنية الرسمية:</span>
                          <p className="text-base font-black text-foreground mt-1">{nasabData.kunya || 'غير محددة'}</p>
                        </div>
                        <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                          <span className="text-xs text-muted-foreground font-bold">معرف السلالة (Lineage ID):</span>
                          <p className="text-base font-mono font-bold text-primary mt-1">{nasabData.lineageId}</p>
                        </div>
                      </div>

                      {nasabData.nasabChain?.length > 0 && (
                        <div className="bg-secondary/20 p-4 rounded-lg border border-border mt-4">
                          <span className="text-xs text-muted-foreground font-bold block mb-2">سلسلة النسب المتسلسلة:</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {nasabData.nasabChain.map((item: string, idx: number) => (
                              <React.Fragment key={idx}>
                                {idx > 0 && <span className="text-muted-foreground font-black text-xs">←</span>}
                                <span className="px-3 py-1 bg-card rounded-md border border-border text-sm font-bold shadow-xs">
                                  {item}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">جاري تحميل وشفرة أنساب الشخصية...</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
                {isEditing ? (
                  <RichTextEditor
                    value={formData[activeTab] || ''}
                    onChange={(html: string) => setFormData(prev => ({ ...prev, [activeTab]: html }))}
                    placeholder={`اكتب تفاصيل ${TABS.find(t => t.id === activeTab)?.label}...`}
                  />
                ) : (
                  <div 
                    className="prose prose-invert max-w-none text-foreground leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: formData[activeTab] || `<p className="text-muted-foreground italic">لا توجد تفاصيل مسجلة لـ ${TABS.find(t => t.id === activeTab)?.label} بعد.</p>` }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Info Sidebar */}
        <div className="w-80 border-r border-border bg-card/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar shrink-0">
          {/* Reference Images Gallery */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <ImageIcon size={14} />
                معرض المراجع البصرية ({referenceImages.length})
              </h3>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="p-1 hover:bg-secondary rounded text-primary transition-colors disabled:opacity-50"
                title="إضافة صورة مرجعية"
              >
                {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {referenceImages.map((img: string, idx: number) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-black/20">
                  <img 
                    src={resolveMediaUrl(activeScenarioId, img)} 
                    alt={`مرجع ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {referenceImages.length === 0 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="col-span-2 border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <Camera size={24} className="text-muted-foreground/40 mb-1" />
                  <span className="text-[10px] font-bold text-muted-foreground">اضغط لرفع صور مرجعية</span>
                </div>
              )}
            </div>
          </div>

          {/* Scenes List */}
          <div>
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
              <Film size={14} />
              المشاهد المرتبطة ({characterScenes.length})
            </h3>

            {characterScenes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 bg-background rounded-lg border border-dashed border-border font-medium">
                غير مرتبطة بأي مشهد حتى الآن.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {characterScenes.map(sc => (
                  <div 
                    key={sc.id} 
                    onClick={() => navigate(`/scene/${sc.id}`)}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border hover:border-primary/40 cursor-pointer transition-all group"
                  >
                    <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors text-xs font-bold">
                      {sc.scene_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {sc.title || sc.location_name || 'بدون عنوان'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {sc.location_type} • {sc.time_of_day}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
