import { RelationType } from "../core/enums";
import { KinshipDictionary } from "./types";

export const EnglishDictionary: KinshipDictionary = {
  locale: "en",
  direction: "ltr",
  translations: {
    relations: {
      [RelationType.PARENT_MALE]: "Father",
      [RelationType.PARENT_FEMALE]: "Mother",
      [RelationType.CHILD_MALE]: "Son",
      [RelationType.CHILD_FEMALE]: "Daughter",
      [RelationType.SIBLING_MALE]: "Brother",
      [RelationType.SIBLING_FEMALE]: "Sister",
      [RelationType.SPOUSE_MALE]: "Husband",
      [RelationType.SPOUSE_FEMALE]: "Wife",
      [RelationType.EX_SPOUSE_MALE]: "Ex-Husband",
      [RelationType.EX_SPOUSE_FEMALE]: "Ex-Wife",

      [RelationType.GRANDPARENT_MALE]: "Grandfather",
      [RelationType.GRANDPARENT_FEMALE]: "Grandmother",
      [RelationType.GRANDCHILD_MALE]: "Grandson",
      [RelationType.GRANDCHILD_FEMALE]: "Granddaughter",
      [RelationType.UNCLE_FULL_MALE]: "Full Paternal Uncle",
      [RelationType.UNCLE_FULL_FEMALE]: "Full Paternal Aunt",
      [RelationType.UNCLE_PATERNAL_MALE]: "Paternal Uncle",
      [RelationType.UNCLE_PATERNAL_FEMALE]: "Paternal Aunt",
      [RelationType.UNCLE_MATERNAL_MALE]: "Maternal Uncle",
      [RelationType.UNCLE_MATERNAL_FEMALE]: "Maternal Aunt",
      [RelationType.NEPHEW_FULL_MALE]: "Full Brother's Son",
      [RelationType.NEPHEW_FULL_FEMALE]: "Full Brother's Daughter",
      [RelationType.NEPHEW_PATERNAL_MALE]: "Brother's Son",
      [RelationType.NEPHEW_PATERNAL_FEMALE]: "Brother's Daughter",
      [RelationType.NEPHEW_MATERNAL_MALE]: "Sister's Son",
      [RelationType.NEPHEW_MATERNAL_FEMALE]: "Sister's Daughter",

      [RelationType.COUSIN_PATERNAL_MALE]: "Paternal Cousin (M)",
      [RelationType.COUSIN_PATERNAL_FEMALE]: "Paternal Cousin (F)",
      [RelationType.COUSIN_MATERNAL_MALE]: "Maternal Cousin (M)",
      [RelationType.COUSIN_MATERNAL_FEMALE]: "Maternal Cousin (F)",
      [RelationType.GREAT_GRANDPARENT_PATERNAL_MALE]: "Paternal Great-Grandfather",
      [RelationType.GREAT_GRANDPARENT_MATERNAL_MALE]: "Maternal Great-Grandfather",

      [RelationType.FATHER_IN_LAW]: "Father-in-Law",
      [RelationType.MOTHER_IN_LAW]: "Mother-in-Law",
      [RelationType.SON_IN_LAW]: "Son-in-Law",
      [RelationType.DAUGHTER_IN_LAW]: "Daughter-in-Law",

      [RelationType.SIBLING_PATERNAL_MALE]: "Paternal Half-Brother",
      [RelationType.SIBLING_PATERNAL_FEMALE]: "Paternal Half-Sister",
      [RelationType.SIBLING_MATERNAL_MALE]: "Maternal Half-Brother",
      [RelationType.SIBLING_MATERNAL_FEMALE]: "Maternal Half-Sister",

      [RelationType.STEP_PARENT_MALE]: "Stepfather",
      [RelationType.STEP_PARENT_FEMALE]: "Stepmother",
      [RelationType.STEP_CHILD_MALE]: "Stepson",
      [RelationType.STEP_CHILD_FEMALE]: "Stepdaughter",

      [RelationType.HALF_SIBLING_MALE]: "Half-Brother",
      [RelationType.HALF_SIBLING_FEMALE]: "Half-Sister",

      [RelationType.ADOPTIVE_PARENT_MALE]: "Adoptive Father",
      [RelationType.ADOPTIVE_PARENT_FEMALE]: "Adoptive Mother",
      [RelationType.ADOPTED_CHILD_MALE]: "Adopted Son",
      [RelationType.ADOPTED_CHILD_FEMALE]: "Adopted Daughter",

      [RelationType.SIBLINGS]: "Siblings",
      [RelationType.BROTHERS_PATERNAL]: "Paternal Brothers",
      [RelationType.SISTERS_PATERNAL]: "Paternal Sisters",
      [RelationType.SIBLINGS_PATERNAL]: "Paternal Siblings",
      [RelationType.SIBLINGS_MATERNAL]: "Maternal Siblings",
      [RelationType.CHILDREN]: "Children",
      [RelationType.SONS_DAUGHTERS]: "Sons & Daughters",
      [RelationType.PARENT_CHILD]: "Parent / Child",
      [RelationType.COUSINS_PATERNAL]: "Paternal Cousins",

      // Foster (Radhaa)
      [RelationType.FOSTER_MOTHER]: "Foster Mother",
      [RelationType.FOSTER_FATHER]: "Foster Father",
      [RelationType.FOSTER_SON]: "Foster Son",
      [RelationType.FOSTER_DAUGHTER]: "Foster Daughter",
      [RelationType.FOSTER_BROTHER]: "Foster Brother",
      [RelationType.FOSTER_SISTER]: "Foster Sister",

      // Unused keys from translation bridge
      [RelationType.CO_PARENT_MALE]: "Co-Parent (M)",
      [RelationType.CO_PARENT_FEMALE]: "Co-Parent (F)",
      [RelationType.SPOUSES]: "Spouses",
      [RelationType.EX_SPOUSES]: "Ex-Spouses",
    },
    categories: {
      FIRST_DEGREE: "First Degree",
      SECOND_DEGREE: "Second Degree",
      THIRD_DEGREE: "Third Degree",
      IN_LAW: "In-Law",
      STEP_ADOPTION: "Other (Step, Adoption)",
    },
    engine_messages: {
      CYCLE_DETECTED_PARENT_GRANDPARENT:
        "{{parentName}} cannot be parent of {{childName}} — already a grandparent via existing lineage.",
      GENDER_CONFLICT_MARRIAGE: "Cannot marry two persons of the same gender.",
      MARRIAGE_BLOOD_LINE_CONFLICT:
        "{{wifeName}} cannot marry {{husbName}} — he is a direct ascendant or descendant.",
      MARRIAGE_SIBINGS_CONFLICT:
        "{{wifeName}} cannot marry {{husbName}} — he is her brother.",
      MARRIAGE_UNCLES_NEPHEW_CONFLICT:
        "Cannot marry between uncles/aunts and nephews/nieces ({{sourceName}} and {{targetName}}).",
      BIOLOGICAL_PARENT_LIMIT:
        "{{targetName}} cannot have more than {{parentLimitText}} parents.",
      GENERAL_CYCLE: "Infinite loop detected (genealogical conflict).",
    },
    inheritance_reasons: {
      BLOCKED_BY_FATHER: "Blocked by father",
      BLOCKED_HUSBAND_CHILDREN: "Due to existence of descendant heir of the wife",
      NO_CHILDREN: "No direct descendant",
    },
    ui: {
      ADD_PERSON: "Add Person",
      SMART_SETTINGS: "Smart Settings",
      TREE_DIRECTION: "Tree Direction",
    },
  },
};
