import path from "path";
import { inject_file, InjectType, Injection } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_scrinever = async ({ LibDir, AppNameSnake }: AppData) => {
  const file = path.join(LibDir || ".", `lib/${AppNameSnake}/repo.ex`);
  const injections: Injection[] = [
    [InjectType.BEFORE, /end[\s\n]*$/, `  use Scrivener\n`],
  ];

  return inject_file({ file, injections }, "inject_scrinever");
};

export { inject_scrinever };
