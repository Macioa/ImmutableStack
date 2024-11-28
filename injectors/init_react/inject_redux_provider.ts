import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_redux_provider = async (AppNameCamel: string, UiDir: string) => {
  const file = path.join(UiDir, "src/App.tsx");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /import\s+['"]\.\/App\.css['"]/,
      `\nimport { Provider } from 'react-redux';\n import { ${AppNameCamel}Store } from './store';`,
    ],
    [InjectType.AFTER, /\<\>/, `\n<Provider store={${AppNameCamel}Store}>`],
    [InjectType.BEFORE, /\<\/\>/, `</Provider>\n`],
  ];

  return inject_file({ file, injections }, "inject_redux_provider");
};

export { inject_redux_provider };
