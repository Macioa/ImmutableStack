import { join } from "path";
import { ImmutableGenerator, GenTypes } from "../../../immutable_gen";
import { generateFile } from "../../";

const gen_list_demo_component = async (
  generator: ImmutableGenerator,
  genTypes: GenTypes
) => {
  const { name, LibDir } = generator;
  const {
    singleUpperCamel,
    singleLowerCamel,
    pluralLowerCamel,
    pluralUpperCamel,
  } = name || {};

  const filedir = join(
    LibDir || "",
    `lib/typescript/components/${singleLowerCamel}/`
  );

  const content = `
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
  select${pluralUpperCamel},
  ${singleUpperCamel} as ${singleUpperCamel}T,
  GenericAppState as AppState,
} from "../../state/${singleUpperCamel}";
import { ${singleUpperCamel} } from "./show";

interface ${singleUpperCamel}Props {
  ${pluralLowerCamel}?: ${singleUpperCamel}T[];
  effect?: (d: Dispatch) => void;
}

export const ${pluralUpperCamel}Render = ({ ${pluralLowerCamel} }: ${singleUpperCamel}Props) => (
  <div>
    <ul>
      {${pluralLowerCamel}?.map((${singleLowerCamel}) => (
        <${singleUpperCamel} ${singleLowerCamel}={${singleLowerCamel}} key={\`${singleLowerCamel}-\${${singleLowerCamel}?.id}\`} />
      ))}
    </ul>
  </div>
);

export const ${pluralUpperCamel} = ({ ${pluralLowerCamel}, effect }: ${singleUpperCamel}Props) => {
  const dispatch = useDispatch(); // Generate a redux dispatch for this component

  useEffect(() => {
    // By passing the effect function through props, we can defer the decision whether this function requests data
    //      or merely renders existing data to the parent component
    if (effect) effect(dispatch as Dispatch);
  }, [dispatch]); // This will fire the effect once on component mount and again if dispatch changes

  return (
    <div>
      <h3>${pluralUpperCamel}</h3>
      <${pluralUpperCamel}Render ${pluralLowerCamel}={${pluralLowerCamel}} />
    </div>
  );
};
  `;

  return generateFile(
    { dir: filedir, filename: `list.tsx`, content },
    "gen_list_demo_component"
  );
};

export { gen_list_demo_component };
