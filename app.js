const generateButton = document.querySelector("#generate-button");
const topicInput = document.querySelector("#topic");
const outputSection = document.querySelector("#output");
const summary = document.querySelector("#summary");
const insightsContainer = document.querySelector("#insights");
const linkedInPost = document.querySelector("#linkedin-post");

const insightTemplates = [
  {
    title: "Shift in audience behavior",
    detail:
      "People respond faster when the message makes the next step feel obvious and low effort.",
    anglePrefixes: [
      "Explain why the old approach loses attention",
      "Show the small change that improves response",
      "Turn the pattern into a practical team habit",
    ],
  },
  {
    title: "Execution gap",
    detail:
      "Most teams already have enough ideas, but they struggle to turn one idea into multiple usable assets.",
    anglePrefixes: [
      "Break down the workflow into repeatable pieces",
      "Compare scattered creation with a simple system",
      "Highlight how repurposing saves time without lowering quality",
    ],
  },
  {
    title: "Business payoff",
    detail:
      "Clearer positioning and stronger distribution create more chances for the right people to notice the message.",
    anglePrefixes: [
      "Connect better messaging to business outcomes",
      "Frame consistency as a growth advantage",
      "Show how focused content earns trust over time",
    ],
  },
];

const hookTemplates = [
  "Most people talking about {topic} miss this point: {angle}.",
  "If your work on {topic} feels harder than it should, start with this: {angle}.",
  "One simple way to improve {topic} is to focus on this first: {angle}.",
  "The teams getting better results from {topic} usually do this differently: {angle}.",
  "A practical lesson from {topic}: {angle}.",
  "Before you create more around {topic}, pressure-test this idea: {angle}.",
];

generateButton.addEventListener("click", () => {
  const rawTopic = topicInput.value.trim();

  if (!rawTopic) {
    outputSection.classList.add("hidden");
    alert("Please enter a topic first.");
    return;
  }

  const topic = normalizeTopic(rawTopic);
  const insights = buildInsights(topic);
  const post = buildLinkedInPost(topic, insights);

  renderInsights(topic, insights);
  linkedInPost.textContent = post;
  summary.textContent = `Generated 3 insights, 9 angles, 18 hooks, and 1 LinkedIn post for "${topic}".`;
  outputSection.classList.remove("hidden");
});

function normalizeTopic(text) {
  return text.replace(/\s+/g, " ");
}

function buildInsights(topic) {
  return insightTemplates.map((template, insightIndex) => {
    const insightText = `${template.title}: ${template.detail} In the context of ${topic}, this matters because it makes the message easier to understand and share.`;

    const angles = template.anglePrefixes.map((prefix, angleIndex) => {
      const angle = `${prefix} for ${topic.toLowerCase()}.`;
      const hooks = [
        createHook(topic, angle, insightIndex * 2 + angleIndex),
        createHook(topic, angle, insightIndex * 2 + angleIndex + 1),
      ];

      return { angle, hooks };
    });

    return {
      title: `Insight ${insightIndex + 1}`,
      body: insightText,
      angles,
    };
  });
}

function createHook(topic, angle, seed) {
  const template = hookTemplates[seed % hookTemplates.length];
  return template.replace("{topic}", topic).replace("{angle}", angle);
}

function buildLinkedInPost(topic, insights) {
  return `A lot of teams have valuable ideas about ${topic}, but they still struggle to turn those ideas into content that travels.\n\nHere are 3 useful takeaways:\n\n1. ${insights[0].body}\n2. ${insights[1].body}\n3. ${insights[2].body}\n\nThe opportunity is not just creating more. It is creating once, then shaping that message into multiple angles people actually want to read.\n\nIf you were refining your approach to ${topic}, which angle would you publish first?`;
}

function renderInsights(topic, insights) {
  insightsContainer.innerHTML = "";

  insights.forEach((insight) => {
    const card = document.createElement("article");
    card.className = "insight-card";

    const title = document.createElement("h3");
    title.textContent = insight.title;

    const body = document.createElement("p");
    body.textContent = insight.body;

    const angleLabel = document.createElement("p");
    angleLabel.className = "angle-hooks";
    angleLabel.textContent = `Angles for ${topic}:`;

    const angleList = document.createElement("ol");
    angleList.className = "angle-list";

    insight.angles.forEach((angleGroup) => {
      const angleItem = document.createElement("li");
      angleItem.className = "angle-item";

      const angleText = document.createElement("strong");
      angleText.textContent = angleGroup.angle;

      const hookList = document.createElement("ul");
      hookList.className = "hook-list";

      angleGroup.hooks.forEach((hook) => {
        const hookItem = document.createElement("li");
        hookItem.textContent = hook;
        hookList.appendChild(hookItem);
      });

      angleItem.appendChild(angleText);
      angleItem.appendChild(hookList);
      angleList.appendChild(angleItem);
    });

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(angleLabel);
    card.appendChild(angleList);
    insightsContainer.appendChild(card);
  });
}
