import { executeAllSync as execAllSync, Execution } from "../../runners";

import { gen_lorem_utils } from "../../generators/init_react/gen_lorem_utils";
import { gen_request_lib } from "../../generators/init_react/gen_request_lib";
import { gen_store } from "../../generators/init_react/gen_store";
import { inject_redux_provider } from "../../injectors/init_react/inject_redux_provider";

const build_tool_agnostic_init_tasks = async (
  projectNameCamel: string,
  uidir: string
) => {
  const frontEndSyncCommands: Execution[] = [
    "npm i --save-dev @types/node",
    "npm install @reduxjs/toolkit react-redux @types/react-redux",
    "npm install --save-dev @babel/plugin-transform-private-property-in-object",
    "npm install --save-dev lorem-ipsum",
    "npm install deepmerge",
    // "npm install @mui/material @emotion/react @emotion/styled"
  ].map((c) => ({ command: c, dir: uidir }));
  const installs = await execAllSync(frontEndSyncCommands);

  const tasks = await Promise.all([
    gen_store(projectNameCamel, uidir),
    inject_redux_provider(projectNameCamel, uidir),
    // gen_react_config(projectNameCamel, uidir),
    gen_lorem_utils(projectNameCamel, uidir),
    gen_request_lib(projectNameCamel, uidir),
  ]).catch(console.error);

  return [installs, tasks].flat();
};

export { build_tool_agnostic_init_tasks };