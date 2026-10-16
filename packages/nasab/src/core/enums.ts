export enum RelationType {
  // ============================================================================
  // الطبقة الأولى: الأصول المباشرة (First Degree Ascendants)
  // الأصول الذين لا يٌحجبون حجب حرمان أبداً في المواريث
  // ===========  /** الأب (Father) - أصل وارث بالفرض والتعصيب */
  PARENT_MALE = 'PARENT_MALE', // أب
  
  /** الأم (Mother) - أصل وارث بالفرض دائماً */
  PARENT_FEMALE = 'PARENT_FEMALE', // أم
  
  // ============================================================================
  // الطبقة الأولى: الفروع المباشرة (First Degree Descendants)
  // الفروع الذين يحجبون الإخوة والأخوات، ولا يٌحجبون أبداً
  // ============================================================================

  /** الابن (Son) - فرع وارث بالتعصيب (يحجب معظم الحواشي) */
  CHILD_MALE = 'CHILD_MALE', // ابن
  
  /** البنت (Daughter) - فرع وارث بالفرض (أو بالتعصيب مع وجود الابن) */
  CHILD_FEMALE = 'CHILD_FEMALE', // ابنة
  
  // ============================================================================
  // الحواشي: الإخوة والأخوات (Siblings)
  // حواشي الدرجة الأولى المرتبطون بالأب والأم معاً أو بأحدهما
  // ============================================================================

  /** أخ شقيق (Full Brother) - من نفس الأب والأم (عصبة) */
  SIBLING_MALE = 'SIBLING_MALE', // أخ شقيق
  
  /** أخت شقيقة (Full Sister) - من نفس الأب والأم (فرض أو عصبة بالغير/مع الغير) */
  SIBLING_FEMALE = 'SIBLING_FEMALE', // أخت شقيقة
  
  /** أخ لأب (Paternal Half-Brother) - أخ من جهة الأب فقط */
  SIBLING_PATERNAL_MALE = 'SIBLING_PATERNAL_MALE', // أخ لأب
  
  /** أخت لأب (Paternal Half-Sister) - أخت من جهة الأب فقط */
  SIBLING_PATERNAL_FEMALE = 'SIBLING_PATERNAL_FEMALE', // أخت لأب
  
  /** أخ لأم (Maternal Half-Brother) - أخ من جهة الأم فقط (فرض، ولا يفرق فيه ذكر عن أنثى) */
  SIBLING_MATERNAL_MALE = 'SIBLING_MATERNAL_MALE', // أخ لأم
  
  /** أخت لأم (Maternal Half-Sister) - أخت من جهة الأم فقط (فرض) */
  SIBLING_MATERNAL_FEMALE = 'SIBLING_MATERNAL_FEMALE', // أخت لأم
  
  /** أخ غير شقيق عام (Half-Brother) - مصطلح عام يغطي الأخ لأب أو لأم عند عدم التحديد */
  HALF_SIBLING_MALE = 'HALF_SIBLING_MALE', // أخ غير شقيق
  
  /** أخت غير شقيقة عامة (Half-Sister) - مصطلح عام يغطي الأخت لأب أو لأم عند عدم التحديد */
  HALF_SIBLING_FEMALE = 'HALF_SIBLING_FEMALE', // أخت غير شقيقة
  
  // ============================================================================
  // المصاهرة والزوجية (Affinity & Marital Relations)
  // ============================================================================

  /** الزوج (Husband) - صاحب فرض لا يٌحجب حجب حرمان */
  SPOUSE_MALE = 'SPOUSE_MALE', // زوج
  
  /** الزوجة (Wife) - صاحبة فرض لا تٌحجب حجب حرمان */
  SPOUSE_FEMALE = 'SPOUSE_FEMALE', // زوجة
  
  /** الزوج السابق (Ex-Husband / المطلّق) - انقضت رابطة الزوجية شرعاً */
  EX_SPOUSE_MALE = 'EX_SPOUSE_MALE', // طليق
  
  /** الزوجة السابقة (Ex-Wife / المطلّقة) - انقضت رابطة الزوجية شرعاً */
  EX_SPOUSE_FEMALE = 'EX_SPOUSE_FEMALE', // طليقة

  /** مطلق رجعي (Divorced Revocable Husband) - الزوج في فترة العدة الرجعية (له حق الإرجاع وتوارث مستمر) */
  DIVORCED_REVOCABLE_MALE = 'DIVORCED_REVOCABLE_MALE', // مطلق رجعياً

  /** مطلقة رجعية (Divorced Revocable Wife) */
  DIVORCED_REVOCABLE_FEMALE = 'DIVORCED_REVOCABLE_FEMALE', // مطلقة رجعية

  /** مطلق بائن (Divorced Irrevocable Husband) - بائن بينونة صغرى أو كبرى */
  DIVORCED_IRREVOCABLE_MALE = 'DIVORCED_IRREVOCABLE_MALE', // مطلق بائن

  /** مطلقة بائن (Divorced Irrevocable Wife) */
  DIVORCED_IRREVOCABLE_FEMALE = 'DIVORCED_IRREVOCABLE_FEMALE', // مطلقة بائن
  
  // ============================================================================
  // الطبقة الثانية: الجدود (Second Degree Ascendants - Grandparents)
  // ============================================================================

  /** الجد (Grandfather) - يشمل الجد الصحيح (أب الأب) والجد الفاسد (أب الأم) ما لم يحدد */
  GRANDPARENT_MALE = 'GRANDPARENT_MALE', // جد
  
  /** الجدة (Grandmother) - تشمل الجدة الصحيحة (أم الأم، أم الأب) والجدة الفاسدة */
  GRANDPARENT_FEMALE = 'GRANDPARENT_FEMALE', // جدة
  
  // ============================================================================
  // الطبقة الثانية: الأحفاد (Second Degree Descendants - Grandchildren)
  // ============================================================================

  /** الحفيد الذكر (Grandson) - يشمل ابن الابن (وارث) وابن البنت (ذو رحم) */
  GRANDCHILD_MALE = 'GRANDCHILD_MALE', // حفيد
  
  /** الحفيدة الأنثى (Granddaughter) - تشمل بنت الابن (وارثة) وبنت البنت (ذات رحم) */
  GRANDCHILD_FEMALE = 'GRANDCHILD_FEMALE', // حفيدة
  
  // ============================================================================
  // الحواشي: درجة الأعمام والأخوال (Uncles & Aunts)
  // ============================================================================

  /** عم شقيق (Full Paternal Uncle) - أخو الأب من أبيه وأمه (عصبة) */
  UNCLE_FULL_MALE = 'UNCLE_FULL_MALE', // عم شقيق
  
  /** عمة شقيقة (Full Paternal Aunt) - أخت الأب من أبيه وأمه (من ذوي الأرحام) */
  UNCLE_FULL_FEMALE = 'UNCLE_FULL_FEMALE', // عمة شقيقة
  
  /** عم لأب (Paternal Uncle from Father's side) - أخو الأب لأبيه */
  UNCLE_PATERNAL_MALE = 'UNCLE_PATERNAL_MALE', // عم
  
  /** عمة لأب (Paternal Aunt from Father's side) - أخت الأب لأبيه */
  UNCLE_PATERNAL_FEMALE = 'UNCLE_PATERNAL_FEMALE', // عمة
  
  /** الخال (Maternal Uncle) - أخو الأم (من ذوي الأرحام) */
  UNCLE_MATERNAL_MALE = 'UNCLE_MATERNAL_MALE', // خال
  
  /** الخالة (Maternal Aunt) - أخت الأم (من ذوي الأرحام) */
  UNCLE_MATERNAL_FEMALE = 'UNCLE_MATERNAL_FEMALE', // خالة
  
  // ============================================================================
  // الحواشي: أبناء الإخوة (Nephews & Nieces)
  // ============================================================================

  /** ابن الأخ الشقيق (Full Nephew) - وارث بالتعصيب */
  NEPHEW_FULL_MALE = 'NEPHEW_FULL_MALE', // ابن أخ شقيق
  
  /** بنت الأخ الشقيق (Full Niece) - من ذوي الأرحام */
  NEPHEW_FULL_FEMALE = 'NEPHEW_FULL_FEMALE', // ابنة أخ شقيقة
  
  /** ابن الأخ لأب (Paternal Half-Nephew) - وارث بالتعصيب */
  NEPHEW_PATERNAL_MALE = 'NEPHEW_PATERNAL_MALE', // ابن أخ
  
  /** بنت الأخ لأب (Paternal Half-Niece) - من ذوي الأرحام */
  NEPHEW_PATERNAL_FEMALE = 'NEPHEW_PATERNAL_FEMALE', // ابنة أخ
  
  /** ابن الأخت (Maternal Nephew) - ابن الأخت مطلقا وهو من ذوي الأرحام */
  NEPHEW_MATERNAL_MALE = 'NEPHEW_MATERNAL_MALE', // ابن أخت
  
  /** ابنة الأخت (Maternal Niece) - ابنة الأخت مطلقا وهي من ذوي الأرحام */
  NEPHEW_MATERNAL_FEMALE = 'NEPHEW_MATERNAL_FEMALE', // ابنة أخت
  
  // ============================================================================
  // الطبقة الثالثة: أبناء الأعمام والأخوال (Couins) وأصول عليا (Great Grandparents)
  // ============================================================================

  /** ابن العم (Paternal Cousin Male) - ابن العم الشقيق أو لأب (عصبة) */
  COUSIN_PATERNAL_MALE = 'COUSIN_PATERNAL_MALE', // ابن عم
  
  /** ابنة العم (Paternal Cousin Female) - بنت العم مطلقا (ذوو أرحام) */
  COUSIN_PATERNAL_FEMALE = 'COUSIN_PATERNAL_FEMALE', // ابنة عم
  
  /** ابن الخال (Maternal Cousin Male) - ذوو أرحام */
  COUSIN_MATERNAL_MALE = 'COUSIN_MATERNAL_MALE', // ابن خال
  
  /** ابنة الخال (Maternal Cousin Female) - ذوو أرحام */
  COUSIN_MATERNAL_FEMALE = 'COUSIN_MATERNAL_FEMALE', // ابنة خال
  
  /** أب الجد / جد الأب (Great Grandfather Paternal) - أب أب الأب وإن علا */
  GREAT_GRANDPARENT_PATERNAL_MALE = 'GREAT_GRANDPARENT_PATERNAL_MALE', // جد الأب
  
  /** أبو الجدة / أب الأم (Great Grandfather Maternal) - من الأجداد الفاسدين */
  GREAT_GRANDPARENT_MATERNAL_MALE = 'GREAT_GRANDPARENT_MATERNAL_MALE', // جد الأم
  
  // ============================================================================
  // علاقات المصاهرة (In-Laws)
  // ============================================================================

  /** الحما أب الزوج/الزوجة (Father In-Law) */
  FATHER_IN_LAW = 'FATHER_IN_LAW', // حما
  
  /** الحماة أم الزوج/الزوجة (Mother In-Law) */
  MOTHER_IN_LAW = 'MOTHER_IN_LAW', // حماة
  
  /** الصهر / زوج الابنة (Son In-Law) */
  SON_IN_LAW = 'SON_IN_LAW', // صهر
  
  /** الكنة / زوجة الابن (Daughter In-Law) */
  DAUGHTER_IN_LAW = 'DAUGHTER_IN_LAW', // كنة
  
  // ============================================================================
  // التبني والقرابة التربوية (Adoption & Step-Relations - Not explicit Sharia inherits)
  // ============================================================================

  /** أب بالتبني (Adoptive Father) - لا يترتب عليه توارث شرعي إسلامي بالأسهم */
  ADOPTIVE_PARENT_MALE = 'ADOPTIVE_PARENT_MALE', // أب بالتبني
  
  /** أم بالتبني (Adoptive Mother) */
  ADOPTIVE_PARENT_FEMALE = 'ADOPTIVE_PARENT_FEMALE', // أم بالتبني
  
  /** ابن بالتبني (Adoptive Son) / متبنّى (دعيّ) */
  ADOPTED_CHILD_MALE = 'ADOPTED_CHILD_MALE', // ابن بالتبني
  
  /** ابنة بالتبني (Adoptive Daughter) / متبنّاة */
  ADOPTED_CHILD_FEMALE = 'ADOPTED_CHILD_FEMALE', // ابنة بالتبني
  
  /** زوج الأم (Step-Father) - ربّ أو "عم" مجازا، يحرم نكاحه إذا دخل بالأم */
  STEP_PARENT_MALE = 'STEP_PARENT_MALE', // زوج الأم
  
  /** زوجة الأب (Step-Mother) - تحرم على الأبناء تأبيدا */
  STEP_PARENT_FEMALE = 'STEP_PARENT_FEMALE', // زوجة الأب
  
  /** الربيب ابن الزوجة (Step-Son) - لا يرث من زوج أمه */
  STEP_CHILD_MALE = 'STEP_CHILD_MALE', // ربيب
  
  /** الربيبة ابنة الزوجة (Step-Daughter) - تحرم على زوج الأم إذا دخل بالأم */
  STEP_CHILD_FEMALE = 'STEP_CHILD_FEMALE', // ربيبة

  /** والد الطفل / شريك إنجاب من غير عقد شرعي (Co-Parent Male) */
  CO_PARENT_MALE = 'CO_PARENT_MALE', // شريك إنجاب (ذكر)
  
  /** والدة الطفل / شريكة إنجاب من غير عقد شرعي (Co-Parent Female) */
  CO_PARENT_FEMALE = 'CO_PARENT_FEMALE', // شريكة إنجاب (أنثى)
  
  // ============================================================================
  // الولاء والعتق (Walaa' & Emancipation)
  // ============================================================================

  /** المُعتِق (Master / Emancipator) - من أعتق العبد وله عليه حق الولاء */
  MASTER = 'MASTER', // مُعتِق

  /** المُعتَق (Freed Slave) - العبد المحرر الذي عليه الولاء لمعتقه */
  FREED_SLAVE = 'FREED_SLAVE', // عتيق / مُعتَق

  // ============================================================================
  // الرضاع: قرابات التحريم بالرضاعة (Foster / Milk Kinship)
  // ============================================================================

  /** أم من الرضاع (المرضعة - Foster Mother) - تُحرم كالنسب ولا توارث */
  FOSTER_MOTHER = 'FOSTER_MOTHER', // أم من الرضاعة
  
  /** أب من الرضاع (صاحب اللبن / زوج المرضعة - Foster Father) */
  FOSTER_FATHER = 'FOSTER_FATHER', // أب من الرضاعة
  
  /** ابن من الرضاع (الرضيع الذكر - Foster Son) */
  FOSTER_SON = 'FOSTER_SON', // ابن من الرضاعة
  
  /** ابنة من الرضاع (الرضيعة الأنثى - Foster Daughter) */
  FOSTER_DAUGHTER = 'FOSTER_DAUGHTER', // ابنة من الرضاعة
  
  /** أخ من الرضاع (Foster Brother) */
  FOSTER_BROTHER = 'FOSTER_BROTHER', // أخ من الرضاعة
  
  /** أخت من الرضاع (Foster Sister) */
  FOSTER_SISTER = 'FOSTER_SISTER', // أخت من الرضاعة
  
  // ============================================================================
  // الفئات الجمعية: مجردات للاستعلام والتصفية (Plural/Group - Abstract Queries)
  // لا تُستخدم كحواف فعلية في بناء شجرة العائلة (Edges)
  // ============================================================================

  /** الإخوة مطلقاً ذكوراً وإناثاً (All Siblings) */
  SIBLINGS = 'SIBLINGS', // إخوة
  
  /** الأخوان لأب ذكوراً (Paternal Brothers Only) */
  BROTHERS_PATERNAL = 'BROTHERS_PATERNAL', // أخوان لأب
  
  /** الأخوات لأب إناثاً (Paternal Sisters Only) */
  SISTERS_PATERNAL = 'SISTERS_PATERNAL', // أختان لأب
  
  /** الإخوة لأب ذكوراً وإناثاً (All Paternal Siblings) */
  SIBLINGS_PATERNAL = 'SIBLINGS_PATERNAL', // إخوة لأب
  
  /** الإخوة لأم ذكوراً وإناثاً (All Maternal Siblings - أولاد الأم) */
  SIBLINGS_MATERNAL = 'SIBLINGS_MATERNAL', // إخوة لأم
  
  /** الأبناء والبنات (Children General/Plural) */
  CHILDREN = 'CHILDREN', // أبناء وبنات
  
  /** الأبناء والبنات معاً كمصطلح (Sons & Daughters) */
  SONS_DAUGHTERS = 'SONS_DAUGHTERS', // أبناء وبنات
  
  /** الآباء والأبناء كمحور رابط (Parent-Child Hierarchy Link) */
  PARENT_CHILD = 'PARENT_CHILD', // أب / ابن
  
  /** أبناء العمومة ذكوراً (Paternal Cousins Plural) */
  COUSINS_PATERNAL = 'COUSINS_PATERNAL', // أبناء عم
  
  /** الزوجان (Spouses / Married Couple) */
  SPOUSES = 'SPOUSES', // أزواج
  
  /** المنفصلان / المطلقان (Ex-Spouses / Divorced Couple) */
  EX_SPOUSES = 'EX_SPOUSES', // مطلقان
}


/**
 * FIX-11: الأنواع الجمعية — تُستخدم في العرض والترجمة، ليس كعلاقات فردية.
 * يمكن استخدام هذا النوع لتصفية الأنواع الجمعية من المفردة.
 */


/** الأنواع الجمعية كمجموعة Set للفحص السريع O(1) */
export const RELATION_GROUPS = new Set<RelationType>([
  RelationType.SIBLINGS,
  RelationType.BROTHERS_PATERNAL,
  RelationType.SISTERS_PATERNAL,
  RelationType.SIBLINGS_PATERNAL,
  RelationType.SIBLINGS_MATERNAL,
  RelationType.CHILDREN,
  RelationType.SONS_DAUGHTERS,
  RelationType.PARENT_CHILD,
  RelationType.COUSINS_PATERNAL,
  RelationType.SPOUSES,
  RelationType.EX_SPOUSES,
]);

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}
