import path from 'path';
import { inject_file, InjectType, Injection } from './index'


const inject_router = async (generator: any) => {
    const gen = generator.generate;
    const file = path.join(generator.WebDir, `lib/${generator.AppNameSnake}_web/router.ex`);
    const injections: Injection[] = [
        [InjectType.AFTER, /pipe_through :api/, `\nresources "/${gen.databaseModel}", ${gen.http_controller}`]
    ];

    return inject_file({ file, injections });
};

export { inject_router };