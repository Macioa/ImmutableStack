import { StringOnlyMap, validate } from "../../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../../utils/gen_header";

const show_list = ({ pluralNameSnake, context, genName }: StringOnlyMap) => {
  validate({ pluralNameSnake, context, genName }, "show_list");
  return `
    def show(conn, ${genName}_list) when is_list(${genName}_list) do
      ${pluralNameSnake} = ${context}.get_${genName}!(${genName}_list)
      render(conn, :show, ${pluralNameSnake}: ${pluralNameSnake})
    end
  `;
};

const show = ({ genName, context }: StringOnlyMap) => {
  validate({ genName, context }, "show");
  return `
    def show(conn, %{"id" => id}) do
        ${genName} = ${context}.get_${genName}!(id)
        render(conn, :show, ${genName}: ${genName})
    end
`;
};

const routes: ImmRoute[] = [
  {
    id: "show_list",
    fn: show_list,
    header: (dict) => compute_header(dict, show_list),
  },
  {
    id: "show",
    fn: show,
    header: (dict) => compute_header(dict, show),
  },
];

export { routes };
