import { gen_schema } from "../../generators/gen_phoenix/phx_gen_schema";
import { gen_phx_context } from "../../generators/gen_phoenix/gen_phx_context";
import { gen_phx_context_test } from "../../generators/gen_phoenix/gen_phx_context/test";
import { inject_router } from "../../injectors/gen_phoenix/inject_router";
import {
  gen_phx_controller,
  gen_json_handler,
} from "../../generators/gen_phoenix/gen_phx_controller";
import { ImmutableGenerator, GenTypes } from "../../immutable_gen";

const gen_phx = async (
  generator: ImmutableGenerator,
  genTypes: GenTypes,
) => {
  const gen = generator.generate;
  let res: any = [];

    
  if (gen.schema) res.push(await gen_schema(generator, genTypes));

  if (gen.context) { 
    res.push(await gen_phx_context(generator, genTypes));
    if (gen.test) res.push(await gen_phx_context_test(generator, genTypes));
  }
  if (gen.http_controller)
    res.push(
      await Promise.all([
        gen_phx_controller(generator, genTypes),
        gen_json_handler(generator, genTypes),
        inject_router(generator),
      ]),
    );

  return res;
};

export { gen_phx };
