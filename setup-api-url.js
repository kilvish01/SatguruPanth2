#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Fetching API Gateway URL...\n');

try {
  // Try to get the URL from serverless info
  const output = execSync('cd AWS_Backend && npx serverless info --verbose', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  const match = output.match(/ServiceEndpoint:\s*(https:\/\/[^\s]+)/);
  
  if (match && match[1]) {
    const apiUrl = match[1];
    console.log('✅ Found API Gateway URL:', apiUrl);
    
    // Update the config file
    const configPath = path.join(__dirname, 'src', 'config', 'api.config.ts');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    configContent = configContent.replace(
      /AWS_API_URL:\s*['"][^'"]*['"]/,
      `AWS_API_URL: '${apiUrl}'`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Updated src/config/api.config.ts\n');
    console.log('🎉 Configuration complete! You can now run: npx expo start');
  } else {
    console.log('❌ Could not find ServiceEndpoint in serverless info output');
    console.log('\n📝 Please manually update src/config/api.config.ts with your API Gateway URL');
    console.log('   Run: cd AWS_Backend && npx serverless info');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('\n📝 Please manually get your API Gateway URL:');
  console.log('   1. Run: cd AWS_Backend && npx serverless info');
  console.log('   2. Copy the ServiceEndpoint URL');
  console.log('   3. Update src/config/api.config.ts');
}
