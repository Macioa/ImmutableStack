import path from 'path';
import { inject_file, Injection, InjectType } from '../index';

const inject_web_endpoint = async (AppNameCamel: string, WebDir: string) => {
    const file = path.join(WebDir, `lib/${AppNameCamel}_web/endpoint.ex`);
    const injections: Injection[] = [
        [InjectType.BEFORE, /plug\sPlug\.MethodOverride/, `plug CORSPlug, origin: Application.compile_env(:${AppNameCamel}, CORSPlug)[:origin]\n`]
    ];

    return inject_file({ file, injections });
};

export { inject_web_endpoint };