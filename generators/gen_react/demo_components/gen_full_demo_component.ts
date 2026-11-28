import { join } from "@/utils/path";
import { ImmutableGenerator, GenTypes } from "@/commands/immutable_gen";
import { generateFile } from "@/generators/gen_react";

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

  const content = `import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Dispatch } from "redux";
import type { ${singleUpperCamel} as ${singleUpperCamel}T } from "../../state/${singleUpperCamel}";
import { select${singleUpperCamel}, select${pluralUpperCamel}, set${singleUpperCamel} } from "../../state/${singleUpperCamel}";
import { create${singleUpperCamel}, delete${singleUpperCamel}, request${pluralUpperCamel} } from "../../requests/${singleUpperCamel}";
import { isLoading } from "../../requests";
import type { GenericAppState } from "../../requests";
import { Create${singleUpperCamel} } from "./create";
import { ${pluralUpperCamel} } from "./list";
import { ${singleUpperCamel} } from "./show";
import "../styles.css";

export const prevtDef = (e: React.FormEvent<HTMLFormElement>) =>
  e.preventDefault();

// Requests run through Request.API: their callbacks update the ${singleUpperCamel} slice,
// and the requests store tracks them for the loading state.
export const ${singleUpperCamel}Demo = () => {
  const dispatch = useDispatch<Dispatch>();
  const ${singleLowerCamel} = useSelector(select${singleUpperCamel});
  const ${pluralLowerCamel} = useSelector(select${pluralUpperCamel});
  const loading = useSelector((s: GenericAppState) =>
    isLoading(s, "fetch${pluralUpperCamel}"),
  );
  const [error, setError] = useState<string | null>(null);

  const run = (request: Promise<unknown>) =>
    request
      .then(() => setError(null))
      .then(() => request${pluralUpperCamel}(dispatch))
      .catch((e: Error) => setError(e.message));

  const onCreate = (
    e: React.FormEvent<HTMLFormElement>,
    f: ${singleUpperCamel}T | null,
    d: Dispatch,
  ) => {
    prevtDef(e);
    if (f) run(create${singleUpperCamel}(f, d));
  };

  const onDelete = ({ id }: ${singleUpperCamel}T) => run(delete${singleUpperCamel}(String(id), dispatch));

  return (
    <div className="demo-grid">
      <Create${singleUpperCamel} onSubmit={onCreate} />
      <div className="demo-column">
        <h3 className="section-label">Selected ${singleUpperCamel}</h3>
        <${singleUpperCamel} ${singleLowerCamel}={${singleLowerCamel}} />
        <div className="section-row">
          <h3 className="section-label">
            All ${pluralUpperCamel} {loading && <span className="muted">loading…</span>}
          </h3>
          <button
            type="button"
            className="icon-btn"
            aria-label="Reload ${pluralUpperCamel}"
            onClick={() => run(Promise.resolve())}
          >
            ↻
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
        <${pluralUpperCamel}
          ${pluralLowerCamel}={${pluralLowerCamel}}
          effect={(d) =>
            request${pluralUpperCamel}(d).catch((e: Error) => setError(e.message))
          }
          onSelect={(t) => dispatch(set${singleUpperCamel}(t))}
          onDelete={onDelete}
        />
      </div>
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
