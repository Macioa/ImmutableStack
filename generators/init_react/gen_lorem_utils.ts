import { join } from 'path'
import { generateFile } from "../index";

const gen_lorem_utils = async (AppName: string, UiDir: string) => {
    const utilsPath = join(UiDir, "/src/utils");

    const content = `
import { LoremIpsum } from "lorem-ipsum";

const Lorem = new LoremIpsum();
export default Lorem;
`;

    return generateFile({ dir: utilsPath, filename: "lorem.ts", content });
};

export { gen_lorem_utils };
