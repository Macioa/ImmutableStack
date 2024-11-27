import { ImmRoute } from ".";
import { StringOnlyMap, validate } from "../../../utils/map";

const custom = ({ header }: StringOnlyMap) => {
  validate({ header }, custom);
  return `\n    def ${header} do\n        # TODO: Provide function definition here\n    end\n`;
};

const route: ImmRoute = {
  id: "custom",
  fn: custom,
  header: ({ header }) => header,
};
export { route };
