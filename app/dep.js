/**
 * Dependency Graph + Cassette Builder
 *
 * Builds a dependency graph of modules and generates cassettes to trace dependency paths.
 *
 * Usage (example):
 *   import { buildDependencyGraphAndCassettes } from './dep.js';
 *   const { cassetteIds } = buildDependencyGraphAndCassettes({
 *     graph: getActiveGraph(),
 *     cassettePlayer: graphManager.getActiveGraph().cassettePlayer
 *   });
 */

const MODULE_DEPENDENCIES = {
  'app/src/index.js': [
    'app/src/core/graph.js',
    'app/src/core/event/bus.js',
    'app/src/core/entity.js',
    'app/src/core/relation.js',
    'app/src/core/schema.js',
    'app/src/core/versioning.js',
    'app/src/core/query-engine.js',
    'app/src/core/diff-engine.js',
    'app/src/core/undo-redo.js',
    'app/src/services/annotation-service.js',
    'app/src/services/cassette-player.js',
    'app/src/services/highlight-controller.js',
    'app/src/adapters/storage/storage-manager.js',
    'app/src/adapters/data/data-adapter-manager.js',
    'app/src/services/sync-manager.js',
    'app/src/core/event-replay.js',
    'app/src/core/error-handler.js',
    'app/src/core/event-audit.js',
    'app/src/ui/bridge.js'
  ],
  'app/src/adapters/storage/indexed-db-adapter.js': [
    'app/src/utils/event-emitter.js'
  ],
  'app/src/adapters/storage/local-storage-adapter.js': [
    'app/src/utils/event-emitter.js'
  ],
  'app/src/adapters/storage/storage-manager.js': [
    'app/src/utils/event-emitter.js'
  ],
  'app/src/adapters/storage/rest-adapter.js': [
    'app/src/utils/event-emitter.js'
  ],
  'app/src/adapters/data/github-adapter.js': [],
  'app/src/adapters/data/data-adapter-manager.js': [
    'app/src/utils/event-emitter.js'
  ],
  'app/src/ui/bridge.js': [],
  'app/src/ui/renderers/d3-renderer.js': [
    'app/src/ui/renderers/base-renderer.js'
  ],
  'app/src/ui/renderers/base-renderer.js': [],
  'app/src/ui/renderers/tree-renderer.js': [
    'app/src/ui/renderers/base-renderer.js'
  ],
  'app/src/ui/renderers/json-renderer.js': [
    'app/src/ui/renderers/base-renderer.js'
  ],
  'app/src/core/graph.js': [
    'app/src/core/entity.js',
    'app/src/core/relation.js'
  ],
  'app/src/core/error-handler.js': [
    'app/src/core/event/bus.js'
  ],
  'app/src/core/diff-engine.js': [],
  'app/src/core/undo-redo.js': [],
  'app/src/core/entity.js': [],
  'app/src/core/relation.js': [],
  'app/src/core/schema.js': [
    'app/src/core/entity.js',
    'app/src/core/relation.js'
  ],
  'app/src/core/query-engine.js': [],
  'app/src/core/versioning.js': [
    'app/src/core/entity.js',
    'app/src/core/relation.js'
  ],
  'app/src/core/event-audit.js': [
    'app/src/core/event/bus.js'
  ],
  'app/src/core/event-replay.js': [
    'app/src/core/event/bus.js',
    'app/src/core/graph.js'
  ],
  'app/src/core/event/bus.js': [],
  'app/src/services/annotation-service.js': [],
  'app/src/services/highlight-controller.js': [],
  'app/src/services/cassette-player.js': [],
  'app/src/services/sync-manager.js': [],
  'app/src/utils/event-emitter.js': [],
  'app/src/utils/performance.js': []
};

function encodeId(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getModuleEntityId(modulePath) {
  return `module:${encodeId(modulePath)}`;
}

function getRelationId(fromPath, toPath) {
  return `dep:${encodeId(fromPath)}__${encodeId(toPath)}`;
}

function ensureModuleEntity(graph, modulePath) {
  const id = getModuleEntityId(modulePath);
  if (graph.getEntity(id)) return id;
  graph.addEntity({
    id,
    type: 'module',
    metadata: {
      title: modulePath,
      path: modulePath
    }
  });
  return id;
}

function ensureDependencyRelation(graph, fromPath, toPath) {
  const relationId = getRelationId(fromPath, toPath);
  if (graph.getRelation(relationId)) return relationId;
  graph.addRelation({
    id: relationId,
    type: 'depends_on',
    from: getModuleEntityId(fromPath),
    to: getModuleEntityId(toPath),
    metadata: {
      from: fromPath,
      to: toPath
    }
  });
  return relationId;
}

function buildDependencyGraph(graph, dependencies = MODULE_DEPENDENCIES) {
  Object.keys(dependencies).forEach((modulePath) => {
    ensureModuleEntity(graph, modulePath);
  });

  Object.entries(dependencies).forEach(([modulePath, deps]) => {
    deps.forEach((depPath) => {
      ensureModuleEntity(graph, depPath);
      ensureDependencyRelation(graph, modulePath, depPath);
    });
  });
}

function buildTraceFrames(rootPath, dependencies, visited = new Set(), frames = []) {
  if (visited.has(rootPath)) return frames;
  visited.add(rootPath);

  frames.push({
    targetId: getModuleEntityId(rootPath),
    action: 'focus',
    duration: 800,
    metadata: { label: rootPath }
  });

  const deps = dependencies[rootPath] || [];
  deps.forEach((depPath) => {
    frames.push({
      targetId: getRelationId(rootPath, depPath),
      action: 'highlight',
      duration: 500,
      metadata: { label: `${rootPath} → ${depPath}` }
    });

    frames.push({
      targetId: getModuleEntityId(depPath),
      action: 'focus',
      duration: 700,
      metadata: { label: depPath }
    });

    buildTraceFrames(depPath, dependencies, visited, frames);
  });

  return frames;
}

function buildDependencyCassettes(cassettePlayer, dependencies = MODULE_DEPENDENCIES) {
  const cassetteIds = [];

  Object.keys(dependencies).forEach((modulePath) => {
    const frames = buildTraceFrames(modulePath, dependencies, new Set(), []);
    const cassetteId = `cassette-deps-${encodeId(modulePath)}`;

    const cassette = {
      id: cassetteId,
      name: `Dependency Trace: ${modulePath}`,
      description: `Dependency path walkthrough for ${modulePath}`,
      frames,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: '1.0.0'
    };

    cassettePlayer.play(cassette.id, cassette);
    cassettePlayer.stop();
    cassetteIds.push(cassetteId);
  });

  return cassetteIds;
}

export function buildDependencyGraphAndCassettes({ graph, cassettePlayer, dependencies } = {}) {
  if (!graph) {
    throw new Error('graph is required');
  }

  buildDependencyGraph(graph, dependencies || MODULE_DEPENDENCIES);

  if (cassettePlayer) {
    const cassetteIds = buildDependencyCassettes(cassettePlayer, dependencies || MODULE_DEPENDENCIES);
    return { cassetteIds };
  }

  return { cassetteIds: [] };
}

export { MODULE_DEPENDENCIES };
