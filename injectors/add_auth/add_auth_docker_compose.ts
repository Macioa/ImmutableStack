import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_docker_compose = async ({ UmbrellaDir, AppNameSnake }: ApiAppData) => {
  const file = join(UmbrellaDir, "docker/compose.yaml");

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /DATABASE_URL=/,
      (content: string) => {
        if (content.includes("AUTH_DATABASE_URL")) return content;

        const withAuthEnv = content.replace(
          new RegExp(
            `(\\s*- DATABASE_URL=ecto://postgres:postgres@db:5432/${AppNameSnake}_db\\n)`,
            "m"
          ),
          `$1      - AUTH_DATABASE_URL=ecto://postgres:postgres@db:5432/${AppNameSnake}_auth_db\n`
        );

        if (withAuthEnv === content) return content;

        if (withAuthEnv.includes("./initdb:/docker-entrypoint-initdb.d")) return withAuthEnv;

        return withAuthEnv.replace(
          new RegExp(`(\\s*- ./pgdata:/var/lib/postgresql/data\\n)`, "m"),
          `$1      - ./initdb:/docker-entrypoint-initdb.d\n`
        );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_docker_compose");
};

export { add_auth_docker_compose };

