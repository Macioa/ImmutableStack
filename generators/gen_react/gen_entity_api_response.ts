import { generateFile } from "..";
import { GenTypes, ImmutableGenerator } from "../../immutable_gen";
import { mark } from "../../repair";

const gen_entity_api_response = async (
  generator: ImmutableGenerator,
  _typeDict: GenTypes
) => {
  const { name, LibDir } = generator;
  const { singleUpperCamel } = name;
  const dir = `${LibDir || ""}/lib/typescript/requests/`;
  const filename = `${name.singleUpperCamel}Response.tsx`;

  const contentInit = `import { ${singleUpperCamel} } from "../state/${singleUpperCamel}";

type BaseQuery = {
  query?: Record<string, any>;
};

type ${singleUpperCamel}Response = BaseQuery & {
  data: ${singleUpperCamel} | ${singleUpperCamel}[];
  count?: number;
};

type Count${singleUpperCamel}Response = {
  success_count: number;
  fail_count: number;
};

type Partial${singleUpperCamel}Response = BaseQuery & {
  success_count: number;
  fail_count: number;
  data: ${singleUpperCamel}[];
  failed: any[];
};

type All${singleUpperCamel}Response =
  | ${singleUpperCamel}Response
  | Count${singleUpperCamel}Response
  | Partial${singleUpperCamel}Response;

  export type { ${singleUpperCamel}Response, Count${singleUpperCamel}Response, Partial${singleUpperCamel}Response, All${singleUpperCamel}Response };
  `;
  const content = mark(
    { str: contentInit, entity: singleUpperCamel, type: "API_RESPONSE" })

  return generateFile(
    { dir, filename, content },
    "gen_entity_api_response"
  );
};

export { gen_entity_api_response };
