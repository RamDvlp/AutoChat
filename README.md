# AutoChat Playwright Project

This project contains a Playwright script to navigate to the Steven's Chips website in incognito Chrome mode.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install-browsers
```

## Running the Script

### Run the test in headless mode:
```bash
npm test
```

### Run the test with browser visible:
```bash
npm run test:headed
```

### Run the test in debug mode:
```bash
npm run test:debug
```

## What the Script Does

The script (`tests/navigate-to-stevens-chips.spec.js`) will:

1. Launch Chrome in incognito/private browsing mode
2. Navigate to https://stevens-chips.myshopify.com/
3. Wait for the page to fully load
4. Take a screenshot of the homepage
5. Verify that the "Steven's Chips" text is visible on the page
6. Close the browser session

## Output

- The script will create a screenshot file named `stevens-chips-homepage.png` in the project root
- Test results will be displayed in the console
- HTML test report will be generated in the `playwright-report` directory

## Notes

- In Playwright, `browser.newContext()` creates an isolated session that behaves like incognito mode
- The script uses Chrome (Chromium) browser as configured in `playwright.config.js`
- The test includes basic verification to ensure the page loaded correctly 