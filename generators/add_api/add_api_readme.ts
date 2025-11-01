import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./add_api_endpoint";

const add_api_readme = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "README.md";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}`);
  const content = `# ${ApiNameCamel}

API Web Application.

This is a Phoenix web application that provides an additional API endpoint.
`;

  return generateFile({ filename, dir, content }, "add_api_readme");
};

export { add_api_readme };

