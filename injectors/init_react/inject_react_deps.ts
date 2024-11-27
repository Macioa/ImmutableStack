import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_react_deps = async (UiDir: string) => {
  const file = path.join(UiDir, "package.json");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /\"dependencies\":\s+\{/,
      `
    "@reduxjs/toolkit": "^2.3.0",
    "@types/react-redux": "^7.1.34",
    "deepmerge": "^4.3.1",
    "react-redux": "^9.1.2",`,
    ],
    [
        InjectType.AFTER,
        /\"devDependencies\":\s+\{/,
        `
    "@babel/plugin-transform-private-property-in-object": "^7.25.9",
    "@types/node": "^22.10.0",
    "lorem-ipsum": "^2.0.8",`
    ]
  ];

  return inject_file({ file, injections });
};

export { inject_react_deps };
