import { RelationType } from "../core/enums";
import { KinshipDictionary } from "./types";

export const ArabicDictionary: KinshipDictionary = {
  locale: "ar",
  direction: "rtl",
  translations: {
    relations: {
      [RelationType.PARENT_MALE]: "أب",
      [RelationType.PARENT_FEMALE]: "أم",
      [RelationType.CHILD_MALE]: "ابن",
      [RelationType.CHILD_FEMALE]: "ابنة",
      [RelationType.SIBLING_MALE]: "أخ",
      [RelationType.SIBLING_FEMALE]: "أخت",
      [RelationType.SPOUSE_MALE]: "زوج",
      [RelationType.SPOUSE_FEMALE]: "زوجة",
      [RelationType.EX_SPOUSE_MALE]: "طليق",
      [RelationType.EX_SPOUSE_FEMALE]: "طليقة",

      [RelationType.GRANDPARENT_MALE]: "جد",
      [RelationType.GRANDPARENT_FEMALE]: "جدة",
      [RelationType.GRANDCHILD_MALE]: "حفيد",
      [RelationType.GRANDCHILD_FEMALE]: "حفيدة",
      [RelationType.UNCLE_PATERNAL_MALE]: "عم",
      [RelationType.UNCLE_PATERNAL_FEMALE]: "عمة",
      [RelationType.UNCLE_MATERNAL_MALE]: "خال",
      [RelationType.UNCLE_MATERNAL_FEMALE]: "خالة",
      [RelationType.UNCLE_FULL_MALE]: "عم شقيق",
      [RelationType.UNCLE_FULL_FEMALE]: "عمة شقيقة",
      [RelationType.NEPHEW_PATERNAL_MALE]: "ابن أخ",
      [RelationType.NEPHEW_PATERNAL_FEMALE]: "ابنة أخ",
      [RelationType.NEPHEW_MATERNAL_MALE]: "ابن أخت",
      [RelationType.NEPHEW_MATERNAL_FEMALE]: "ابنة أخت",
      [RelationType.NEPHEW_FULL_MALE]: "ابن أخ شقيق",
      [RelationType.NEPHEW_FULL_FEMALE]: "ابنة أخ شقيق",

      [RelationType.COUSIN_PATERNAL_MALE]: "ابن عم",
      [RelationType.COUSIN_PATERNAL_FEMALE]: "ابنة عم",
      [RelationType.COUSIN_MATERNAL_MALE]: "ابن خال",
      [RelationType.COUSIN_MATERNAL_FEMALE]: "ابنة خال",
      [RelationType.GREAT_GRANDPARENT_PATERNAL_MALE]: "جد الأب",
      [RelationType.GREAT_GRANDPARENT_MATERNAL_MALE]: "جد الأم",

      [RelationType.FATHER_IN_LAW]: "حما",
      [RelationType.MOTHER_IN_LAW]: "حماة",
      [RelationType.SON_IN_LAW]: "صهر",
      [RelationType.DAUGHTER_IN_LAW]: "كنة",

      [RelationType.SIBLING_PATERNAL_MALE]: "أخ لأب",
      [RelationType.SIBLING_PATERNAL_FEMALE]: "أخت لأب",
      [RelationType.SIBLING_MATERNAL_MALE]: "أخ لأم",
      [RelationType.SIBLING_MATERNAL_FEMALE]: "أخت لأم",
      
      [RelationType.STEP_PARENT_MALE]: "زوج الأم",
      [RelationType.STEP_PARENT_FEMALE]: "زوجة الأب",
      [RelationType.STEP_CHILD_MALE]: "ربيب",
      [RelationType.STEP_CHILD_FEMALE]: "ربيبة",

      [RelationType.HALF_SIBLING_MALE]: "أخ غير شقيق",
      [RelationType.HALF_SIBLING_FEMALE]: "أخت غير شقيقة",

      [RelationType.ADOPTIVE_PARENT_MALE]: "أب بالتبني",
      [RelationType.ADOPTIVE_PARENT_FEMALE]: "أم بالتبني",
      [RelationType.ADOPTED_CHILD_MALE]: "ابن بالتبني",
      [RelationType.ADOPTED_CHILD_FEMALE]: "ابنة بالتبني",

      [RelationType.CO_PARENT_MALE]: "شريك إنجاب (ذكر)",
      [RelationType.CO_PARENT_FEMALE]: "شريكة إنجاب (أنثى)",

      [RelationType.FOSTER_MOTHER]: "أم من الرضاعة",
      [RelationType.FOSTER_FATHER]: "أب من الرضاعة",
      [RelationType.FOSTER_SON]: "ابن من الرضاعة",
      [RelationType.FOSTER_DAUGHTER]: "ابنة من الرضاعة",
      [RelationType.FOSTER_BROTHER]: "أخ من الرضاعة",
      [RelationType.FOSTER_SISTER]: "أخت من الرضاعة",

      [RelationType.SIBLINGS]: "إخوة",
      [RelationType.BROTHERS_PATERNAL]: "أخوين لأب",
      [RelationType.SISTERS_PATERNAL]: "أختين لأب",
      [RelationType.SIBLINGS_PATERNAL]: "إخوة لأب",
      [RelationType.SIBLINGS_MATERNAL]: "إخوة لأم",
      [RelationType.CHILDREN]: "أبناء وبنات",
      [RelationType.SONS_DAUGHTERS]: "أبناء وبنات",
      [RelationType.PARENT_CHILD]: "أب / ابن",
      [RelationType.COUSINS_PATERNAL]: "أبناء عم",
      [RelationType.SPOUSES]: "أزواج",
      [RelationType.EX_SPOUSES]: "طليق/طليقة",
    },
    categories: {
      FIRST_DEGREE: "درجة أولى",
      SECOND_DEGREE: "درجة ثانية",
      THIRD_DEGREE: "درجة ثالثة",
      IN_LAW: "مصاهرة",
      STEP_ADOPTION: "أخرى (أنصاف، تبني)",
    },
    engine_messages: {
      CYCLE_DETECTED_PARENT_GRANDPARENT:
        "لا يمكن لـ ({{parentName}}) أن تكون أماً/أباً لـ ({{childName}}) لأنها بالفعل جدة/جد له عبر سلسلة نسب موجودة.",
      GENDER_CONFLICT_MARRIAGE: "لا يمكن الزواج بين شخصين من نفس الجنس.",
      MARRIAGE_BLOOD_LINE_CONFLICT:
        "لا يمكن لـ ({{wifeName}}) الزواج من ({{husbName}}) لأنه من أصولها أو فروعها المباشرة.",
      MARRIAGE_SIBINGS_CONFLICT:
        "لا يمكن لـ ({{wifeName}}) الزواج من ({{husbName}}) لأنه أخوها.",
      MARRIAGE_UNCLES_NEPHEW_CONFLICT:
        "لا يمكن الزواج بين الأعمام/العمات أو الأخوال/الخالات وأبناء الإخوة/الأخوات ({{sourceName}} و {{targetName}}).",
      BIOLOGICAL_PARENT_LIMIT:
        "لا يمكن لـ ({{targetName}}) أن يكون له أكثر من {{parentLimitText}}.",
      GENERAL_CYCLE: "حلقة لا نهائية (تضارب في الأنساب).",
    },
    inheritance_reasons: {
      BLOCKED_BY_FATHER: "محجوب بوجود الأب",
      BLOCKED_HUSBAND_CHILDREN: "لوجود الفرع الوارث للزوجة",
      NO_CHILDREN: "لعدم وجود فرع وارث",
      //... more to be extracted from Mawarith
    },
    ui: {
      ADD_PERSON: "إضافة شخص",
      SMART_SETTINGS: "الإعدادات الذكية",
      TREE_DIRECTION: "اتجاه الشجرة",
    },
  },
};
