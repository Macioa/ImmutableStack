import { gen_chunk_util } from "./gen_chunk_util";
import { gen_dynamic_query_util } from "./gen_dynamic_query_util";
import { gen_paginate_util } from "./gen_paginate_util";
import { gen_map_util } from "./gen_map_util";

const gen_phx_utils = async (AppNameCamel: string, AppDir: string) =>
  Promise.all([
    gen_chunk_util(AppNameCamel, AppDir),
    gen_dynamic_query_util(AppNameCamel, AppDir),
    gen_paginate_util(AppNameCamel, AppDir),
    gen_map_util(AppNameCamel, AppDir),
  ]);

export { gen_phx_utils };
