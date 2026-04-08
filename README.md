# Content Distributor

Minimal web app that uses the OpenAI API to generate:

- 3 insights
- 3 angles per insight
- 2 hooks per angle
- 1 LinkedIn post

## Requirements

- Node.js 18+ for built-in `fetch`
- `OPENAI_API_KEY` in your environment

## Run

```bash
cd /Users/xeniakadar/Coding/content-distributor
export OPENAI_API_KEY="your_api_key_here"
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

## Optional

Set a different model if you want:

```bash
export OPENAI_MODEL="gpt-5.4-mini"
```
