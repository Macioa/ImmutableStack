import { ImmutableGenerator, GenTypes } from "../../immutable_gen";
import { gen_entity_store } from "../../generators/gen_react/state";
import { addReducerToGlobal } from "../../injectors/gen_react/add_reducer_to_global";
import { gen_entity_requests } from "../../generators/gen_react/gen_entitiy_requests";
import { gen_entity_api_response } from "../../generators/gen_react/gen_entity_api_response";
import { gen_demo_components } from "../../generators/gen_react/demo_components";


const gen_react = async (generator: ImmutableGenerator, genTypes: GenTypes) => {

  return Promise.all([
    addReducerToGlobal(generator),
    gen_demo_components(generator, genTypes),
    gen_entity_store(generator, genTypes),
    gen_entity_requests(generator, genTypes),
    gen_entity_api_response(generator, genTypes),
  ]);
};

export { gen_react };