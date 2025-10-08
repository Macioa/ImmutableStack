import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ApiAppData } from "../../generators/gen_web_api";

const inject_api_to_umbrella_mix = async ({ UmbrellaDir, ApiNameSnake }: ApiAppData) => {
  const file = path.join(UmbrellaDir, "mix.exs");
  const apiAppName = `${ApiNameSnake}_web`;
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /apps:\s*\[([^\]]*)\]/,
      (content: string) => {
        const match = content.match(/apps:\s*\[([^\]]*)\]/);
        if (!match) return content;
        const apps = match[1];
        if (apps.includes(`:${apiAppName}`)) return content;
        const appsArray = apps.split(',').map(s => s.trim()).filter(s => s);
        appsArray.push(`:${apiAppName}`);
        return content.replace(/apps:\s*\[([^\]]*)\]/, `apps: [${appsArray.join(', ')}]`);
      }
    ],
    [
      InjectType.REPLACE,
      /applications:\s*\[([^\]]*)\]/,
      (content: string) => {
        const match = content.match(/applications:\s*\[([^\]]*)\]/);
        if (!match) return content;
        const apps = match[1];
        if (apps.includes(`${apiAppName}:`)) return content;
        const appsArray = apps.split(',').map(s => s.trim()).filter(s => s);
        appsArray.push(`${apiAppName}: :permanent`);
        return content.replace(/applications:\s*\[([^\]]*)\]/, `applications: [${appsArray.join(', ')}]`);
      }
    ]
  ];

  return inject_file({ file, injections }, "inject_api_to_umbrella_mix");
};

export { inject_api_to_umbrella_mix };

