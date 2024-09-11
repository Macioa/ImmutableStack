const fs = require('fs');
const path = require('path');

// Get the string argument from the command line
const [,, genName] = process.argv;
console.log("GENNAME", genName)

if (!genName) {
  console.error('Please provide a name as an argument.');
  process.exit(1);
}

// Template object
const tsContent = `

const Immutable : ImmutableGenerator = {
  name: "${genName}",
  generate: {
    slice: "${genName}Slice",
    http_controller: "${genName}_controller",
    channel_controller: "${genName}_channel",
    databaseModel: "${genName}",
    schema: "${genName}",
    tstype: "${genName}"
  },
  test: true
}

/*                  DECLARATIONS

   Global will be used when other types are not specified. If all types are specified, Global will be ignored. 
       If genfile is run again with the same argument, global will be propagated to all other types which can then be customized.
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
interface Model extends GenType<{

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
      databaseModel?: string;
      schema?: string;
      tstype?: string;
    }
    test: boolean
}

export { Immutable, ImmutableGlobal, AppState, TransitoryState, Schema, Model, TsType };


`;

const test = "test"

// Define the output file path
const outputPath = path.join(__dirname, `.genfile_${genName}.ts`);

// Write the TypeScript content to the file
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log(`Template written to ${outputPath}`);