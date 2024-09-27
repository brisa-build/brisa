import { dangerHTML } from 'brisa';
import fs from 'node:fs';
import MarkdownIt from 'markdown-it';
import matter from 'gray-matter';
import { tabsPlugin } from '@/helpers/md-tabs-plugin';
import Shikiji from 'markdown-it-shikiji';
import { transformerMetaHighlight } from 'shikiji-transformers';
import slugify from 'slugify';

const md = MarkdownIt({ html: true });

md.use(
  await Shikiji({
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    // https://shikiji.netlify.app/packages/transformers
    transformers: [transformerMetaHighlight()],
  }),
).use(tabsPlugin);

// Custom renderer rule to modify links
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const hrefIndex = tokens[idx].attrIndex('href');
  if (hrefIndex >= 0) {
    const href = tokens[idx].attrs![hrefIndex][1];
    if (href.startsWith('http')) {
      tokens[idx].attrPush(['target', '_blank']);
      tokens[idx].attrPush(['rel', 'noopener noreferrer']);
    }
  }
  return self.renderToken(tokens, idx, options);
};

// Custom blockquote rule for GitHub-like notes
md.use((md) => {
  md.core.ruler.after('block', 'custom_alerts', (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'blockquote_open') {
        let inlineToken;
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === 'inline') {
            inlineToken = tokens[j];
            break;
          }
          if (tokens[j].type === 'blockquote_close') break;
        }

        if (inlineToken && inlineToken.content.startsWith('[!')) {
          const match = inlineToken.content.match(
            /^\[!(NOTE|WARNING|CAUTION|IMPORTANT|TIP)\]/,
          );
          if (match) {
            const type = match[1].toLowerCase();

            inlineToken.content = inlineToken.content.replace(
              /^\[!(NOTE|WARNING|CAUTION|IMPORTANT|TIP)\]\s*/,
              '',
            );
            token.attrPush(['class', `alert-${type}`]);
          }
        }
      }
    }
  });
});

// Custom rule to add IDs to headings
md.core.ruler.after('block', 'add_heading_ids', (state) => {
  const tokens = state.tokens;
  const ids = new Set();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') {
      const nextToken = tokens[tokens.indexOf(token) + 1];

      if (nextToken && nextToken.type === 'inline') {
        const text = nextToken.content.trim();
        const originalId = slugify(text, { lower: true, strict: true });
        let id = originalId;
        let num = 1;
        while (ids.has(id)) id = `${originalId}-${num++}`;
        ids.add(id);
        token.attrPush(['id', id]);

        const linkOpenToken = new state.Token('link_open', 'a', 1);
        linkOpenToken.attrPush(['href', `#${id}`]);
        linkOpenToken.attrPush(['aria-label', `Anchor to ${text}`]);
        linkOpenToken.attrPush(['class', 'heading-hash-link']);

        const linkTextToken = new state.Token('text', '', 0);
        const linkCloseToken = new state.Token('link_close', 'a', -1);

        nextToken.children!.unshift(
          linkOpenToken,
          linkTextToken,
          linkCloseToken,
        );
      }
    }
  }
});

export function loadMarkdownFromPath(filePath: string) {
  const { data, content } = matter(fs.readFileSync(filePath).toString());
  const html = md.render(content);
  return { data, element: dangerHTML(html), html, content };
}

export function RenderCode({
  code,
  format = 'tsx',
}: { code: string; format?: string }) {
  return dangerHTML(md.render(`\`\`\`${format} ${code}`));
}

// This is to help the compiler understand the web components to be used in the page
// @ts-ignore
export const webComponents = [<md-tabs />, <w-badge />];
