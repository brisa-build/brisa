const fs = require('fs');
const path = require('path');

async function validateBrisaURLs(directory: string) {
  const urls = new Set<string>();

  function searchDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        searchDirectory(filePath);
      } else {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const match = fileContent.match(/https:\/\/brisa\.build[^\s"']+/g);
        if (match) {
          match.forEach((url: string) => URL.canParse(url.trim()) && urls.add(url.trim()));
        }
      }
    }
  }

  console.log(`Searching URLs in directory: ${directory}`)
  searchDirectory(directory);

  console.log('Validating Brisa URLs...');
  let ok = 0;
  let ko = 0;
  for (const url of urls) {
    // TODO: Remove the replace when the Brisa documentation is public
    const finalUrl = url.replace('brisa.build', 'brisa-mu.vercel.app');
    try {
      const response = await fetch(finalUrl);
      if (!response.ok) {
        ko++;
        console.log(response.status)
        console.log(`\t- ${finalUrl}`)
        console.log(`\t- ${url}\n\n`)
      } else {
        ok++;
      }
    } catch (error: any) {
      ko++;
      console.log(error.message, finalUrl)
    }
  }

  console.log(`OK: ${ok}, KO: ${ko}`);
}

await validateBrisaURLs('.');
console.log('Done!');
