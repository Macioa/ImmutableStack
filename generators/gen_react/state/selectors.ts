import { ImmutableGenerator } from "../../../immutable_gen";
import { StringOnlyMap } from "../../../utils/map";
import { log } from "../../../utils/logger";

const getOne = ({ singleUpperCamel, singleLowerCamel }: StringOnlyMap) => ({
  header: `select${singleUpperCamel} = (state: GenericAppState)`,
  definition: `const select${singleUpperCamel} = (state: GenericAppState) => state.${`${singleUpperCamel}Store`}.${singleLowerCamel};`,
});

const getMany = ({
  pluralUpperCamel,
  singleUpperCamel,
  pluralLowerCamel,
}: StringOnlyMap) => ({
  header: `select${pluralUpperCamel} = (state: GenericAppState)`,
  definition: `const select${pluralUpperCamel} = (state: GenericAppState) => state.${singleUpperCamel}Store.${pluralLowerCamel}`,
});

const customSelector = (header: string) => `const ${header} => {
      // TODO: implement custom selector 
      return state;   
  }`;

const getOneTest = (
  { singleUpperCamel, singleLowerCamel }: StringOnlyMap,
  header = `select${singleUpperCamel} = (state: GenericAppState)`
) => ({
  header,
  definition: `it("${header}", () => {
  const ${singleLowerCamel} = ${singleUpperCamel}Factory();
  const state = ${singleLowerCamel}Slice.reducer(initial${singleUpperCamel}StoreStateState, set${singleUpperCamel}(${singleLowerCamel}));
  const selected${singleUpperCamel} = select${singleUpperCamel}({ ${singleUpperCamel}Store: state });
  expect(selected${singleUpperCamel}).toEqual(${singleLowerCamel});
});`,
});

const getManyTest = (
  { singleUpperCamel, singleLowerCamel, pluralUpperCamel }: StringOnlyMap,
  header = `select${pluralUpperCamel} = (state: GenericAppState)`
) => ({
  header,
  definition: `it("select${singleUpperCamel}s", () => {
  const ${singleLowerCamel}s = [${singleUpperCamel}Factory(), ${singleUpperCamel}Factory()];
  const state = ${singleLowerCamel}Slice.reducer(initial${singleUpperCamel}StoreStateState, set${singleUpperCamel}s(${singleLowerCamel}s));
  const selected${singleUpperCamel}s = select${singleUpperCamel}s({ ${singleUpperCamel}Store: state });
  expect(selected${singleUpperCamel}s).toEqual(${singleLowerCamel}s);
});`,
});

const customSelectorTest = (header: string) => `
it("${header}", () => {
    // TODO: implement custom selector test
})`;

const get_selectors = (generator: ImmutableGenerator) => {
  const { name, generate } = generator;
  const selectors = generate?.stateSlice?.selectors,
    appstate = generate?.appstate || "";

  const generatedSelectors = [getOne, getMany].map((selector) =>
    selector({ ...name, appstate })
  );

  return selectors?.map(
    (selector) =>
      generatedSelectors.find((r) => selector === r.header)?.definition ||
      customSelector(selector)
  ) as string[];
};

const get_selector_exports = (selectors: string[]) =>
  selectors?.map((r) => typeof r === "string" && r.match(/(?<=\bconst\s)\w+/)?.[0]);

const get_selector_tests = async (generator: ImmutableGenerator) => {
  const { name, generate } = generator;
  const selectors = generate?.stateSlice?.selectors,
    appstate = generate?.appstate || "";
  log({ level: 8 }, { selectors });

  const generatedSelectorTests = [getOneTest, getManyTest].map((selector) =>
    selector({ ...name, appstate })
  );

  log({ level: 8 }, { generatedSelectorTests });
  const sel = selectors?.map(
    (selector) =>
      generatedSelectorTests.find((r) => selector === r.header)?.definition ||
      customSelectorTest(selector)
  ) as string[];

  log({ level: 8 }, { sel });

  return sel;
};

export { get_selector_exports, get_selector_tests, get_selectors };
