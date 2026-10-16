import {
  SceneStatus, TimeOfDay, LocationType, CrewCategory, ContractStatus,
  PaymentStatus, EmploymentType, PermitStatus, LocationStatus, RevisionColor,
  ScriptBlockType, Gender, CastingStatus, CurrencyCode, DayType, ProductionPhase
} from './enums.js';

export type ProjectID    = `prj_${string}`;
export type EpisodeID    = `epi_${string}`;
export type CharacterID  = `chr_${string}`;
export type LocationID   = `loc_${string}`;
export type CrewID       = `crw_${string}`;
export type SceneID      = `scn_${string}`;
export type ShootDayID   = `shd_${string}`;
export type ToneID       = `ton_${string}`;
export type BlockID      = `blk_${string}`;
export type RelationID   = `rel_${string}`;
export type AssignmentID = `asn_${string}`;
export type TaskID       = `tsk_${string}`;
export type LocImageID   = `lim_${string}`;
export type LocDocID     = `ldc_${string}`;
export type ReminderID   = `rem_${string}`;

export interface IScenario {
  id: ProjectID;
  title: string;
  description: string;
  cover_image: string;
  cover_video: string;
  status: SceneStatus;
  genre: string;
  notes: string;
  include_master_cover?: number;
  include_episode_covers?: number;
  include_scene_covers?: number;
  created_at: string;
  deleted_at: string | null;
}

export interface IEpisode {
  id: EpisodeID;
  scenario_id: ProjectID;
  episode_number: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export interface ICharacter {
  id: CharacterID;
  scenario_id: ProjectID;
  actor_id: CrewID | null;
  name: string;
  full_name: string;
  description: string;
  color: string;
  age: string;
  role: string;
  gender: Gender;
  status: CastingStatus;
  backstory: string;
  psychology: string;
  physical_traits: string;
  arc: string;
  relationships: string;
  reference_images: string;
  actor_name: string;
  actor_photo: string;
  phone: string;
  email: string;
  actor_bio: string;
  father_id: CharacterID | null;
  mother_id: CharacterID | null;
  dramatic_pos_x: number;
  dramatic_pos_y: number;
  birth_date: string | null;
  death_date: string | null;
  is_deceased?: number | boolean;
  metadata?: string;
  deleted_at: string | null;
}

export interface IScene {
  id: SceneID;
  scenario_id: ProjectID;
  episode_id: EpisodeID | null;
  location_id: LocationID | null;
  shoot_day_id: ShootDayID | null;
  scene_number: number;
  title: string;
  description: string;
  location_type: LocationType;
  location_name: string;
  time_of_day: TimeOfDay;
  exact_time: string;
  weather: string;
  status: SceneStatus;
  revision_color: RevisionColor;
  continuity: string;
  time_shift: string;
  director_notes: string;
  extras_note: string;
  present_characters: string;
  planned_shoot_date: string;
  estimated_duration: number;
  page_eighths?: number;
  page_count?: number;
  shoot_order: number;
  source_scene_id: SceneID | null;
  clone_type: string | null;
  version: number;
  created_at: string;
  deleted_at: string | null;
}

export interface ILocation {
  id: LocationID;
  scenario_id: ProjectID;
  parent_location_id: LocationID | null;
  name: string;
  location_type: LocationType;
  address: string;
  description: string;
  image_url: string;
  status: LocationStatus;
  map_url: string;
  latitude: number | null;
  longitude: number | null;
  contact_name: string;
  contact_phone: string;
  permit_status: PermitStatus;
  cost_per_day: number;
  cost_currency: CurrencyCode;
  technical_notes: string;
  created_at: string;
  deleted_at: string | null;
}

export interface ICrewMember {
  id: CrewID;
  scenario_id: ProjectID;
  name: string;
  role: string;
  category: CrewCategory;
  image_url: string;
  phone: string;
  email: string;
  contract_status: ContractStatus;
  payment_status: PaymentStatus;
  wage: number;
  currency: CurrencyCode;
  employment_type: EmploymentType;
  job_title: string;
  notes: string;
  created_at: string;
  deleted_at: string | null;
}

export interface IShootDay {
  id: ShootDayID;
  scenario_id: ProjectID;
  title: string;
  shoot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
  day_type: DayType;
  primary_location_id: LocationID | null;
  weather_forecast: string;
  call_time: string;
  wrap_time: string;
  estimated_cost: number;
  production_phase: ProductionPhase;
  week_number: number;
  created_at: string;
}

export interface IScriptBlock {
  id: BlockID;
  scene_id: SceneID;
  character_id: CharacterID | null;
  type: ScriptBlockType;
  content: string;
  metadata: string;
  sort_order: number;
}

export interface IPageNumbering {
  id: string;
  scenario_id: ProjectID;
  item_id: string;
  item_type: 'MASTER_COVER' | 'EPISODE_COVER' | 'SCENE_COVER' | 'SCENE';
  page_count: number;
  start_page: number;
  sort_order: number;
}
