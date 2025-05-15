import { join } from "../../utils/path";
import { ImmutableGenerator, GenTypes } from "../../immutable_gen";
import { generateFile } from "../index";
import { StringOnlyMap } from "../../utils/map";
import { CommentType, mark } from "../../repair/index";

const gen_entity_requests = async (
  generator: ImmutableGenerator,
  _typeDict: GenTypes
) => {
  const {
    name: { singleUpperCamel, singleLowerCamel, pluralUpperCamel, singleSnake },
    generate: { requests },
    AppData: { AppNameCamel, LibDir },
  } = generator;
  const filedir = join(LibDir || "", "lib/typescript/requests/");

  const APIS = [
    gen_request_show,
    gen_request_list,
    gen_request_update,
    gen_request_delete,
  ]
    .map((fn) => {
      return fn({
        singleUpperCamel,
        singleLowerCamel,
        pluralUpperCamel,
        AppNameCamel,
        singleSnake,
      });
    })
    .map((m) =>
      mark(
        { str: m, entity: singleUpperCamel, type: "REQUEST_API" },
        "TS" as CommentType
      )
    )
    .join("\n");

  const imports = `
import type { Dispatch } from "redux";
import { Request } from "./index";
import { set${singleUpperCamel}, set${pluralUpperCamel} } from "../state/${singleUpperCamel}";
import type { ${singleUpperCamel} } from "../state/${singleUpperCamel}";
import type { ${singleUpperCamel}Response, Count${singleUpperCamel}Response, Partial${singleUpperCamel}Response } from "./${singleUpperCamel}Response";`;

  const exports = `export { request${singleUpperCamel}, request${pluralUpperCamel}, update${singleUpperCamel}, delete${singleUpperCamel} };
`;
  const content = [imports, APIS, exports].join("\n");
  return requests
    ? generateFile(
        { dir: filedir, filename: `${singleUpperCamel}.tsx`, content },
        "gen_entity_requests"
      )
    : null;
};

const gen_request_show = ({
  singleUpperCamel,
  AppNameCaps,
  singleSnake,
}: StringOnlyMap) =>
  `const request${singleUpperCamel} = (id: string, dispatch: Dispatch) => 
    Request.API({
      name: "fetch${singleUpperCamel}",
      api_url_key: "${AppNameCaps}_API_URL",
      route: \`${singleSnake}/\${id}\`,
      callback: (res: any) => dispatch(set${singleUpperCamel}(res.data))
    }, dispatch) as Promise<${singleUpperCamel}Response>;`;

const gen_request_list = ({
  pluralUpperCamel,
  AppNameCaps,
  singleSnake,
  singleUpperCamel,
}: StringOnlyMap) =>
  `const request${pluralUpperCamel} = (dispatch: Dispatch) => 
    Request.API({
      name: "fetch${pluralUpperCamel}",
      api_url_key: "${AppNameCaps}_API_URL",
      route: \`${singleSnake}\`,
      callback: (res: any) => dispatch(set${pluralUpperCamel}(res.data)),
    }, dispatch) as Promise<${singleUpperCamel}Response>;`;

const gen_request_update = ({
  singleUpperCamel,
  singleLowerCamel,
  AppNameCaps,
  singleSnake,
}: StringOnlyMap) =>
  `const update${singleUpperCamel} = (${singleLowerCamel}: ${singleUpperCamel}, dispatch: Dispatch) => 
    Request.API({
      name: "update${singleUpperCamel}",
      api_url_key: "${AppNameCaps}_API_URL",
      route: "${singleSnake}",
      options: {
        method: "PUT",
        body: JSON.stringify(${singleLowerCamel}),
      },
      callback: (_data: any) => null,
    }, dispatch) as Promise<Partial${singleUpperCamel}Response>;`;

const gen_request_delete = ({
  singleUpperCamel,
  AppNameCaps,
  singleSnake,
}: StringOnlyMap) =>
  `const delete${singleUpperCamel} = (id: string, dispatch: Dispatch) => 
    Request.API({
      name: "delete${singleUpperCamel}",
      api_url_key: "${AppNameCaps}_API_URL",
      route: \`${singleSnake}/\${id}\`,
      options: {
        method: "DELETE",
      },
    }, dispatch) as Promise<Count${singleUpperCamel}Response>;`;

export { gen_entity_requests };
