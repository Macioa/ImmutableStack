# Generation Test Summary

## Test plans

- [Genfile and gen](plan_genfile.md)
- [Add elements](plan_add_elements.md)

## Results

Each test ran on Windows (mise, Git Bash) and WSL (Ubuntu 24.04, asdf). Results were identical on both. Where applicable, a pass covers codegen, `mix compile`, `mix test`, and the UI type-check and Vite build.

| Test | Windows | WSL | What was changed | Further review |
| --- | --- | --- | --- | --- |
| GF1 create genfile | Pass | Pass | | |
| GF2 re-run genfile | Pass | Pass | Fixed re-run crash, malformed interfaces, and `Schema` not receiving Global fields | |
| G1 default entity | Pass | Pass | Fixed Windows `cd null` in schema generation | |
| G2 all field types | **Fail** (`mix test`) | **Fail** (`mix test`) | | Issue 1 |
| G3 layered types | **Fail** (`mix test`) | **Fail** (`mix test`) | | Issue 1 |
| G4 backend only | Pass | Pass | Guarded frontend steps that crashed or left broken imports | |
| G5 frontend only | Pass | Pass | | |
| G6 custom functions | Pass | Pass | Fixed custom reducer syntax and unused `action` error | |
| G7 subset, no factory | Pass | Pass | Removed unused `Lorem` import when factory is off | |
| A1 add_api | Pass | Pass | APIs now get a free dev port, including numbered APIs whose usual port is taken | Issue 3 |
| A2 add_api with port | Pass | Pass | | |
| U1 add_ui | Pass | Pass | | Issue 5 |
| C1 gen_channel | **Fail** (`mix test`) | **Fail** (`mix test`) | Added missing `ChannelCase`; fixed test compile errors | Issue 2 |
| AU1 add_auth | Pass* | Pass* | Replaced `bcrypt_elixir` with `pbkdf2_elixir` (210,000 rounds outside tests) | Issue 6 |
| X1 gen into second UI | Pass* | Pass* | | |
| T1 gentemplate | Pass | Pass | | |
| S1 server boot, UI and API | Pass | Pass | | |

\* The harness removes C1's failing channel tests after recording C1, so these rows test their own feature. A real project with a channel still has the Issue 2 failures.

### Auth and port retest

After the hasher and port changes, a focused retest passed on both platforms with no Visual Studio tools on the path. It covered four API variants with unique ports, `add_auth`, compile, `gen` after auth, password hash and verify, `mix test`, and a server boot with all five endpoints responding. The full suite was not rerun after these changes.

## Additional issues not addressed (critical-only mandate)

1. **Generated context tests hardcode `example1/2/3`.** Entities with other fields fail `mix test` (14 of 30 tests in G2 and G3). See `generators/gen_phoenix/gen_phx_context/test/`.
2. **Generated channel tests do not match the generated channel.** C1 has 5 of 29 tests failing, with 11 cluster tests excluded. `ping` and `shout` have no handler, and some assertions use string keys where the channel broadcasts atom keys.
3. **Production API ports can still collide.** `add_api_docker_prod.ts` keeps the old port logic that was fixed for dev.
4. **The CLI can exit 0 on failure.** `main().catch(console.error)` logs the error without setting a failing exit code, so scripts can miss it.
5. **A second UI shares Vite's default port.** It moves to another port when 5173 is in use.
6. **Existing auth projects keep bcrypt.** Bcrypt and PBKDF2 hashes are not interchangeable, so moving an existing project needs a rehash-on-login path. See [issue #17](https://github.com/Macioa/ImmutableStack/issues/17).
7. **Regenerating an existing entity was not tested.**
