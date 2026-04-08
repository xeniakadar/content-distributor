const form = document.querySelector("#generator-form");
const topicInput = document.querySelector("#topic");
const generateButton = document.querySelector("#generate-button");
const buttonText = document.querySelector("#button-text");
const statusMessage = document.querySelector("#status-message");
const outputSection = document.querySelector("#output");
const summary = document.querySelector("#summary");
const insightsContainer = document.querySelector("#insights");
const linkedInPost = document.querySelector("#linkedin-post");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const topic = topicInput.value.trim();

  if (!topic) {
    showStatus("Please enter text first.", true);
    outputSection.classList.add("hidden");
    return;
  }

  setLoadingState(true);
  showStatus("");

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Generation failed.");
    }

    renderOutput(topic, payload);
    showStatus("Content generated successfully.");
  } catch (error) {
    outputSection.classList.add("hidden");
    showStatus(error.message || "Something went wrong.", true);
  } finally {
    setLoadingState(false);
  }
});

function renderOutput(topic, payload) {
  insightsContainer.innerHTML = "";
  summary.textContent = `Generated 3 insights, 9 angles, 18 hooks, and 1 LinkedIn post from your input about "${topic}".`;

  payload.insights.forEach((insight, index) => {
    const card = document.createElement("article");
    card.className = "insight-card";

    const title = document.createElement("h3");
    title.textContent = `Insight ${index + 1}`;

    const body = document.createElement("p");
    body.textContent = insight.insight;

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
    card.appendChild(angleList);
    insightsContainer.appendChild(card);
  });

  linkedInPost.textContent = payload.linkedin_post;
  outputSection.classList.remove("hidden");
}

function setLoadingState(isLoading) {
  generateButton.disabled = isLoading;
  buttonText.textContent = isLoading ? "Generating..." : "Generate Content";
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}
