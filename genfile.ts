import fs from "fs";
import { join } from "path";
import pluralize from "pluralize";

const [, , genName] = process.argv;
const file = join(process.cwd(), `.genfile_${genName}.ts`);

if (!genName) {
  console.error("Please provide a name as an argument.");
  process.exit(1);
}

const main = () => (fs.existsSync(file) ? update_genfile() : new_genfile());

const new_genfile = () => {
  const pluralName = pluralize(genName);
  const tsContent = `
const Immutable : ImmutableGenerator = {
  name: '${genName}',
  generate: {
    // BACK END
    http_controller: {
      name: '${capFirst(genName)}Controller',
      routes: [
        'routed_index(conn, entity_queries, page_queries) when entity_queries == %{}',
        'routed_index(conn, entity_queries, page_queries) when entity_queries != %{}',
        'create(conn, ${genName}_list) when is_list(${genName}_list)',
        'create(conn, ${genName}_params)',
        'show(conn, ${genName}_list) when is_list(${genName}_list)',
        'show(conn, %{"id" => id})',
        'update(conn, ${genName}_list) when is_list(${genName}_list)',
        'update(conn, ${genName}_params) when is_map(${genName}_params)',
        'delete(conn, ${genName}_list) when is_list(${genName}_list)',
        'delete(conn, %{"id" => id})'
      ]
    },
    channel_controller: '${genName}_channel',     // Requires Context, Schema, and DatabaseModel
    context: {
      name: '${capFirst(genName)}Context',
      apiFunctions: [
      'create_${genName}(attrs) when is_list(attrs)',
      'create_${genName}(${genName}_params) when is_map(${genName}_params)',
      'delete_${genName}(${pluralName}) when is_list(${pluralName})',
      'delete_${genName}(${genName}_params) when is_map(${genName}_params)',
      'delete_${genName}(id) when is_binary(id)',
      'get_${genName}!(${pluralName}) when is_list(${pluralName})',
      'get_${genName}!(${genName}_params) when is_map(${genName}_params)',
      'get_${genName}!(id) when is_binary(id)',
      'list_${pluralName}(page_query \\\\ %{})',
      'list_${pluralName}_by(entity_queries, page_queries \\\\ %{})',
      'update_${genName}(${pluralName}) when is_list(${pluralName})',
      'update_${genName}(attrs) when is_map(attrs)'
      ]
    },  
    schema: "${capFirst(genName)}",               // Requires DatabaseModel
    databaseModel: "${pluralName}",       // Requires Schema
    
    // FRONT END
    appstate: "${capFirst(genName)}StoreState",
    factory: true,
    slice: "${genName}Slice",
    tstype: "${capFirst(genName)}"
  },
  test: true
}

/*                  DECLARATIONS

   Global will be used when other types are not specified. If all types are specified, Global will be ignored. 
       If genfile is run again with the same name argument, global will be propagated to all other types which can then be customized.
*/
interface ImmutableGlobal
  extends GenType<{
    example1: integer;
    example2: string;
    example3: float;
  }> {}

interface AppState extends GenType<{
  ${genName}: ${capFirst(genName)} | null;
  ${pluralName}: ${capFirst(genName)}[];
}> {}
interface InitialAppState extends AppState {
  ${genName}: null;
  ${pluralName}: [];
}
interface TransitoryState extends GenType<{

}> {}
interface Schema extends GenType<{

}> {}
interface DatabaseModel extends GenType<{

}> {}
interface TsType extends GenType<{
  
}> {}

/*                   AVAILABLE TYPES

   The following ecto types, with their default typescript equivalents, are available for assignment
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

/*                   INTERNAL

  The following types are unused other than to provide type checking for the fields above

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
    | ${capFirst(genName)}
    | ${capFirst(genName)}[]
    | null;
}
interface ${capFirst(genName)} {}
type GenType<T extends AllowedTypes> = T;

interface ImmutableGenerator {
    name: string
    generate: {
      slice?: string
      http_controller?: ImmutableController;
      channel_controller?: string;
      context?: ImmutableContext;
      databaseModel?: string;
      schema?: string;
      tstype?: string;
      appstate?: string;
      factory?: boolean;
    }
    test: boolean
}

interface ImmutableController {
    name: string;
    routes: string[];
}

interface ImmutableContext {
    name: string;
    apiFunctions: string[];
}

export { Immutable }
export type { ImmutableGenerator, ImmutableGlobal, AppState, InitialAppState, TransitoryState, Schema, DatabaseModel, TsType }
`;

  fs.writeFileSync(`.genfile_${genName}.ts`, tsContent, "utf8");

  console.log(`Created .genfile_${genName}.ts`);
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
  const updated_interfaces = parsed?.map(([_name, definition, _fullstr], i: number) => {
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
  });

  updated_interfaces?.forEach((interf, index) => {
    if (interf)
      updatedContent = updatedContent.replace(
        interfaces?.[index] || "",
        interf
      );
  });

  fs.writeFileSync(`.genfile_${genName}.ts`, updatedContent, "utf8");

  console.log(`Updated .genfile_${genName}.ts`);
};

const parse_interface = (str: string): [string, string, string] => {
  const name = str.match(/interface\s(\w+)/)?.[1] || "";
  const attr = str.match(/\w+\:\s\w+/gs)?.join("\n") || "";
  return [name, attr, str];
};

// Utils
function capFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function snakeToCamel(str: string): string {
  return str.toLowerCase().replace(/(_\w)/g, (match) => match[1].toUpperCase());
}

main();
