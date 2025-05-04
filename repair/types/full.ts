import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { getContext, getTarget, repairFn, RepairI } from "../";
import { log } from "../../utils/logger";
import { API_Fn } from "../adapters";

const fullFileRepair = async (query: API_Fn, params: RepairI) => {
  log(
    { level: 6, color: "YELLOW" },
    "fullFileRepair",
    { ...params },
    await Promise.all(params.context || [])
  );
  if (!(await repairFn)) {
    log(
      { level: 1, color: "RED" },
      "llm not selected or no adapter found for the selected llm",
      "immutable -settings llm: openai openai: MY-OPENAI-KEY"
    );
    return null;
  }
  log({ level: 7, color: "GREEN" }, { ...params });
  let { prompt, output } = params;
  prompt ||= "";
  output ||= [];
  const targets = await getTarget(params);
  const updates = await Promise.all(
    targets.map(async (target) =>
      query({
        prompt,
        context: await getContext(params),
        target: target,
        output: output || [],
      })
    )
  );

  const results = (await Promise.all(updates)).map((r) => r?.result);
  const fileContent = await readFile(resolve(params.dir || ""), "utf-8");
  const fileContentWithUpdates = targets.reduce(
    (acc, target, i) => acc.replace(target, results[i] || target),
    fileContent
  );
  log({level:9}, {fileContentWithUpdates});
  return writeFile(resolve(params.dir || ""), fileContentWithUpdates, "utf-8");
};

export default fullFileRepair;
