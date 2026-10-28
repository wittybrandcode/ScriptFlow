import { format as dateFnsFormat } from 'date-fns';

const maghrebMonths: string[] = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Unified date formatting utility across the application.
 * Uses Latin digits and Maghreb Arabic month names.
 */
export function formatDate(date: Date | string | number | null | undefined, formatStr: string = 'dd MMMM yyyy'): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  let result = dateFnsFormat(d, formatStr);

  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const englishMonthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  for (let i = 0; i < 12; i++) {
    if (result.includes(englishMonths[i])) {
      result = result.replace(englishMonths[i], maghrebMonths[i]);
    } else if (result.includes(englishMonthsShort[i])) {
      result = result.replace(englishMonthsShort[i], maghrebMonths[i]);
    }
  }

  const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const englishDaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    if (result.includes(englishDays[i])) {
      result = result.replace(englishDays[i], arabicDays[i]);
    } else if (result.includes(englishDaysShort[i])) {
      result = result.replace(englishDaysShort[i], arabicDays[i]);
    }
  }

  return result;
}

export function getMaghrebMonths(): string[] {
  return maghrebMonths;
}
