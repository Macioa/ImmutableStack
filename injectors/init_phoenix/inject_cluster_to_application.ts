import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_cluster_to_application = async ({ LibDir, AppNameCamel }: AppData) => {
  const file = path.join(LibDir, `lib/${AppNameCamel.toLowerCase()}/application.ex`);
  const injections: Injection[] = [
    [
      T.AFTER,
      /def start\(_type, _args\) do\s*\n/,
      `    topologies = [
      ${AppNameCamel.toLowerCase()}: [
        strategy: Cluster.Strategy.Epmd,
        config: [hosts: [:"a@localhost", :"b@localhost"]]
      ]
    ]

`,
    ],
    [
      T.AFTER,
      /children = \[\s*\n/,
      `      {DNSCluster, query: Application.get_env(:${AppNameCamel.toLowerCase()}, :dns_cluster_query) || :ignore},
      {Cluster.Supervisor, [topologies, [name: ${AppNameCamel}.ClusterSupervisor]]},
      ${AppNameCamel}.ClusterMonitor,
`,
    ],
  ];

  return inject_file({ file, injections }, "inject_cluster_to_application");
};

export { inject_cluster_to_application };
