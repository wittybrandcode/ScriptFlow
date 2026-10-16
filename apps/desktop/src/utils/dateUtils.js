import { format as dateFnsFormat } from 'date-fns';

const maghrebMonths = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * دالة موحدة لتنسيق التواريخ في جميع أنحاء التطبيق
 * تستخدم الأرقام اللاتينية (1، 2، 3) وأسماء الأشهر المغاربية
 *
 * @param {Date|string|number} date 
 * @param {string} formatStr 'dd MMMM yyyy', 'MMMM', إلخ
 * @returns {string} النص المنسق
 */
export function formatDate(date, formatStr = 'dd MMMM yyyy') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  // Use base date-fns to format the string (in English)
  // We use English as a base because it reliably uses Latin digits 0-9
  let result = dateFnsFormat(d, formatStr);

  // Replace English month names with our Maghreb month names
  // We do this by replacing the 'MMMM' or 'MMM' equivalents.
  // Wait, the safest way is to parse the format string or just replace English month names.
  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const englishMonthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // We loop backwards or by index to replace them
  for (let i = 0; i < 12; i++) {
    // Replace full month names
    if (result.includes(englishMonths[i])) {
      result = result.replace(englishMonths[i], maghrebMonths[i]);
    }
    // Replace short month names if they exist and aren't caught by full (though order matters, 
    // replacing full first is correct).
    else if (result.includes(englishMonthsShort[i])) {
      result = result.replace(englishMonthsShort[i], maghrebMonths[i]); // Mapping short to full Maghreb as well
    }
  }

  // Replace English weekdays if needed (optional, but good for completeness)
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

export function getMaghrebMonths() {
  return maghrebMonths;
}
