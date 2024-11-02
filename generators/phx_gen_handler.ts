import { exec } from "child_process";
import { log } from "../utils/logger";
import { handle_json } from "./phx_gen_json";
import { gen_schema } from "./phx_gen_schema";
import { gen_context } from "./phx_gen_context";
import { ImmutableGenerator } from "./gen_controller";

const handle_phx_gen = async (generator: ImmutableGenerator, typeDict: any) => {
  const gen = generator.generate;
  let res = null;

  if (gen.schema && gen.context) res = await gen_context(generator, typeDict)
    if (gen.schema && !gen.context) res = await gen_schema(generator, typeDict)
      if (gen.context && !gen.schema) console.error("Schema is required to generate context")

  

  return res;
};

export { handle_phx_gen };
