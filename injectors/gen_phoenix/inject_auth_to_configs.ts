import path from "path";
import { InjectType, Injection, inject_file } from "..";
import { ImmutableGenerator } from "../../immutable_gen";
import { join } from "../../utils/path";

const inject_auth_to_configs = async ({
  AppData: { UmbrellaDir },
}: ImmutableGenerator) => {
  const files = ["dev.exs", "docker.exs"].map((file) =>
    join(UmbrellaDir, "config", file)
  );

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /^/,
      `config :ueberauth, Ueberauth,
  providers: [
    google: {Ueberauth.Strategy.Google, [default_scope: "email profile"]}
  ]

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")`,
    ],
  ];

  return Promise.all(files.map((file) => inject_file({ file, injections })));
};

export { inject_auth_to_configs };