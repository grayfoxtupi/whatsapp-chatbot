import openAI from '../config/openAI.js';

const instructions = process.env.SYSTEM_INSTRUCTIONS;

async function generateResponse(history) {
  const contents = [
    {
      role: "system", // ✅ should be "system", not "assistant"
      content: instructions
    },
    ...history
  ];

  console.log("historinha: ", contents);
  try {
    const response = await openAI.chat.completions.create({
      model: "google/gemini-flash-1.5-8b",
      messages: contents,
    });

    // ✅ Correct way to access the model's response
    const text = response.choices[0].message.content;

    return text;
  } catch (e) {
    console.log("Error during OpenAI request:", e);
    return null;
  }
}

export { generateResponse };
