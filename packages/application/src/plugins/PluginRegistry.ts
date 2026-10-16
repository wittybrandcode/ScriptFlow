import { IScriptFlowPlugin, IExporterPlugin, IImporterPlugin, IProcessorPlugin, IPluginContext } from './extension-ports.js';

/**
 * ScriptFlow Enterprise - Plugin Registry (Milestone 11)
 * 
 * A central hub for registering and managing plugins.
 * Ensures that the core application remains closed for modification 
 * but open for extension (Open/Closed Principle).
 */
export class PluginRegistry {
    private plugins: Map<string, IScriptFlowPlugin> = new Map();
    private context: IPluginContext;

    constructor(version: string = '1.0.0') {
        this.context = {
            version,
            logger: {
                info: (msg: string) => console.log(`[PluginRegistry] INFO: ${msg}`),
                error: (msg: string, err?: any) => console.error(`[PluginRegistry] ERROR: ${msg}`, err)
            }
        };
    }

    /**
     * Registers a new plugin in the system.
     */
    public async register(plugin: IScriptFlowPlugin): Promise<void> {
        if (this.plugins.has(plugin.id)) {
            throw new Error(`Plugin with ID ${plugin.id} is already registered.`);
        }

        try {
            if (plugin.onInit) {
                await plugin.onInit(this.context);
            }
            this.plugins.set(plugin.id, plugin);
            this.context.logger.info(`Registered plugin: ${plugin.name} (${plugin.version})`);
        } catch (error: any) {
            this.context.logger.error(`Failed to initialize plugin: ${plugin.id}`, error);
        }
    }

    /**
     * Unregisters and cleans up a plugin.
     */
    public async unregister(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        try {
            if (plugin.onDestroy) {
                await plugin.onDestroy();
            }
        } catch (error: any) {
            this.context.logger.error(`Failed to cleanup plugin: ${pluginId}`, error);
        } finally {
            this.plugins.delete(pluginId);
            this.context.logger.info(`Unregistered plugin: ${plugin.name}`);
        }
    }

    /**
     * Executes a processor plugin with a timeout guard (default 5 seconds).
     */
    public async runProcessor<TData>(pluginId: string, data: TData, timeoutMs: number = 5000): Promise<TData> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin || (plugin as any).type !== 'processor') {
            throw new Error(`Processor plugin with ID ${pluginId} not found.`);
        }

        const processor = plugin as IProcessorPlugin<TData>;

        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`Plugin execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });

        try {
            return await Promise.race([
                processor.process(data),
                timeoutPromise
            ]) as TData;
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Retrieves all plugins.
     */
    public getAllPlugins(): IScriptFlowPlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Retrieves only Exporter plugins.
     */
    public getExporters(): Array<IExporterPlugin<any, any>> {
        return this.getAllPlugins().filter(
            (p): p is IExporterPlugin<any, any> => (p as any).type === 'exporter'
        );
    }

    /**
     * Retrieves only Importer plugins.
     */
    public getImporters(): Array<IImporterPlugin<any, any>> {
        return this.getAllPlugins().filter(
            (p): p is IImporterPlugin<any, any> => (p as any).type === 'importer'
        );
    }

    /**
     * Retrieves only Processor plugins (e.g. AI logic).
     */
    public getProcessors(): Array<IProcessorPlugin<any>> {
        return this.getAllPlugins().filter(
            (p): p is IProcessorPlugin<any> => (p as any).type === 'processor'
        );
    }
}

// Export a singleton instance for global use
export const globalPluginRegistry = new PluginRegistry();
