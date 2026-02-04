```
> import os, re, json
> root='/workspaces/deat/app/src'
> import_map={}
> pattern=re.compile(r"^\s*import\s+(?:[^'\"]+\s+from\s+)?['\"]([^'\"]+)['\"];?")
> for dirpath, _, filenames in os.walk(root):
>     for fn in filenames:
>         if fn.endswith('.js'):
>             path=os.path.join(dirpath, fn)
>             rel=os.path.relpath(path, root)
>             deps=[]
>             with open(path, 'r', encoding='utf-8') as f:
>                 for line in f:
>                     m=pattern.match(line)
>                     if m:
>                         deps.append(m.group(1))
>             import_map[rel]=deps
> print(json.dumps(import_map, indent=2))
```



```
{
  "index.js": [
    "./core/graph.js",
    "./core/event/bus.js",
    "./core/entity.js",
    "./core/relation.js",
    "./core/schema.js",
    "./core/versioning.js",
    "./core/query-engine.js",
    "./core/diff-engine.js",
    "./core/undo-redo.js",
    "./services/annotation-service.js",
    "./services/cassette-player.js",
    "./services/highlight-controller.js",
    "./adapters/storage/storage-manager.js",
    "./adapters/data/data-adapter-manager.js",
    "./services/sync-manager.js",
    "./core/event-replay.js",
    "./core/error-handler.js",
    "./core/event-audit.js",
    "./ui/bridge.js"
  ],
  "adapters/storage/indexed-db-adapter.js": [
    "../../utils/event-emitter.js"
  ],
  "adapters/storage/local-storage-adapter.js": [
    "../../utils/event-emitter.js"
  ],
  "adapters/storage/storage-manager.js": [
    "../../utils/event-emitter.js"
  ],
  "adapters/storage/rest-adapter.js": [
    "../../utils/event-emitter.js"
  ],
  "adapters/data/github-adapter.js": [],
  "adapters/data/data-adapter-manager.js": [
    "../../utils/event-emitter.js"
  ],
  "ui/bridge.js": [],
  "ui/renderers/d3-renderer.js": [
    "./base-renderer.js"
  ],
  "ui/renderers/base-renderer.js": [],
  "ui/renderers/tree-renderer.js": [
    "./base-renderer.js"
  ],
  "ui/renderers/json-renderer.js": [
    "./base-renderer.js"
  ],
  "core/graph.js": [
    "./entity.js",
    "./relation.js"
  ],
  "core/error-handler.js": [
    "./event/bus.js"
  ],
  "core/diff-engine.js": [],
  "core/undo-redo.js": [],
  "core/entity.js": [],
  "core/relation.js": [],
  "core/schema.js": [
    "./entity.js",
    "./relation.js"
  ],
  "core/query-engine.js": [],
  "core/versioning.js": [
    "./entity.js",
    "./relation.js"
  ],
  "core/event-audit.js": [
    "./event/bus.js"
  ],
  "core/event-replay.js": [
    "./event/bus.js",
    "./graph.js"
  ],
  "core/event/bus.js": [],
  "services/annotation-service.js": [],
  "services/highlight-controller.js": [],
  "services/cassette-player.js": [],
  "services/sync-manager.js": [],
  "utils/event-emitter.js": [],
  "utils/performance.js": []
}
```