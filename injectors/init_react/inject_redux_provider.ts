import path from 'path';
import { inject_file, Injection, InjectType } from '../index';

const inject_redux_provider = async (AppNameCamel: string, UiDir: string) => {
    const file = path.join(UiDir, 'src/App.tsx');
    const injections: Injection[] = [
        [InjectType.AFTER, /import\s+['"]\.\/App\.css['"]/, `\nimport { Provider } from 'react-redux';\n import { ${AppNameCamel}Store } from './store';`],
        [InjectType.BEFORE, /<div\s+className=["']App["']\s*>/, `<Provider store={${AppNameCamel}Store}>\n`],
        [InjectType.AFTER, /<\/div>/, `\n</Provider>`]
    ];

    return inject_file({ file, injections});
};

export { inject_redux_provider };