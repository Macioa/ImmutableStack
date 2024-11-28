import { StringOnlyMap } from "./map";
import { log } from "./logger";
const compute_header = (
  dict: StringOnlyMap,
  genFn: (dict: StringOnlyMap) => string,
): string => {
  const definition = genFn(dict);
  log({ level: 5 }, "Generating header for:", definition);

  let header = "";
  definition
    .split(/[ \n]+do/)[0]
    .replace(
      /(defp{0,1})(.*)/s,
      (_match: string, _def: string, head: string) => (header = head),
    );
  header = header.replace(/,{0,1}\s*(do){0,1}$/, "").trim();
  log({ level: 5 }, "Generated header:", header);
  return header;
};

export { compute_header };
