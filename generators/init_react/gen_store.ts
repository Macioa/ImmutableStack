import path from "path";
import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_store = async ({ AppNameCamel, AppNameSnake, AppDir }: AppData, uiName: string = 'ui') => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const storePath = join(UiDir, "/src/store");

  const content = `
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { requestReducer } from "@requests/index"; 
import type { RequestsStoreState } from "@requests/index";


type ${AppNameCamel}State = {
    requestsStore: RequestsStoreState;
};

const ${AppNameCamel}Store = configureStore({
  reducer: combineReducers({
    requestsStore: requestReducer,
  }),
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActionPaths: ['payload.details.callback', 'payload.request'],
      ignoredPaths: ["requestsStore.activeRequests"],
    },
  }),
    // devTools: {
    // actionsDenylist: ['add_request', 'complete_request'],
    // },
});

export { ${AppNameCamel}Store };
export type { ${AppNameCamel}State };
        `;

  return generateFile(
    { dir: storePath, filename: "index.tsx", content },
    "gen_store"
  );
};

export { gen_store };
