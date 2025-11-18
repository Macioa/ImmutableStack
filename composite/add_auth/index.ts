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
  add_auth_user_json,
  add_auth_user_registration_json_controller,
  add_auth_user_session_json_controller,
  add_auth_user_settings_json_controller,
  add_auth_changeset_json,
  add_auth_user_auth,
  add_auth_repo,
  add_auth_docker_init_db,
  add_auth_router,
  add_auth_migration,
  add_auth_oauth_tokens_migration,
  add_auth_oauth_states_migration,
  add_auth_accounts_migration,
  add_auth_access_control_migration,
  add_auth_oauth_state,
  add_auth_oauth_token,
  add_auth_oauth_controller,
  add_auth_oauth_adapter,
  add_auth_account_schema,
  add_auth_access_group,
  add_auth_access_tag,
  add_auth_account_access,
  add_auth_user_access,
  add_auth_group_tag,
  add_auth_user_menu,
  add_auth_login_modal,
  add_auth_register_modal,
  add_auth_index,
  add_auth_user_requests,
  add_auth_user_response,
  add_auth_user_state,
  add_auth_user_state_test,
} from "../../generators/add_auth";
import {
  add_auth_mix_dependency,
  add_auth_test_config,
  add_auth_application_supervisor,
  add_auth_config_root,
  add_auth_dev_config,
  add_auth_docker_config,
  add_auth_runtime_config,
  add_auth_docker_compose,
  add_auth_custom_compiler,
} from "../../injectors/add_auth";
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
    add_auth_user_json(apiAppData),
    add_auth_user_registration_json_controller(apiAppData),
    add_auth_user_session_json_controller(apiAppData),
    add_auth_user_settings_json_controller(apiAppData),
    add_auth_changeset_json(apiAppData),
    add_auth_oauth_controller(apiAppData),
    add_auth_oauth_adapter(apiAppData),
    add_auth_oauth_state(apiAppData),
    add_auth_oauth_token(apiAppData),
    add_auth_account_schema(apiAppData),
    add_auth_access_group(apiAppData),
    add_auth_access_tag(apiAppData),
    add_auth_account_access(apiAppData),
    add_auth_user_access(apiAppData),
    add_auth_group_tag(apiAppData),
    add_auth_migration(apiAppData),
    add_auth_oauth_tokens_migration(apiAppData),
    add_auth_oauth_states_migration(apiAppData),
    add_auth_accounts_migration(apiAppData),
    add_auth_access_control_migration(apiAppData),
    add_auth_repo(apiAppData),
    add_auth_docker_init_db(apiAppData),
    add_auth_user_menu(apiAppData),
    add_auth_login_modal(apiAppData),
    add_auth_register_modal(apiAppData),
    add_auth_index(apiAppData),
    add_auth_user_requests(apiAppData),
    add_auth_user_response(apiAppData),
    add_auth_user_state(apiAppData),
    add_auth_user_state_test(apiAppData),
  ]);

  log({ level: 2, color: "BLUE" }, "\nApplying authentication configuration updates...");

  const authInjectors = await Promise.all([
    add_auth_mix_dependency(apiAppData),
    add_auth_test_config(apiAppData),
    add_auth_application_supervisor(apiAppData),
    add_auth_config_root(apiAppData),
    add_auth_dev_config(apiAppData),
    add_auth_docker_config(apiAppData),
    add_auth_runtime_config(apiAppData),
    add_auth_docker_compose(apiAppData),
    add_auth_custom_compiler(apiAppData),
  ]);

  log({ level: 2, color: "GREEN" }, "\nAuth enhancements applied successfully.");

  return [...base, ...authGenerators.flat(), ...authInjectors.flat()];
};

export { add_auth };

