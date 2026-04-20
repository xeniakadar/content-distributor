const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["insights", "linkedin_post"],
  properties: {
    insights: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["insight", "angles"],
        properties: {
          insight: { type: "string" },
          angles: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["angle", "hooks"],
              properties: {
                angle: { type: "string" },
                hooks: {
                  type: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    linkedin_post: { type: "string" },
  },
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/generate") {
      await handleGenerate(request, response);
      return;
    }

    if (request.method === "GET") {
      serveStatic(request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`Content Distributor running on http://localhost:${PORT}`);
});

async function handleGenerate(request, response) {
  if (!API_KEY) {
    sendJson(response, 500, {
      error: "Missing OPENAI_API_KEY. Set it in your environment before starting the server.",
    });
    return;
  }

  const body = await readJsonBody(request);
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";

  if (!topic) {
    sendJson(response, 400, { error: "Topic is required." });
    return;
  }

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are a content strategist. Return valid JSON only. No markdown, no commentary, no code fences. Base every output on the user's exact input text.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(topic),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "content_distribution",
          schema: responseSchema,
          strict: true,
        },
      },
    }),
  });

  const payload = await aiResponse.json();

  if (!aiResponse.ok) {
    const errorMessage =
      payload?.error?.message || "OpenAI request failed. Check your API key and model access.";
    sendJson(response, aiResponse.status, { error: errorMessage });
    return;
  }

  const outputText = payload.output_text;

  if (!outputText) {
    sendJson(response, 502, { error: "The model returned no text output." });
    return;
  }

  let parsed;

  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    sendJson(response, 502, { error: "The model returned invalid JSON." });
    return;
  }

  const validationError = validateGeneratedContent(parsed);

  if (validationError) {
    sendJson(response, 502, { error: validationError });
    return;
  }

  sendJson(response, 200, parsed);
}

function buildPrompt(topic) {
  return [
    "Analyze the user's text and generate content ideas that clearly depend on it.",
    `User input: ${topic}`,
    "Return JSON with this exact shape:",
    "{",
    '  "insights": [',
    '    { "insight": "string", "angles": [',
    '      { "angle": "string", "hooks": ["string", "string"] }',
    "    ] }",
    "  ],",
    '  "linkedin_post": "string"',
    "}",
    "Requirements:",
    "- Generate exactly 3 insights.",
    "- Generate exactly 3 angles for each insight.",
    "- Generate exactly 2 hooks for each angle.",
    "- Generate 1 LinkedIn post that synthesizes the ideas.",
    "- Avoid placeholders and generic filler.",
    "- Make the language specific to the user's input.",
  ].join("\n");
}

function validateGeneratedContent(data) {
  if (!data || typeof data !== "object") {
    return "The model returned an invalid response shape.";
  }

  if (!Array.isArray(data.insights) || data.insights.length !== 3) {
    return "The model did not return exactly 3 insights.";
  }

  if (typeof data.linkedin_post !== "string" || !data.linkedin_post.trim()) {
    return "The model did not return a LinkedIn post.";
  }

  for (const insight of data.insights) {
    if (typeof insight.insight !== "string" || !insight.insight.trim()) {
      return "An insight was missing text.";
    }

    if (!Array.isArray(insight.angles) || insight.angles.length !== 3) {
      return "Each insight must include exactly 3 angles.";
    }

    for (const angle of insight.angles) {
      if (typeof angle.angle !== "string" || !angle.angle.trim()) {
        return "An angle was missing text.";
      }

      if (!Array.isArray(angle.hooks) || angle.hooks.length !== 2) {
        return "Each angle must include exactly 2 hooks.";
      }

      for (const hook of angle.hooks) {
        if (typeof hook !== "string" || !hook.trim()) {
          return "A hook was missing text.";
        }
      }
    }
  }

  return null;
}

function serveStatic(request, response) {
  const safePath = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendText(response, 404, "Not found");
        return;
      }

      sendText(response, 500, "Internal server error");
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    response.end(file);
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": MIME_TYPES[".json"],
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(text);
}
