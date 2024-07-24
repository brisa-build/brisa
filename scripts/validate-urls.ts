const fs = require('fs');
const path = require('path');

async function validateBrisaURLs(directory: string) {
  const urls = new Map<string, string>();

  function searchDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);

      if (
        !filePath.startsWith('packages') ||
        filePath.startsWith('packages/docs/.vitepress/cache') ||
        filePath.startsWith('packages/docs/.vitepress/dist')
      ) {
        continue;
      }

      if (fs.statSync(filePath).isDirectory()) {
        searchDirectory(filePath);
      } else if (!filePath.match(/\.test\.(ts|tsx|js|jsx)$/)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const isDocs = filePath.startsWith('packages/docs/');
        const regex = isDocs ? /\(\/[^\s"']+/g : /https:\/\/brisa\.build[^\s"']+/g;
        const match = fileContent.match(regex);

        if (match) {
          match.forEach((url: string) => {
            let trimUrl = url
              .trim()
              .replace(/\)*\.*,*:* *\**$/, '')
              .replace(/^\(/, '');
            if (isDocs) trimUrl = 'https://brisa.build' + trimUrl;

            if (!URL.canParse(trimUrl) || trimUrl.includes('${')) {
              return;
            }
            urls.set(trimUrl, filePath);
          });
        }
      }
    }
  }

  console.log(`Searching URLs in directory: ${directory}`);
  searchDirectory(directory);

  console.log('Validating Brisa URLs...');
  let ok = 0;
  let ko = 0;
  for (const [url, filePath] of urls) {
    // TODO: Remove the replace when the Brisa documentation is public
    const finalUrl = url.replace('https://brisa.build', 'https://brisa-mu.vercel.app');
    try {
      const response = await fetch(finalUrl);
      if (!response.ok) {
        ko++;
        console.log('File:', filePath, response.status);
        console.log(`\t- ${finalUrl}`);
        console.log(`\t- ${url}\n\n`);
      } else {
        ok++;
      }
    } catch (error: any) {
      ko++;
      console.log(error.message, finalUrl);
    }
  }

  console.log(`OK: ${ok}, KO: ${ko}`);
}

await validateBrisaURLs('.');
console.log('Done!');
