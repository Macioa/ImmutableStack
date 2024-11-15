import path from "path";
import { inject_file, InjectType, Injection } from "../index";
import { ImmutableGenerator } from "../../generators/gen_controller";

const inject_router = async (generator: ImmutableGenerator) => {
  const { WebDir, generate, AppNameSnake, name: resource } = generator || {};
  const { http_controller } = generate || {};
  const { name: controller } = http_controller || {};
  const file = path.join(WebDir || ".", `lib/${AppNameSnake}_web/router.ex`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /pipe_through :api/,
      `\nresources "/${resource}", ${controller}` +
        `\nput "/${resource}", ${controller}, :update` +
        `\ndelete "/${resource}", ${controller}, :delete`,
    ],
  ];

  return inject_file({ file, injections });
};

export { inject_router };
