import {
  ChatMLPrompt,
  generateStructure,
  jsonStructurePrompt,
  llamacpp,
  zodSchema,
} from "modelfusion";
import { z } from "zod";

async function main() {
  const structure = await generateStructure(
    llamacpp
      .TextGenerator({
        // run openhermes-2.5-mistral-7b.Q4_K_M.gguf in llama.cpp
        maxGenerationTokens: 1024,
        temperature: 0,
      })
      .withTextPromptTemplate(ChatMLPrompt.instruction()) // needed for jsonStructurePrompt.text()
      .asStructureGenerationModel(jsonStructurePrompt.text()), // automatically restrict the output to JSON

    zodSchema(
      z.object({
        characters: z.array(
          z.object({
            name: z.string(),
            class: z
              .string()
              .describe("Character class, e.g. warrior, mage, or thief."),
            description: z.string(),
          })
        ),
      })
    ),

    "Generate 3 character descriptions for a fantasy role playing game. "
  );

  console.log(structure.characters);
}

main().catch(console.error);
