import { gen_custom_formatter } from "../../generators/init_phoenix/gen_custom_formatter";
import { inject_custom_format_to_mix_exs } from "../../injectors/init_phoenix/inject_custom_format_to_mix_exs";
import { StringOnlyMap, validate } from "../../utils/map";

const configure_phoenix_to_format_react = async ({
  AppName,
  LibDir,
}: StringOnlyMap) => {
  validate({ AppName, LibDir }, "configure_phoenix_to_format_react");
  const formatter = gen_custom_formatter(AppName, LibDir);
  const mix = inject_custom_format_to_mix_exs(LibDir);

  return [formatter, mix].flat();
};

export { configure_phoenix_to_format_react };
