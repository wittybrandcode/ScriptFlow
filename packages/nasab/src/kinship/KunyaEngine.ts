import { Person, Relation } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { normalizeType } from '../core/normalizer';

/**
 * تحذير تناقض الكنية
 */
export interface KunyaWarning {
  parentId: string;
  childId: string;
  parentName: string;
  childName: string;
  parentKunya: string;
  childKunya: string;
  message: string;
}

/**
 * نتيجة التحقق من تطابق الكنية
 */
export interface KunyaMatchResult {
  match: boolean;
  parentKunya: string | null;
  childKunya: string | null;
  suggestion?: string;
}

/**
 * محرك الكنية (KunyaEngine)
 * 
 * يتعامل مع الألقاب العائلية العربية (الهاشمي، القرشي، آل سعود...)
 * ويتحقق من تطابقها بين الأب والابن لكشف التناقضات في النسب.
 * 
 * @example
 * ```typescript
 * const kunya = KunyaEngine.extractKunya('محمد الهاشمي');
 * // → 'الهاشمي'
 * 
 * const warnings = KunyaEngine.detectMismatches(nodes, edges);
 * // → [{ message: 'كنية الابن (التميمي) لا تتطابق مع كنية أبيه (الهاشمي)' }]
 * ```
 */
export class KunyaEngine {

  /**
   * استخراج الكنية (اللقب العائلي) من اسم كامل
   * 
   * الخوارزمية:
   * 1. إذا كان للشخص حقل `kunya` مباشر، يُستخدم
   * 2. وإلا، يتم تحليل الاسم الكامل واستخراج الكلمة الأخيرة
   *    التي تبدأ بـ "ال" أو "آل" كلقب عائلي
   * 3. يتم تجاهل الجسيمات (بن، بنت، ابن...)
   * 
   * @param person - الشخص المراد استخراج كنيته
   * @returns الكنية أو null إذا لم تُستخرج
   */
  static extractKunya(person: Person): string | null {
    // أولوية: الحقل المباشر
    if (person.kunya && person.kunya.trim()) {
      return person.kunya.trim();
    }

    // تحليل الاسم الكامل
    return KunyaEngine.extractKunyaFromName(person.name);
  }

  /**
   * استخراج الكنية من نص الاسم مباشرة
   */
  static extractKunyaFromName(fullName: string): string | null {
    if (!fullName || !fullName.trim()) return null;

    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return null;

    // البحث من الآخر عن كلمة تبدأ بـ "ال" أو "آل"
    for (let i = parts.length - 1; i >= 1; i--) {
      const word = parts[i];
      
      // "آل" + اسم (مثل: آل سعود)
      if (word === 'آل' && i + 1 < parts.length) {
        return `آل ${parts[i + 1]}`;
      }

      // كلمة تبدأ بـ "ال" (مثل: الهاشمي، القرشي)
      if (word.startsWith('ال') && word.length > 3) {
        // تأكد أنها ليست جزءاً من سلسلة "بن" (مثل: بن الخطاب = ليست كنية بالضرورة)
        if (i > 0 && (parts[i - 1] === 'بن' || parts[i - 1] === 'ابن')) {
          continue; // تخطّ، ابحث عن كلمة أخرى
        }
        return word;
      }
    }

    // الحالة الأخيرة: الكلمة الأخيرة إذا بدأت بـ "ال"
    const lastWord = parts[parts.length - 1];
    if (lastWord.startsWith('ال') && lastWord.length > 3) {
      return lastWord;
    }

    return null;
  }

  /**
   * التحقق من تطابق الكنية بين أب وابن
   * 
   * @param parent - الشخص الأب/الأم
   * @param child - الشخص الابن/الابنة
   * @returns نتيجة التطابق مع اقتراح إذا لم تتطابق
   */
  static validateLineageKunya(parent: Person, child: Person): KunyaMatchResult {
    const parentKunya = KunyaEngine.extractKunya(parent);
    const childKunya = KunyaEngine.extractKunya(child);

    // إذا لم يكن لأحدهما كنية، لا يمكن التحقق
    if (!parentKunya && !childKunya) {
      return { match: true, parentKunya: null, childKunya: null };
    }

    // إذا كان للأب كنية ولكن الابن بلا كنية
    if (parentKunya && !childKunya) {
      return {
        match: true, // ليس تناقضاً، فقط ناقص
        parentKunya,
        childKunya: null,
        suggestion: `يمكن إضافة الكنية "${parentKunya}" لـ (${child.name})`
      };
    }

    // إذا كان للابن كنية ولكن الأب بلا كنية
    if (!parentKunya && childKunya) {
      return {
        match: true,
        parentKunya: null,
        childKunya,
        suggestion: `يمكن إضافة الكنية "${childKunya}" لـ (${parent.name})`
      };
    }

    // كلاهما لديه كنية — قارن
    const match = KunyaEngine.normalizeKunya(parentKunya!) === KunyaEngine.normalizeKunya(childKunya!);

    return {
      match,
      parentKunya,
      childKunya,
      suggestion: match ? undefined : `كنية (${child.name}) هي "${childKunya}" بينما كنية أبيه (${parent.name}) هي "${parentKunya}"`
    };
  }

  /**
   * تطبيع الكنية للمقارنة (إزالة "ال" و "آل" للمقارنة)
   */
  static normalizeKunya(kunya: string): string {
    let normalized = kunya.trim();
    if (normalized.startsWith('آل ')) normalized = normalized.substring(3);
    if (normalized.startsWith('ال')) normalized = normalized.substring(2);
    return normalized;
  }

  /**
   * نشر الكنية تلقائياً من الآباء إلى الأبناء الذين لا كنية لهم
   * 
   * القاعدة: الكنية تُورث من الأب (النسب الأبوي)
   * - إذا كان للأب كنية، تُنسخ لجميع أبنائه الذين لا كنية لهم
   * - يتم النشر بشكل تسلسلي (الأب → الابن → الحفيد)
   * 
   * @param nodes - قائمة الأشخاص
   * @param edges - قائمة العلاقات
   * @returns قائمة الأشخاص المحدثة مع الكنية المنشورة
   */
  static propagateKunya(nodes: Person[], edges: Relation[]): Person[] {
    const updatedNodes = nodes.map(n => ({ ...n })); // نسخة عميقة

    // بناء خريطة الأبناء حسب الأب
    const childrenByFather = new Map<string, string[]>();
    
    for (const edge of edges) {
      const type = normalizeType(edge.type);
      if (type === RelationType.PARENT_MALE) {
        if (!childrenByFather.has(edge.sourceId)) {
          childrenByFather.set(edge.sourceId, []);
        }
        childrenByFather.get(edge.sourceId)!.push(edge.targetId);
      }
    }

    // نشر الكنية بشكل عودي (BFS)
    const propagate = (fatherId: string, kunya: string) => {
      const children = childrenByFather.get(fatherId) || [];
      for (const childId of children) {
        const child = updatedNodes.find(n => n.id === childId);
        if (child && !child.kunya) {
          child.kunya = kunya;
          // استمر بالنشر إذا كان الابن ذكراً
          if (child.gender === Gender.MALE) {
            propagate(childId, kunya);
          }
        }
      }
    };

    // ابدأ من كل أب لديه كنية
    for (const node of updatedNodes) {
      const kunya = KunyaEngine.extractKunya(node);
      if (kunya && node.gender === Gender.MALE) {
        // تأكد من تعيين الكنية للأب نفسه
        if (!node.kunya) node.kunya = kunya;
        propagate(node.id, kunya);
      }
    }

    return updatedNodes;
  }

  /**
   * كشف تناقضات الكنية في الشجرة
   * 
   * يبحث عن حالات يكون فيها الابن بكنية مختلفة عن أبيه
   * (مثل: الأب "الهاشمي" والابن "التميمي")
   * 
   * @param nodes - قائمة الأشخاص
   * @param edges - قائمة العلاقات
   * @returns قائمة التحذيرات
   */
  static detectMismatches(nodes: Person[], edges: Relation[]): KunyaWarning[] {
    const warnings: KunyaWarning[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const edge of edges) {
      const type = normalizeType(edge.type);
      
      // فقط علاقات الأبوة (أب → ابن)
      if (type !== RelationType.PARENT_MALE) continue;

      const parent = nodeMap.get(edge.sourceId);
      const child = nodeMap.get(edge.targetId);
      if (!parent || !child) continue;

      const result = KunyaEngine.validateLineageKunya(parent, child);
      
      if (!result.match && result.parentKunya && result.childKunya) {
        warnings.push({
          parentId: parent.id,
          childId: child.id,
          parentName: parent.name,
          childName: child.name,
          parentKunya: result.parentKunya,
          childKunya: result.childKunya,
          message: `كنية (${child.name}: ${result.childKunya}) لا تتطابق مع كنية أبيه (${parent.name}: ${result.parentKunya})`
        });
      }
    }

    return warnings;
  }

  /**
   * بناء سلسلة النسب الكاملة لشخص
   * 
   * @example
   * buildNasabChain('omar', nodes, edges)
   * // → "عمر بن محمد بن عبدالله الهاشمي"
   * 
   * @param personId - معرف الشخص
   * @param nodes - قائمة الأشخاص
   * @param edges - قائمة العلاقات
   * @param maxDepth - أقصى عمق للسلسلة (افتراضي: 5)
   * @returns سلسلة النسب الكاملة
   */
  static buildNasabChain(
    personId: string,
    nodes: Person[],
    edges: Relation[],
    maxDepth: number = 5
  ): string {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const person = nodeMap.get(personId);
    if (!person) return '';

    const chain: string[] = [];
    let currentId: string | null = personId;
    let depth = 0;
    let foundKunya: string | null = null;

    while (currentId && depth < maxDepth) {
      const current = nodeMap.get(currentId);
      if (!current) break;

      if (!foundKunya) {
        foundKunya = KunyaEngine.extractKunya(current);
      }

      // أضف الاسم الأول فقط (بدون الكنية)
      const firstName = KunyaEngine.getFirstName(current.name);
      chain.push(firstName);

      // ابحث عن الأب
      const fatherEdge = edges.find(e => {
        const type = normalizeType(e.type);
        return type === RelationType.PARENT_MALE && e.targetId === currentId;
      });

      currentId = fatherEdge ? fatherEdge.sourceId : null;
      depth++;
    }

    // أضف الكنية في النهاية
    const nasab = chain.join(' بن ');
    
    return foundKunya ? `${nasab} ${foundKunya}` : nasab;
  }

  /**
   * استخراج الاسم الأول (أو المُركب) من اسم كامل
   * (بدون الكنية أو سلسلة "بن")
   */
  static getFirstName(fullName: string): string {
    if (!fullName) return '';
    let name = fullName.trim();
    
    // إزالة الكنية إذا وجدت
    const kunya = KunyaEngine.extractKunyaFromName(name);
    if (kunya && name.endsWith(kunya)) {
      name = name.substring(0, name.lastIndexOf(kunya)).trim();
    }

    // إزالة سلسلة النسب "بن ..." إذا وجدت
    const binIndex = name.search(/\s+(بن|ابن|بنت|ابنة)\s+/);
    if (binIndex !== -1) {
      name = name.substring(0, binIndex).trim();
    }

    return name || fullName.split(/\s+/)[0];
  }

  /**
   * اقتراح كنية لشخص بناءً على أبيه
   * 
   * @param personId - معرف الشخص
   * @param nodes - قائمة الأشخاص
   * @param edges - قائمة العلاقات
   * @returns الكنية المقترحة أو null
   */
  static suggestKunya(
    personId: string,
    nodes: Person[],
    edges: Relation[]
  ): string | null {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // ابحث عن الأب
    const fatherEdge = edges.find(e => {
      const type = normalizeType(e.type);
      return type === RelationType.PARENT_MALE && e.targetId === personId;
    });

    if (!fatherEdge) return null;

    const father = nodeMap.get(fatherEdge.sourceId);
    if (!father) return null;

    return KunyaEngine.extractKunya(father);
  }
}
