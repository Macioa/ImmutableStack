<div align="center">
  <img src="https://raw.githubusercontent.com/macioa/immutablestuff/alpha/assets/logotext.png" width="300"/><br/>
  <h4>Elixir - Phoenix - React - Redux</h4><br/>
  <img src="https://raw.githubusercontent.com/macioa/immutablestuff/alpha/assets/logo.png" width="300"/><br/>
  <img src="https://raw.githubusercontent.com/macioa/immutablestuff/alpha/assets/alpha.png" width="300"/>
</div>

## 

The Immutable Stack provides comprehensive tooling for creating applications with Elixir/Phoenix and React/Redux including:
##

- **-New Immutable Projects-**   Generate new ready-to-go Immutable projects with both live ssr and static rendering. Full integration with mix commands like:
  - mix deps.get (retreives full stack dependencies)
  - mix compile (compiles front and back end)
  - mix phx.server (In -dev-, starts vite with hot-reload and serves static files from phoenix endpoint)
##
- **-AI Code Repair-**   Add an adapter for your llm of choice or connect to an extisting adapter for command line file repair with targeted code and context selection.
##
- **-Pre-connected Channel Generation-**    Prewired Phoenix Channels for full-duplex communication. Includes socket hooks, channel hooks, components, and server code. Simply add channel state or call handlers.
##
- **-Entity Driven Code Generation-**    Code generation through control files provide 'instant gen' or highly customizable code generations. Fine tune entity attributes, appstate, and more. Toggle crud routes and apis with `cmd + /`. Add new routes and apis to generate boiler. Repair tool can be used to fill in new custom functions. 
  
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

<div style="margin-left: 10em;">
  <br/>
  <a href="https://github.com/Macioa/ImmutableStuff/blob/master/assets/sample_genfile.md"><strong><em>Example Genfile</em></strong></a>
  <br/><br/><br/>
</div>

##
- **Foundations** for **scalable**, **resusable** code and scalable **architecture**
##
- **Easy Customization** with **transparency** and Generation Logs - "Built to be forked". Generators primarily use easily-modified TS string-literals for code generation. Code generation include histories, making it easy to find which generators touched a file and in what order. Includes utility for quickly converting live-code to literal generators.
<br>

<div style="margin-left: 10em;">
  <br/>
  <a href="https://github.com/Macioa/ImmutableStuff/blob/master/assets/sample_history_file.md"><strong><em>Example Log</em></strong></a>
  <br/><br/><br/>
</div>


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
* [Quickest Start (Docker)](https://github.com/Macioa/ImmutableStuff/blob/master/quickeststart.md)
* [Quick Start (local dev)](https://github.com/Macioa/ImmutableStuff/blob/master/quickstart.md)
* [Dataflow in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/dataflow.md)
* [File Structure in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/filestructure.md)
* [Architecture in ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/architecture.md)
* [Automated File Repair](https://github.com/Macioa/ImmutableStuff/blob/master/filerepair.md)
* [Customizing the ImmutableStack](https://github.com/Macioa/ImmutableStuff/blob/master/customimmutable.md)

## Other
* [Source](https://github.com/Macioa/ImmutableStack)
* [Homebrew](https://github.com/Macioa/homebrew-immutable)