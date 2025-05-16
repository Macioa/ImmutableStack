import { exec } from "child_process";
import { createCipheriv, createDecipheriv, createHash } from "crypto";
import {
  createReadStream,
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import { join } from "path";
import { StringOnlyMap } from "../map";
import { log } from "../logger";
const SETTINGS = ".immutable";
const cred = gen();

const IMM_DIR = (function (): Promise<string> {
  return new Promise((resolve, reject) =>
    exec("brew --prefix immutable", (err, stdout, stderr) =>
      resolve(stdout.trim())
    )
  );
})();

interface Settings {
  openai?: string;
}

interface Key {
  key: Buffer;
  iv: Buffer;
}

async function SHA(filePath: string): Promise<string> {
  log({ level: 38 }, "Hashing file", { dir: await IMM_DIR });
  const hash = createHash("sha256");
  log({ level: 38 }, "Hashing file", { filePath });
  log({ level: 38 }, "Hashing file", {
    dir: join(await IMM_DIR, "bin/" + filePath),
  });
  const stream = createReadStream(join(await IMM_DIR, "bin/" + filePath));
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => {
      log({ level: 38 }, "Hashed file", { hash });
      resolve(hash.digest("hex"));
    });
    stream.on("error", (err) => reject(err));
  });
}

async function fromSeed(
  input: string,
  hash = createHash("sha256").update(input).digest()
): Promise<{ key: Buffer; iv: Buffer }> {
  return {
    key: hash.slice(0, 32),
    iv: hash.slice(16, 32),
  };
}

async function salt(files: StringOnlyMap) {
  // log({ level: 38 }, "Salting files", files);
  Object.keys(files).forEach(
    //@ts-ignore
    async (file) => (files[file] = SHA(files[file]))
  );
  await Promise.all(Object.values(files));
  log({ level: 38 }, "Salted files", files);
  return JSON.stringify({ home: homedir(), ...files });
}

const encrypt = (
  { key, iv }: Key,
  text: string,
  cipher = createCipheriv("aes-256-cbc", key, iv)
) => Buffer.concat([cipher.update(text), cipher.final()]).toString("hex");

const decrypt = (
  { key, iv }: Key,
  encrypted: string,
  decipher = createDecipheriv("aes-256-cbc", key, iv)
) => {
  try {
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "hex")),
      decipher.final(),
    ]).toString();
  } catch (err) {
    log({ level: 1, color: "RED" }, "Decryption error", {
      err,
      message: "Wrong user or source code has changed",
      action: "Clear settings with immutable -settings -clear",
    });
    return null;
  }
};

let SETTINGS_CACHE: StringOnlyMap = {};
const clearSettingsCache = () => (SETTINGS_CACHE = {});

const readSettings = async (): Promise<StringOnlyMap> => {
  log({ level: 37 }, "Reading settings", { home: homedir(), SETTINGS });
  if (Object.keys(SETTINGS_CACHE).length) return SETTINGS_CACHE;

  if (!existsSync(join(homedir(), SETTINGS))) {
    await writeSettings({});
    return {};
  }
  const data = readFileSync(join(homedir(), SETTINGS), "utf8");
  SETTINGS_CACHE = JSON.parse(decrypt(await cred, data) || "{}");
  return SETTINGS_CACHE;
};

const writeSettings = async (settings: StringOnlyMap) => {
  log({ level: 37 }, "Writing settings");
  SETTINGS_CACHE = settings;
  const raw = JSON.stringify(settings);
  log({ level: 38 }, "Write Data", { home: homedir(), SETTINGS, raw });
  log({ level: 38 }, { SETTINGS_CACHE, body: encrypt(await cred, raw) });
  return writeFileSync(
    join(homedir(), SETTINGS),
    encrypt(await cred, raw),
    "utf8"
  );
};

const updateSetting = async (settings: StringOnlyMap) => {
  const source = existsSync(join(homedir(), SETTINGS))
    ? await readSettings()
    : {};
  log({ level: 33 }, "Update settings", { source, settings });
  return writeSettings({ ...source, ...settings });
};

const clearSettings = () => {
  clearSettingsCache();
  return unlinkSync(join(homedir(), SETTINGS));
};

const getSetting = async (key: string) =>
  readSettings().then(() => SETTINGS_CACHE[key]);

async function gen() {
  return await fromSeed(
    await salt({
      init: "init_proj.js",
      gen: "gen.js",
      repair: "repair.js",
      settings: "settings.js"
    })
  );
}

export {
  clearSettings,
  clearSettingsCache,
  readSettings,
  updateSetting,
  getSetting,
};
export type { Settings };
