import { gen_cursorrules } from "./gen_cursorrules";
import { gen_cursorrules_phoenix } from "./gen_cursorrules_phoenix";
import { gen_cursorrules_react } from "./gen_cursorrules_react";
import { gen_gitignore } from "./gen_gitignore";
import { gen_gitignore_phoenix } from "./gen_gitignore_phoenix";
import { gen_gitignore_react } from "./gen_gitignore_react";
import { gen_readme } from "./gen_readme";
import { gen_readme_phoenix } from "./gen_readme_phoenix";
import { gen_readme_react } from "./gen_readme_react";
import { gen_dev_config_env } from "./gen_devcfgenv";
import { gen_docker_config_env } from "./gen_dockercfgenv";

const gen_all_configs = async (appdata: any, uiName: string = 'ui') =>
  Promise.all([
    gen_gitignore(appdata),
    gen_gitignore_phoenix(appdata),
    gen_gitignore_react(appdata, uiName),
    gen_cursorrules(appdata),
    gen_cursorrules_phoenix(appdata),
    gen_cursorrules_react(appdata, uiName),
    gen_readme(appdata),
    gen_readme_phoenix(appdata),
    gen_readme_react(appdata, uiName),
  ]);

export {
  gen_all_configs,
  gen_cursorrules,
  gen_cursorrules_phoenix,
  gen_cursorrules_react,
  gen_gitignore,
  gen_gitignore_phoenix,
  gen_gitignore_react,
  gen_readme,
  gen_readme_phoenix,
  gen_readme_react,
  gen_dev_config_env,
  gen_docker_config_env,
};
