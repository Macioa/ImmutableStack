interface StringOnlyMap {
  [key: string]: string;
}

interface RestructuredMap {
  [key: string]: string | null | undefined;
}
// const { var1, var2 } = MyMap: StringOnlyMap;
// validate({var1, var2}, myFunc);
const validate = (
  map: RestructuredMap,
  caller: Function | null = null
): boolean => {
  Object.keys(map).forEach((key) => {
    const value = map[key];
    if (value === null || value === undefined) {
      console.error(
        `${key} in StringOnlyMap cannot be null or undefined.\n     Caller: ${caller?.name}`
      );
      throw new Error(
        `${key} in StringOnlyMap cannot be null or undefined. Caller: ${caller?.name}`
      );
    }
  });
  return true;
};

export type { StringOnlyMap };
export { validate };
