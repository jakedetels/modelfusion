import dotenv from "dotenv";
import { OpenAIChatModel, streamText } from "modelfusion";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

async function main() {
  const textStream = await streamText(
    new OpenAIChatModel({
      model: "gpt-4-vision-preview",
      maxCompletionTokens: 1000,
    }).withVisionInstructionPrompt(),
    {
      instruction: "Describe the image in detail:",
      image: fs.readFileSync(path.join("data", "example-image.png"), {
        encoding: "base64",
      }),
      mimeType: "image/jpeg",
    }
  );

  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }
}

main().catch(console.error);
