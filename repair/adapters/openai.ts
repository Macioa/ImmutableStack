import { OpenAI } from "openai";
import { API_Fn, RepairRequest, RepairRequestReply } from "..";
import { getSetting } from "../../utils/settings";
import { log } from "../../utils/logger";

const key = "openai";

const defaults = {
  model: "gpt-3.5-turbo",
  temperature: 0.2,
  //   max_tokens: 2000,
  //   top_p: 1,
  //   frequency_penalty: 0,
  //   presence_penalty: 0,
  //   stop: ["\n\n"],
};

const client = (async function () {
  if ((await getSetting("llm")) != key) {
    log({ level: 11, color: "YELLOW" }, `WARNING: ${key} not selected as llm`);
    return null;
  }
  return new OpenAI({
    apiKey: await getSetting(key),
  });
})();

const query: API_Fn = async ({
  prompt,
  context,
  target,
  output,
}: RepairRequest): Promise<RepairRequestReply | null> => {
  if (!(await client)) {
    log({ level: 2, color: "RED" }, `Error: openai client not available`);
    return null;
  }
  const request = {
    messages: [
      { role: "user", content: JSON.stringify({ prompt }), name: "prompt" },
      { role: "user", content: JSON.stringify({ target }), name: "target" },
      ...context.map((c) => ({
        role: "assistant",
        content: JSON.stringify(c),
        name: `associated_type_declarations$`,
      })),
      ...output.map((rule, index) => ({
        role: "system",
        content: JSON.stringify({ rule }),
        name: `output_rule_${index}`,
      })),
    ],
    ...defaults,
  } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

  const response = (await client)?.chat.completions.create(request);
  const { id, model, usage } = (await response) || {};
  const result = (await response)?.choices[0].message.content
    ?.replace(/^```typescript/g, "")
    ?.replace(/```$/g, "");
  return { id, model, result, usage, api: key } as RepairRequestReply;
};

export default query;
