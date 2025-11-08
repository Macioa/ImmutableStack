import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_test_config = async ({ UmbrellaDir }: ApiAppData) => {
  const file = join(UmbrellaDir, "config/test.exs");
  const marker = "config :bcrypt_elixir, :log_rounds, 1";

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /import Config\n/,
      (content: string) => {
        if (content.includes(marker)) return content;

        return content.replace(
          /import Config\n/,
          `import Config\n\n# Only in tests, remove the complexity from the password hashing algorithm\nconfig :bcrypt_elixir, :log_rounds, 1\n\n`
        );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_test_config");
};

export { add_auth_test_config };


