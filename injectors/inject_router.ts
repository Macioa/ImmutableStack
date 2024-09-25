import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { log } from '../utils/logger';

const inject_router = async (generator: any) => {
    const gen = generator.generate;
    return new Promise((resolve, reject) => {
      log(5, `Adding route to router for ${gen.databaseModel}.`);
      const routerPath = path.join(generator.WebDir, `lib/${generator.AppNameSnake}_web/router.ex`);
      let routerContent = fs.readFileSync(routerPath, "utf8");
  
      const import_index = routerContent.search(/use \w+Web, \:router/);
      const route_index = routerContent.search(/pipe_through \:api/);
      const moduleStr = gen.http_controller
        .toLowerCase()
        .split("_")
        .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
  
      const route_str = `    resources "/${gen.databaseModel}", ${moduleStr}\n #,         except: [:new, :edit]`;
      const import_str = `alias ${generator.AppNameCamel}Web.${moduleStr}`;
  
      [
        [import_str, import_index],
        [route_str, route_index],
      ].forEach(([str, index]) => {
        index = parseInt(index as string, 10);
        if (index !== -1) {
          const i = routerContent.indexOf("\n", index) + 2;
          routerContent =
            routerContent.slice(0, i) + `${str}\n` + routerContent.slice(i);
        } else {
          console.error(`${str} not found in the router.ex file.`);
          reject(null);
        }
      });
  
      fs.writeFileSync(routerPath, routerContent, "utf8");
      execSync(`mix format ${routerPath}`, {
        stdio: "inherit",
      });
      resolve([routerPath]);
    });
  };

  export { inject_router };