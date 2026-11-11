import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let REPO_OWNER = process.env.REPO_OWNER || 'arkan12-maker';
let REPO_NAME = process.env.REPO_NAME || 'backup-mexpo';

try {
  const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/);
  if (match) {
    REPO_OWNER = match[1];
    REPO_NAME = match[2];
  }
} catch (e) {
  // Keep default
}

// 1. Default Known Secrets (ECR and region fallback)
const BASE_SECRETS = {
  AWS_REGION: process.env.AWS_REGION || 'ap-southeast-2',
  ECR_BACKEND_IMAGE: process.env.ECR_BACKEND_IMAGE || '331235584925.dkr.ecr.ap-southeast-2.amazonaws.com/mexpo-be',
  ECR_FRONTEND_IMAGE: process.env.ECR_FRONTEND_IMAGE || '331235584925.dkr.ecr.ap-southeast-2.amazonaws.com/mexpo-fe',
};

// 2. Parse .env file supporting multiline quoted values
function loadEnvFile(envPath) {
  const result = {};
  if (!fs.existsSync(envPath)) return result;
  
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  let currentKey = null;
  let currentValue = '';
  let inQuotes = null;

  for (const line of lines) {
    if (!currentKey) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();

      if (val.startsWith('"')) {
        inQuotes = '"';
        val = val.slice(1);
        if (val.endsWith('"') && val.length > 0) {
          result[key] = val.slice(0, -1);
          inQuotes = null;
        } else {
          currentKey = key;
          currentValue = val;
        }
      } else if (val.startsWith("'")) {
        inQuotes = "'";
        val = val.slice(1);
        if (val.endsWith("'") && val.length > 0) {
          result[key] = val.slice(0, -1);
          inQuotes = null;
        } else {
          currentKey = key;
          currentValue = val;
        }
      } else {
        const commentIdx = val.indexOf('#');
        if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
        result[key] = val;
      }
    } else {
      if (inQuotes === '"' && line.includes('"')) {
        const quoteIdx = line.lastIndexOf('"');
        currentValue += '\n' + line.slice(0, quoteIdx);
        result[currentKey] = currentValue;
        currentKey = null;
        currentValue = '';
        inQuotes = null;
      } else if (inQuotes === "'" && line.includes("'")) {
        const quoteIdx = line.lastIndexOf("'");
        currentValue += '\n' + line.slice(0, quoteIdx);
        result[currentKey] = currentValue;
        currentKey = null;
        currentValue = '';
        inQuotes = null;
      } else {
        currentValue += '\n' + line;
      }
    }
  }
  return result;
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  console.log('\n======================================================');
  console.log('   🚀 Mexpo GitHub Repository Secrets Importer');
  console.log('======================================================\n');
  console.log(`Target Repository: ${REPO_OWNER}/${REPO_NAME}\n`);

  let token = process.env.GITHUB_TOKEN;
  if (!token) {
    token = await askQuestion('🔑 Enter your GitHub Personal Access Token (with "repo" scope): ');
  }

  if (!token) {
    console.error('❌ GitHub Token is required. Exiting.');
    process.exit(1);
  }

  // Check and install libsodium-wrappers if missing
  let sodium;
  try {
    sodium = require('libsodium-wrappers');
    await sodium.ready;
  } catch (err) {
    console.log('📦 Installing temporary libsodium-wrappers dependency...');
    execSync('npm install --no-save libsodium-wrappers', { stdio: 'inherit' });
    sodium = require('libsodium-wrappers');
    await sodium.ready;
  }

  // Load .env from root
  const rootEnvPath = path.resolve(process.cwd(), '.env');
  const envVars = loadEnvFile(rootEnvPath);

  // Combine secrets (envVars from .env override default BASE_SECRETS)
  const allSecrets = {
    ...BASE_SECRETS,
    ...envVars,
  };

  // Check for EC2_SSH_KEY
  if (!allSecrets.EC2_SSH_KEY) {
    const keyPath = await askQuestion('🔑 (Optional) Path to your EC2 SSH private key (.pem): ');
    if (keyPath && fs.existsSync(keyPath)) {
      allSecrets.EC2_SSH_KEY = fs.readFileSync(keyPath, 'utf8');
    }
  }

  // Unescape literal \n in EC2_SSH_KEY if it was stored as a single line string
  if (allSecrets.EC2_SSH_KEY && typeof allSecrets.EC2_SSH_KEY === 'string') {
    allSecrets.EC2_SSH_KEY = allSecrets.EC2_SSH_KEY.replace(/\\n/g, '\n').trim();
  }

  // Set default EC2_HOST if available in .env or ask
  if (!allSecrets.EC2_HOST && envVars.API_BASE_URL) {
    const hostMatch = envVars.API_BASE_URL.match(/https?:\/\/([^:\/]+)/);
    if (hostMatch) {
      allSecrets.EC2_HOST = hostMatch[1];
    }
  }
  if (!allSecrets.EC2_USER) {
    allSecrets.EC2_USER = 'ubuntu';
  }

  // Mirror EC2_* and SSH_* for cross-workflow compatibility
  if (allSecrets.EC2_HOST) allSecrets.SSH_HOST = allSecrets.EC2_HOST;
  if (allSecrets.EC2_USER) allSecrets.SSH_USER = allSecrets.EC2_USER;
  if (allSecrets.EC2_PORT) allSecrets.SSH_PORT = allSecrets.EC2_PORT;
  if (allSecrets.EC2_SSH_KEY) allSecrets.SSH_KEY = allSecrets.EC2_SSH_KEY;

  console.log(`\nFetching public key for ${REPO_OWNER}/${REPO_NAME}...`);
  const pubKeyRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/public-key`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!pubKeyRes.ok) {
    const errorText = await pubKeyRes.text();
    console.error(`❌ Failed to get repository public key: ${pubKeyRes.status} ${errorText}`);
    process.exit(1);
  }

  const { key: publicKeyBase64, key_id: publicKeyId } = await pubKeyRes.json();
  const publicKeyBytes = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL);

  console.log(`✅ Public Key ID obtained: ${publicKeyId}\n`);
  console.log('Uploading secrets to GitHub Actions...\n');

  let successCount = 0;
  let failCount = 0;

  for (const [secretName, secretValue] of Object.entries(allSecrets)) {
    if (secretValue === undefined || secretValue === null || secretValue === '') {
      continue;
    }

    try {
      const messageBytes = sodium.from_string(String(secretValue));
      const encryptedBytes = sodium.crypto_box_seal(messageBytes, publicKeyBytes);
      const encryptedBase64 = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

      const putRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/${secretName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            encrypted_value: encryptedBase64,
            key_id: publicKeyId,
          }),
        }
      );

      if (putRes.ok || putRes.status === 201 || putRes.status === 204) {
        console.log(` ✔️ Set secret: ${secretName}`);
        successCount++;
      } else {
        const errorText = await putRes.text();
        console.error(` ❌ Failed to set ${secretName}: ${putRes.status} ${errorText}`);
        failCount++;
      }
    } catch (err) {
      console.error(` ❌ Error setting ${secretName}:`, err.message);
      failCount++;
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 Finished! Successfully uploaded ${successCount} secrets. (${failCount} failed)`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
