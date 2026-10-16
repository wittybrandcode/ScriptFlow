import { NasabPlugin, PluginType } from './NasabPlugin';

export class PluginManager {
  private static plugins: Map<string, NasabPlugin> = new Map();

  /**
   * Registers a new plugin with the system.
   *
   * @param plugin - The plugin instance to register.
   */
  public static register(plugin: NasabPlugin): void {
    const id = plugin.metadata.id;
    if (this.plugins.has(id)) {
      console.warn(`[Nasab] Plugin with ID "${id}" is already registered. Overwriting.`);
    }
    
    if (typeof plugin.install === 'function') {
      plugin.install();
    }
    
    this.plugins.set(id, plugin);
  }

  /**
   * Retrieves a plugin by its unique identifier.
   */
  public static get(id: string): NasabPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Returns all registered plugins.
   */
  public static getAll(): NasabPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Returns all plugins of a specific operational type.
   */
  public static getByType(type: PluginType): NasabPlugin[] {
    return this.getAll().filter(p => p.type === type);
  }

  /**
   * Unregisters a plugin and invokes its teardown hook.
   */
  public static unregister(id: string): void {
    const plugin = this.plugins.get(id);
    if (plugin) {
      if (typeof plugin.uninstall === 'function') {
        plugin.uninstall();
      }
      this.plugins.delete(id);
    }
  }

  /**
   * Triggers a specific lifecycle hook on all registered plugins, respecting their priority order.
   */
  public static triggerHook(hookName: keyof NasabPlugin, ...args: any[]): void {
    const sortedPlugins = this.getAll();
    for (const plugin of sortedPlugins) {
      if (typeof plugin[hookName] === 'function') {
        (plugin[hookName] as Function)(...args);
      }
    }
  }
}

