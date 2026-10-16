import { PluginManager as _PM } from './core/PluginManager';

// Export everything first
export { PluginManager } from './core/PluginManager';
export type { NasabPlugin, PluginMetadata } from './core/NasabPlugin';
export { PluginType } from './core/NasabPlugin';

export type { MadhabPlugin } from './madhabs/MadhabPlugin';
export { ShafiiPlugin } from './madhabs/ShafiiPlugin';
export { HanafiPlugin } from './madhabs/HanafiPlugin';
export { MalikiPlugin } from './madhabs/MalikiPlugin';
export { HanbaliPlugin } from './madhabs/HanbaliPlugin';
export { JafariPlugin } from './madhabs/JafariPlugin';

export { GedcomEngine } from './importers/GedcomEngine';
export { JsonLDEngine } from './exporters/JsonLDEngine';
export { RPGLineageEngine } from './rpg/RPGLineageEngine';
export type { RPGTrait, RPGCharacterData, SuccessionLaw } from './rpg/types';

export * from './medical';
export * from './animal';
export * from './importers/GedcomEngine';
export * from './importers/JsonLDEngine';

// Then Auto-register core plugins here so they are always available when plugins are loaded
import { ShafiiPlugin as _SP } from './madhabs/ShafiiPlugin';
import { HanafiPlugin as _HP } from './madhabs/HanafiPlugin';
import { MalikiPlugin as _MP } from './madhabs/MalikiPlugin';
import { HanbaliPlugin as _HBP } from './madhabs/HanbaliPlugin';
import { EvidencePlugin as _EP } from './evidence/EvidencePlugin';

_PM.register(new _SP());
_PM.register(new _HP());
_PM.register(new _MP());
_PM.register(new _HBP());
_PM.register(new _EP());

