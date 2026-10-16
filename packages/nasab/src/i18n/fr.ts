import { RelationType } from "../core/enums";
import { KinshipDictionary } from "./types";

export const FrenchDictionary: KinshipDictionary = {
  locale: "fr",
  direction: "ltr",
  translations: {
    relations: {
      [RelationType.PARENT_MALE]: "P\u00e8re",
      [RelationType.PARENT_FEMALE]: "M\u00e8re",
      [RelationType.CHILD_MALE]: "Fils",
      [RelationType.CHILD_FEMALE]: "Fille",
      [RelationType.SIBLING_MALE]: "Fr\u00e8re",
      [RelationType.SIBLING_FEMALE]: "S\u0153ur",
      [RelationType.SPOUSE_MALE]: "\u00c9poux",
      [RelationType.SPOUSE_FEMALE]: "\u00c9pouse",
      [RelationType.EX_SPOUSE_MALE]: "Ex-\u00e9poux",
      [RelationType.EX_SPOUSE_FEMALE]: "Ex-\u00e9pouse",

      [RelationType.GRANDPARENT_MALE]: "Grand-p\u00e8re",
      [RelationType.GRANDPARENT_FEMALE]: "Grand-m\u00e8re",
      [RelationType.GRANDCHILD_MALE]: "Petit-fils",
      [RelationType.GRANDCHILD_FEMALE]: "Petite-fille",
      [RelationType.UNCLE_PATERNAL_MALE]: "Oncle paternel",
      [RelationType.UNCLE_PATERNAL_FEMALE]: "Tante paternelle",
      [RelationType.UNCLE_MATERNAL_MALE]: "Oncle maternel",
      [RelationType.UNCLE_MATERNAL_FEMALE]: "Tante maternelle",
      [RelationType.NEPHEW_PATERNAL_MALE]: "Fils du fr\u00e8re",
      [RelationType.NEPHEW_PATERNAL_FEMALE]: "Fille du fr\u00e8re",
      [RelationType.NEPHEW_MATERNAL_MALE]: "Fils de la s\u0153ur",
      [RelationType.NEPHEW_MATERNAL_FEMALE]: "Fille de la s\u0153ur",

      [RelationType.COUSIN_PATERNAL_MALE]: "Cousin paternel",
      [RelationType.COUSIN_PATERNAL_FEMALE]: "Cousine paternelle",
      [RelationType.COUSIN_MATERNAL_MALE]: "Cousin maternel",
      [RelationType.COUSIN_MATERNAL_FEMALE]: "Cousine maternelle",
      [RelationType.GREAT_GRANDPARENT_PATERNAL_MALE]: "Arri\u00e8re-grand-p\u00e8re paternel",
      [RelationType.GREAT_GRANDPARENT_MATERNAL_MALE]: "Arri\u00e8re-grand-p\u00e8re maternel",

      [RelationType.FATHER_IN_LAW]: "Beau-p\u00e8re",
      [RelationType.MOTHER_IN_LAW]: "Belle-m\u00e8re",
      [RelationType.SON_IN_LAW]: "Gendre",
      [RelationType.DAUGHTER_IN_LAW]: "Belle-fille",

      [RelationType.SIBLING_PATERNAL_MALE]: "Demi-fr\u00e8re paternel",
      [RelationType.SIBLING_PATERNAL_FEMALE]: "Demi-s\u0153ur paternelle",
      [RelationType.SIBLING_MATERNAL_MALE]: "Demi-fr\u00e8re maternel",
      [RelationType.SIBLING_MATERNAL_FEMALE]: "Demi-s\u0153ur maternelle",

      [RelationType.STEP_PARENT_MALE]: "Beau-p\u00e8re (recompos\u00e9)",
      [RelationType.STEP_PARENT_FEMALE]: "Belle-m\u00e8re (recompos\u00e9e)",
      [RelationType.STEP_CHILD_MALE]: "Beau-fils",
      [RelationType.STEP_CHILD_FEMALE]: "Belle-fille",

      [RelationType.HALF_SIBLING_MALE]: "Demi-fr\u00e8re",
      [RelationType.HALF_SIBLING_FEMALE]: "Demi-s\u0153ur",

      [RelationType.ADOPTIVE_PARENT_MALE]: "P\u00e8re adoptif",
      [RelationType.ADOPTIVE_PARENT_FEMALE]: "M\u00e8re adoptive",
      [RelationType.ADOPTED_CHILD_MALE]: "Fils adoptif",
      [RelationType.ADOPTED_CHILD_FEMALE]: "Fille adoptive",

      [RelationType.SIBLINGS]: "Fr\u00e8res et s\u0153urs",
      [RelationType.BROTHERS_PATERNAL]: "Fr\u00e8res paternels",
      [RelationType.SISTERS_PATERNAL]: "S\u0153urs paternelles",
      [RelationType.SIBLINGS_PATERNAL]: "Germains paternels",
      [RelationType.SIBLINGS_MATERNAL]: "Germains maternels",
      [RelationType.CHILDREN]: "Enfants",
      [RelationType.SONS_DAUGHTERS]: "Fils et filles",
      [RelationType.PARENT_CHILD]: "Parent / Enfant",
      [RelationType.COUSINS_PATERNAL]: "Cousins paternels",

      // Foster (Radhaa)
      [RelationType.FOSTER_MOTHER]: "M\u00e8re de lait",
      [RelationType.FOSTER_FATHER]: "P\u00e8re de lait",
      [RelationType.FOSTER_SON]: "Fils de lait",
      [RelationType.FOSTER_DAUGHTER]: "Fille de lait",
      [RelationType.FOSTER_BROTHER]: "Fr\u00e8re de lait",
      [RelationType.FOSTER_SISTER]: "S\u0153ur de lait",

      [RelationType.CO_PARENT_MALE]: "Co-parent (H)",
      [RelationType.CO_PARENT_FEMALE]: "Co-parent (F)",
      [RelationType.SPOUSES]: "Conjoints",
      [RelationType.EX_SPOUSES]: "Ex-conjoints",
    },
    categories: {
      FIRST_DEGREE: "Premier degr\u00e9",
      SECOND_DEGREE: "Second degr\u00e9",
      THIRD_DEGREE: "Troisi\u00e8me degr\u00e9",
      IN_LAW: "Alliance",
      STEP_ADOPTION: "Autre (recomposition, adoption)",
    },
    engine_messages: {
      CYCLE_DETECTED_PARENT_GRANDPARENT:
        "{{parentName}} ne peut pas \u00eatre parent de {{childName}} \u2014 il/elle est d\u00e9j\u00e0 un grand-parent via une lign\u00e9e existante.",
      GENDER_CONFLICT_MARRIAGE: "Impossible de marier deux personnes du m\u00eame sexe.",
      MARRIAGE_BLOOD_LINE_CONFLICT:
        "{{wifeName}} ne peut pas \u00e9pouser {{husbName}} \u2014 il est un ascendant ou descendant direct.",
      MARRIAGE_SIBINGS_CONFLICT:
        "{{wifeName}} ne peut pas \u00e9pouser {{husbName}} \u2014 il est son fr\u00e8re.",
      MARRIAGE_UNCLES_NEPHEW_CONFLICT:
        "Mariage impossible entre oncles/tantes et neveux/ni\u00e8ces ({{sourceName}} et {{targetName}}).",
      BIOLOGICAL_PARENT_LIMIT:
        "{{targetName}} ne peut pas avoir plus de {{parentLimitText}} parents.",
      GENERAL_CYCLE: "Boucle infinie d\u00e9tect\u00e9e (conflit g\u00e9n\u00e9alogique).",
    },
    inheritance_reasons: {
      BLOCKED_BY_FATHER: "Exclu par le p\u00e8re",
      BLOCKED_HUSBAND_CHILDREN: "En raison d\u2019un descendant h\u00e9ritier de l\u2019\u00e9pouse",
      NO_CHILDREN: "Pas de descendant direct",
    },
    ui: {
      ADD_PERSON: "Ajouter une personne",
      SMART_SETTINGS: "Param\u00e8tres intelligents",
      TREE_DIRECTION: "Direction de l\u2019arbre",
    },
  },
};
