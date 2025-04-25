/*
** Immutable GenFile **
    Generate a genfile for the immutable generator
          - requires a entity name as an argument
*/

import fs from "fs";
import { join } from "path";
import { getNamesFromSingularSnakeCase as getNames } from "./utils/string";
import { log } from "./utils/logger";

const [, , genName] = process.argv;
const file = join(process.cwd(), `.genfile_${genName}.ts`);

if (!genName) {
  console.error("Please provide a name as an argument.");
  process.exit(1);
}

const main = () => (fs.existsSync(file) ? update_genfile() : new_genfile());

const new_genfile = () => {
  const {
    singleUpperCamel,
    singleLowerCamel,
    pluralUpperCamel,
    pluralLowerCamel,
  } = getNames(genName);
  const tsContent = `
/*
                    *****************************
                *** APPLICATION TYPE DECLARATIONS ***

  Specify properties for ${singleLowerCamel} types.

     Global will be used when other types are not specified. If all types are specified, Global will be ignored. 
       If genfile is run again with the same name argument, global will be propagated to all other types which can then be customized.

                    *****************************
*/

interface ImmutableGlobal
  extends GenType<{
//    * ${singleUpperCamel} * 
    example1: integer;
    example2: string;
    example3: float;
  }> {}

interface AppState
  extends GenType<{
    ${singleLowerCamel}: ${singleUpperCamel} | null;
    ${pluralLowerCamel}: ${singleUpperCamel}[];
  }> {}
interface InitialAppState extends AppState {
  ${singleLowerCamel}: null;
  ${pluralLowerCamel}: [];
}
interface Schema extends GenType<{
  // Schema here or use Global
}> {}
interface DatabaseTable extends GenType<{
  // DatabaseTable here or use Global
}> {}
interface TsType extends GenType<{
  // TsType here or use Global
}> {}

/*
                    ****************************
                        *** GENERATOR ***

  Comment out unwanted functionality or add new functionality for generation.

                    ****************************
*/
const Immutable: ImmutableGenerator = {
  name: "${genName}",
  generate: {
    // BACK END
    http_controller: {
      name: "${singleUpperCamel}Controller",
      routes: [
        "routed_index(conn, entity_queries, page_queries) when entity_queries == %{}",
        "routed_index(conn, entity_queries, page_queries) when entity_queries != %{}",
        "create(conn, ${genName}_list) when is_list(${genName}_list)",
        "create(conn, ${genName}_params)",
        "show(conn, ${genName}_list) when is_list(${genName}_list)",
        'show(conn, %{"id" => id})',
        "update(conn, ${genName}_list) when is_list(${genName}_list)",
        "update(conn, ${genName}_params) when is_map(${genName}_params)",
        "delete(conn, ${genName}_list) when is_list(${genName}_list)",
        'delete(conn, %{"id" => id})',
        // "custom_route(conn, %{destructured: params})"
      ],
    },
    channel_controller: "${genName}_channel",
    context: {
      name: "${singleUpperCamel}Context",
      apiFunctions: [
        "create_${genName}(attrs) when is_list(attrs)",
        "create_${genName}(${genName}_params) when is_map(${genName}_params)",
        "delete_${genName}(${pluralLowerCamel}) when is_list(${pluralLowerCamel})",
        "delete_${genName}(${genName}_params) when is_map(${genName}_params)",
        "delete_${genName}(id) when is_binary(id)",
        "get_${genName}!(${pluralLowerCamel}) when is_list(${pluralLowerCamel})",
        "get_${genName}!(${genName}_params) when is_map(${genName}_params)",
        "get_${genName}!(id) when is_binary(id)",
        "list_${pluralLowerCamel}(page_query \\ %{})",
        "list_${pluralLowerCamel}_by(entity_queries, page_queries \\ %{})",
        "update_${genName}(${pluralLowerCamel}) when is_list(${pluralLowerCamel})",
        "update_${genName}(attrs) when is_map(attrs)",
        // "custom_api_function(\${key: _value}) when is_binary('guard_clause')",
      ],
    },
    schema: "${singleUpperCamel}",
    databaseTable: "${pluralLowerCamel}",

    // FRONT END
    requests: {
      requestFunctions: [
        "request${singleUpperCamel} = (${pluralLowerCamel}: ${singleUpperCamel}[], dispatch: Dispatch)",
        "create${singleUpperCamel} = (${pluralLowerCamel}: ${singleUpperCamel}[], dispatch: Dispatch)",
        "update${singleUpperCamel} = (${singleLowerCamel}: ${singleUpperCamel}[], dispatch: Dispatch)",
        "delete${singleUpperCamel} = (${singleLowerCamel}: ${singleUpperCamel}[], dispatch: Dispatch)",
        // "customRequest = (%{key: _value}, dispatch: Dispatch)",
      ],
    },
    stateSlice: {
      name: "${singleLowerCamel}Slice",
      reducers: [
        "set${singleUpperCamel} = (state, action)",
        "set${pluralUpperCamel} = (state, action)",
        // "customReducer = (state, {payload: {key: _value}})",
      ],
      selectors: [
        "select${singleUpperCamel} = (state)",
        "select${pluralUpperCamel} = (state)",
        // "customSelector = (%{key: _value})",
      ],
    },
    appstate: "${singleUpperCamel}StoreState",
    tstype: "${singleUpperCamel}",
    factory: true,
    demoComponents: true,
    test: true,
  },
};


/*
                    ****************************
                        *** PRIMITIVES ***

  View and adjust primitive type associations between Elixir and Typescript

            type ex_type = ts_type & { __brand: 'ex_type'  };
                    ****************************
*/
type integer = number & { __brand: "integer" };
type float = number & { __brand: "float" };
type decimal = number & { __brand: "decimal" };
// type string = string & { __brand: 'string'  };
// type boolean = boolean & { __brand: 'boolean'  };
type date = string & { __brand: "date" };
type time = string & { __brand: "time" };
type naive_datetime = string & { __brand: "naive_datetime" };
type utc_datetime = string & { __brand: "utc_datetime" };
type binary = string & { __brand: "binary" };
type array = any[] & { __brand: "array" };
type map = object & { __brand: "map" };
type json = object & { __brand: "json" };
type id = string & { __brand: "id" };
type uuid = string & { __brand: "uuid" };
type binary_id = string & { __brand: "binary_id" };

/*




















                    ****************************
                        *** INTERNAL USE ***

  The following types are unused other than to provide in-editor type checking for the fields above

                    ****************************
*/

interface AllowedTypes {
  [key: string]:
    | integer
    | float
    | decimal
    | string
    | boolean
    | date
    | time
    | naive_datetime
    | utc_datetime
    | binary
    | array
    | map
    | json
    | id
    | uuid
    | binary_id
    // unique types for appstate only
    | ${singleUpperCamel}
    | ${singleUpperCamel}[]
    | null;
}
interface ${singleUpperCamel} {}
type GenType<T extends AllowedTypes> = T;

interface ImmutableGenerator {
  name: string;
  generate: {
    requests?: ImmutableRequests;
    stateSlice?: ImmutableStateSlice;
    http_controller?: ImmutableController;
    channel_controller?: string;
    context?: ImmutableContext;
    databaseTable?: string;
    schema?: string;
    tstype?: string;
    appstate?: string;
    factory?: boolean;
    demoComponents?: boolean;
    test?: boolean;
  };
}

interface ImmutableController {
  name: string;
  routes: string[];
}

interface ImmutableContext {
  name: string;
  apiFunctions: string[];
}

interface ImmutableStateSlice {
  name: string;
  reducers?: string[];
  selectors?: string[];
}

interface ImmutableRequests {
  requestFunctions: string[];
}

export { Immutable };
export type {
  ImmutableGenerator,
  ImmutableGlobal,
  AppState,
  InitialAppState,
  Schema,
  DatabaseTable,
  TsType,
  ImmutableContext,
  ImmutableController,
  ImmutableRequests,
  ImmutableStateSlice,
};
`;
  fs.writeFileSync(`.genfile_${genName}.ts`, tsContent, "utf8");

  log({ level: 1, color: "GREEN" }, `\nCreated .genfile_${genName}.ts`);
  log({ level: 1, color: "BLUE" }, `    in ${file}\n\n`);
};

const update_genfile = () => {
  const fileContent = fs.readFileSync(file, "utf8");
  let updatedContent = fileContent;
  const interfaces = fileContent.match(
    /interface \w+.*?extends GenType<.*?> \{\}/gs
  );
  const parsed = interfaces?.map((str: string) => parse_interface(str));
  const [_, global_def] =
    parsed?.find(([name, _]) => name === "ImmutableGlobal") || [];
  const updated_interfaces = parsed?.map(
    ([_name, definition, _fullstr], i: number) => {
      if (definition.length === 0 && global_def) {
        let res = "";
        interfaces?.[i].replace(
          /interface\s(\w+).*?extends\sGenType<\{(.*?)\}?> \{\}/gs,
          (name, _attr, _str) => {
            res = `interface ${name} extends GenType<{${global_def}}> {}`;
            return res;
          }
        );
        return res;
      } else return interfaces?.[i];
    }
  );

  updated_interfaces?.forEach((interf, index) => {
    if (interf)
      updatedContent = updatedContent.replace(
        interfaces?.[index] || "",
        interf
      );
  });

  fs.writeFileSync(`.genfile_${genName}.ts`, updatedContent, "utf8");

  log({ level: 1, color: "GREEN" }, `\nUpdated .genfile_${genName}.ts`);
  log({ level: 1, color: "BLUE" }, `    in ${file}\n\n`);
};

main();

// Utils

const parse_interface = (str: string): [string, string, string] => {
  const name = str.match(/interface\s(\w+)/)?.[1] || "";
  const attr = str.match(/\w+\:\s\w+/gs)?.join("\n") || "";
  return [name, attr, str];
};
