import { formatDate } from '../../utils/dateUtils';

export interface CallSheetSettings {
  callSheetDate?: string;
  callSheetCallTime?: string;
  callSheetWrapTime?: string;
  callSheetCrewNotes?: string;
  directorName?: string;
  productionCompany?: string;
  shootDayData?: {
    day_type?: string;
    week_number?: number | string;
    production_phase?: string;
    title?: string;
    weather_forecast?: string;
  };
}

export interface CallSheetPageProps {
  scenarioTitle?: string;
  scenes?: any[];
  characters?: any[];
  settings?: CallSheetSettings;
}

/**
 * CallSheetPage — صفحة كشف الاستدعاء (Call Sheet)
 * تُلحق بنهاية PDF المُصدّر.
 */
export default function CallSheetPage({ 
  scenarioTitle, 
  scenes = [], 
  characters = [],
  settings = {} 
}: CallSheetPageProps) {
  const {
    callSheetDate,
    callSheetCallTime,
    callSheetWrapTime,
    callSheetCrewNotes,
    directorName,
    productionCompany,
    shootDayData,
  } = settings;

  // Collect unique characters from all scenes
  const presentCharIds = new Set<string>();
  scenes.forEach(scene => {
    try {
      const ids = JSON.parse(scene.present_characters || '[]');
      if (Array.isArray(ids)) {
        ids.forEach(id => presentCharIds.add(String(id)));
      }
    } catch (e) {
      console.warn('Failed to parse present_characters in CallSheetPage', e);
    }
  });

  const presentChars = characters.filter(c => presentCharIds.has(String(c.id)));

  // Collect unique locations
  const locationMap: Record<string, { name: string; type: string; sceneNumbers: (string | number)[] }> = {};
  scenes.forEach(scene => {
    const locKey = scene.location_name || 'غير محدد';
    if (!locationMap[locKey]) {
      locationMap[locKey] = {
        name: locKey,
        type: scene.location_type || 'INT',
        sceneNumbers: []
      };
    }
    locationMap[locKey].sceneNumbers.push(scene.scene_number);
  });
  const locations = Object.values(locationMap);

  const formattedDate = callSheetDate 
    ? formatDate(callSheetDate, 'EEEE, d MMMM yyyy')
    : 'غير محدد';

  return (
    <div className="cover-page" style={{ backgroundColor: '#FAFAFA', justifyContent: 'flex-start', paddingTop: '48px' }}>
      <div className="w-full px-12 text-black" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
        
        {/* Call Sheet Header */}
        <div className="text-center mb-6 relative">
          <h1 className="text-3xl font-black tracking-wide mb-1">كشف الاستدعاء</h1>
          <p className="text-lg font-bold text-gray-600">CALL SHEET</p>
          
          <div className="absolute top-0 right-0 text-right text-xs font-bold text-gray-500">
            <div>نوع اليوم: {shootDayData?.day_type || 'SHOOT'}</div>
            <div>أسبوع الإنتاج: {shootDayData?.week_number || 1}</div>
            <div>المرحلة: {shootDayData?.production_phase || 'PRODUCTION'}</div>
          </div>
          
          <div className="absolute top-0 left-0 text-left text-xs font-bold text-gray-500" dir="ltr">
             {shootDayData?.title && <div>{shootDayData.title}</div>}
             {shootDayData?.weather_forecast && <div>Weather: {shootDayData.weather_forecast}</div>}
          </div>

          {productionCompany && (
            <p className="text-sm font-medium text-gray-500 mt-2">{productionCompany}</p>
          )}
        </div>

        <div className="h-[2px] bg-black w-full mb-4" />

        {/* Production Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-gray-500 shrink-0">المشروع:</span>
            <span className="font-bold">{scenarioTitle || '—'}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-gray-500 shrink-0">المخرج:</span>
            <span className="font-bold">{directorName || '—'}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-gray-500 shrink-0">تاريخ التصوير:</span>
            <span className="font-bold">{formattedDate}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-gray-500 shrink-0">ساعة الحضور والانصراف:</span>
            <span className="font-bold text-lg">{callSheetCallTime || '07:00'} - {callSheetWrapTime || '21:00'}</span>
          </div>
        </div>

        <div className="h-[1px] bg-gray-300 w-full mb-4" />

        {/* Scenes Table */}
        <div className="mb-5">
          <h2 className="text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">المشاهد المطلوبة</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 py-1.5 text-right font-black">رقم</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right font-black">العنوان</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center font-black">INT/EXT</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right font-black">الموقع</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center font-black">الوقت</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center font-black">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene, i) => (
                <tr key={scene.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center font-black">{scene.scene_number}</td>
                  <td className="border border-gray-300 px-2 py-1.5 font-bold">{scene.title || '—'}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center font-bold uppercase">{scene.location_type}</td>
                  <td className="border border-gray-300 px-2 py-1.5 font-medium">{scene.location_name || '—'}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center font-medium">{scene.time_of_day}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center font-bold uppercase text-[10px]">{scene.status || 'DRAFT'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Locations */}
        {locations.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">المواقع</h2>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc, i) => (
                <div key={i} className="bg-white border border-gray-300 rounded px-3 py-1.5 text-xs flex items-center gap-2">
                  <span className="font-black">{loc.type}</span>
                  <span className="font-bold">{loc.name}</span>
                  <span className="text-gray-400 font-medium">(مشهد {loc.sceneNumbers.join(', ')})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {presentChars.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">الممثلون المطلوبون</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-2 py-1.5 text-center font-black w-8">#</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right font-black">اسم الشخصية</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right font-black">الدور</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-center font-black">ساعة الحضور</th>
                </tr>
              </thead>
              <tbody>
                {presentChars.map((char, i) => (
                  <tr key={char.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-black">{char.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-medium">{char.role || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold">{callSheetCallTime || '07:00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Crew Notes */}
        {callSheetCrewNotes && (
          <div className="mb-4">
            <h2 className="text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">ملاحظات للطاقم</h2>
            <div className="bg-white border border-gray-300 rounded p-3 text-xs font-medium whitespace-pre-wrap leading-relaxed">
              {callSheetCrewNotes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-400">
          <span>SCRIPTFLOW PRO — CALL SHEET</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
