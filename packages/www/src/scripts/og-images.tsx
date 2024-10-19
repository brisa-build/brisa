import { fileSystemRouter, renderToString } from 'brisa/server';
import path from 'node:path';
import fs from 'node:fs';
import jsdom from 'jsdom';
import sharp from 'sharp';

const dir = path.join(
  import.meta.dirname,
  '..',
  '..',
  '.vercel',
  'output',
  'static',
);
const { routes } = fileSystemRouter({ dir, fileExtensions: ['.html'] });
const { JSDOM } = jsdom;

for (const [route, filePath] of routes) {
  console.log('Generating OG image for', route);
  const hash = Bun.hash(route);
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const h1 = dom.window.document.querySelector('h1');
  let title = h1?.textContent ?? 'Brisa Framework';

  title = title[0].toUpperCase() + title.slice(1);

  const svgHTML = await renderToString(
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#050c4b" />
      <g transform="translate(50, 265) scale(0.4)">
        <g transform="matrix(1,0,0,1,-1.46627e-05,-0.862671)">
          <path
            d="M124.615,158.942C194.326,134.262 190.916,42.893 140.767,0.863C184.318,20.349 206.756,72.952 198.203,118.905C191.512,154.854 164.558,184.522 129.69,194.524C111.34,199.788 91.695,200.819 73.085,196.201C36.436,187.108 7.653,155.954 1.303,118.778C-3.783,88.998 6.075,58.343 29.922,38.996C54.808,18.806 92.107,14.056 119.324,32.517C146.142,50.708 155.776,89.452 135.231,116.111C124.748,129.714 107.413,137.633 90.191,135.012C72.184,132.272 58.17,116.038 60.606,97.494C63.655,121.563 92.134,130.674 109.243,113.883C125.024,98.394 116.512,74.337 100.517,62.603C87.184,52.821 68.389,55.268 55.26,64.22C39.06,75.266 32.739,94.717 36.289,113.574C44.063,154.866 87.626,172.037 124.615,158.942L124.615,158.942Z"
            style="fill:url(#_Radial1);"
          />
        </g>
        <defs>
          <radialGradient
            id="_Radial1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(52.186,-99.1373,99.1373,52.186,88.8208,100)"
          >
            <stop
              offset="0"
              style="stop-color:rgb(44,240,204);stop-opacity:1"
            />
            <stop
              offset="0.53"
              style="stop-color:rgb(44,230,209);stop-opacity:1"
            />
            <stop
              offset="1"
              style="stop-color:rgb(44,195,228);stop-opacity:1"
            />
          </radialGradient>
        </defs>
      </g>
      <text y="50%" font-size="50px" fill="white" text-anchor="start">
        {splitTitleToLines({ title, maxLineLength: 40 }).map((line, index) => (
          <tspan x="17%" dy={index === 0 ? 0 : '1.2em'}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>,
  );

  const svgBuffer = Buffer.from(svgHTML);

  await sharp(svgBuffer)
    .png()
    .toFile(path.join(dir, `${hash}.png`));
}

function splitTitleToLines({
  title,
  maxLineLength,
}: {
  title: string;
  maxLineLength: number;
}) {
  const words = title.split(' ');
  const lines = [];
  let currentLine = '';

  for (let word of words) {
    if ((currentLine + word).length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = '';
    }
    currentLine += word + ' ';
  }
  lines.push(currentLine.trim());

  return lines;
}
