import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./add_api_endpoint";

const add_api_conn_case = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "conn_case.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/test/support`);
  const content = `defmodule ${ApiNameCamel}.ConnCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      import Plug.Conn
      import Phoenix.ConnTest
      alias ${ApiNameCamel}.Router.Helpers, as: Routes

      @endpoint ${ApiNameCamel}.Endpoint
    end
  end

  setup _tags do
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end`;

  return generateFile({ filename, dir, content }, "add_api_conn_case");
};

const add_api_test_helper = async ({ AppDir, ApiNameSnake }: ApiAppData) => {
  const filename = "test_helper.exs";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/test`);
  const content = `ExUnit.start()`;

  return generateFile({ filename, dir, content }, "add_api_test_helper");
};

const add_api_error_json_test = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "error_json_test.exs";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/test/${ApiNameSnake}_web/controllers`);
  const content = `defmodule ${ApiNameCamel}.ErrorJSONTest do
  use ${ApiNameCamel}.ConnCase, async: true

  test "renders 404" do
    assert ${ApiNameCamel}.ErrorJSON.render("404.json", %{}) == %{errors: %{detail: "Not Found"}}
  end

  test "renders 500" do
    assert ${ApiNameCamel}.ErrorJSON.render("500.json", %{}) ==
             %{errors: %{detail: "Internal Server Error"}}
  end
end`;

  return generateFile({ filename, dir, content }, "add_api_error_json_test");
};

export { add_api_conn_case, add_api_test_helper, add_api_error_json_test };

