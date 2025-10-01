import { ImmutableGenerator, GenTypes } from "@/commands/immutable_gen";
import { gen_entity_store } from "@/generators/gen_react/state";
import { addReducerToGlobal } from "@/injectors/gen_react/add_reducer_to_global";
import { gen_entity_requests } from "@/generators/gen_react/gen_entitiy_requests";
import { gen_entity_api_response } from "@/generators/gen_react/gen_entity_api_response";
import { gen_demo_components } from "@/generators/gen_react/demo_components";
import { join } from "@/utils/path";
import { execute as exec } from "@/runners";


const gen_react = async (generator: ImmutableGenerator, genTypes: GenTypes) => {
  // Ensure state directory exists before any generators try to use it
  const stateDir = join(generator.AppData.LibDir, "lib/typescript/state");
  await exec({ dir: generator.AppData.LibDir, command: `mkdir -p lib/typescript/state` }, "gen_react");

  return Promise.all([
    addReducerToGlobal(generator),
    gen_demo_components(generator, genTypes),
    gen_entity_store(generator, genTypes),
    gen_entity_requests(generator, genTypes),
    gen_entity_api_response(generator, genTypes),
  ]);
};

export { gen_react };