import { handle_json } from "./phx_gen_json";
import { gen_schema } from "./phx_gen_schema";
import { gen_phx_contex } from "./gen_phx_context/";
import { gen_phx_controller } from "./gen_phx_controller/";
import { ImmutableGenerator, GenTypes } from "./gen_controller";

const handle_phx_gen = async (generator: ImmutableGenerator, genTypes: GenTypes) => {
  const gen = generator.generate;
  let res:any = [];

  if (gen.schema) res.push(await gen_schema(generator, genTypes))
  if (gen.context) res.push(await gen_phx_contex(generator, genTypes))
  if (gen.http_controller) res.push(gen_phx_controller(generator, genTypes))
  
  return res;
};

export { handle_phx_gen };
