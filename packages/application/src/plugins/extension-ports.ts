/**
 * ScriptFlow Enterprise - Extension Ports (Milestone 11)
 * 
 * This file defines the stable interfaces (Ports) for external plugins.
 * By standardizing these interfaces, we allow future developers to build
 * Importers, Exporters, and Processors without modifying the core system.
 */

export interface IPluginContext {
    version: string;
    logger: {
        info: (msg: string) => void;
        error: (msg: string, err?: any) => void;
    };
    // Expose limited, safe access to the repository layer if needed
    // or strictly require plugins to take data as arguments.
}

export interface IScriptFlowPlugin {
    id: string;
    name: string;
    version: string;
    description: string;
    
    /** Lifecycle hook when plugin is loaded */
    onInit?: (context: IPluginContext) => Promise<void>;
    
    /** Lifecycle hook when plugin is unloaded */
    onDestroy?: () => Promise<void>;
}

export interface IExporterPlugin<TData, TOptions> extends IScriptFlowPlugin {
    type: 'exporter';
    supportedFormats: string[];
    
    /** Core export function */
    export(data: TData, options?: TOptions): Promise<ArrayBuffer | string>;
}

export interface IImporterPlugin<TRaw, TResult> extends IScriptFlowPlugin {
    type: 'importer';
    supportedFormats: string[];
    
    /** Core import function */
    import(raw: TRaw): Promise<TResult>;
}

export interface IProcessorPlugin<TData> extends IScriptFlowPlugin {
    type: 'processor';
    
    /** AI or custom business logic processor */
    process(data: TData): Promise<TData>;
}
