import { join } from "../../../utils/path";
import { ImmutableGenerator, GenTypes } from "../../../immutable_gen";
import { generateFile } from "../../";

const gen_list_demo_component = async (
  generator: ImmutableGenerator,
  genTypes: GenTypes
) => {
  const {
    name: {
      singleUpperCamel,
      singleLowerCamel,
      pluralLowerCamel,
      pluralUpperCamel,
    },
    AppData: { LibDir },
  } = generator;

  const filedir = join(
    LibDir || "",
    `lib/typescript/components/${singleLowerCamel}/`
  );

  const content = `import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import type { ${singleUpperCamel} as ${singleUpperCamel}T } from "../../state/${singleUpperCamel}";
import { ${singleUpperCamel} } from "./show";
import "../styles.css";

interface ${singleUpperCamel}Props {
  ${pluralLowerCamel}?: ${singleUpperCamel}T[];
  effect?: (d: Dispatch) => void;
}

export const ${pluralUpperCamel}Render = ({ ${pluralLowerCamel} }: ${singleUpperCamel}Props) => (
  <div>
    <ul className="styled-list">
      {${pluralLowerCamel}?.map((${singleLowerCamel}) => (
        <li className="styled-list-item" key={\`${singleLowerCamel}-\${${singleLowerCamel}?.id}\`}>
          <${singleUpperCamel} ${singleLowerCamel}={${singleLowerCamel}} key={\`${singleLowerCamel}-\${${singleLowerCamel}?.id}\`} />
        </li>
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

  return <${pluralUpperCamel}Render ${pluralLowerCamel}={${pluralLowerCamel}} />;
};`;

  return generateFile(
    { dir: filedir, filename: `list.tsx`, content },
    "gen_list_demo_component"
  );
};

export { gen_list_demo_component };
