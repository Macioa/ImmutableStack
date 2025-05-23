import { join } from "../../../utils/path";
import { ImmutableGenerator, GenTypes } from "../../../immutable_gen";
import { generateFile } from "../../";
import { StringOnlyMap } from "../../../utils/map";

enum JsToInputType {
  string = "text",
  number = "number",
  boolean = "checkbox",
  date = "date",
  email = "email",
  password = "password",
}

const createPropertyField = (
  name: string,
  type: string,
  singleLowerCamel: string
) => {
  return ` 
  <label htmlFor="${name}">${name}</label>
  <input
    type="${JsToInputType[type as keyof typeof JsToInputType] || "text"}"
    name="${name}"
    value={${singleLowerCamel}?.${name} ?? ""}
    onChange={onChange}
  />
  `;
};

const gen_create_demo_component = async (
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

  const propertyFields = Object.keys(source)
    .map((k) => {
      return createPropertyField(
        k,
        (source as StringOnlyMap)[k],
        singleLowerCamel
      );
    })
    .join("\n");

  const content = `
  import React, { useState } from "react";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import type { ${singleUpperCamel} as ${singleUpperCamel}T } from "../../state/${singleUpperCamel}";

interface CreateProps {
  onSubmit?: (
    e: React.FormEvent<HTMLFormElement>,
    f: ${singleUpperCamel}T | null,
    d: Dispatch
  ) => void;
  submitText?: string;
}

export const ${singleUpperCamel}Form = ({ onSubmit, submitText }: CreateProps) => {
  const dispatch = useDispatch();
  const [${singleLowerCamel}, set${singleUpperCamel}] = useState<${singleUpperCamel}T | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    set${singleUpperCamel}((prev${singleUpperCamel}) => {
      return { ...prev${singleUpperCamel}, [name]: value } as ${singleUpperCamel}T;
    });
  };

  return (
    <form className="form-container"
      onSubmit={(e: React.FormEvent<HTMLFormElement>) =>
        onSubmit && onSubmit(e, ${singleLowerCamel}, dispatch)
      }
    >
      <h4 className="form-title">${singleUpperCamel} Form</h4>

    ${propertyFields}
      
      <button type="submit" className="form-submit-btn">{submitText || "Submit"}</button>
    </form>
  );
};

export const Create${singleUpperCamel} = ({ onSubmit }: CreateProps) => (
  <div>
    <h4>Create a ${singleUpperCamel}</h4>
    <${singleUpperCamel}Form onSubmit={onSubmit} submitText="Create a ${singleUpperCamel}"/>
  </div>
);
  `;

  return generateFile(
    { dir: filedir, filename: `create.tsx`, content },
    "gen_create_demo_component"
  );
};

export { gen_create_demo_component };
