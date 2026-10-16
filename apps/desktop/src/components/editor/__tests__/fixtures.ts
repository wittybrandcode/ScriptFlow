import { LayoutBlockNode } from '../TextMeasurementEngine';

/**
 * Fixture: A variety of scene blocks representing a real-world scenario.
 * It includes different block types with varying lengths to test the line measurement
 * and pagination logic (including margins for specific types).
 */
export const SCENE_FIXTURE_BLOCKS: LayoutBlockNode[] = [
  {
    id: 'b1',
    type: 'ACTION',
    textContent: 'الغرفة مظلمة تماماً. شعاع نور خافت يتسلل من تحت الباب الخشبي القديم.',
  },
  {
    id: 'b2',
    type: 'CHARACTER',
    textContent: 'أحمد',
  },
  {
    id: 'b3',
    type: 'PARENTHETICAL',
    textContent: 'بصوت هامس ومرتعد',
  },
  {
    id: 'b4',
    type: 'DIALOGUE',
    textContent: 'هل يوجد أحد هنا؟ لقد سمعت صوتاً يأتي من الطابق العلوي.',
  },
  {
    id: 'b5',
    type: 'ACTION',
    textContent: 'صمت مطبق. فجأة، يسقط كتاب من الرف.',
  },
  {
    id: 'b6',
    type: 'SHOT',
    textContent: 'لقطة مقربة على وجه أحمد',
  },
  {
    id: 'b7',
    type: 'ACTION',
    textContent: 'تتوسع عيناه ذعراً. يتراجع خطوة للوراء.',
  },
  {
    id: 'b8',
    type: 'CHARACTER',
    textContent: 'صوت مجهول',
  },
  {
    id: 'b9',
    type: 'DIALOGUE',
    textContent: 'لم يكن يجب أن تأتي إلى هنا يا أحمد. هذا المكان يحمل ذكريات لا يجب أن توقظ.',
  },
  {
    id: 'b10',
    type: 'TRANSITION',
    textContent: 'قطع إلى:',
  },
  {
    id: 'b11',
    type: 'ACTION',
    textContent: 'شارع مزدحم في وسط المدينة. السيارات تمر بسرعة والناس يمشون في كل اتجاه. الشمس مشرقة وتتناقض تماماً مع المشهد السابق.',
  },
  {
    id: 'b12',
    type: 'CHARACTER',
    textContent: 'سارة',
  },
  {
    id: 'b13',
    type: 'DIALOGUE',
    textContent: 'لقد تأخرت نصف ساعة! ألم نتفق على اللقاء في الثامنة؟',
  },
  {
    id: 'b14',
    type: 'CHARACTER',
    textContent: 'خالد',
  },
  {
    id: 'b15',
    type: 'PARENTHETICAL',
    textContent: 'يلهث',
  },
  {
    id: 'b16',
    type: 'DIALOGUE',
    textContent: 'آسف جداً. زحمة السير كانت لا تطاق اليوم.',
  },
  {
    id: 'b17',
    type: 'DIRECTOR_NOTE',
    textContent: 'التركيز على حركة الكاميرا العشوائية لتعزيز شعور الارتباك.',
  },
  {
    id: 'b18',
    type: 'AUDIO',
    textContent: 'صوت بوق سيارة عالٍ',
  },
  {
    id: 'b19',
    type: 'ACTION',
    textContent: 'سارة تنظر إلى ساعتها بضيق ثم تبتسم ابتسامة خفيفة.',
  },
  {
    id: 'b20',
    type: 'DIALOGUE',
    textContent: 'حسناً، لندخل المقهى قبل أن نفقد الطاولة.',
  }
];
