import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { getContext, getTarget, repairFn, RepairI } from "../";
import { log } from "../../utils/logger";
import { API_Fn } from "../adapters";

const fullFileRepair = async (query: API_Fn, params: RepairI) => {
  log(
    { level: 6, color: "YELLOW" },
    "fullFileRepair1",
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
  log({ level: 7, color: "GREEN" }, "Params: ", { ...params });
  let { prompt, output } = params;
  prompt ||= "";
  output ||= [];

  const targets = await getTarget(params);
  const context = await getContext(params);

  log({ level: 9, color: "YELLOW" }, "Resolved:", { targets, context });
  const updates = await Promise.all(
    targets.map(async (target) => {
      const queryParams = {
        prompt,
        context: context || [],
        target: target,
        output: output || [],
      };
      log({ level: 8, color: "YELLOW" }, "Reduced params:", { queryParams });
      return query(queryParams);
    })
  );

  const results = (await Promise.all(updates)).map((r) => r?.result);
  const fileContent = await readFile(resolve(params.dir || ""), "utf-8");
  const fileContentWithUpdates = targets.reduce(
    (acc, target, i) => acc.replace(target, results[i] || target),
    fileContent
  );
  log({ level: 9 }, { fileContentWithUpdates });
  return writeFile(resolve(params.dir || ""), fileContentWithUpdates, "utf-8");
};

export default fullFileRepair;
