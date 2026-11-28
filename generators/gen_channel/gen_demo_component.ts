import { join } from "@/utils/path";
import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";
import { Names } from "@/commands/immutable_gen";

const gen_channel_demo_component = (
  { singleUpperCamel, singleSnake }: Names,
  { LibDir }: AppData
) => {
  const filename = `${singleUpperCamel}Channel.tsx`;
  const dir = join(LibDir, "lib/typescript/components");
  const content = `import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import use${singleUpperCamel}Channel from "../requests/${singleUpperCamel}Channel";
import "./styles.css";

type Message = { id: number; body: string };

const statusOf = (joined: boolean, error: string | null) =>
  error ? "error" : joined ? "connected" : "joining";

const statusText = {
  error: "Channel error",
  connected: "${singleUpperCamel} channel joined",
  joining: "Joining channel…",
};

export default function ${singleUpperCamel}ChannelComponent() {
  const { channel, joined, error, push, on, off } =
    use${singleUpperCamel}Channel("${singleSnake}:lobby");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!joined || !channel) return;
    // Keep the last 20 broadcasts
    on("message", ({ body }) =>
      setMessages((prev) => [...prev.slice(-19), { id: performance.now(), body }]),
    );
    return () => off("message");
  }, [joined, channel]);

  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.trim()) return;
    push("message", { body: draft.trim() });
    setDraft("");
  };

  const status = statusOf(joined, error);

  return (
    <div className="channel-panel">
      <div className={\`status-pill status-\${status}\`} role="status">
        <span className="status-dot" />
        {statusText[status]}
        {error && <span className="muted"> - {error}</span>}
      </div>
      <ul className="message-log" aria-live="polite">
        {messages.length ? (
          messages.map(({ id, body }) => <li key={id}>{body}</li>)
        ) : (
          <li className="muted">Broadcasts on ${singleSnake}:lobby show up here</li>
        )}
      </ul>
      <form className="inline-form" onSubmit={send}>
        <label htmlFor="${singleSnake}-message" className="visually-hidden">
          Message
        </label>
        <input
          id="${singleSnake}-message"
          value={draft}
          placeholder="Say something to the ${singleSnake}"
          disabled={!joined}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="form-submit-btn" disabled={!joined}>
          Send
        </button>
      </form>
    </div>
  );
}
`;
  return generateFile({ filename, dir, content }, "gen_channel_demo_component");
};

export { gen_channel_demo_component };
