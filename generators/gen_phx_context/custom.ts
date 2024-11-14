import { ImmAPI } from "./";
import { StringOnlyMap } from "../../utils/map";

const custom = ({ header }: StringOnlyMap) => {
  return `\n    def ${header} do\n        # TODO: Provide function definition here\n    end\n`;
};

const api: ImmAPI = {
  id: "custom",
  fn: custom,
  header: ({ header }) => header,
};
export { api };
