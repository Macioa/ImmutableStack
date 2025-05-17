import { join } from "../../utils/path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";
import { Names } from "../../immutable_gen";

const gen_channel_demo_component = (
  { singleUpperCamel, singleSnake }: Names,
  { LibDir }: AppData
) => {
  const filename = `${singleUpperCamel}Channel.tsx`;
  const dir = join(LibDir, "lib/typescript/components");
  const content = `import use${singleUpperCamel}Channel from "../requests/${singleUpperCamel}Channel"; // adjust path as needed
import { useEffect } from "react";

export default function ${singleUpperCamel}ChannelComponent() {
  const { channel, joined, error, push, on, off } = use${singleUpperCamel}Channel("${singleSnake}:lobby");

  useEffect(() => {
    if (!joined || !channel) return;

    // Listen for a message
    on("quack", (payload) => {
      console.log("Received:", payload);
    });

    // Push a message to the channel
    push("croak", { frog: "Kermit" });

    // Clean up listener
    return () => {
      off("ribbit");
    };
  }, [joined, channel]);

  if (error) return <div>Error: {error}</div>;
  if (!joined) return <div>Joining channel...</div>;

  return <div>${singleUpperCamel} channel joined!</div>;
}`;
  return generateFile({ filename, dir, content }, "gen_channel_demo_component");
};

export { gen_channel_demo_component };
