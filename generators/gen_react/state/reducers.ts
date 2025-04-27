import { ImmutableGenerator } from "../../../immutable_gen";
import { StringOnlyMap } from "../../../utils/map";
import { log } from "../../../utils/logger";

const setOne = ({
  singleUpperCamel,
  singleLowerCamel,
  appstate,
}: StringOnlyMap) => ({
  header: `set${singleUpperCamel}(state: ${appstate}, action: PayloadAction<${singleUpperCamel}>`,
  definition: `set${singleUpperCamel}(state: ${appstate}, action: PayloadAction<${singleUpperCamel}>) {
          state.${singleLowerCamel} = action.payload;
        }`,
});

const setMany = ({
  pluralUpperCamel,
  singleUpperCamel,
  appstate,
  pluralLowerCamel,
}: StringOnlyMap) => ({
  header: `set${pluralUpperCamel}(state: ${appstate}, action: PayloadAction<${singleUpperCamel}[]>`,
  definition: `set${pluralUpperCamel}(state: ${appstate}, action: PayloadAction<${singleUpperCamel}[]>) {
          state.${pluralLowerCamel} = action.payload;
        }`,
});

const customReducer = (header: string) => `${header} {
      // TODO: implement custom reducer 
      return state;   
  `;

const setOneTest = (
  {
    pluralUpperCamel,
    singleUpperCamel,
    singleLowerCamel,
    appstate,
  }: StringOnlyMap,
  header = `set${pluralUpperCamel}(state: ${appstate}, action: PayloadAction<${singleUpperCamel}[]>`
) => ({
  header,
  definition: `it("${header}", () => {
    const ${singleLowerCamel} = ${singleUpperCamel}Factory();
    const state = ${singleLowerCamel}Slice.reducer(initial${singleUpperCamel}StoreStateState, set${singleUpperCamel}(${singleLowerCamel}));
    expect(state.${singleLowerCamel}).toEqual(${singleLowerCamel});
  });`,
});

const setManyTest = (
  {
    singleUpperCamel,
    singleLowerCamel,
    pluralLowerCamel,
    pluralUpperCamel,
    appstate,
  }: StringOnlyMap,
  header = `set${singleUpperCamel}(state: ${appstate}, action: PayloadAction<${singleUpperCamel}>`
) => ({
  header,
  definition: `it("${header}", () => {
  const ${pluralLowerCamel} = [${singleUpperCamel}Factory(), ${singleUpperCamel}Factory()];
  const state = ${singleLowerCamel}Slice.reducer(initial${singleUpperCamel}StoreStateState, set${pluralUpperCamel}(${pluralLowerCamel}));
  expect(state.${pluralLowerCamel}).toEqual(${pluralLowerCamel});
});`,
});

const customReducerTest = (header: string) => `
it("${header}", () => {
    // TODO: implement custom reducer test
})`;

const get_reducers = (generator: ImmutableGenerator) => {
  const { name, generate } = generator;
  const reducers = generate?.stateSlice?.reducers,
    appstate = generate?.appstate || "";
  log({ level: 8 }, { reducers });

  const generatedReducers = [setOne, setMany].map((reducer) =>
    reducer({ ...name, appstate })
  );
  log({ level: 8 }, { generatedReducers });

  const red = reducers?.map(
    (reducer) =>
      generatedReducers.find((r) => reducer === r.header)?.definition ||
      customReducer(reducer)
  ) as string[];
  log({ level: 8 }, { red });
  return red;
};

const get_reducer_exports = (reducers: string[]) =>
  reducers?.map((r) => typeof r === "string" && r.match(/^\w+/)?.[0]);

const get_reducer_tests = async (generator: ImmutableGenerator) => {
  const { name, generate } = generator;
  const reducers = generate?.stateSlice?.reducers,
    appstate = generate?.appstate || "";
  log({ level: 1 }, { reducers });
  const generatedReducerTests = [setOneTest, setManyTest].map((reducer) =>
    reducer({ ...name, appstate })
  );
  log({ level: 1 }, { generatedReducerTests });
  const red = reducers?.map(
    (reducer) =>
      generatedReducerTests.find(({ header }) => reducer === header)
        ?.definition || customReducerTest(reducer)
  ) as string[];

  log({ level: 1 }, { red });

  return red;
};

export { get_reducer_exports, get_reducer_tests, get_reducers };
