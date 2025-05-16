import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_react_deps = async (UiDir: string) => {
  const file = path.join(UiDir, "package.json");
  const injections: Injection[] = [
    [InjectType.AFTER, /\"scripts\":\s+\{/, `"test": "jest",`],
    [
      InjectType.AFTER,
      /\"dependencies\":\s+\{/,
      `
    "@reduxjs/toolkit": "^2.3.0",
    "@types/react-redux": "^7.1.34",
    "deepmerge": "^4.3.1",
    "react-redux": "^9.1.2",
    "mincurrypipe": "^3.0.0",`,
    ],
    [
      InjectType.AFTER,
      /\"devDependencies\":\s+\{/,
      `
    "@babel/plugin-transform-private-property-in-object": "^7.25.9",
    "@types/node": "^22.10.0",
    "lorem-ipsum": "^2.0.8",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.3.2",`,
    ],
  ];

  return inject_file({ file, injections }, "inject_react_deps");
};

export { inject_react_deps };
