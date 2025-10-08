import fs from "fs";
import { Readable } from "stream";
import { join } from "@/utils/path";
import { AppData } from "@/readers/get_app_data";
import path from "path";

const url_path =
  "https://raw.githubusercontent.com/macioa/immutablestack/alpha/assets/";
const files = ["logo3.png"];
const urls = files.map((name) => ({
  name,
  url: new URL(name, url_path).toString(),
}));

async function fetch_assets({ AppDir, AppNameSnake }: AppData, uiName: string = 'temp_ui') {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const outDir = join(UiDir, "./src/assets/");
  await fs.promises.mkdir(outDir, { recursive: true });

  const downloads = urls.map(async ({ name, url }) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    //@ts-ignore unreachable ts error
    const nodeStream = Readable.fromWeb(res.body);
    const fileStream = fs.createWriteStream(join(outDir, name));

    await new Promise((resolve, reject) => {
      nodeStream.pipe(fileStream);
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });

    return name;
  });

  return Promise.all(downloads);
}

export { fetch_assets };
