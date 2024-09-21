import fs from 'fs';
import pluralize from 'pluralize';

const [,, genName] = process.argv;

if (!genName) {
  console.error('Please provide a name as an argument.');
  process.exit(1);
}

const tsContent = `

const Immutable : ImmutableGenerator = {
  name: "${genName}",
  generate: {
    // BACK END
    http_controller: "${genName}_controller",
    channel_controller: "${genName}_channel",     // Requires Context, Schema, and DatabaseModel
    context: "${capFirst(genName)}Context",       // Requires Schema and DatabaseModel
    schema: "${capFirst(genName)}",               // Requires DatabaseModel
    databaseModel: "${pluralize(genName)}",       // Requires Schema
    
    // FRONT END
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

}> {}
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
    | binary_id;
}
type GenType<T extends AllowedTypes> = T;

interface ImmutableGenerator {
    name: string
    generate: {
      slice?: string
      http_controller?: string
      channel_controller?: string;
      context?: string;
      databaseModel?: string;
      schema?: string;
      tstype?: string;
    }
    test: boolean
}

export { Immutable, ImmutableGlobal, AppState, TransitoryState, Schema, DatabaseModel, TsType };


`;

fs.writeFileSync(`.genfile_${genName}.ts`, tsContent, 'utf8');

console.log(`Created .genfile_${genName}.ts`);




// Utils
function capFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function snakeToCamel(str: string): string {
  return str.toLowerCase().replace(/(_\w)/g, (match) => match[1].toUpperCase());
}