import { getSetting } from "../utils/settings";
import adapters from "./adapters";

interface Repair {
  filename: string;
  dir: string;
  target: RegExp;
  context: {
    name: string;
    filename: string;
    dir: string;
    targets: RegExp[];
    desc: string;
  }[];
  output: string[];
  prompt: string;
}

interface RepairRequest {
  prompt: string;
  context: { name: string; body: string; desc: string }[];
  target: string;
  output: string[];
}

interface RepairRequestReply {
  api: string;
  id: string;
  model: string;
  result: string;
  usage: object;
}

type RepairFn = (_: RepairRequest) => Promise<RepairRequestReply>;

const repair = async (params: Repair) => {

    return adapters[await getSetting("llm")](params)
}

export default repair;
export type { RepairRequest, Repair, RepairRequestReply, RepairFn };
