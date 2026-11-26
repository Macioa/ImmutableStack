import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";
import { OAUTH_PROVIDERS, OAuthProvider } from "./oauth_providers";

const oauthDir = ({ AppDir, AppNameSnake, ApiNameSnake }: ApiAppData) =>
  join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/oauth`);

const providerModule = (ApiNameCamel: string, { key, module, label, spec }: OAuthProvider) =>
  `defmodule ${ApiNameCamel}.OAuth.Providers.${module} do
  @moduledoc "${label} sign in. Keys live in config/<env>/external_service_keys/oauth.exs."

  use ${ApiNameCamel}.OAuth.Provider,
    name: :${key},
    label: "${label}",
    ${spec.join(",\n    ")}
end
`;

const add_auth_oauth_provider = (apiAppData: ApiAppData, provider: OAuthProvider) =>
  generateFile(
    {
      dir: join(oauthDir(apiAppData), "providers"),
      filename: `${provider.key}.ex`,
      content: providerModule(apiAppData.ApiNameCamel, provider),
    },
    "add_auth_oauth_provider"
  );

const add_auth_oauth_providers = async (apiAppData: ApiAppData) =>
  (await Promise.all(OAUTH_PROVIDERS.map((provider) => add_auth_oauth_provider(apiAppData, provider)))).flat();

export { add_auth_oauth_providers, oauthDir };
