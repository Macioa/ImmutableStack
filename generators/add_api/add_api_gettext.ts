import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./add_api_endpoint";

const add_api_gettext = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "gettext.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web`);
  const content = `defmodule ${ApiNameCamel}.Gettext do
  @moduledoc """
  A module providing Internationalization with a gettext-based API.

  By using [Gettext](https://hexdocs.pm/gettext),
  your module gains a set of macros for translations, for example:

      import ${ApiNameCamel}.Gettext

      # Simple translation
      gettext("Here is the string to translate")

      # Plural translation
      ngettext("Here is the string to translate",
               "Here are the strings to translate",
               3)

      # Domain-based translation
      dgettext("errors", "Here is the error message to translate")

  See the [Gettext Docs](https://hexdocs.pm/gettext) for detailed usage.
  """
  use Gettext, otp_app: :${ApiNameSnake}_web
end`;

  return generateFile({ filename, dir, content }, "add_api_gettext");
};

export { add_api_gettext };

