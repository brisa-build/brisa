import { renderToString } from 'brisa/server';

export default async function OpenGraphImages({ title }: { title: string }) {
  const svgHTML = await renderToString(
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#050c4b" />
      <image
        href="https://brisa.build/brisa.svg"
        x="50"
        y="50%"
        width="100"
        height="100"
        transform="translate(0, -50)"
      />
      <text y="50%" font-size="50px" fill="white" text-anchor="start">
        {splitTitleToLines({ title, maxLineLength: 40 }).map((line, index) => (
          <tspan x="17%" dy={index === 0 ? 0 : '1.2em'}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>,
  );

  const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svgHTML).toString('base64')}`;

  return (
    <>
      <meta id="og:image" property="og:image" content={imageUrl} />
      <meta id="twitter:image" property="twitter:image" content={imageUrl} />
    </>
  );
}

function splitTitleToLines({
  title,
  maxLineLength,
}: { title: string; maxLineLength: number }) {
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
