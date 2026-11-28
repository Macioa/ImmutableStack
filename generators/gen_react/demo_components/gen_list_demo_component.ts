import { join } from "@/utils/path";
import { ImmutableGenerator, GenTypes } from "@/commands/immutable_gen";
import { generateFile } from "@/generators/gen_react";

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
import "../styles.css";

interface ${singleUpperCamel}Props {
  ${pluralLowerCamel}?: ${singleUpperCamel}T[];
  effect?: (d: Dispatch) => void;
  onSelect?: (${singleLowerCamel}: ${singleUpperCamel}T) => void;
  onDelete?: (${singleLowerCamel}: ${singleUpperCamel}T) => void;
}

// The first field titles the row; the rest read as a short summary
const fields = (${singleLowerCamel}: ${singleUpperCamel}T) =>
  Object.entries(${singleLowerCamel}).filter(([key]) => key !== "id");
const titleOf = (${singleLowerCamel}: ${singleUpperCamel}T) => String(fields(${singleLowerCamel})[0]?.[1] ?? ${singleLowerCamel}.id);
const detailsOf = (${singleLowerCamel}: ${singleUpperCamel}T) =>
  fields(${singleLowerCamel})
    .slice(1)
    .map(([key, value]) => \`\${key} \${value}\`)
    .join(" · ");

export const ${pluralUpperCamel}Render = ({ ${pluralLowerCamel}, onSelect, onDelete }: ${singleUpperCamel}Props) =>
  ${pluralLowerCamel}?.length ? (
    <ul className="styled-list">
      {${pluralLowerCamel}.map((${singleLowerCamel}) => (
        <li className="styled-list-item" key={\`${singleLowerCamel}-\${${singleLowerCamel}?.id}\`}>
          <button
            type="button"
            className="list-item-main"
            onClick={() => onSelect?.(${singleLowerCamel})}
          >
            <span className="list-item-title">{titleOf(${singleLowerCamel})}</span>
            <span className="muted">{detailsOf(${singleLowerCamel})}</span>
          </button>
          {onDelete && (
            <button
              type="button"
              className="icon-btn"
              aria-label={\`Delete \${titleOf(${singleLowerCamel})}\`}
              onClick={() => onDelete(${singleLowerCamel})}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  ) : (
    <p className="muted">No ${pluralUpperCamel} yet</p>
  );

export const ${pluralUpperCamel} = ({ ${pluralLowerCamel}, effect, onSelect, onDelete }: ${singleUpperCamel}Props) => {
  const dispatch = useDispatch(); // Generate a redux dispatch for this component

  useEffect(() => {
    // By passing the effect function through props, we can defer the decision whether this function requests data
    //      or merely renders existing data to the parent component
    if (effect) effect(dispatch as Dispatch);
  }, [dispatch]); // This will fire the effect once on component mount and again if dispatch changes

  return <${pluralUpperCamel}Render ${pluralLowerCamel}={${pluralLowerCamel}} onSelect={onSelect} onDelete={onDelete} />;
};
`;

  return generateFile(
    { dir: filedir, filename: `list.tsx`, content },
    "gen_list_demo_component"
  );
};

export { gen_list_demo_component };
