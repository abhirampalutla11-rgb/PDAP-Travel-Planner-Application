// WanderWise Gemini travel companion. JWT verification is enabled by Supabase.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "Gemini is not configured yet." }, 503);

  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 1200) return json({ error: "Message must contain 1–1200 characters." }, 400);

    const context = body.context && typeof body.context === "object" ? body.context : {};
    // Gemini conversation history must begin with a user turn. The app's
    // chat UI starts with a local welcome bubble, not a real Gemini response.
    const history = Array.isArray(body.history) ? body.history.slice(-10).filter((item: any) =>
      item && ["user", "assistant"].includes(item.role) && typeof item.content === "string"
    ) : [];
    while (history.length && history[0].role !== "user") history.shift();
    const language = ["English", "Telugu", "Hindi", "Tamil"].includes(context.language) ? context.language : "English";
    const systemInstruction = [
      "You are WanderWise AI, a friendly and practical travel-planning companion for budget-conscious travellers.",
      "Give clear, useful, structured travel advice. Prefer affordable and public-transport-friendly options where sensible.",
      "Use Indian Rupees (₹) when discussing costs for this app. Separate estimates from verified prices.",
      "Never claim that prices, hotel availability, transport schedules, opening hours, weather, or bookings are live or confirmed unless the user supplies verified data.",
      "Do not invent citations, booking confirmations, exact fares, or current availability. Explain when the traveller should verify details.",
      "For itineraries, organise suggestions by day and time of day, avoid unrealistic travel between distant attractions, and include practical breaks.",
      "When information is missing, make reasonable assumptions and state them briefly rather than asking many questions.",
      "Keep answers concise but helpful. Do not ask for passwords, payment details, or sensitive personal information.",
      `Reply in ${language} unless the user explicitly asks for another language.`,
      `Current WanderWise planning context: destination=${String(context.destination || "not selected")}; trip duration=${String(context.days || "not set")} days; travellers=${String(context.travellers || "not set")}; budget=${String(context.budget || "not set")} INR; saved trips on device=${String(context.savedTripCount ?? 0)}.`,
    ].join("\n");

    const contents = [
      ...history.map((item: any) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content.slice(0, 1200) }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.65, maxOutputTokens: 1200 },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Gemini API error", response.status, result?.error?.message || "unknown error");
      return json({ error: "Gemini could not complete that request. Please try again shortly." }, 502);
    }
    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part: any) => typeof part.text === "string" ? part.text : "")
      .join("").trim();
    if (!reply) return json({ error: "Gemini returned no text. Please rephrase your request." }, 502);
    return json({ reply });
  } catch (error) {
    console.error("WanderWise AI function failed", error);
    return json({ error: "The AI request could not be processed." }, 500);
  }
});
