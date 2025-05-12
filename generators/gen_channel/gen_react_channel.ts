import { join } from "path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";
import { Names } from "../../immutable_gen";

const gen_react_channel = ({singleUpperCamel}: Names, {LibDir}: AppData) => {
    const filename = `${singleUpperCamel}Channel.ts`
    const dir = join(LibDir, 'lib/typescript/requests')
    const content = `import { useEffect, useRef, useState } from "react";
import { Channel } from "phoenix";
import { usePhoenixSocket } from "@utils";

export function use${singleUpperCamel}Channel(topic: string, params = {}) {
  const { socket, connected } = usePhoenixSocket();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!socket || !connected) return;

    const chan = socket.channel(topic, params);
    channelRef.current = chan;
    setChannel(chan);

    chan
      .join()
      .receive("ok", () => {
        setJoined(true);
        setError(null);
      })
      .receive("error", (e) => {
        setJoined(false);
        setError(e?.reason || "join error");
      });

    return () => {
      chan.leave();
    };
  }, [socket, connected, topic]);

  return {
    channel,
    joined,
    error,
    push: (event: string, payload: any) =>
      channel?.push(event, payload),
    on: (event: string, callback: (payload: any) => void) =>
      channel?.on(event, callback),
    off: (event: string) =>
      channel?.off(event),
  };
}`
  return generateFile({filename, dir, content}, "gen_react_channel");
};

export { gen_react_channel };
