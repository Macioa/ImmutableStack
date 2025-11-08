import { add_api } from "../add_api";
import { ApiAppData } from "../../generators/add_api";
import {
  add_auth_accounts_context,
  add_auth_user_schema,
  add_auth_user_token,
  add_auth_user_notifier,
  add_auth_user_confirmation_controller,
  add_auth_user_registration_controller,
  add_auth_user_reset_password_controller,
  add_auth_user_session_controller,
  add_auth_user_settings_controller,
  add_auth_user_auth,
  add_auth_router,
  add_auth_migration,
} from "../../generators/add_auth";
import { add_auth_mix_dependency, add_auth_test_config } from "../../injectors/add_auth";
import { log } from "../../utils/logger";

const add_auth = async (apiAppData: ApiAppData) => {
  const { AppNameSnake, ApiNameSnake } = apiAppData;

  log({ level: 2, color: "BLUE" }, `\nGenerating base API for ${AppNameSnake}_${ApiNameSnake}...`);
  const base = await add_api(apiAppData);

  log({ level: 2, color: "BLUE" }, "\nAdding authentication modules...");

  const authGenerators = await Promise.all([
    add_auth_accounts_context(apiAppData),
    add_auth_user_schema(apiAppData),
    add_auth_user_token(apiAppData),
    add_auth_user_notifier(apiAppData),
    add_auth_user_auth(apiAppData),
    add_auth_router(apiAppData),
    add_auth_user_confirmation_controller(apiAppData),
    add_auth_user_registration_controller(apiAppData),
    add_auth_user_reset_password_controller(apiAppData),
    add_auth_user_session_controller(apiAppData),
    add_auth_user_settings_controller(apiAppData),
    add_auth_migration(apiAppData),
  ]);

  log({ level: 2, color: "BLUE" }, "\nApplying authentication configuration updates...");

  const authInjectors = await Promise.all([
    add_auth_mix_dependency(apiAppData),
    add_auth_test_config(apiAppData),
  ]);

  log({ level: 2, color: "GREEN" }, "\nAuth enhancements applied successfully.");

  return [...base, ...authGenerators.flat(), ...authInjectors.flat()];
};

export { add_auth };

