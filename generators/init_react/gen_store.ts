import { join } from "path";
import { generateFile } from "../index";

const gen_store = async (AppName: string, UiDir: string) => {
  const storePath = join(UiDir, "/src/store");

  const content = `
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { requestReducer } from "@requests/index"; 
import type { RequestsStoreState } from "@requests/index";


type ${AppName}State = {
    requestsStore: RequestsStoreState;
};

const ${AppName}Store = configureStore({
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

export { ${AppName}Store };
export type { ${AppName}State };
        `;

  return generateFile(
    { dir: storePath, filename: "index.tsx", content },
    "gen_store",
  );
};

export { gen_store };
