import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_custom_compiler = async ({ AppDir, AppNameSnake }: ApiAppData) => {
  const file = join(AppDir || "", `${AppNameSnake}/lib/mix/tasks/custom_compiler.ex`);

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /def run\(_args\) do/,
      (content: string) => {
        if (content.includes('Mix.env() == :test')) return content;

        return content.replace(
          /def run\(_args\) do\n([\s\S]*?)\n  end/m,
          (_match, body) => {
            const indentedBody = body
              .split("\n")
              .map((line: string) => (line.length ? `  ${line}` : line))
              .join("\n");

            return `def run(_args) do
    if Mix.env() == :test do
      IO.puts("Skipping custom compiler steps in test environment")
      {:ok, []}
    else
${indentedBody}
      {:ok, []}
    end
  end`;
          }
        );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_custom_compiler");
};

export { add_auth_custom_compiler };

