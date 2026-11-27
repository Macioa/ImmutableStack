import fs from "fs";
import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const DNS_CLUSTER_CHILD = /\{DNSCluster,[^\n]*\n/;
const CHILDREN_START = /children = \[\s*\n/;

const dnsClusterChild = (app: string) =>
  `      {DNSCluster, query: Application.get_env(:${app}, :dns_cluster_query) || :ignore},\n`;

const clusterChildren = (camel: string) =>
  `      {Cluster.Supervisor, [topologies, [name: ${camel}.ClusterSupervisor]]},
      ${camel}.ClusterMonitor,
`;

const topologies = (app: string) => `    cluster_hosts =
      System.get_env("CLUSTER_HOSTS", "a@localhost,b@localhost")
      |> String.split(",", trim: true)
      |> Enum.map(&String.to_atom/1)

    topologies = [
      ${app}: [
        strategy: Cluster.Strategy.Epmd,
        config: [hosts: cluster_hosts]
      ]
    ]

`;

// Phoenix generates DNSCluster by default, so only Cluster.Supervisor marks an existing setup
const childInjection = (content: string, app: string, camel: string): Injection =>
  DNS_CLUSTER_CHILD.test(content)
    ? [T.AFTER, DNS_CLUSTER_CHILD, clusterChildren(camel)]
    : [T.AFTER, CHILDREN_START, dnsClusterChild(app) + clusterChildren(camel)];

const inject_cluster_to_application = async ({ LibDir, AppNameCamel, AppNameSnake }: AppData) => {
  const file = path.join(LibDir, `lib/${AppNameSnake}/application.ex`);
  const content = fs.readFileSync(file, "utf8");

  if (content.includes("Cluster.Supervisor")) return [file];

  const injections: Injection[] = [
    [T.AFTER, /def start\(_type, _args\) do\s*\n/, topologies(AppNameSnake)],
    childInjection(content, AppNameSnake, AppNameCamel),
  ];

  return inject_file({ file, injections }, "inject_cluster_to_application");
};

export { inject_cluster_to_application };
