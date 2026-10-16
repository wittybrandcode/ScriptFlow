export enum PluginType {
  MADHAB = 'MADHAB',
  IMPORTER = 'IMPORTER',
  EXPORTER = 'EXPORTER',
  HOOK = 'HOOK'
}

export interface PluginMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author?: string;
  readonly description?: string;
}

export interface NasabPlugin {
  /** High-level metadata about the plugin. */
  readonly metadata: PluginMetadata;
  
  /** The operational classification of this plugin. */
  readonly type: PluginType;

  /** Execution priority for conflict resolution. Higher values execute first. Default is 0. */
  readonly priority?: number;

  /** Lifecycle hook invoked when the plugin is registered with the system. */
  install?(): void;

  /** Lifecycle hook invoked when the plugin is removed or the system shuts down. */
  uninstall?(): void;

  /** Granular Hooks */
  onBeforeGraphTraverse?(context: any): void;
  onNodeDiscovered?(node: any, context: any): void;
  onNodeExcluded?(node: any, reason: string, context: any): void;
  onShareCalculated?(node: any, share: any, context: any): void;
  onAfterInheritanceCalculation?(context: any): void;
}
