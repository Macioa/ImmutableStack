import { join } from "path";
import { ImmutableGenerator, GenTypes } from "../../immutable_gen";
import { generateFile } from "../index";

const gen_entity_requests = async (
  generator: ImmutableGenerator,
  _typeDict: GenTypes
) => {
  const { name, generate, AppNameCaps, LibDir } = generator;
  const {
    singleUpperCamel,
    singleLowerCamel,
    pluralUpperCamel,
    singleSnake,
  } = name;
  const { requests } = generate;
  const filedir = join(LibDir || "", "lib/typescript/requests/");

  const content = `
import { Dispatch } from "redux";
import { Request } from "./index";
import { ${singleUpperCamel}, set${singleUpperCamel}, set${pluralUpperCamel} } from "../state/${singleUpperCamel}";

const request${singleUpperCamel} = (id: string, dispatch: Dispatch) => 
  Request.API({
    name: "fetch${singleUpperCamel}",
    api_url_key: "${AppNameCaps}_API_URL",
    route: \`${singleSnake}/\${id}\`,
    callback: (res: any) => dispatch(set${singleUpperCamel}(res.data))
  }, dispatch);


const request${pluralUpperCamel} = (dispatch: Dispatch) => 
  Request.API({
    name: "fetch${pluralUpperCamel}",
    api_url_key: "${AppNameCaps}_API_URL",
    route: \`${singleSnake}\`,
    callback: (res: any) => dispatch(set${pluralUpperCamel}(res.data)),
  }, dispatch);


const update${singleUpperCamel} = (${singleLowerCamel}: ${singleUpperCamel}, dispatch: Dispatch) => 
  Request.API({
    name: "update${singleUpperCamel}",
    api_url_key: "${AppNameCaps}_API_URL",
    route: "${singleSnake}",
    options: {
      method: "PUT",
      body: JSON.stringify(${singleLowerCamel}),
    },
    callback: (_data: any) => null,
  }, dispatch);


const delete${singleUpperCamel} = (id: string, dispatch: Dispatch) => 
  Request.API({
    name: "delete${singleUpperCamel}",
    api_url_key: "${AppNameCaps}_API_URL",
    route: \`${singleSnake}/\${id}\`,
    options: {
      method: "DELETE",
    },
  }, dispatch);


export { request${singleUpperCamel}, request${pluralUpperCamel}, update${singleUpperCamel}, delete${singleUpperCamel} };
`;


  return requests
    ? generateFile(
        { dir: filedir, filename: `${singleUpperCamel}.tsx`, content },
        "gen_entity_requests"
      )
    : null;
};

export { gen_entity_requests };
