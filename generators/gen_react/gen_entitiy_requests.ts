import { join } from "path";
import { ImmutableGenerator } from "../gen_controller";
import pluralize from "pluralize";
import { generateFile } from "../index";

const gen_entity_requests = async (
  generator: ImmutableGenerator,
  typeDict: any
) => {
    const { name, generate, UiDir, AppNameCamel } = generator;
    const { tstype } = generate;
    const filedir = join(UiDir || '', "src/requests");

    const content = `
import { Dispatch } from "redux";
import { Request } from "./index";
import { ${tstype}, set${tstype}, set${pluralize(tstype as string)} } from "../store/${name}";

const request${tstype} = (id: string, dispatch: Dispatch) => {
  Request.API({
    name: "fetch${tstype}",
    api_url_key: "${AppNameCamel?.toUpperCase()}_API_URL",
    route: \`${pluralize(tstype as string).toLowerCase()}/\${id}\`,
    callback: (res: any) => dispatch(set${tstype}(res.data))
  }, dispatch);
};

const request${pluralize(tstype as string)} = (dispatch: Dispatch) => {
  return Request.API({
    name: "fetch${pluralize(tstype as string)}",
    api_url_key: "${AppNameCamel?.toUpperCase()}_API_URL",
    route: \`${pluralize(tstype as string).toLowerCase()}\`,
    callback: (res: any) => dispatch(set${pluralize(tstype as string)}(res.data)),
  }, dispatch);
};

const update${tstype} = (${tstype?.toLowerCase()}: ${tstype}, dispatch: Dispatch) => {
  Request.API({
    name: "update${tstype}",
    api_url_key: "${AppNameCamel?.toUpperCase()}_API_URL",
    route: "${tstype?.toLowerCase()}",
    options: {
      method: "PUT",
      body: JSON.stringify(${tstype?.toLowerCase()}),
    },
    callback: (data: any) => null,
  }, dispatch);
};

const delete${tstype} = (id: string, dispatch: Dispatch) => {
  Request.API({
    name: "delete${tstype}",
    api_url_key: "${AppNameCamel?.toUpperCase()}_API_URL",
    route: \`${tstype?.toLowerCase()}/\${id}\`,
    options: {
      method: "DELETE",
    },
  }, dispatch);
};

export { request${tstype}, request${pluralize(tstype as string)}, update${tstype}, delete${tstype} };
`;

return generateFile({ dir: filedir, filename: `${name}.tsx`, content });
}

export { gen_entity_requests };




