import { get } from "http";
import { getContext, getTarget, repairFn, RepairI } from "../";
import { log } from "../../utils/logger";

const fullFileRepair = async ( params: RepairI ) => {
  if (!(await repairFn)) {
    log(
      { level: 1, color: "RED" },
      "llm not selected or no adapter found for the selected llm",
      "immutable -settings llm: openai openai: MY-OPENAI-KEY"
    );
    return null;
  }
  log({ level: 1, color: "GREEN" }, {...params})
  console.log( "TARGET", await getTarget(params) );
  console.log( "CONTEXT", await getContext(params) );
};

export default fullFileRepair;