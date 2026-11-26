import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { AppData } from "@/readers/get_app_data";

const MARKER = "# External service keys";

const resolver = (app: string) => `
${MARKER} (config/<env>/external_service_keys/*.exs). A value written in a keys file
# always wins. A blank one falls back to its environment variable, <GROUP>_<KEY>
# (e.g. EMAIL_API_KEY), only while :allow_env_keys is on (default: on outside prod).
# key.(category, group, name) returns the value, or nil when there is none.
allow_env_keys = Application.get_env(:${app}, :allow_env_keys, false)
file_keys = Application.get_env(:${app}, :keys, [])

key = fn category, group, name ->
  value = file_keys |> Keyword.get(category, []) |> Keyword.get(group, []) |> Keyword.get(name, "")
  value = if value in ["", nil] and allow_env_keys, do: System.get_env(String.upcase("#{group}_#{name}"), ""), else: value
  if value in ["", nil], do: nil, else: value
end

# Every key of a category, resolved, with "" for missing values
keys = fn category ->
  for {group, values} <- Keyword.get(file_keys, category, []),
      do: {group, for({name, _value} <- values, do: {name, key.(category, group, name) || ""})}
end

# Features (add_auth: oauth, email) read their keys below this line
_ = {key, keys}
`;

const keysFirst = (app: string) => (content: string) =>
  content.includes(MARKER)
    ? content
    : content.replace(/import Config\n/, `import Config\n${resolver(app)}`);

const inject_runtime_keys = ({ UmbrellaDir, AppNameSnake }: AppData) => {
  const injections: Injection[] = [
    [InjectType.REPLACE, /[\s\S]*/, (content: string) => keysFirst(AppNameSnake)(content)],
  ];
  return inject_file({ file: join(UmbrellaDir, "config", "runtime.exs"), injections }, "inject_runtime_keys");
};

export { inject_runtime_keys };
