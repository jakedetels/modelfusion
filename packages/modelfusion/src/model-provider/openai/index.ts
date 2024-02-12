import * as OpenAIFacade from "./OpenAIFacade";
import { OpenAIChatPrompt } from "./AbstractOpenAIChatModel";

/**
 * @namespace openai!!
 * @description A collection of utilities for interacting with the OpenAI API.
 * @see https://modelfusion.dev/integration/model-provider/openai/ for detailed documentation.
 * @see https://platform.openai.com/docs/ for more information about the OpenAI API.
 * @see /examples/basic/src/model-provider/openai/... for examples of working with OpenAI.
 */
export const openai = OpenAIFacade;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace openai {
  export type ChatPrompt = OpenAIChatPrompt;
}

export * from "./AbstractOpenAIChatModel";
export * from "./AbstractOpenAICompletionModel";
export * from "./AbstractOpenAITextEmbeddingModel";
export * from "./AzureOpenAIApiConfiguration";
export * from "./OpenAIApiConfiguration";
export * from "./OpenAIChatMessage";
export * from "./OpenAIChatModel";
export * from "./OpenAICompletionModel";
export { OpenAIErrorData } from "./OpenAIError";
export * from "./OpenAIImageGenerationModel";
export * from "./OpenAISpeechModel";
export * from "./OpenAITextEmbeddingModel";
export * from "./OpenAITranscriptionModel";
export * from "./TikTokenTokenizer";
export * from "./countOpenAIChatMessageTokens";
