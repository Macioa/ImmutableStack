import { join } from 'path'
import { generateFile } from "./index";

const gen_store = async (AppName: string, UiDir: string) => {
    const storePath = join(UiDir, "/src/store");

    const literal = "`${requestsKey}/activeRequests`"

    const content = `
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { requestsKey, RequestsStoreState, requestReducer } from "../requests"; 

type ${AppName}State = {
    [requestsKey]: RequestsStoreState;
};

const ${AppName}Store = configureStore({
  reducer: combineReducers({
    [requestsKey]: requestReducer,
  }),
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActionPaths: ['payload.details.callback', 'payload.request'],
      ignoredPaths: [${literal}],
    },
  }),
});

export { ${AppName}Store };
export type { ${AppName}State };
        `;

    return generateFile({ dir: storePath, filename: "index.ts", content });
};

export { gen_store };
