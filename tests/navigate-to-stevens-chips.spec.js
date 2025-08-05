const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Navigate to Steven\'s Chips website in incognito Chrome', async ({ browser }) => {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '..', 'logs');
  console.log('Logs directory path:', logsDir);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('Created logs directory');
  }
  
  const logFile = path.join(logsDir, 'network-requests.log');
  console.log('Log file path:', logFile);
  
  // Test file writing
  try {
    fs.writeFileSync(logFile, 'Network Requests Log\n' + new Date().toISOString() + '\n\n');
    console.log('Successfully created log file');
  } catch (error) {
    console.error('Error creating log file:', error);
  }
  
  // Launch a new incognito context
  const context = await browser.newContext({
    // This creates an incognito/private browsing session
    // In Playwright, newContext() creates an isolated session by default
  });
  
  // Create a new page in the incognito context
  const page = await context.newPage();
  
  // Array to store network requests
  const networkRequests = [];
  
  // Listen to all network requests
  page.on('request', request => {
    const url = request.url();
    
    // Only log requests that begin with the specified URL
    if (url.startsWith('https://server-qa.myrepai.com/web/load')) {
      console.log(`🔍 LOAD REQUEST DETECTED: ${request.method()} ${url}`);
      const startTime = Date.now();
      const requestData = {
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData(),
        resourceType: request.resourceType(),
        timestamp: new Date().toISOString(),
        startTime: startTime
      };
      
      // Store request data for later processing
      requestData._requestId = request.url() + '_' + startTime;
      networkRequests.push(requestData);
    }
  });
  
  // Listen to all network responses
  page.on('response', async response => {
    const url = response.url();
    
    // Only process responses for requests that begin with the specified URL
    if (url.startsWith('https://server-qa.myrepai.com/web/load')) {
      console.log(`🔍 LOAD RESPONSE DETECTED: ${response.status()} ${url}`);
      const endTime = Date.now();
      const request = response.request();
      
      // Find the corresponding request by URL
      const requestData = networkRequests.find(req => req.url === request.url());
      
      if (requestData) {
      requestData.executionTime = endTime - requestData.startTime;
      requestData.status = response.status();
      requestData.statusText = response.statusText();
      requestData.responseHeaders = response.headers();
      
             try {
         // Try to get response body (for text-based responses)
         const contentType = response.headers()['content-type'] || '';
         if (contentType.includes('application/json') || contentType.includes('text/')) {
           const responseText = await response.text();
           // Try to parse as JSON if it's JSON content
           if (contentType.includes('application/json')) {
             try {
               requestData.responseBody = JSON.parse(responseText);
             } catch (parseError) {
               requestData.responseBody = responseText; // Fallback to string if parsing fails
             }
           } else {
             requestData.responseBody = responseText;
           }
         } else {
           requestData.responseBody = '[Binary data]';
         }
       } catch (error) {
         requestData.responseBody = '[Error reading response body]';
       }
      
             // Create response data without payload
       const responseData = {
         url: requestData.url,
         timestamp: requestData.timestamp,
         method: requestData.method,
         status: requestData.status,
         executionTime: requestData.executionTime + 'ms',
         responseHeaders: requestData.responseHeaders,
         responseBody: requestData.responseBody,
         resourceType: requestData.resourceType
       };
       
       // Write response to separate JSON file with timestamp
       try {
         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
         const responseFileName = `load-${timestamp}.json`;
         const responseFilePath = path.join(logsDir, responseFileName);
         
         // Add URL at the beginning of the response body
         const fullResponseData = {
           requestUrl: requestData.url,
           ...responseData
         };
         
         fs.writeFileSync(responseFilePath, JSON.stringify(fullResponseData, null, 2));
         console.log(`Response saved to: ${responseFileName}`);
       } catch (error) {
         console.error('Error writing response file:', error);
       }
      
             // Log detailed information for load requests
       console.log(`\n🔍 LOAD REQUEST DETAILS:`);
       console.log(`URL: ${requestData.url}`);
       console.log(`Method: ${requestData.method}`);
       console.log(`Status: ${requestData.status}`);
       console.log(`Execution Time: ${requestData.executionTime}ms`);
       console.log(`Payload: ${requestData.postData || 'No payload'}`);
               console.log(`Response: ${requestData.responseBody ? JSON.stringify(requestData.responseBody).substring(0, 200) + '...' : 'No response body'}`);
       }
     }
   });
  
  // Navigate to Steven's Chips website
  await page.goto('https://stevens-chips.myshopify.com/');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more to capture any additional requests
  await page.waitForTimeout(2000);
  
  // Verify that we're on the correct website by checking the title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'stevens-chips-homepage.png' });
  
  // Optional: Verify some basic elements are present
  await expect(page.locator('text=Steven\'s Chips').first()).toBeVisible();
  
  console.log(`\n📊 Network requests logged to: ${logFile}`);
  console.log(`Total requests captured: ${networkRequests.length}`);
  
  // Close the context (this will close the incognito session)
  await context.close();
}); 