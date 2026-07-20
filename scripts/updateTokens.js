import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. PINNED CORE TOKENS
// These tokens are hardcoded to ensure they are never accidentally deleted or missing
const CORE_TOKENS = [
  { address: "0x0000000000000000000000000000000000000000", symbol: "MON", decimals: 18 },
  { address: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", symbol: "USDC", decimals: 6 },
  { address: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A", symbol: "WMON", decimals: 18 },
  { address: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D", symbol: "USDT0", decimals: 6 },
  { address: "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777", symbol: "CHOG", decimals: 18 },
  { address: "0x29fF09Dcd83ec33CE5BE1E388AE98C7A7F9faB07", symbol: "DAK", decimals: 18 },
  { address: "0x43cf5407bda1400498B8064D50a7e17528d87777", symbol: "JAMES", decimals: 18 }
];

async function updateTokens() {
  console.log('🤖 Starting automated GeckoTerminal scraper for Monad...');
  
  const tokenMap = new Map(); // We use a Map to guarantee deduplication by address
  const outputPath = path.join(__dirname, '../src/config/monad_tokens.json');
  
  // 2. LOAD EXISTING TOKENS
  try {
    if (fs.existsSync(outputPath)) {
      const existingData = fs.readFileSync(outputPath, 'utf8');
      const existingTokens = JSON.parse(existingData);
      for (const t of existingTokens) {
        tokenMap.set(t.address.toLowerCase(), t);
      }
      console.log(`Loaded ${tokenMap.size} existing tokens from monad_tokens.json`);
    }
  } catch (e) {
    console.log('No existing token file found or failed to parse. Starting fresh.');
  }

  // 3. SCRAPE GECKOTERMINAL
  const MAX_PAGES = 50; // Scrape up to 50 pages of top pools to get EVERYTHING
  let newTokensFound = 0;

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      console.log(`Fetching GeckoTerminal Page ${page}...`);
      
      const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/monad/pools?page=${page}&include=base_token,quote_token`);
      
      if (!res.ok) {
        if (res.status === 429) {
          console.log('Hit GeckoTerminal rate limit. Stopping scrape for this run.');
          break;
        }
        console.warn(`Failed to fetch page ${page}: ${res.statusText}`);
        continue;
      }
      
      const data = await res.json();
      
      if (!data.included || data.included.length === 0) {
        break; // No more tokens found
      }

      for (const item of data.included) {
        if (item.type === 'token' && item.attributes) {
          const address = item.attributes.address.toLowerCase();
          
          if (!tokenMap.has(address)) {
            tokenMap.set(address, {
              address: item.attributes.address,
              symbol: item.attributes.symbol,
              decimals: item.attributes.decimals
            });
            newTokensFound++;
          }
        }
      }
      
      // Sleep to respect API rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (error) {
    console.error('Error during GeckoTerminal scrape:', error);
  }

  // 4. INJECT PINNED CORE TOKENS (Ensures they are NEVER deleted)
  for (const t of CORE_TOKENS) {
    tokenMap.set(t.address.toLowerCase(), t);
  }

  // 5. SAVE UPDATED DICTIONARY
  const finalTokens = Array.from(tokenMap.values());
  console.log(`\n✅ Scrape complete! Found ${newTokensFound} new tokens.`);
  console.log(`💾 Total verified tokens in dictionary: ${finalTokens.length}`);
  
  fs.writeFileSync(outputPath, JSON.stringify(finalTokens, null, 2));
  console.log(`File saved to ${outputPath}`);
}

updateTokens();
