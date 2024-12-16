import { join } from "path";
import { ImmutableGenerator, GenTypes } from "../../../immutable_gen";
import { generateFile } from "../../";

const createProperty = (name: string, singleLowerCamel: string) => {
  return `\${${singleLowerCamel}?.${name}}`;
};

const gen_show_demo_component = async (
  generator: ImmutableGenerator,
  genTypes: GenTypes
) => {
  const { name, LibDir } = generator;
  const { singleUpperCamel, singleLowerCamel } = name || {};
  const sourceType = genTypes.TsType || genTypes.ImmutableGlobal;
  const source = sourceType?.ts || {};

  const filedir = join(
    LibDir || "",
    `lib/typescript/components/${singleLowerCamel}/`
  );

  const properties = Object.keys(source || {})
    .map((k) => {
      return createProperty(k, singleLowerCamel);
    })
    .join(" ");

  const content = `
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { ${singleUpperCamel} as ${singleUpperCamel}T } from "../../state/${singleUpperCamel}";

interface ${singleUpperCamel}Props {
  ${singleLowerCamel}?: ${singleUpperCamel}T | null;
  effect?: (d: Dispatch) => void;
}

export const ${singleUpperCamel}Render = ({ ${singleLowerCamel} }: ${singleUpperCamel}Props) => (
  <div>
    <h4>${singleUpperCamel}:</h4>
    <p>
      \`${properties}\`
    </p>
  </div>
);

export const ${singleUpperCamel} = (props: ${singleUpperCamel}Props) => {
  const { ${singleLowerCamel}, effect } = props;
  const dispatch =useDispatch(); // Generate a redux dispatch for this component

  useEffect(() => {
    // By passing the effect function through props, we can defer the decision whether this function requests data
    //      or merely renders existing data to the parent component
    if (effect) effect(dispatch as Dispatch);
  }, [dispatch]); // This will fire the effect once on component mount

  return (
    <div>{${singleLowerCamel} ? <${singleUpperCamel}Render ${singleLowerCamel}={${singleLowerCamel}} /> : <p> No ${singleUpperCamel} selected</p>}</div>
  );
};
  `;

  return generateFile(
    { dir: filedir, filename: `show.tsx`, content },
    "gen_show_demo_component"
  );
};

export { gen_show_demo_component };
