import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { AppData } from "@/readers/get_app_data";

const AUTH_UI_DEPENDENCIES = { antd: "^5.29.3", "@ant-design/icons": "^5.6.1" };

// add_auth generates the UserMenu into the shared TypeScript lib; its presence means auth exists
const has_auth_ui = ({ LibDir }: AppData) => existsSync(join(LibDir, "lib/typescript/components/UserMenu.tsx"));

// The auth components use antd; add it before dependencies are installed for the apps workspace
const add_auth_ui_dependencies = async ({ AppDir }: AppData) => {
  const file = join(AppDir, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  const dependencies = Object.fromEntries(
    Object.entries({ ...pkg.dependencies, ...AUTH_UI_DEPENDENCIES }).sort(([a], [b]) => a.localeCompare(b))
  );
  writeFileSync(file, `${JSON.stringify({ ...pkg, dependencies }, null, 2)}\n`, "utf8");
  return [file];
};

// Applies the injections only once, so wiring a UI twice changes nothing
const inject_once = (file: string, marker: string, injections: Injection[], caller: string) =>
  readFileSync(file, "utf8").includes(marker) ? Promise.resolve([file]) : inject_file({ file, injections }, caller);

// UserMenu reads the signed in user from the UserStore slice
const add_auth_ui_store = (uiDir: string) =>
  inject_once(
    join(uiDir, "src/store/index.tsx"),
    "UserStore: UserReducer",
    [
      [
        InjectType.AFTER,
        /import type \{ RequestsStoreState \} from "@requests\/index";/,
        `\nimport { UserReducer } from "@state/User";\nimport type { UserStoreState } from "@state/User";`,
      ],
      [InjectType.AFTER, /requestsStore: RequestsStoreState;/, `\n  UserStore: UserStoreState;`],
      [InjectType.AFTER, /requestsStore: requestReducer,/, `\n    UserStore: UserReducer,`],
    ],
    "add_auth_ui_store"
  );

// Account icon with sign in / register in the top right of the UI's main page
const add_auth_ui_app = (uiDir: string) =>
  inject_once(
    join(uiDir, "src/App.tsx"),
    "<UserMenu",
    [
      [
        InjectType.AFTER,
        /import \{ PhoenixSocketProvider \} from "@utils\/PhoenixSocketContext";/,
        `\nimport { UserMenu } from "@components/UserMenu";`,
      ],
      [InjectType.AFTER, /<Provider store=\{\w+\}>/, `\n<UserMenu style={{ position: "fixed", top: 16, right: 16 }} />`],
    ],
    "add_auth_ui_app"
  );

// Adds the auth component to one UI, given its folder (apps/<app>_<ui>)
const add_auth_to_ui = async (uiDir: string) => [await add_auth_ui_store(uiDir), await add_auth_ui_app(uiDir)].flat();

// Adds the auth component to every UI in the project
const add_auth_to_all_uis = async ({ UiDirs }: AppData) =>
  (await Promise.all(UiDirs.map(add_auth_to_ui))).flat();

export { add_auth_ui_dependencies, add_auth_to_ui, add_auth_to_all_uis, has_auth_ui };
