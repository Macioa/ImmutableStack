import { join } from "../../../utils/path";
import { ImmutableGenerator, GenTypes } from "../../../immutable_gen";
import { generateFile } from "../../";

const gen_full_demo_component = async (
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

  const content = `
import React from "react";
import { useSelector } from "react-redux";
import type { Dispatch } from "redux";
import { pipe } from "mincurrypipe";
import type { ${singleUpperCamel} as ${singleUpperCamel}T } from "../../state/${singleUpperCamel}";
import { select${singleUpperCamel}, select${pluralUpperCamel}, setFrog } from "../../state/${singleUpperCamel}";
import { request${pluralUpperCamel}, update${singleUpperCamel} } from "../../requests/${singleLowerCamel}";
import { Create${singleUpperCamel} } from "./create";
import { ${pluralUpperCamel} } from "./list";
import { ${singleUpperCamel} } from "./show";

export const prevtDef = (e: React.FormEvent<HTMLFormElement>) =>
  e.preventDefault();

export const ${singleUpperCamel}Demo = () => {
  const ${singleLowerCamel} = useSelector(select${singleUpperCamel});
  const ${pluralLowerCamel} = useSelector(select${pluralUpperCamel});

  return (
    <div>
      <h1>${singleUpperCamel} Demo</h1>
      <p>This is a demo of ${singleLowerCamel} components.</p>
      <h2>My ${singleUpperCamel}</h2>
      <${singleUpperCamel} ${singleLowerCamel}={${singleLowerCamel}} />
      <h2>New ${singleUpperCamel}</h2>
      <CreateFrog
        onSubmit={(
          e: React.FormEvent<HTMLFormElement>,
          f: FrogT | null,
          d: Dispatch
        ) =>
          pipe(
            prevtDef(e),
            () => f && updateFrog(f, d),
            setFrog,
            d,
            () => requestFrogs(d)
          )
        }
      />
      <h2>All ${pluralUpperCamel}</h2>
      <${pluralUpperCamel} ${pluralLowerCamel}={${pluralLowerCamel}} effect={request${pluralUpperCamel}} />
    </div>
  );
};
  `;

  return generateFile(
    { dir: filedir, filename: `index.tsx`, content },
    "gen_full_demo_component"
  );
};

export { gen_full_demo_component };
