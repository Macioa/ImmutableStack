import { gen_custom_formatter } from "../../generators/init_phoenix/gen_custom_formatter";
import { inject_custom_format_to_mix_exs } from "../../injectors/init_phoenix/inject_custom_format_to_mix_exs";
import { AppData } from "../../readers/get_app_data";

const configure_phoenix_to_format_react = async (appdata: AppData) => {
  const formatter = gen_custom_formatter(appdata);
  const mix = inject_custom_format_to_mix_exs(appdata);

  return [formatter, mix].flat();
};

export { configure_phoenix_to_format_react };
