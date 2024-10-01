import { join } from 'path'
import { generateFile } from "./index";

const gen_store = async (AppName: string, UiDir: string) => {
    const storePath = join(UiDir, "/src/store");

    const content = `
import { configureStore, combineReducers } from "@reduxjs/toolkit";

type ${AppName}State = {
    // AppState here Key: Value
};

const ${AppName}Store = configureStore({
  reducer: combineReducers({
    // Reducers here Key: Value
  }),
});

export { ${AppName}Store };
export type { ${AppName}State };
        `;

    return generateFile({ dir: storePath, filename: "index.ts", content });
};

export { gen_store };
