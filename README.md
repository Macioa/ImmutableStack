# `    Immutable Stack    `
### `    Pre-Alpha           `

![software composer image](https://raw.githubusercontent.com/Macioa/MinCurryPipe/main/_logo_adjusted.png)

## [`    Elixir/Phoenix    ->    Typescript/React/Redux    `] 

The Immutable Stack provides comprehensive tooling for creating applications with Elixir/Phoenix and React/Redux including:

- **-New Immutable Projects-**   Generate new ready-to-go Immutable projects with both live ssr and static rendering. Full integration with mix commands like:
  - mix deps.get (retreives full stack dependencies)
  - mix compile (compiles front and back end)
  - mix phx.server (In -dev-, starts vite with hot-reload and serves static files from phoenix endpoint)

- **-Entity Driven Code Generation-**    Code generation through control files provide 'instant gen' or highly customized code generations. Fine tune entity attributes, appstate, and more. Toggle crud routes and apis with `cmd + /`. Add new routes and apis to generate boiler. 
  
  - Customizable (Ex : Ts) type-mapping

  **(back - end)**
  - database migrations
  - "ORM" schemas
  - Reusable Programmitic API with chunked batching options
  - Entity controllers
  - Routes

  **(front - end)**
  - TS Types
  - Factories
  - State Definitions
  - Entity Request functions
  - Global State Getters/Setters (reducers/selectors)
  - Demo front-end entity components 

*Sample Genfile*
```ts
interface ImmutableGlobal
  extends GenType<{
//    * Frog * 
    example1: integer;
    example2: string;
    example3: float;
  }> {}

interface AppState
  extends GenType<{
    frog: Frog | null;
    frogs: Frog[];
  }> {}
const Immutable: ImmutableGenerator = {
  name: "frog",
  generate: {
    // BACK END
    http_controller: {
      name: "FrogController",
      routes: [
        "routed_index(conn, entity_queries, page_queries) when entity_queries == %{}",
        "routed_index(conn, entity_queries, page_queries) when entity_queries != %{}",
        "create(conn, frog_list) when is_list(frog_list)",
        "create(conn, frog_params)",
        "show(conn, frog_list) when is_list(frog_list)",
        'show(conn, %{"id" => id})',
        "update(conn, frog_list) when is_list(frog_list)",
        "update(conn, frog_params) when is_map(frog_params)",
        "delete(conn, frog_list) when is_list(frog_list)",
        'delete(conn, %{"id" => id})',
        // "custom_route(conn, %{destructured: params})"
      ],
    },
    channel_controller: "frog_channel",
    context: {
      name: "FrogContext",
      apiFunctions: [
        "create_frog(attrs) when is_list(attrs)",
        "create_frog(frog_params) when is_map(frog_params)",
        "delete_frog(frogs) when is_list(frogs)",
        "delete_frog(frog_params) when is_map(frog_params)",
        "delete_frog(id) when is_binary(id)",
        "get_frog!(frogs) when is_list(frogs)",
        "get_frog!(frog_params) when is_map(frog_params)",
        "get_frog!(id) when is_binary(id)",
        "list_frogs(page_query \ %{})",
        "list_frogs_by(entity_queries, page_queries \ %{})",
        "update_frog(frogs) when is_list(frogs)",
        "update_frog(attrs) when is_map(attrs)",
        // "custom_api_function(${key: _value}) when is_binary('guard_clause')",
      ],
    },
    schema: "Frog",
    databaseTable: "frogs",

    // FRONT END
    requests: {
      requestFunctions: [
        "requestFrog = (frogs: Frog[], dispatch: Dispatch)",
        "createFrog = (frogs: Frog[], dispatch: Dispatch)",
        "updateFrog = (frog: Frog[], dispatch: Dispatch)",
        "deleteFrog = (frog: Frog[], dispatch: Dispatch)",
        // "customRequest = (%{key: _value}, dispatch: Dispatch)",
      ],
    },
    stateSlice: {
      name: "frogSlice",
      reducers: [
        "setFrog = (state, action)",
        "setFrogs = (state, action)",
        // "customReducer = (state, {payload: {key: _value}})",
      ],
      selectors: [
        "selectFrog = (state)",
        "selectFrogs = (state)",
        // "customSelector = (%{key: _value})",
      ],
    },
    appstate: "FrogStoreState",
    tstype: "Frog",
    factory: true,
    demoComponents: true,
    test: true,
  },
};
```
** *Sample Generation* **

![sample output](https://raw.githubusercontent.com/Macioa/ImmutableStuff/master/output.gif)

- **Foundations** for **scalable**, **resusable** code and scalable **architecture**

- **Easy Customization** with **transparency** and Generation Logs - "Built to be forked". Generators primarily use easily-modified TS string-literals for code generation. Code generation include histories, making it easy to find which generators touched a file and in what order. Includes utility for quickly converting live-code to literal generators.
<br>

**Example Log**
```js
{
  "_name": "init_project_test",
  "commands": [
    {
      "command": "mix phx.new test --no-live --no-html --no-assets --binary-id --umbrella --no-install",
      "dir": ".",
      "caller": "init_phoenix_umbrella_app"
    },
    {
      "command": "npx create-vite@latest test_ui --template react-ts --no-install",
      "dir": "test_umbrella/apps",
      "caller": "init_react_app_with_vite"
    }
  ],
  "file_modifications": {
    "mix.exs": [
      "inject_app_declarations",
      "inject_deps_get_aliases_to_mix_exs"
    ],
    "apps": {
      "test_web": {
        "mix.exs": [
          "inject_web_app_libs",
          "inject_custom_compile_to_mix_exs"
        ],
        "lib": {
          "test_web": {
            "endpoint.ex": [
              "inject_web_endpoint",
              "inject_static_output_to_endpoint"
            ],
}}}}}}
```

- **MacOs Toolkit** - automated installs for common, language-agnostic dev tools, including:

  - **[asdf](https://asdf-vm.com/)** - A universal language version handler.
  - **[VSCODE](https://code.visualstudio.com/)** - A lightweight, language agnostic code editor
  - **[Docker](https://www.docker.com/)** - A virtual machine service
  - **[Postman](https://www.postman.com/)** - Deploy, save, manage, and share network requests
  - **[DBeaver](https://dbeaver.io/)** - A db-agnostic database utility

## Explainers
* [Determinism in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/determinism.md)
* [Composability in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/composability.md)

## Documentation
* [Quick Start](https://github.com/Macioa/ImmutableStuff/blob/master/quickstart.md)
* [Dataflow in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/dataflow.md)
* [File Structure in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/filestructure.md)
* [Architecture in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/architecture.md)

## Other
* [Source](https://github.com/Macioa/ImmutableStack)
* [Homebrew](https://github.com/Macioa/homebrew-immutable)