import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_lorem_utils = async ({ LibDir }: AppData) => {
  const utilsPath = join(LibDir, "/lib/typescript/utils/");

  const content = `
import { LoremIpsum } from "lorem-ipsum";

const Lorem = new LoremIpsum();
export default Lorem;
`;

  return generateFile(
    { dir: utilsPath, filename: "lorem.ts", content },
    "gen_lorem_utils"
  );
};

export { gen_lorem_utils };
