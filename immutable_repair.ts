import { log, setLogLevel } from "./utils/logger";
import adapters from "./repair/adapters";
import {getTarget, getContext, RepairI, marked} from "./repair";
import  fullFileRepair  from "./repair/types/full";
setLogLevel(20);

const [, , , ...args] = process.argv;

const main = async () => {
    // console.log(await getContext({context: [{name: "test", body: "test", desc: "test"}]}));
//   console.log(
//     await adapters.openai({
//       prompt: "Testing the repair function",
//       context: [
//         {
//           name: "test",
//           body: "how much context can you handle",
//           desc: "This is a test",
//         },
//       ],
//       target: "This is the target body",
//       output: ["This is the output body"],
//     })
//   );
await fullFileRepair({
    prompt: "Testing the repair function",
    context: [
      {
        name: "Frog State",
        filename: "Frog.tsx",
        dir: "alpha_umbrella/apps/alpha/lib/typescript/state",
        targets: [marked({type: "REDUCER"})],
        desc: "AppState, FrogT, FrogState, Reducer, Selector, Factory",
      },
    ],
    target: [marked({type: "SELECTOR"})],
    filename: "Frog.tsx",
    dir: "alpha_umbrella/apps/alpha/lib/typescript/state",
    output: ["This is the output body"],
  });
  console.log("complete")
}

main();
