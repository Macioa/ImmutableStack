import pluralize from "pluralize";

interface Names {
  pluralLowerCamel: string;
  pluralUpperCamel: string;
  singleLowerCamel: string;
  singleUpperCamel: string;
  singleCAPS: string;
  singleSnake: string;
  pluralSnake: string;
  singleChar?: string;
}

const getNamesFromSingularSnakeCase = (
  singularSnakeStr: string
): Names | null => {
  if (!singularSnakeStr) return null;
  const pluralSnake = pluralizeSnakeCase(singularSnakeStr);
  const singleUpperCamel = toUpperCamel(singularSnakeStr);
  const singleLowerCamel = toLowerCamel(singleUpperCamel);
  const pluralUpperCamel = toUpperCamel(pluralSnake);
  const pluralLowerCamel = toLowerCamel(pluralUpperCamel);
  const singleChar = singularSnakeStr[0];
  const singleCAPS = singularSnakeStr.toUpperCase();

  return {
    singleSnake: singularSnakeStr,
    pluralSnake,
    singleLowerCamel,
    singleUpperCamel,
    singleCAPS,
    pluralLowerCamel,
    pluralUpperCamel,
    singleChar,
  };
};

const pluralizeSnakeCase = (str: string): string => {
  const parts = str.split("_");
  const lastPartPlural = pluralize(parts.pop() || "");
  return [...parts, lastPartPlural].join("_");
};

const toUpperCamel = (snakeStr: string): string =>
  snakeStr
    .split("_")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

const toLowerCamel = (upperCamel: string): string =>
  upperCamel.replace(upperCamel[0], upperCamel[0].toLowerCase());

export type { Names };
export {
  getNamesFromSingularSnakeCase,
  pluralizeSnakeCase,
  toUpperCamel,
  toLowerCamel,
};
