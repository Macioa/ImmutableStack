import { join } from "../../../utils/path";
import { ImmutableGenerator } from "../../../immutable_gen";
import { mark } from "../../../repair/index";
import { generateFile } from "../../index";

import { get_reducer_exports, get_reducer_tests } from "./reducers";
import { get_selector_exports, get_selector_tests } from "./selectors";

const generate_entity_state_tests = async (
  generator: ImmutableGenerator,
  reducers: string[],
  selectors: string[]
) => {
  const {
    name: { singleUpperCamel },
    generate: { stateSlice, factory, test },
    AppData: { LibDir },
  } = generator;
  if (test) {
    const reducerTests = await get_reducer_tests(generator);
    const selectorTests = await get_selector_tests(generator);
    const reducerExports = get_reducer_exports(reducers);
    const selectorExports = get_selector_exports(selectors);

    const content =
      `
    import ${stateSlice?.name || ""}, {
  ${reducerExports.join(", ")},
  ${selectorExports.join(", ")},
  ${factory ? `${singleUpperCamel}Factory` : ""},
  initial${singleUpperCamel}StoreStateState,
} from "./${singleUpperCamel}";
    ` +
      "\n\n" +
      reducerTests
        .map((test) =>
          mark({ str: test, entity: singleUpperCamel, type: "REDUCER TEST" })
        )
        .join("\n") +
      "\n\n" +
      selectorTests
        ?.map((test) =>
          mark({ str: test, entity: singleUpperCamel, type: "SELECTOR TEST" })
        )
        ?.join("\n");

    return generateFile({
      filename: `${singleUpperCamel}.test.tsx`,
      dir: join(LibDir, "lib/typescript/state/"),
      content,
    });
  }
};

export { generate_entity_state_tests };
