//summarise the email using the google ai sdk
import {google} from "@ai-sdk/google";
import{generateObject} from "ai";
import {z} from "zod";
const emailSummarySchema = z.object({
    summary:z.string(),
    action:z.string(),
    reply:z.string(),
    priority:z.enum(["need-action","important","low-priority"])})

    export async function summariseEmail(subject:string,body:string){
        // Only send the first ~2000 chars to the model. Summaries don't need the
        // whole newsletter, and shorter prompts = fewer tokens = cheaper/faster
        // and easier on free-tier limits.
        const trimmedBody = body.slice(0, 2000)

        const result=await generateObject({
            // flash-lite has higher free-tier limits than flash, and is plenty
            // for summarising an email.
            model:google("gemini-2.5-flash-lite"),
            schema:emailSummarySchema,
            prompt: `

You are an email assistant.

Analyze this email.

Subject:

${subject}

Body:

${trimmedBody}

Return:

1. summary: A short 1-2 sentence summary of the email.

2. action: What the user should do about it (one short line).

3. reply: A short, polite reply the user could send. Plain text, ready to send.

4. priority: The email priority.

`,

  });

  return result.object;

    }