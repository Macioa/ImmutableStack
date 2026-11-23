# Test Plan: Add Elements

Runs on Windows and WSL in one fresh project, in order, so later cases prove the additions work together. Each case checks the codegen and the project (`mix compile`, `mix test`, UI type-check, UI build).

| ID | Command | Coverage |
|---|---|---|
| A1 | `add_api admin` | Default port |
| A2 | `add_api partner_api 5055` | Multi-word name, explicit port |
| U1 | `add_ui console` | Second UI |
| C1 | `gen_channel chat` | Channel across Phoenix and React |
| AU1 | `add_auth` | Auth API, auth database, React auth components |
| X1 | `gen` with `ui_path` on `console` | Entity generated into the added UI, after API and auth |
| T1 | `gentemplate` | Template created from a generated file |
| S1 | `mix phx.server` | Server boots and serves the UI and an entity API |
