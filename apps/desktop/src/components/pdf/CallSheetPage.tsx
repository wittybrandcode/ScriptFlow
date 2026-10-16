import React from 'react';
import { formatDate } from '../../utils/dateUtils';

export interface CallSheetPageProps {
  scenarioTitle?: string;
  scenes?: any[];
  characters?: any[];
  settings?: Record<string, any>;
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
      ids.forEach((id: any) => presentCharIds.add(String(id)));
    } catch (e) {
      console.warn('Failed to parse present_characters in CallSheetPage', e);
    }
  });

  const presentChars = characters.filter(c => presentCharIds.has(String(c.id)));

  // Collect unique locations
  const locationMap: Record<string, { name: string; type: string; sceneNumbers: (number | string)[] }> = {};
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

        <div className="border-t border-gray-300 pt-4 mb-6">
          <h2 className="text-sm font-black text-gray-600 mb-2 uppercase tracking-wider">جدول مشاهد اليوم ({scenes.length} مشهد)</h2>
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-gray-100">
                <th className="p-1.5 font-black">#</th>
                <th className="p-1.5 font-black">العنوان</th>
                <th className="p-1.5 font-black">المكان</th>
                <th className="p-1.5 font-black">التوقيت</th>
                <th className="p-1.5 font-black">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((s, idx) => (
                <tr key={s.id || idx} className="border-b border-gray-200">
                  <td className="p-1.5 font-bold">{s.scene_number}</td>
                  <td className="p-1.5">{s.title || '—'}</td>
                  <td className="p-1.5">{s.location_type || 'INT'} / {s.location_name || '—'}</td>
                  <td className="p-1.5">{s.time_of_day || 'DAY'}</td>
                  <td className="p-1.5">{s.status || 'DRAFT'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-black text-gray-600 mb-2 uppercase tracking-wider">الشخصيات المطلوبة ({presentChars.length})</h2>
            <div className="space-y-1 text-xs">
              {presentChars.map(c => (
                <div key={c.id} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-gray-500">{c.role || 'ممثل'}</span>
                </div>
              ))}
              {presentChars.length === 0 && <div className="text-gray-400 italic">لا توجد شخصيات محددة</div>}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-black text-gray-600 mb-2 uppercase tracking-wider">مواقع التصوير</h2>
            <div className="space-y-1 text-xs">
              {locations.map((loc, idx) => (
                <div key={idx} className="border-b border-gray-100 py-1">
                  <div className="font-bold">{loc.type} / {loc.name}</div>
                  <div className="text-gray-400 text-[10px]">المشاهد: {loc.sceneNumbers.join(', ')}</div>
                </div>
              ))}
              {locations.length === 0 && <div className="text-gray-400 italic">لا توجد أماكن محددة</div>}
            </div>
          </div>
        </div>

        {callSheetCrewNotes && (
          <div className="border-t border-gray-300 pt-3">
            <h2 className="text-xs font-black text-gray-600 mb-1">ملاحظات الطاقم والتعليمات:</h2>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">{callSheetCrewNotes}</p>
          </div>
        )}

      </div>
    </div>
  );
}
