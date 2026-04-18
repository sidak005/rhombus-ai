# Rhombus AI — Test Suite

Automated tests for the [Rhombus AI](https://rhombusai.com) web app

## Demo Video

[Watch the demo]https://drive.google.com/file/d/1wCxIG27EWiyd5FX_zzopA3hDZ5ck_omV/view?usp=sharing

## Setup

### Requirements
- Node.js v18+
- Python 3.8+

### Install

```bash
npm install
npx playwright install chromium
```

### Environment Variables

Create a `.env` file in the root folder:
RHOMBUS_EMAIL=...
RHOMBUS_PASSWORD=...
RHOMBUS_PROJECT_ID=...
RHOMBUS_TOKEN=...

To get your token:
1. Log in to rhombusai.com
2. Open DevTools -> Network tab
3. Click the session request
4. Copy the accessToken from the Response tab

## Running the Tests

### Part 1 — UI Tests

```bash
npx playwright test ui-tests/rhombus.spec.js --headed
```

Signs in, uploads a messy CSV, prompts the AI to clean it, runs the pipeline and finally downloads the result

### Part 2 — API Tests

```bash
node api-tests/api.test.js
```

Tests authentication, user profile, credits, projects, datasets, pipeline nodes and two negative cases

### Part 3 — Data Validation

```bash
python3 data-validation/validate.py
```

Compares the input and output CSV files to check that the AI correctly transformed the data
