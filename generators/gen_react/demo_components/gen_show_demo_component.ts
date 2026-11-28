import { join } from "@/utils/path";
import { ImmutableGenerator, GenTypes } from "@/commands/immutable_gen";
import { generateFile } from "@/generators/gen_react";

const createProperty = (name: string, singleLowerCamel: string) => {
  return `\${${singleLowerCamel}?.${name}}`;
};

const gen_show_demo_component = async (
  generator: ImmutableGenerator,
  genTypes: GenTypes
) => {
  const {
    name: { singleUpperCamel, singleLowerCamel },
    AppData: { LibDir },
  } = generator;
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

  const content = `import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import type { ${singleUpperCamel} as ${singleUpperCamel}T } from "../../state/${singleUpperCamel}";
import "../styles.css";

interface ${singleUpperCamel}Props {
  ${singleLowerCamel}?: ${singleUpperCamel}T | null;
  effect?: (d: Dispatch) => void;
}

export const ${singleUpperCamel}Render = ({ ${singleLowerCamel} }: ${singleUpperCamel}Props) => {
  if (!${singleLowerCamel}) return null;

  return (
    <dl className="field-list">
      {Object.entries(${singleLowerCamel}).map(([key, value]) => (
        <div className="field-row" key={key}>
          <dt>{key}</dt>
          <dd>{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
};

export const ${singleUpperCamel} = (props: ${singleUpperCamel}Props) => {
  const { ${singleLowerCamel}, effect } = props;
  const dispatch = useDispatch();

  useEffect(() => {
    if (effect) effect(dispatch as Dispatch);
  }, [dispatch, effect]);

  return ${singleLowerCamel} ? (
    <${singleUpperCamel}Render ${singleLowerCamel}={${singleLowerCamel}} />
  ) : (
    <p className="muted">No ${singleUpperCamel} selected</p>
  );
};
`;

  return generateFile(
    { dir: filedir, filename: `show.tsx`, content },
    "gen_show_demo_component"
  );
};

export { gen_show_demo_component };
