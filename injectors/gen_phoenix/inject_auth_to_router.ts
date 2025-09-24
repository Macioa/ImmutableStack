import { inject_file, Injection, InjectType } from "..";
import { ImmutableGenerator } from "../../immutable_gen";

import { join } from "../../utils/path";

const inject_auth_to_router = async ({
  AppData: { WebDir, AppNameCamel },
}: ImmutableGenerator) => {
  const file = join(WebDir, "lib/auth_web/router.ex");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /use\s+\w+Web,\s+:router/g,
      `\npipeline :auth do
  plug Ueberauth
end

scope "/auth", ${AppNameCamel}Web do
  pipe_through :browser

  get "/:provider", AuthController, :request
  get "/:provider/callback", AuthController, :callback
end`,
    ],
    [
      InjectType.AFTER,
      /scope\s+"\/api",\s+\w+Web\s+do\s*\n\s*pipe_through\s+:api/gms,
      `post "/login", AuthController, :login`,
    ],
  ];

  return inject_file({ file, injections }, "inject_auth_to_router");
};

export { inject_auth_to_router };
