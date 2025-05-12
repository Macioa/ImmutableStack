import { gen_chunk_util } from "./gen_chunk_util";
import { gen_dynamic_query_util } from "./gen_dynamic_query_util";
import { gen_paginate_util } from "./gen_paginate_util";
import { gen_map_util } from "./gen_map_util";
import { AppData } from "../../../readers/get_app_data";

const gen_phx_utils = async ({ AppNameCamel, LibDir }: AppData) =>
  Promise.all([
    gen_chunk_util(AppNameCamel, LibDir),
    gen_dynamic_query_util(AppNameCamel, LibDir),
    gen_paginate_util(AppNameCamel, LibDir),
    gen_map_util(AppNameCamel, LibDir),
  ]);

export { gen_phx_utils };
