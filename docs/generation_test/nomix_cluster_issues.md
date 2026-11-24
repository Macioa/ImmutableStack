# Nomix Cluster Test Issues

Tested on Windows with a generated project running as three Docker nodes. Issue 3 and the `add_auth` dependency fix are uncommitted on top of `0efb7c7`.

## Latest retest

A fresh project ran init, genfile, gen, gen_channel and add_auth with a trap on host `mix`, which recorded zero calls after the fixes. Three nodes formed a cluster, and the API matrix passed 47 of 47 checks before and after restarting node 3. CRUD, live channels, login, cross-node sessions and logout also passed in the browser on all three nodes, with no shim or auth proxy.

## Issues

| # | Status | Severity | Issue | Evidence or impact | Location |
| --- | --- | --- | --- | --- | --- |
| 1 | **Fixed** | Blocker | libcluster is never added | Phoenix's default `DNSCluster` line made the injector think clustering already existed | [inject_cluster_to_application.ts](../../injectors/init_phoenix/inject_cluster_to_application.ts) |
| 2 | **Fixed** | Blocker | No Docker cluster setup | Init now generates a three-node compose file with configurable hosts and published auth ports | [gen_dockercompose_cluster.ts](../../generators/init_docker/gen_dockercompose_cluster.ts) |
| 3 | **Fixed** | Blocker | `gen` bypasses nomix for formatting | Nomix now formats each Elixir file in Docker. A fresh project ran every generator with zero host `mix` calls | [format.ts](../../utils/format.ts) |
| 4 | **Fixed** | Blocker | Auth migrations share one timestamp | Each auth migration now gets a unique, ordered version | [add_auth_migration.ts](../../generators/add_auth/add_auth_migration.ts) |
| 5 | **Fixed** | Blocker | `add_auth` leaves a new dependency unfetched | `add_auth` now fetches dependencies through nomix | [add_auth_mix_dependency.ts](../../injectors/add_auth/add_auth_mix_dependency.ts) |
| 6 | **Fixed** | Blocker | Auth endpoint missing from `docker.exs` | `add_auth` now writes the Docker endpoint config | [add_auth_docker_config.ts](../../injectors/add_auth/add_auth_docker_config.ts) |
| 7 | **Fixed** | High | Browser login blocked by CORS | Local origins are listed explicitly. Browser login, sessions and logout pass on all nodes without a proxy | [cors.ts](../../utils/cors.ts) |
| 8 | **Fixed** | High | Login returns a token the API rejects | Bearer tokens now pass on all three nodes | Generated `user_auth.ex` |
| 9 | **Fixed** | High | Generated channel demo crashes its channel | The demo now sends, listens for and cleans up `message` | [gen_demo_component.ts](../../generators/gen_channel/gen_demo_component.ts) |
| 10 | **Fixed for cluster**, open for dev | High | Code reloader makes Docker on Windows very slow | Cluster requests dropped from 44–90 seconds to about 4 ms. The dev server still uses the reloader | [gen_dockercfgenv.ts](../../generators/init_configs/gen_dockercfgenv.ts) |
| 11 | Open | High | CRUD and sockets are open after `add_auth` | The widget API answers without a login, and socket connect accepts everyone | Generated router and socket |
| 12 | Open | High | Request keys become atoms | Arbitrary JSON keys could exhaust a node's atom table (from code, not exercised) | Generated `utils/map.ex:10` |
| 13 | Open | Medium | Intermittent WebSocket failure on node 3 | The first connect to node 3 still retries in matrix runs and then succeeds. All 100 isolated connects to each node succeeded, so the test client may be the cause | Unresolved |
| 14 | **Fixed** | Medium | Nomix init can remove unrelated containers | Init now stops conflicting containers without removing them. It still stops them | [nomix.ts](../../runners/nomix.ts) |
| 15 | **Fixed** | Medium | No generated `createWidget` client request | Generated entity requests now include `createWidget` | Generated `requests/Widget.tsx` |
| 16 | **Fixed** | Low | `d.test` script is broken | The script no longer references a missing `test` service. The script itself was not run in this retest | Generated `package.json` |
