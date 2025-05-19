// import { OpenAI } from "openai";
import { API_Fn, RepairRequest, RepairRequestReply } from "..";
import { getSetting } from "../../utils/settings";
import { log } from "../../utils/logger";
import util from "util";

const key = "openai";
const url = "https://api.openai.com/v1/chat/completions";

const defaults = {
  model: "gpt-3.5-turbo",
  temperature: 0.2,
  //   max_tokens: 2000,
  //   top_p: 1,
  //   frequency_penalty: 0,
  //   presence_penalty: 0,
  //   stop: ["\n\n"],
};


const query: API_Fn = async ({
  prompt,
  context,
  target,
  output,
}: RepairRequest): Promise<RepairRequestReply | null> => {
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
  };
  log({ level: 5 }, "Request", { ...request });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getSetting(key)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  const parsed = await response.json();
  log({ level: 3 }, "Response:", parsed?.choices);

  const { id, model, usage } = parsed;
  const result = parsed?.choices[0].message.content
    ?.replace(/^```typescript/g, "")
    ?.replace(/```$/g, "");
  return { id, model, result, usage, api: key } as RepairRequestReply;
};

export default query;
