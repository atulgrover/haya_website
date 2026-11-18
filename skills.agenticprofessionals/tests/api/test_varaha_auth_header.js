const fs = require("fs");
const assert = require("assert");

function testHeaderAuthIntegration() {
  const content = fs.readFileSync("/Users/atulgrover/Desktop/VARAHA/js/components.js", "utf-8");
  assert(content.includes("varahaAuthAction") || content.includes("http://localhost:3300/auth/login?app=varaha"), 
    "VARAHA components.js must include Garuda login integration link");
  assert(content.includes("varaha_token") || content.includes("varaha_user"), 
    "VARAHA components.js must include session state checking logic");
  console.log("PASS: Varaha header auth integration verified");
}

testHeaderAuthIntegration();
