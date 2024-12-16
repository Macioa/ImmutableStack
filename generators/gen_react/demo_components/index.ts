import { ImmutableGenerator, GenTypes } from "../../../immutable_gen";
import { gen_create_demo_component } from "./gen_create_demo_component";
import { gen_full_demo_component } from "./gen_full_demo_component";
import { gen_list_demo_component } from "./gen_list_demo_component";
import { gen_show_demo_component } from "./gen_show_demo_component";

const gen_demo_components = async (
  generator: ImmutableGenerator,
  typeDict: GenTypes
) => {
  const { generate: demoComponents } = generator;
  return demoComponents
    ? Promise.all([
        gen_create_demo_component(generator, typeDict),
        gen_list_demo_component(generator, typeDict),
        gen_show_demo_component(generator, typeDict),
        gen_full_demo_component(generator, typeDict),
      ])
    : null;
};

export { gen_demo_components };
