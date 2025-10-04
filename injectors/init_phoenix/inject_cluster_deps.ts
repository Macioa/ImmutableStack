import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_cluster_deps = async ({ LibDir }: AppData) => {
  const file = path.join(LibDir, "mix.exs");
  
  // Read the file to check if libcluster already exists
  const fs = require('fs');
  const content = fs.readFileSync(file, 'utf8');
  
  // If libcluster already exists, skip injection
  if (content.includes('{:libcluster, "~> 3.0"}')) {
    console.log('libcluster dependency already exists in mix.exs, skipping injection');
    return Promise.resolve([file]);
  }
  
  const injections: Injection[] = [
    [
      T.AFTER,
      /defp\sdeps\sdo\s*\n{0,5}\s*\[/,
      `\n      {:libcluster, "~> 3.0"},\n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_cluster_deps");
};

export { inject_cluster_deps };
