const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:/Users/sarfr/.gemini/antigravity/brain/cf211a45-0f55-4d50-b0d1-bcfb9fde264b/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.source === 'USER_EXPLICIT' || obj.type === 'USER_INPUT') {
        const date = obj.created_at || '';
        let text = obj.content || '';
        // Extract content inside <USER_REQUEST> if present
        const match = text.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
        if (match) text = match[1].trim();
        else text = text.trim();
        // truncate text for readability
        const preview = text.split('\n')[0].slice(0, 120);
        console.log(`[${date}] ${preview}`);
      }
    } catch(e) {}
  }
}
run();
