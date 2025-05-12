import { join } from "path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_store = async ({ AppNameSnake, UiDir }: AppData) => {
  const storePath = join(UiDir, "/src/store");

  const content = `
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { requestReducer } from "@requests/index"; 
import type { RequestsStoreState } from "@requests/index";


type ${AppNameSnake}State = {
    requestsStore: RequestsStoreState;
};

const ${AppNameSnake}Store = configureStore({
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

export { ${AppNameSnake}Store };
export type { ${AppNameSnake}State };
        `;

  return generateFile(
    { dir: storePath, filename: "index.tsx", content },
    "gen_store"
  );
};

export { gen_store };
