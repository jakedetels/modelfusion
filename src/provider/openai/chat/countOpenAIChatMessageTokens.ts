import { getTiktokenTokenizerForModel } from "../tiktoken.js";
import {
  OpenAIChatModelType,
  OpenAIChatMessage,
} from "./OpenAIChatCompletion.js";

/**
 * Prompt tokens that are included automatically for every full
 * chat prompt (several messages) that is sent to OpenAI.
 */
export const OPENAI_CHAT_PROMPT_BASE_TOKENS = 2;

/**
 * Prompt tokens that are included automatically for every
 * message that is sent to OpenAI.
 */
export const OPENAI_CHAT_MESSAGE_BASE_TOKENS = 5;

export async function countOpenAIChatMessageTokens({
  message,
  model,
}: {
  message: OpenAIChatMessage;
  model: OpenAIChatModelType;
}) {
  return (
    OPENAI_CHAT_MESSAGE_BASE_TOKENS +
    (await getTiktokenTokenizerForModel({ model }).countTokens(message.content))
  );
}

export async function countOpenAIChatPromptTokens({
  messages,
  model,
}: {
  messages: OpenAIChatMessage[];
  model: OpenAIChatModelType;
}) {
  let tokens = OPENAI_CHAT_PROMPT_BASE_TOKENS;
  for (const message of messages) {
    tokens += await countOpenAIChatMessageTokens({ message, model });
  }
  return tokens;
}
