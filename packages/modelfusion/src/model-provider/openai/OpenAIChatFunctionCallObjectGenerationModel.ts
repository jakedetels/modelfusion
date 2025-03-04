import SecureJSON from "secure-json-parse";
import { FunctionCallOptions } from "../../core/FunctionOptions";
import { JsonSchemaProducer } from "../../core/schema/JsonSchemaProducer";
import { Schema } from "../../core/schema/Schema";
import { ObjectStreamingModel } from "../../model-function/generate-object/ObjectGenerationModel";
import { ObjectParseError } from "../../model-function/generate-object/ObjectParseError";
import { TextGenerationPromptTemplate } from "../../model-function/generate-text/TextGenerationPromptTemplate";
import { parsePartialJson } from "../../util/parsePartialJson";
import {
  OpenAIChatChunk,
  OpenAIChatPrompt,
  OpenAIChatResponseFormat,
} from "./AbstractOpenAIChatModel";
import { OpenAIChatModel, OpenAIChatSettings } from "./OpenAIChatModel";
import { chat, instruction, text } from "./OpenAIChatPromptTemplate";

export class OpenAIChatFunctionCallObjectGenerationModel<
  PROMPT_TEMPLATE extends TextGenerationPromptTemplate<
    unknown,
    OpenAIChatPrompt
  >,
> implements
    ObjectStreamingModel<
      Parameters<PROMPT_TEMPLATE["format"]>[0], // first argument of the function
      OpenAIChatSettings
    >
{
  readonly model: OpenAIChatModel;
  readonly fnName: string;
  readonly fnDescription?: string;
  readonly promptTemplate: PROMPT_TEMPLATE;

  constructor({
    model,
    fnName,
    fnDescription,
    promptTemplate,
  }: {
    model: OpenAIChatModel;
    fnName: string;
    fnDescription?: string;
    promptTemplate: PROMPT_TEMPLATE;
  }) {
    this.model = model;
    this.fnName = fnName;
    this.fnDescription = fnDescription;
    this.promptTemplate = promptTemplate;
  }

  get modelInformation() {
    return this.model.modelInformation;
  }

  get settings() {
    return {
      ...this.model.settings,
      fnName: this.fnName,
      fnDescription: this.fnDescription,
    };
  }

  get settingsForEvent() {
    return {
      ...this.model.settingsForEvent,
      fnName: this.fnName,
      fnDescription: this.fnDescription,
    };
  }

  /**
   * Returns this model with a text prompt template.
   */
  withTextPrompt() {
    return this.withPromptTemplate(text());
  }

  /**
   * Returns this model with an instruction prompt template.
   */
  withInstructionPrompt() {
    return this.withPromptTemplate(instruction());
  }

  /**
   * Returns this model with a chat prompt template.
   */
  withChatPrompt() {
    return this.withPromptTemplate(chat());
  }

  withPromptTemplate<
    TARGET_PROMPT_FORMAT extends TextGenerationPromptTemplate<
      unknown,
      OpenAIChatPrompt
    >,
  >(
    promptTemplate: TARGET_PROMPT_FORMAT
  ): OpenAIChatFunctionCallObjectGenerationModel<TARGET_PROMPT_FORMAT> {
    return new OpenAIChatFunctionCallObjectGenerationModel({
      model: this.model,
      fnName: this.fnName,
      fnDescription: this.fnDescription,
      promptTemplate,
    });
  }

  withSettings(additionalSettings: Partial<OpenAIChatSettings>) {
    return new OpenAIChatFunctionCallObjectGenerationModel({
      model: this.model.withSettings(additionalSettings),
      fnName: this.fnName,
      fnDescription: this.fnDescription,
      promptTemplate: this.promptTemplate,
    }) as this;
  }

  /**
   * JSON generation uses the OpenAI GPT function calling API.
   * It provides a single function specification and instructs the model to provide parameters for calling the function.
   * The result is returned as parsed JSON.
   *
   * @see https://platform.openai.com/docs/guides/gpt/function-calling
   */
  async doGenerateObject(
    schema: Schema<unknown> & JsonSchemaProducer,
    prompt: Parameters<PROMPT_TEMPLATE["format"]>[0], // first argument of the function
    options: FunctionCallOptions
  ) {
    const expandedPrompt = this.promptTemplate.format(prompt);

    const rawResponse = await this.model
      .withSettings({
        stopSequences: [
          ...(this.settings.stopSequences ?? []),
          ...this.promptTemplate.stopSequences,
        ],
      })
      .callAPI(expandedPrompt, options, {
        responseFormat: OpenAIChatResponseFormat.json,
        functionCall: { name: this.fnName },
        functions: [
          {
            name: this.fnName,
            description: this.fnDescription,
            parameters: schema.getJsonSchema(),
          },
        ],
      });

    const valueText = rawResponse.choices[0]!.message.function_call!.arguments;

    try {
      return {
        rawResponse,
        valueText,
        value: SecureJSON.parse(valueText),
        usage: this.model.extractUsage(rawResponse),
      };
    } catch (error) {
      throw new ObjectParseError({
        valueText,
        cause: error,
      });
    }
  }

  async doStreamObject(
    schema: Schema<unknown> & JsonSchemaProducer,
    prompt: Parameters<PROMPT_TEMPLATE["format"]>[0], // first argument of the function
    options: FunctionCallOptions
  ) {
    const expandedPrompt = this.promptTemplate.format(prompt);

    return this.model.callAPI(expandedPrompt, options, {
      responseFormat: OpenAIChatResponseFormat.deltaIterable,
      functionCall: { name: this.fnName },
      functions: [
        {
          name: this.fnName,
          description: this.fnDescription,
          parameters: schema.getJsonSchema(),
        },
      ],
    });
  }

  extractObjectTextDelta(delta: unknown) {
    const chunk = delta as OpenAIChatChunk;

    if (chunk.object !== "chat.completion.chunk") {
      return undefined;
    }

    const chatChunk = chunk as OpenAIChatChunk;

    const firstChoice = chatChunk.choices[0];

    if (firstChoice.index > 0) {
      return undefined;
    }

    return firstChoice.delta.function_call?.arguments;
  }

  parseAccumulatedObjectText(accumulatedText: string) {
    return parsePartialJson(accumulatedText);
  }
}
