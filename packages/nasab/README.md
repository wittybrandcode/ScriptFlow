# Nasab (نَسَب)

**v1.0.0** — Islamic Inheritance & Kinship Calculation Engine  
**Enterprise Grade** — موجه للتطبيقات الحكومية الرسمية

---

## 🇸🇦 نظرة عامة

محرك حسابات المواريث والأنساب وفق الشريعة الإسلامية. يدعم المذاهب الأربعة، الرضاع، التصحيح، والعول.

### الميزات

| الميزة | الوصف |
|--------|-------|
| **6 مراحل حجز (Hajb)** | حجب بالنفس وبالغير — 28 صنفاً من الورثة |
| **المذاهب الأربعة** | حنفي، شافعي، مالكي، حنبلي (عبر نمط الاستراتيجيات) |
| **العول والرد** | معالجة زيادة ونقصان السهام على أصل المسألة |
| **ذوو الأرحام** | 12 قاعدة تنزيل للأقارب غير أصحاب الفروض ولا العصبات |
| **التصحيح (Tashih)** | تحويل الكسور غير المنقسمة على الرؤوس إلى أعداد صحيحة |
| **مسائل فقهية متقدمة** | الأكدرية، المنبرية، المباهلة، العُمريتان، الدينارية |
| **الرضاع (Radhaa)** | تحريم الزواج بالرضاع — validation + relation inference |
| **التدقيق (Validation)** | 10 دوال تحقق: دورات، فرق عمر، محارم، خنثى، مفقود، حمل |
| **GEDCOM** | استيراد/تصدير شجرات العائلة |
| **i18n** | عربي، إنجليزي، فرنسي |

### الاختبارات

```
406 اختباراً   |   23 ملفاً   |   tsc --noEmit نظيف
100,000 عائلة عشوائية  |   4 ثوابت فقهية   |   fast-check
Stryker مهيأ   |   ESLint 0 خطأ   |   knip
```

### التركيب

```bash
npm install nasab
```

### الاستخدام الأساسي

```typescript
import { BaseEngine, Heir } from 'nasab';

const heirs: Heir[] = [
  { id: 'h1', type: 'DAUGHTER', gender: 'FEMALE' },
  { id: 'h2', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
];

const engine = new BaseEngine('SHAFII');
const result = engine.solve(heirs);
console.log(result);
// { shares: { h1: '5/8', h2: '1/8' }, baseOrigin: 8, ... }
```

### المذاهب

```typescript
import { BaseEngine } from 'nasab';

const hanafi = new BaseEngine('HANAFI');   // جد يحجب الإخوة
const shafii = new BaseEngine('SHAFII');   // المشتركة (الأكول)
const common = new BaseEngine('COMMON');   // افتراضي
```

التفاصيل: 📖 [docs-knowledge/fiqh_madhab_comparison.md](docs-knowledge/fiqh_madhab_comparison.md)

### الرضاع

```typescript
import { FosterEngine } from 'nasab';

const errors = FosterEngine.validateFosterConditions({
  childId: 'c1', nurseId: 'n1',
  numberOfFeedings: 5, childAgeAtNursing: 6
});
// errors.length === 0 ✅

const relations = FosterEngine.inferFosterRelationships(records, people, existing);
// FOSTER_MOTHER, FOSTER_FATHER, FOSTER_BROTHER, ...
```

### الأوامر

| الأمر | الوظيفة |
|-------|---------|
| `npm test` | تشغيل 406 اختباراً |
| `npm run lint` | tsc --noEmit |
| `npm run lint:eslint` | ESLint |
| `npm run test:coverage` | تغطية الكود |
| `npm run test:fuzz` | 100,000 عائلة عشوائية |
| `npm run test:mutation` | Stryker (يحتاج ~1 ساعة) |
| `npm run build` | بناء المكتبة |
| `npm run docs` | typedoc |

### الاعتماديات

- **runtime:** `fraction.js ^5.3.4`
- **dev:** TypeScript, Vite, Vitest, fast-check, Stryker, ESLint, typedoc, knip

### الترخيص

MIT — Lida Mostefaoui & contributors.

---

## 🇬🇧 Overview

Nasab is an enterprise-grade Islamic inheritance and kinship calculation engine supporting all four Sunni schools of jurisprudence.

### Features

- **6-tier Blocking (Hajb):** 28 heir types with full exclusion matrix
- **4 Madhabs:** Hanafi, Shafii, Maliki, Hanbali (Strategy Pattern)
- **Awl & Radd:** Share overflow/remainder redistribution
- **Distant Kindred:** 12 descent rules for non-agnatic relatives
- **Tashih:** Fraction-to-integer conversion per head-count
- **Advanced Fiqh Cases:** Akdariya, Minbariya, Mubahala, Umariyat, Dinariya
- **Milk Kinship (Radhaa):** Marriage prohibition via foster relationships
- **Validation:** 10 checks — cycles, age gaps, incest, hermaphrodite, missing, fetus
- **GEDCOM:** Family tree import/export
- **i18n:** Arabic, English, French

### Tests

```
406 tests   |   23 files   |   tsc --noEmit clean
100,000 random families   |   4 fiqh invariants   |   fast-check
Stryker configured   |   ESLint 0 errors   |   knip
```

### Quick Start

```bash
npm install nasab
```

```typescript
import { BaseEngine, Heir } from 'nasab';

const heirs: Heir[] = [
  { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
  { id: 'w1', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
];

const result = new BaseEngine('SHAFII').solve(heirs);
// { shares: { d1: '5/8', w1: '1/8' }, baseOrigin: 8 }
```

### License

MIT — Lida Mostefaoui & contributors.
