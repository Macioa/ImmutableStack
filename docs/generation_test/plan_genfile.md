# Test Plan: Genfile and Gen

Runs on Windows and WSL in one fresh project. Each case checks the codegen (command succeeds, expected files exist) and the project (`mix compile`, `mix test`, UI type-check, UI build).

| ID | Entity | Genfile coverage |
|---|---|---|
| GF1 | `sample` | `genfile` creates a new file |
| GF2 | `sample` | Second `genfile` run propagates Global types into empty Schema, DatabaseTable and TsType |
| G1 | `product` | Default genfile, all generators on |
| G2 | `invoice` | All primitive types in Global |
| G3 | `customer` | Different Schema, DatabaseTable and TsType definitions |
| G4 | `warehouse` | Backend only |
| G5 | `notice` | Frontend only |
| G6 | `order_item` | Multi-word name plus custom route, API function, request, reducer and selector |
| G7 | `category` | Irregular plural, CRUD subset, with test, factory and demo components off |

Not covered: every toggle permutation, and regenerating an entity that already exists.
