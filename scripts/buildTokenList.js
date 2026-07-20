import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchTokens() {
  console.log('Fetching 500+ Monad tokens via Deep DexScreener Scraping...');
  
  const tokens = new Map();
  
  try {
    // 1. First, get the verified official list as the base
    const officialRes = await fetch('https://raw.githubusercontent.com/monad-crypto/token-list/main/tokenlist-mainnet.json');
    const officialData = await officialRes.json();
    if (officialData.tokens) {
      for (const token of officialData.tokens) {
        if (token.chainId !== 143) continue;
        tokens.set(token.address.toLowerCase(), {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals
        });
      }
    }

    // 2. Deep scrape DexScreener using an alphabet/keyword loop to bypass the 30-pair limit
    const searchTerms = ['monad', 'monad a', 'monad b', 'monad c', 'monad d', 'monad e', 'monad f', 'monad g', 'monad h', 'monad i', 'monad j', 'monad k', 'monad l', 'monad m', 'monad n', 'monad o', 'monad p', 'monad s', 'monad t', 'cat', 'dog', 'pepe', 'moon', 'safe', 'inu'];
    
    for (const term of searchTerms) {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      
      if (data.pairs) {
        for (const pair of data.pairs) {
          if (pair.chainId !== 'monad') continue;
          if (!pair.liquidity || !pair.liquidity.usd || pair.liquidity.usd < 100) continue;
          
          if (pair.baseToken && pair.baseToken.address) {
            if (!tokens.has(pair.baseToken.address.toLowerCase())) {
              tokens.set(pair.baseToken.address.toLowerCase(), {
                address: pair.baseToken.address,
                symbol: pair.baseToken.symbol,
                decimals: 18
              });
            }
          }
          if (pair.quoteToken && pair.quoteToken.address) {
            if (!tokens.has(pair.quoteToken.address.toLowerCase())) {
              tokens.set(pair.quoteToken.address.toLowerCase(), {
                address: pair.quoteToken.address,
                symbol: pair.quoteToken.symbol,
                decimals: (pair.quoteToken.symbol === 'USDC' || pair.quoteToken.symbol === 'USDT0') ? 6 : 18
              });
            }
          }
        }
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
    
    // Add our guaranteed fallback test tokens just to be safe
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
    console.log(`Successfully collected ${finalTokens.length} verified Monad tokens from Deep Scraping.`);
    
    const outputPath = path.join(__dirname, '../src/config/monad_tokens.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalTokens, null, 2));
    
    console.log(`Saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error fetching deep token list:', error);
  }
}

fetchTokens();
