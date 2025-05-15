import path from "path";
import { inject_file, InjectType, Injection } from "../index";
import { ImmutableGenerator } from "../../immutable_gen";

const inject_router = async (generator: ImmutableGenerator) => {
  const {
    generate,
    name,
    AppData: { AppNameSnake, WebDir },
  } = generator || {};
  const { singleSnake: resource } = name || {};
  const { http_controller } = generate || {};
  const { name: controller } = http_controller || {};
  const file = path.join(WebDir || ".", `lib/${AppNameSnake}_web/router.ex`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /pipe_through[\s\(]{1,3}:api\){0,1}/,
      `\nresources "/${resource}", ${controller}` +
        `\nput "/${resource}", ${controller}, :update` +
        `\ndelete "/${resource}", ${controller}, :delete`,
    ],
  ];

  return inject_file({ file, injections }, "inject_router");
};

export { inject_router };
