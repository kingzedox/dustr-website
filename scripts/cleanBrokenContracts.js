import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, http, parseAbi } from 'viem';
import { monadTestnet, monad } from 'viem/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const erc20Abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)'
]);

async function cleanBrokenContracts() {
  console.log('🧹 Starting broken contract cleanup...');
  
  const tokenFilePath = path.join(__dirname, '../src/config/monad_tokens.json');
  if (!fs.existsSync(tokenFilePath)) {
    console.error('Token file not found!');
    return;
  }

  const tokens = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
  console.log(`Loaded ${tokens.length} tokens for testing.`);

  // Connect to Monad (using testnet RPC for testing compatibility)
  const client = createPublicClient({
    chain: monadTestnet,
    transport: http('https://rpc.monad.xyz')
  });

  const validTokens = [];
  let brokenCount = 0;

  // We chunk them to use multicall for speed
  const CHUNK_SIZE = 50;
  // Use the burn address as a dummy target to test balanceOf
  const dummyAddress = '0x0000000000000000000000000000000000000000';

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE);
    
    const calls = chunk.map(t => ({
      address: t.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [dummyAddress]
    }));

    try {
      const results = await client.multicall({
        contracts: calls,
        allowFailure: true
      });

      for (let j = 0; j < chunk.length; j++) {
        if (results[j].status === 'success') {
          validTokens.push(chunk[j]);
        } else {
          console.log(`❌ Banned broken contract: ${chunk[j].symbol} (${chunk[j].address})`);
          brokenCount++;
        }
      }
    } catch (e) {
      console.warn('Chunk execution failed entirely', e);
    }
  }

  console.log(`\n✅ Cleanup complete! Removed ${brokenCount} broken contracts.`);
  console.log(`💾 Saving ${validTokens.length} healthy contracts back to JSON.`);

  fs.writeFileSync(tokenFilePath, JSON.stringify(validTokens, null, 2));
}

cleanBrokenContracts();
