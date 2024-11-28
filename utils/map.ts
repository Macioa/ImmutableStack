import { get } from "http";

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
  caller: string | null = null,
): boolean => {
  Object.keys(map).forEach((key) => {
    const value = map[key];
    if (value === null || value === undefined) {
      console.error(
        `${key} in StringOnlyMap cannot be null or undefined.\n     Caller: ${caller}`,
      );
      throw `${key} in StringOnlyMap cannot be null or undefined. Caller: ${caller}`;
    }
  });
  return true;
};

const get_in = (map: { [key: string]: any }, keys: string[]): any =>
  keys.reduce((acc, key) => acc?.[key], map);

const immutable_set_in = (
  map: { [key: string]: any },
  keys: string[],
  value: any,
): object => {
  const immKeys = [...keys].reverse();
  const { result } = immKeys.reduce(
    ({ result, processed_keys, unprocessed_keys }, key) => {
      unprocessed_keys = unprocessed_keys.slice(1);
      const newResult = {
        ...(get_in(map, unprocessed_keys.reverse()) || {}),
        [key]: processed_keys.length ? { ...result } : value,
      };

      return {
        result: newResult,
        processed_keys: [...processed_keys, key],
        unprocessed_keys,
      };
    },
    { result: {}, processed_keys: [] as string[], unprocessed_keys: immKeys },
  );
  return result;
};

const referenced_set_in = (
  map: { [key: string]: any },
  keys: string[],
  value: any,
): void => {
  const lastKey = keys.pop() as string;
  let tailRef = get_in(map, keys);
  if (tailRef && typeof tailRef == "object") tailRef[lastKey] = value;
  else referenced_set_in(map, keys, { [lastKey]: value });
};

export type { StringOnlyMap };
export { validate, get_in, immutable_set_in, referenced_set_in };
