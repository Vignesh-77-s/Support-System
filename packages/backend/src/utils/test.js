// import { GoogleGenerativeAI } from "@google/generative-ai";

// const API_KEY = "AIzaSyAvVghUZjPWLMS47ietGRE0VXynFU29V3A";

// const genAI = new GoogleGenerativeAI(API_KEY);

// async function testModel() {
//   const model = genAI.getGenerativeModel({
//     model: "models/gemini-2.5-flash",
//   });

//   const result = await model.generateContent(
//     "what is the highest score of rohit sharma in ipl 2023?"
//   );
//   console.log("Response:", result.response.text());
// }

// testModel();

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(AIzaSyAvVghUZjPWLMS47ietGRE0VXynFU29V3A);
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL = "models/gemini-2.5-flash";

export async function classifySupportMessage(userMessage, imageBase64 = null) {
  const model = genAI.getGenerativeModel({ model: MODEL });

  // SYSTEM + USER PROMPT (your full classifier logic)
  const SYSTEM_PROMPT = `
You are an expert support-ticket classifier and message understanding engine for a WhatsApp-based support system.

Your job:
1. Read the incoming WhatsApp message (text or caption).
2. Decide if the message is a SUPPORT TICKET or a NORMAL CHAT.
3. Extract meaningful information only if it's a ticket.
4. ALWAYS respond in CLEAN JSON only.

Rules:
- Understand Tamil, Hindi, English mixed messages.
- If user sends an image with no text, classify based on image.
- Ignore greetings or casual chat.
- If unsure → isTicket=false, confidence < 0.5.

JSON Schema:
{
  "isTicket": boolean,
  "confidence": number,
  "ticketData": {
    "title": string,
    "description": string,
    "category": string,
    "priority": "low" | "medium" | "high"
  },
  "messageType": "ticket" | "normal",
  "rawMessage": string
}

Second part (image analysis):
If screenshot/photo is provided, analyze it and classify as ticket if it shows errors, broken product, warnings.

Output must ALWAYS be strict JSON.
`;

  // Build content for Gemini
  const content = [
    { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "user", parts: [{ text: `<<<USER_MESSAGE>>>\n${userMessage}` }] },
  ];

  // If an image is provided, attach to prompt
  if (imageBase64) {
    content.push({
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64, // already base64
          },
        },
      ],
    });
  }

  // Call Gemini
  const result = await model.generateContent({
    contents: content,
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json", // forces JSON output
    },
  });

  const output = result.response.text();
  return output;
}
