import { ImmAPI } from ".";
import { StringOnlyMap, validate } from "../../../../utils/map";

const custom_api = ({ header }: StringOnlyMap) => {
  validate({ header }, "custom");
  return `\n    test "${header}" do\n        # TODO: Provide test definition here\n    end\n`;
};

const api_test: ImmAPI = {
  id: "custom",
  fn: custom_api,
  header: ({ header }) => header,
};
export { api_test };
