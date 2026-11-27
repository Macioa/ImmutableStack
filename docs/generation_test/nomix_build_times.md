# Nomix Build Times

Measured on Windows with Docker Desktop on a project generated from commit `abf4935`. Network speed and Docker cache state affect these numbers, so treat them as one-machine measurements. An earlier first toolchain build took 987 seconds, while the clean rebuild below took 178.

## Where the time goes

| Step | Time | Notes |
| --- | ---: | --- |
| Toolchain image, no cache | 178s | 142s is OS packages |
| `immutable -init` | 255s | Toolchain was already cached. Earlier runs took up to 417s |
| `immutable -genfile` | 4s | |
| `immutable -gen` | 136s | About 26s is Prettier. Most of the rest is not yet broken down |
| `immutable -gen_channel` | 26s | |
| `immutable -add_auth` | 23s | |
| Compiled image, toolchain cached | 84s | 64s is the dependency layer |
| Cluster start, including database setup | 18s | |
| Nodes ready after start | 2s | |
| Node restart and rejoin | 5s | |
| **Clean total** | **About 724s** | Toolchain, generator commands, image and cluster start |

## Possible improvements

| Priority | Where the time goes | Possible improvement | Current | After | Time difference | Basis |
| --- | --- | --- | ---: | ---: | ---: | --- |
| 1 | `postgresql-dev` pulls in Clang and LLVM | Remove it from the toolchain | 178s | 61s | **117s saved on a clean build** | Measured. The app compiled without it, but was not booted |
| 2 | Prettier starts once per generated TS file | Format all files in one batch per command | About 58s | About 9s | **About 49s per full generation** | Estimated from 20 file writes at about 2.9s each, and 2.7s for a batch of 10 |
| 3 | Elixir dependency compile | Upgrade to Elixir 1.19 for parallel compilation ([issue #19](https://github.com/Macioa/ImmutableStack/issues/19)) | 49s | Not measured | Not measured | Needs a version upgrade |
| 4 | Windows bind mount during dev dependency compile | Keep the project in the WSL filesystem or compile in the image | 62s | 49s | **Up to 13s per clean dev compile** | Measured bind mount against image, including container startup |
| 5 | npm downloads when the dependency layer rebuilds | Add a BuildKit npm cache mount | 11.3s | 3.9s | **7.4s per dependency rebuild** | Measured with a warm npm cache. No effect on a first build |
| 6 | Each Mix command starts a new container | Reuse one running dev container with `docker exec` | 3.1–4.5s | 1.6–1.9s | **About 2s per Mix command, about 8s per full generation** | Measured on a no-op compile |
| 7 | TypeScript and Vite run with the app compile | Build the UI in its own cached stage | 4.1s | 0s on Elixir-only edits | **About 4s per Elixir-only rebuild** | Measured `tsc` at 2.1s and Vite at 2.0s |
| 8 | Hex package downloads when dependencies rebuild | Add a BuildKit Hex cache mount | 3.3s | 2.3s | **1s per dependency rebuild** | Measured |

## Expected result

Improvements 1, 2 and 6 would reduce a clean run from about 724s to about 550s, a saving of about 174s or 24%. The Elixir upgrade could reduce it further.

The largest unexplained cost is inside `immutable -init` and `immutable -gen`. Timing each internal step should come before more optimization there.
