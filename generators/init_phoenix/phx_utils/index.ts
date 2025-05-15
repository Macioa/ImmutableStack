import { AppData } from "../../../readers/get_app_data";
import { gen_chunk_util } from "./gen_chunk_util";
import { gen_dynamic_query_util } from "./gen_dynamic_query_util";
import { gen_map_util } from "./gen_map_util";
import { gen_paginate_util } from "./gen_paginate_util";

const gen_phx_utils = async (appdata: AppData) =>
  Promise.all([
    gen_chunk_util(appdata),
    gen_dynamic_query_util(appdata),
    gen_paginate_util(appdata),
    gen_map_util(appdata),
  ]);

export { gen_phx_utils };
