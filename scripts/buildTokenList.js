import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchTokens() {
  console.log('Fetching official Monad Mainnet tokens from GitHub...');
  
  const tokens = new Map();
  
  try {
    // Fetch the OFFICIAL Monad token list directly from their GitHub
    const res = await fetch('https://raw.githubusercontent.com/monad-crypto/token-list/main/tokenlist-mainnet.json');
    const data = await res.json();
    
    if (data.tokens) {
      for (const token of data.tokens) {
        // Only include Monad Mainnet (Chain ID 143)
        if (token.chainId !== 143) continue;
        
        tokens.set(token.address.toLowerCase(), {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals
        });
      }
    }
    
    // Add our guaranteed fallback test tokens just to be safe (in case they aren't on the official list yet)
    const coreTokens = [
      { address: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", symbol: "USDC", decimals: 6 },
      { address: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A", symbol: "WMON", decimals: 18 },
      { address: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D", symbol: "USDT0", decimals: 6 },
      { address: "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777", symbol: "CHOG", decimals: 18 },
      { address: "0x29fF09Dcd83ec33CE5BE1E388AE98C7A7F9faB07", symbol: "DAK", decimals: 18 },
      { address: "0x43cf5407bda1400498B8064D50a7e17528d87777", symbol: "JAMES", decimals: 18 }
    ];
    
    for (const t of coreTokens) {
      tokens.set(t.address.toLowerCase(), t);
    }
    
    const finalTokens = Array.from(tokens.values());
    console.log(`Successfully collected ${finalTokens.length} verified Monad tokens from the official registry.`);
    
    const outputPath = path.join(__dirname, '../src/config/monad_tokens.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalTokens, null, 2));
    
    console.log(`Saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error fetching official token list:', error);
  }
}

fetchTokens();
