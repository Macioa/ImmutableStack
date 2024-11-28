import { execute as exec, Arrow } from "../../runners";
import { log } from "../../utils/logger";

const init_react_app_with_next = async (
  projectName: string,
  appdir: string,
  uidir: string,
) => {
  log(
    { level: 2, color: "BLUE" },
    `\nGenerating React app: ${projectName}_ui with Next.js ...`,
  );
  return exec(
    {
      command: `npx create-next-app@latest ${projectName}_ui --typescript --use-npm --eslint=none --verbose`,
      dir: appdir,
      options: {
        forceReturnOnPrompt: true,
        prompts: [
          ["Would you like to use ESLint?", Arrow.YES],
          ["Would you like to use Tailwind CSS?", Arrow.YES],
          ["Would you like your code inside a `src/` directory?", Arrow.YES],
          ["Would you like to use App Router?", Arrow.NO],
          ["Would you like to use Turbopack for next dev?", Arrow.YES],
          [
            "Would you like to customize the import alias (@/* by default)?",
            Arrow.YES,
          ],
        ],
      },
    },
    "init_react_app_with_next",
  );
};
