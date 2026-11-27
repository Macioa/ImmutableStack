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

const download = async (url: string, file: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  //@ts-ignore unreachable ts error
  const nodeStream = Readable.fromWeb(res.body);
  const fileStream = fs.createWriteStream(file);

  return new Promise((resolve, reject) => {
    nodeStream.pipe(fileStream);
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
  });
};

// Cached assets are copied, missing ones are downloaded into the cache first
const fromCache = async (url: string, name: string, file: string, cacheDir: string) => {
  const cached = join(cacheDir, "assets", name);
  await fs.promises.mkdir(path.dirname(cached), { recursive: true });
  if (!fs.existsSync(cached)) await download(url, cached);
  return fs.promises.copyFile(cached, file);
};

// cacheDir: reuse assets from the -cache dependency cache instead of downloading each init
async function fetch_assets(
  { AppDir, AppNameSnake }: AppData,
  uiName: string = 'ui',
  { cacheDir }: { cacheDir?: string } = {}
) {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const outDir = join(UiDir, "./src/assets/");
  await fs.promises.mkdir(outDir, { recursive: true });

  const fetches = urls.map(async ({ name, url }) => {
    const file = join(outDir, name);
    await (cacheDir ? fromCache(url, name, file, cacheDir) : download(url, file));
    return name;
  });

  return Promise.all(fetches);
}

export { fetch_assets };
