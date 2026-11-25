import { readFileSync, writeFileSync } from "fs";
import { join } from "@/utils/path";
import { inject_file, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const AUTH_UI_DEPENDENCIES = { antd: "^5.29.3", "@ant-design/icons": "^5.6.1" };

const uiDir = ({ AppDir, AppNameSnake }: ApiAppData, uiName: string) => join(AppDir || "", `${AppNameSnake}_${uiName}`);

// The auth components use antd; add it before deps.get installs the shared apps workspace
const add_auth_ui_dependencies = async ({ AppDir }: ApiAppData) => {
  const file = join(AppDir || "", "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  const dependencies = Object.fromEntries(
    Object.entries({ ...pkg.dependencies, ...AUTH_UI_DEPENDENCIES }).sort(([a], [b]) => a.localeCompare(b))
  );
  const updated = { ...pkg, dependencies };
  writeFileSync(file, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  return [file];
};

// UserMenu reads the signed in user from the UserStore slice
const add_auth_ui_store = (apiAppData: ApiAppData, uiName: string) =>
  inject_file(
    {
      file: join(uiDir(apiAppData, uiName), "src/store/index.tsx"),
      injections: [
        [
          InjectType.AFTER,
          /import type \{ RequestsStoreState \} from "@requests\/index";/,
          `\nimport { UserReducer } from "@state/User";\nimport type { UserStoreState } from "@state/User";`,
        ],
        [InjectType.AFTER, /requestsStore: RequestsStoreState;/, `\n  UserStore: UserStoreState;`],
        [InjectType.AFTER, /requestsStore: requestReducer,/, `\n    UserStore: UserReducer,`],
      ],
    },
    "add_auth_ui_store"
  );

// Account icon with sign in / register in the top right of the main page
const add_auth_ui_app = (apiAppData: ApiAppData, uiName: string) =>
  inject_file(
    {
      file: join(uiDir(apiAppData, uiName), "src/App.tsx"),
      injections: [
        [
          InjectType.AFTER,
          /import \{ PhoenixSocketProvider \} from "@utils\/PhoenixSocketContext";/,
          `\nimport { UserMenu } from "@components/UserMenu";`,
        ],
        [InjectType.AFTER, /<Provider store=\{\w+\}>/, `\n<UserMenu style={{ position: "fixed", top: 16, right: 16 }} />`],
      ],
    },
    "add_auth_ui_app"
  );

const add_auth_ui_wiring = async (apiAppData: ApiAppData, uiName: string = "ui") => [
  await add_auth_ui_store(apiAppData, uiName),
  await add_auth_ui_app(apiAppData, uiName),
];

export { add_auth_ui_dependencies, add_auth_ui_wiring };
