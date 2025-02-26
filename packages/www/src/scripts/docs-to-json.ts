/**
 * This script analyse all the "docs" folder an extract all the sections for the search engine
 */
import { fileSystemRouter } from 'brisa/server';
import path from 'node:path';
import fs from 'node:fs';
import { loadMarkdownFromPath } from '@/helpers/markdown-loader';
import jsdom from 'jsdom';

type Section = {
  id: string;
  title: string;
  text: string;
  titles: string[];
};

const ext = '.md';
const dir = path.join(import.meta.dirname, '..', '..', '..', '..', 'docs');
const out = path.join(import.meta.dirname, '..', 'public', 'content.json');
const { routes } = fileSystemRouter({ dir, fileExtensions: [ext] });
const sections: Section[] = [];
const { JSDOM } = jsdom;

for (const [pathname, filePath] of routes) {
  console.log(`Processing ${pathname}...`);
  const { html } = loadMarkdownFromPath(filePath);
  const dom = new JSDOM(html);

  const headings = Array.from(
    dom.window.document.querySelectorAll('h1, h2, h3, h4, h5, h6'),
  );
  const parents: { level: number; title: string }[] = [];

  headings.forEach((heading, index) => {
    const level = Number.parseInt(heading.tagName[1]);
    const id = `${pathname}#${heading.id}`;
    const title = heading.textContent?.trim() ?? '';

    const nextHeading = headings[index + 1];
    let text = '';
    let sibling = heading.nextElementSibling;

    while (sibling && sibling !== nextHeading) {
      text += sibling.textContent?.trim() + ' ';
      sibling = sibling.nextElementSibling;
    }

    while (parents.length > 0 && parents[parents.length - 1].level >= level) {
      parents.pop();
    }

    const parentTitles = parents.map((parent) => parent.title);

    sections.push({
      id,
      title,
      text: text.trim(),
      titles: [...parentTitles],
    });

    parents.push({ level, title });
  });
}

fs.writeFileSync(out, JSON.stringify(sections, null, 2));
console.log(`Sections saved to ${out}`);
