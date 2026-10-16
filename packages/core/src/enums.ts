export enum SceneStatus {
  DRAFT       = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW      = 'REVIEW',
  COMPLETED   = 'COMPLETED'
}

export enum TimeOfDay {
  DAY        = 'DAY',
  NIGHT      = 'NIGHT',
  DAWN       = 'DAWN',
  MORNING    = 'MORNING',
  AFTERNOON  = 'AFTERNOON',
  DUSK       = 'DUSK',
  EVENING    = 'EVENING',
  LATE_NIGHT = 'LATE_NIGHT'
}

export enum LocationType {
  INTERIOR = 'INT',
  EXTERIOR = 'EXT',
  MIXED    = 'INT/EXT'
}

export enum CrewCategory {
  ACTOR           = 'ACTOR',
  DIRECTOR        = 'DIRECTOR',
  PRODUCER        = 'PRODUCER',
  WRITER          = 'WRITER',
  CAMERA          = 'CAMERA',
  SOUND           = 'SOUND',
  LIGHTING        = 'LIGHTING',
  ART_DEPARTMENT  = 'ART_DEPARTMENT',
  MAKEUP_HAIR     = 'MAKEUP_HAIR',
  WARDROBE        = 'WARDROBE',
  POST_PRODUCTION = 'POST_PRODUCTION',
  TECHNICAL       = 'TECHNICAL'
}

export enum ContractStatus {
  PENDING     = 'PENDING',
  NEGOTIATION = 'NEGOTIATION',
  SIGNED      = 'SIGNED',
  TERMINATED  = 'TERMINATED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID    = 'PAID'
}

export enum EmploymentType {
  FREELANCE   = 'FREELANCE',
  CONTRACTED  = 'CONTRACTED',
  VOLUNTEER   = 'VOLUNTEER'
}

export enum PermitStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING      = 'PENDING',
  APPROVED     = 'APPROVED',
  REJECTED     = 'REJECTED'
}

export enum LocationStatus {
  SUGGESTED  = 'SUGGESTED',
  AVAILABLE  = 'AVAILABLE',
  BOOKED     = 'BOOKED',
  UNAVAILABLE = 'UNAVAILABLE'
}

export enum RevisionColor {
  WHITE  = 'WHITE',
  BLUE   = 'BLUE',
  PINK   = 'PINK',
  YELLOW = 'YELLOW',
  GREEN  = 'GREEN',
  GOLDENROD = 'GOLDENROD',
  BUFF   = 'BUFF',
  SALMON = 'SALMON',
  CHERRY = 'CHERRY'
}

export enum ScriptBlockType {
  DIALOGUE      = 'DIALOGUE',
  ACTION        = 'ACTION',
  SCENE_HEADING = 'SCENE_HEADING',
  CHARACTER     = 'CHARACTER',
  PARENTHETICAL = 'PARENTHETICAL',
  TRANSITION    = 'TRANSITION',
  SHOT          = 'SHOT',
  TEXT          = 'TEXT'
}

export enum RelationshipCategory {
  BIOLOGICAL = 'BIOLOGICAL',
  DRAMATIC   = 'DRAMATIC'
}

export enum Gender {
  MALE   = 'MALE',
  FEMALE = 'FEMALE'
}

export enum CastingStatus {
  SEARCHING  = 'SEARCHING',
  AUDITIONED = 'AUDITIONED',
  CASTED     = 'CASTED',
  CONFIRMED  = 'CONFIRMED'
}

export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  SAR = 'SAR',
  AED = 'AED',
  EGP = 'EGP',
  DZD = 'DZD'
}

export enum DayType {
  SHOOT = 'SHOOT',
  REHEARSAL = 'REHEARSAL',
  TRAVEL = 'TRAVEL',
  REST = 'REST',
  REVIEW = 'REVIEW',
  SETUP = 'SETUP'
}

export enum ProductionPhase {
  PRE_PRODUCTION = 'PRE_PRODUCTION',
  PRODUCTION = 'PRODUCTION',
  POST_PRODUCTION = 'POST_PRODUCTION'
}
