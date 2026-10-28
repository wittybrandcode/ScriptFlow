/**
 * Continuity Analyzer — Continuity & logistical conflicts analyzer for shoot schedule.
 */

import { formatDate } from './dateUtils';

export interface ContinuityWarning {
  id: string;
  type: 'warning' | 'info' | 'error';
  category: 'actor' | 'location' | 'turnaround' | string;
  title: string;
  description: string;
  dayId: string | number;
  nextDayId?: string | number;
}

export function analyzeContinuity(shootDays: any[] = [], characters: any[] = []): ContinuityWarning[] {
  const warnings: ContinuityWarning[] = [];
  const charMap: Record<string, string> = {};
  
  if (!shootDays || !Array.isArray(shootDays)) return [];

  characters.forEach(c => { 
    if (c && c.id) {
      charMap[c.id] = c.name; 
    }
  });

  // Sort shoot days by date
  const sortedDays = [...shootDays].sort((a, b) => {
    const dateA = a.shoot_date ? new Date(a.shoot_date + 'T00:00:00Z').getTime() : 0;
    const dateB = b.shoot_date ? new Date(b.shoot_date + 'T00:00:00Z').getTime() : 0;
    return dateA - dateB;
  });

  sortedDays.forEach((day, index) => {
    const scenes = day.scenes || [];
    if (scenes.length === 0) return;

    const formattedDate = formatDate(new Date((day.shoot_date || '') + 'T00:00:00Z'), 'EEEE, d MMMM yyyy');

    // 1. Check actor double booking / locations on same day
    const charLocations: Record<string, Set<string>> = {};
    const locationsInDay = new Set<string>();

    scenes.forEach((scene: any) => {
      let charIds: string[] = [];
      try {
        charIds = JSON.parse(scene.present_characters || '[]');
      } catch (e) {
        charIds = [];
      }

      const locName = scene.location_name || 'موقع غير محدد';
      locationsInDay.add(locName);

      charIds.forEach(charId => {
        if (!charLocations[charId]) {
          charLocations[charId] = new Set<string>();
        }
        charLocations[charId].add(locName);
      });
    });

    // Generate warning if character is in different locations on same day
    Object.keys(charLocations).forEach(charId => {
      const locs = charLocations[charId];
      if (locs.size > 1) {
        const charName = charMap[charId] || 'ممثل غير معروف';
        const locList = Array.from(locs).join(' و ');
        warnings.push({
          id: `char-double-loc-${day.id}-${charId}`,
          type: 'warning',
          category: 'actor',
          title: `تشتت جغرافي للممثل (${charName})`,
          description: `الممثل "${charName}" مجدول في ${locs.size} مواقع مختلفة (${locList}) في نفس يوم التصوير (${formattedDate}).`,
          dayId: day.id
        });
      }
    });

    // 2. Location travel count check (excessive company moves)
    if (locationsInDay.size > 2) {
      warnings.push({
        id: `excessive-locations-${day.id}`,
        type: 'info',
        category: 'location',
        title: `تعدد المواقع الجغرافية`,
        description: `يحتوي يوم التصوير (${formattedDate}) على ${locationsInDay.size} مواقع مختلفة. هذا قد يزيد من وقت نقل المعدات ويؤخر التصوير.`,
        dayId: day.id
      });
    }

    // 3. Day/Night transition inside same day
    let hasDay = false;
    let hasNight = false;
    scenes.forEach((scene: any) => {
      const tod = (scene.time_of_day || '').toUpperCase();
      if (tod === 'DAY' || tod === 'نهار' || tod === 'صباحاً') hasDay = true;
      if (tod === 'NIGHT' || tod === 'ليل' || tod === 'مساءً') hasNight = true;
    });

    if (hasDay && hasNight) {
      warnings.push({
        id: `day-night-mix-${day.id}`,
        type: 'warning',
        category: 'turnaround',
        title: `خلط بين تصوير النهار والليل`,
        description: `يحتوي يوم التصوير (${formattedDate}) على مشاهد ليلية ونهارية معاً في نفس اليوم. قد يتطلب هذا فترات راحة إضافية لتفادي إرهاق الطاقم.`,
        dayId: day.id
      });
    }

    // 4. Day/Night turnaround conflict between consecutive days
    if (index < sortedDays.length - 1) {
      const nextDay = sortedDays[index + 1];
      const nextDayScenes = nextDay.scenes || [];
      if (nextDayScenes.length > 0) {
        const lastScene = scenes[scenes.length - 1];
        const nextFirstScene = nextDayScenes[0];

        const lastTod = (lastScene?.time_of_day || '').toUpperCase();
        const nextTod = (nextFirstScene?.time_of_day || '').toUpperCase();

        const isLastNight = lastTod === 'NIGHT' || lastTod === 'ليل';
        const isNextDay = nextTod === 'DAY' || nextTod === 'نهار';

        if (isLastNight && isNextDay) {
          const nextFormattedDate = formatDate(new Date((nextDay.shoot_date || '') + 'T00:00:00Z'), 'd MMM');
          const currFormattedDate = formatDate(new Date((day.shoot_date || '') + 'T00:00:00Z'), 'd MMM');

          warnings.push({
            id: `turnaround-conflict-${day.id}-${nextDay.id}`,
            type: 'error',
            category: 'turnaround',
            title: `تضارب فترة الراحة (Turnaround)`,
            description: `تصوير مشهد ليلي في نهاية يوم ${currFormattedDate} متبوع مباشرة بمشهد نهاري في بداية يوم ${nextFormattedDate}. لا توجد فترة راحة كافية (12 ساعة) لطاقم العمل.`,
            dayId: day.id,
            nextDayId: nextDay.id
          });
        }
      }
    }
  });

  return warnings;
}
