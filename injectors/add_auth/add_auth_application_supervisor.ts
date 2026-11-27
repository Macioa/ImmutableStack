import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_application_supervisor = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
}: ApiAppData) => {
  const file = join(AppDir || "", `${AppNameSnake}/lib/${AppNameSnake}/application.ex`);

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /children = \[/,
      (content: string) => {
        if (content.includes(`${AppNameCamel}.AuthRepo`)) return content;

        return content.replace(
          new RegExp(`(\\s+${AppNameCamel}\\.Repo,\\n)`),
          `$1      ${AppNameCamel}.AuthRepo,\n`
        );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_application_supervisor");
};

export { add_auth_application_supervisor };

