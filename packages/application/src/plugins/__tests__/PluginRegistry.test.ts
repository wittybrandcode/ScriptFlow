import { describe, it, expect, vi } from 'vitest';
import { PluginRegistry } from '../PluginRegistry';
import { IScriptFlowPlugin, IProcessorPlugin } from '../extension-ports';

describe('PluginRegistry Service', () => {
  it('should register a valid plugin successfully', async () => {
    const registry = new PluginRegistry();
    const mockPlugin: IScriptFlowPlugin = {
      id: 'plugin-1',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A mock test plugin',
      onInit: vi.fn().mockResolvedValue(undefined)
    };

    await registry.register(mockPlugin);
    expect(registry.getAllPlugins().length).toBe(1);
    expect(mockPlugin.onInit).toHaveBeenCalled();
  });

  it('should continue registering other plugins if one throws onInit', async () => {
    const registry = new PluginRegistry();
    const badPlugin: IScriptFlowPlugin = {
      id: 'bad-plugin',
      name: 'Crashing Plugin',
      version: '1.0.0',
      description: 'Throws in onInit',
      onInit: async () => {
        throw new Error('Crash onInit');
      }
    };

    const goodPlugin: IScriptFlowPlugin = {
      id: 'good-plugin',
      name: 'Safe Plugin',
      version: '1.0.0',
      description: 'Works fine',
      onInit: vi.fn().mockResolvedValue(undefined)
    };

    // Should not throw and crash the loading loop
    await expect(registry.register(badPlugin)).resolves.not.toThrow();
    await registry.register(goodPlugin);

    // Good plugin should be registered, bad plugin not added
    const activePlugins = registry.getAllPlugins();
    expect(activePlugins.find(p => p.id === 'good-plugin')).toBeDefined();
    expect(activePlugins.find(p => p.id === 'bad-plugin')).toBeUndefined();
  });

  it('should run onDestroy when unregistering a plugin', async () => {
    const registry = new PluginRegistry();
    const destroySpy = vi.fn().mockResolvedValue(undefined);
    const plugin: IScriptFlowPlugin = {
      id: 'temp-plugin',
      name: 'Temporary Plugin',
      version: '1.0.0',
      description: 'Destroy test',
      onDestroy: destroySpy
    };

    await registry.register(plugin);
    await registry.unregister('temp-plugin');

    expect(destroySpy).toHaveBeenCalled();
    expect(registry.getAllPlugins().length).toBe(0);
  });

  it('should execute processor plugin successfully within timeout', async () => {
    const registry = new PluginRegistry();
    const processor: IProcessorPlugin<string> & { type: 'processor' } = {
      id: 'proc-1',
      name: 'String Upper Case',
      version: '1.0.0',
      description: 'Processor',
      type: 'processor',
      process: async (data: string) => {
        return data.toUpperCase();
      }
    };

    await registry.register(processor);
    const result = await registry.runProcessor('proc-1', 'hello', 1000);
    expect(result).toBe('HELLO');
  });

  it('should throw an error if processor plugin execution times out', async () => {
    const registry = new PluginRegistry();
    const slowProcessor: IProcessorPlugin<string> & { type: 'processor' } = {
      id: 'proc-slow',
      name: 'Slow Processor',
      version: '1.0.0',
      description: 'Processor',
      type: 'processor',
      process: async (data: string) => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve(data), 200);
        });
      }
    };

    await registry.register(slowProcessor);
    // Run with 50ms timeout (should fail)
    await expect(registry.runProcessor('proc-slow', 'hello', 50)).rejects.toThrow(
      'Plugin execution timed out after 50ms'
    );
  });
});
