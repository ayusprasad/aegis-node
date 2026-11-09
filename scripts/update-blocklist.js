const fs = require('fs');
const path = require('path');
const https = require('https');
const unzipper = require('unzipper'); // Requires `npm install unzipper` in the github action

// OSV provides a daily zip dump of all NPM vulnerabilities (including malware)
const OSV_NPM_DUMP_URL = 'https://osv-vulnerabilities.storage.googleapis.com/npm/all.zip';
const BLOCKLIST_PATH = path.join(__dirname, '..', 'blocklist.json');

async function downloadAndParseOSV() {
  console.log('Downloading OSV npm vulnerability dump...');
  
  return new Promise((resolve, reject) => {
    const maliciousPackages = new Set();
    
    https.get(OSV_NPM_DUMP_URL, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download OSV dump: HTTP ${response.statusCode}`));
      }

      response
        .pipe(unzipper.Parse())
        .on('entry', async (entry) => {
          const fileName = entry.path;
          
          // OSV files are JSON. We only care about malicious packages.
          if (fileName.endsWith('.json')) {
            try {
              const content = await entry.buffer();
              const osvData = JSON.parse(content.toString('utf-8'));
              
      // A GHSA alias identifies a vulnerability, not malware. Only keep
      // records explicitly described as malware/malicious or carrying an OSV
      // MAL-* malware identifier; ordinary vulnerable packages must not become
      // package-level blocklist entries.
              const isMalicious = 
        /\bmalware\b|\bmalicious\b|supply.chain attack|credential stealer|backdoor/i.test(osvData.details || '') ||
        osvData.aliases?.some(alias => alias.startsWith('MAL-'));

              // For a security tool, we want to block packages that are explicitly malicious.
              if (isMalicious && osvData.affected && osvData.affected.length > 0) {
                for (const affected of osvData.affected) {
                  if (affected.package && affected.package.ecosystem === 'npm') {
                    maliciousPackages.add(affected.package.name);
                  }
                }
              }
            } catch (err) {
              // Ignore parsing errors for individual files
            }
          } else {
            entry.autodrain();
          }
        })
        .on('close', () => {
          resolve(Array.from(maliciousPackages));
        })
        .on('error', reject);
    }).on('error', reject);
  });
}

async function updateBlocklist() {
  try {
    // 1. Fetch the latest OSV malware
    console.log('Starting threat intelligence pipeline...');
    const newMaliciousPackages = await downloadAndParseOSV();
    console.log(`Extracted ${newMaliciousPackages.length} known malicious package signatures from OSV.`);

    // 2. Read the existing blocklist
    let blocklistData = { known_malicious: [], last_updated: "", version: "1.0.0" };
    if (fs.existsSync(BLOCKLIST_PATH)) {
      blocklistData = JSON.parse(fs.readFileSync(BLOCKLIST_PATH, 'utf-8'));
    }

    // 3. Create a Map of existing entries for quick deduplication
    const existingEntries = new Map();
    for (const entry of blocklistData.known_malicious) {
      existingEntries.set(entry.name, entry);
    }

    // 4. Merge new OSV data
    let addedCount = 0;
    for (const pkgName of newMaliciousPackages) {
      if (!existingEntries.has(pkgName)) {
        existingEntries.set(pkgName, {
          name: pkgName,
          reason: "SUPPLY_CHAIN_MALWARE_OSV",
          severity: "CRITICAL"
        });
        addedCount++;
      }
    }

    // 5. Save back to blocklist.json
    blocklistData.known_malicious = Array.from(existingEntries.values());
    blocklistData.last_updated = new Date().toISOString();

    fs.writeFileSync(BLOCKLIST_PATH, JSON.stringify(blocklistData, null, 2), 'utf-8');
    
    console.log(`Success! Added ${addedCount} new zero-day threats. Total signatures: ${blocklistData.known_malicious.length}.`);

  } catch (error) {
    console.error('Fatal error during pipeline execution:', error);
    process.exit(1);
  }
}

updateBlocklist();
