import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ocr: router({
    extract: publicProcedure
      .input(z.object({ imageData: z.string().min(1).max(8_000_000) }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          model: "gemini-3-flash-preview",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Extract all legible text from this image. Return an empty string when there is no readable text. Do not describe the image or add commentary." },
              { type: "image_url", image_url: { url: `data:image/png;base64,${input.imageData}`, detail: "high" } },
            ],
          }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ocr_result",
              strict: true,
              schema: {
                type: "object",
                properties: { text: { type: "string" } },
                required: ["text"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message?.content;
        const raw = typeof content === "string" ? content : "";
        try { return { text: (JSON.parse(raw) as { text?: string }).text?.trim() ?? "" }; }
        catch { return { text: raw.trim() }; }
      }),
  }),
});

export type AppRouter = typeof appRouter;
