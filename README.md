# `    Immutable Stack    `

![software composer image](https://raw.githubusercontent.com/Macioa/MinCurryPipe/main/_logo_adjusted.png)

## [`    Elixir/Phoenix    ->    Typescript/React/Redux    `] 

The Immutable Stack provides comprehensive tooling for creating applications with Elixir/Phoenix and React/Redux including:

- **-New Immutable Projects-**   Generate new ready-to-go Immutable projects with both live ssr and static rendering. Full integration with mix commands like:
  - mix deps.get (retreives full stack dependencies)
  - mix compile (compiles front and back end)
  - mix phx.server (In -dev-, starts vite with hot-reload and serves static files from phoenix endpoint)

- **-Entity Driven Code Generation-**    Code generation through control files provide 'instant gen' or highly customized code generations. Fine tune entity attributes, appstate, and more. Toggle crud routes and apis with `cmd + /`. Add new routes and apis to generate boiler and vibe. 
  
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

- **Foundations** for **scalable**, **resusable** code and scalable **architecture**

- **Easy Customization** with **transparency** and Generation Logs - "Built to be forked". Generators primarily use easily-modified TS string-literals for code generation. Code generation include histories, making it easy to find which generators touched a file and in what order. Includes utility for quickly converting live-code to literal generators.

- **MacOs Toolkit** - automated installs for common, language-agnostic dev tools, including:

  - **[asdf](https://asdf-vm.com/)** - A universal language version handler.
  - **[VSCODE](https://code.visualstudio.com/)** - A lightweight, language agnostic code editor
  - **[Docker](https://www.docker.com/)** - A virtual machine service
  - **[Postman](https://www.postman.com/)** - Deploy, save, manage, and share network requests
  - **[DBeaver](https://dbeaver.io/)** - A db-agnostic database utility

## Explainers
* [Determinism in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/determinism.md)
* [Composability in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/composabilty.md)

## Documentation
* [Quick Start](https://github.com/Macioa/ImmutableStuff/blob/master/quickstart.md)
* [Dataflow in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/dataflow.md)
* [File Structure in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/filestructure.md)
* [Architecture in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/architecture.md)

## Other
* [Source](https://github.com/Macioa/ImmutableStack)
* [Homebrew](https://github.com/Macioa/homebrew-immutable)