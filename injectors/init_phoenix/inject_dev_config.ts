import path from 'path';
import { inject_file, Injection, InjectType } from '..';

const inject_dev_config = async (AppNameCamel: string, UmbrellaDir: string) => {
    const file = path.join(UmbrellaDir, `config/dev.exs`);
    const injections: Injection[] = [
        [InjectType.BEFORE, /config\s*:\w+\s*,\s*\w+\.\s*Endpoint\s*,/, `config :${AppNameCamel}, CORSPlug, origin: "*"\n`]
    ];

    return inject_file({ file, injections});
};

export { inject_dev_config };