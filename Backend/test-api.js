// Test script to verify API endpoints
// Run with: node test-api.js

import http from "http";

const BASE_URL = "http://localhost:5000";
let testResults = [];

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log("\n🧪 Testing: GET / (Health Check)");
  try {
    const response = await makeRequest("GET", "/");
    if (response.statusCode === 200 && response.data.status === "running") {
      console.log("✅ PASS - Server is running");
      testResults.push({ test: "Health Check", status: "PASS" });
      return true;
    } else {
      console.log("❌ FAIL - Unexpected response");
      testResults.push({ test: "Health Check", status: "FAIL" });
      return false;
    }
  } catch (error) {
    console.log("❌ FAIL - Cannot connect to server");
    console.log("   Make sure the server is running on port 5000");
    testResults.push({ test: "Health Check", status: "FAIL" });
    return false;
  }
}

async function testCreateUser() {
  console.log("\n🧪 Testing: POST /users (Create User)");
  try {
    const userData = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
    };

    const response = await makeRequest("POST", "/users", userData);

    if (response.statusCode === 200 && response.data.success) {
      console.log("✅ PASS - User created successfully");
      console.log(`   User ID: ${response.data.user.id}`);
      testResults.push({ test: "Create User", status: "PASS" });
      return response.data.user.id;
    } else {
      console.log("❌ FAIL - Failed to create user");
      testResults.push({ test: "Create User", status: "FAIL" });
      return null;
    }
  } catch (error) {
    console.log("❌ FAIL - Error:", error.message);
    testResults.push({ test: "Create User", status: "FAIL" });
    return null;
  }
}

async function testGetUser(userId) {
  console.log("\n🧪 Testing: GET /users/:id (Get User)");
  try {
    const response = await makeRequest("GET", `/users/${userId}`);

    if (response.statusCode === 200 && response.data.success) {
      console.log("✅ PASS - User retrieved successfully");
      console.log(`   User: ${response.data.user.name}`);
      testResults.push({ test: "Get User", status: "PASS" });
      return true;
    } else {
      console.log("❌ FAIL - Failed to get user");
      testResults.push({ test: "Get User", status: "FAIL" });
      return false;
    }
  } catch (error) {
    console.log("❌ FAIL - Error:", error.message);
    testResults.push({ test: "Get User", status: "FAIL" });
    return false;
  }
}

async function testChatEndpoint() {
  console.log("\n🧪 Testing: POST /chat (Chat Message)");
  try {
    const chatData = {
      message: "Hello, this is a test message",
      conversationHistory: [],
    };

    const response = await makeRequest("POST", "/chat", chatData);

    if (response.statusCode === 200 && response.data.success) {
      console.log("✅ PASS - Chat endpoint working");
      console.log(
        `   Response preview: ${response.data.response.substring(0, 50)}...`
      );
      testResults.push({ test: "Chat Endpoint", status: "PASS" });
      return true;
    } else {
      console.log("❌ FAIL - Chat endpoint error");
      testResults.push({ test: "Chat Endpoint", status: "FAIL" });
      return false;
    }
  } catch (error) {
    console.log("❌ FAIL - Error:", error.message);
    console.log("   Check if GEMINI_API_KEY is set correctly");
    testResults.push({ test: "Chat Endpoint", status: "FAIL" });
    return false;
  }
}

async function testSaveSession(userId) {
  console.log("\n🧪 Testing: POST /save-session (Save Session)");
  try {
    const sessionData = {
      userId: userId,
      title: "Test Session",
      messages: [
        {
          role: "user",
          content: "Test message",
          timestamp: new Date().toISOString(),
        },
      ],
      screenSteps: [],
    };

    const response = await makeRequest("POST", "/save-session", sessionData);

    if (response.statusCode === 200 && response.data.success) {
      console.log("✅ PASS - Session saved successfully");
      console.log(`   Session ID: ${response.data.sessionId}`);
      testResults.push({ test: "Save Session", status: "PASS" });
      return response.data.sessionId;
    } else {
      console.log("❌ FAIL - Failed to save session");
      testResults.push({ test: "Save Session", status: "FAIL" });
      return null;
    }
  } catch (error) {
    console.log("❌ FAIL - Error:", error.message);
    testResults.push({ test: "Save Session", status: "FAIL" });
    return null;
  }
}

async function testGetSession(sessionId) {
  console.log("\n🧪 Testing: GET /sessions/:id (Get Session)");
  try {
    const response = await makeRequest("GET", `/sessions/${sessionId}`);

    if (response.statusCode === 200 && response.data.success) {
      console.log("✅ PASS - Session retrieved successfully");
      console.log(`   Session title: ${response.data.session.title}`);
      testResults.push({ test: "Get Session", status: "PASS" });
      return true;
    } else {
      console.log("❌ FAIL - Failed to get session");
      testResults.push({ test: "Get Session", status: "FAIL" });
      return false;
    }
  } catch (error) {
    console.log("❌ FAIL - Error:", error.message);
    testResults.push({ test: "Get Session", status: "FAIL" });
    return false;
  }
}

async function testStatus() {
  console.log("\n🧪 Testing: GET /status (Server Status)");
  try {
    const response = await makeRequest("GET", "/status");

    if (response.statusCode === 200 && response.data.success) {
      console.log("✅ PASS - Status endpoint working");
      console.log(
        `   Active WebSocket connections: ${response.data.activeWebSocketConnections}`
      );
      testResults.push({ test: "Server Status", status: "PASS" });
      return true;
    } else {
      console.log("❌ FAIL - Status endpoint error");
      testResults.push({ test: "Server Status", status: "FAIL" });
      return false;
    }
  } catch (error) {
    console.log("❌ FAIL - Error:", error.message);
    testResults.push({ test: "Server Status", status: "FAIL" });
    return false;
  }
}

// Print summary
function printSummary() {
  console.log("\n" + "═".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("═".repeat(60));

  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;
  const total = testResults.length;

  testResults.forEach((result) => {
    const icon = result.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${result.test.padEnd(25)} - ${result.status}`);
  });

  console.log("═".repeat(60));
  console.log(`Total Tests: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Backend is working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the errors above.");
  }
  console.log("═".repeat(60) + "\n");
}

// Run all tests
async function runTests() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                                                          ║");
  console.log("║   🧪 Backend API Test Suite                             ║");
  console.log("║                                                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Test 1: Health Check
  const serverRunning = await testHealthCheck();
  if (!serverRunning) {
    console.log("\n❌ Server is not running. Please start the server first:");
    console.log("   npm run dev");
    process.exit(1);
  }

  // Test 2: Server Status
  await testStatus();

  // Test 3: Create User
  const userId = await testCreateUser();

  // Test 4: Get User (if user was created)
  if (userId) {
    await testGetUser(userId);
  }

  // Test 5: Chat Endpoint
  await testChatEndpoint();

  // Test 6: Save Session (if user was created)
  let sessionId = null;
  if (userId) {
    sessionId = await testSaveSession(userId);
  }

  // Test 7: Get Session (if session was saved)
  if (sessionId) {
    await testGetSession(sessionId);
  }

  // Print summary
  printSummary();
}

// Run the tests
runTests().catch((error) => {
  console.error("\n❌ Test suite failed:", error);
  process.exit(1);
});
