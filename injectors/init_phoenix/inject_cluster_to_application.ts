import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_cluster_to_application = async ({ LibDir, AppNameCamel }: AppData) => {
  const file = path.join(LibDir, `lib/${AppNameCamel.toLowerCase()}/application.ex`);
  
  // Read the file to check if cluster configuration already exists
  const fs = require('fs');
  const content = fs.readFileSync(file, 'utf8');
  
  // If cluster configuration already exists, skip injection
  if (content.includes('{DNSCluster, query: Application.get_env(') || 
      content.includes('topologies = [') ||
      content.includes('Cluster.Supervisor')) {
    console.log('Cluster configuration already exists in application.ex, skipping injection');
    return Promise.resolve([file]);
  }
  
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
