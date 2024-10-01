import { notFound, type RequestContext } from 'brisa';
import path from 'node:path';
import fs from 'node:fs';
import { loadMarkdownFromPath } from '@/helpers/markdown-loader';
import SideBar from '@/components/side-bar';
import BreadcrumbNav from '@/components/breadcrumb-nav';
import HeadingsBar from '@/components/headings-bar';
import { fileSystemRouter } from 'brisa/server';

export function Head({}, { route }: RequestContext) {
  const name = (route.params?.doc as string[])
    ?.map?.(kebabCaseToNormal)
    .join(' / ');
  return <title id="title">{name} - Brisa</title>;
}

export default async function Documentation({}, { route }: RequestContext) {
  const pathnameParts = route.params?.doc as string[];
  let filePath = path.join(
    getDocsDir(),
    ...pathnameParts.slice(0, -1),
    pathnameParts.at(-1) + '.md',
  );

  if (!fs.existsSync(filePath)) {
    filePath = filePath.replace('.md', '/index.md');
  }

  if (!fs.existsSync(filePath)) notFound();

  const { element } = loadMarkdownFromPath(filePath);

  return (
    <main>
      <BreadcrumbNav />
      <div class="docs-content">
        <SideBar />
        <article class="markdown-content">{element}</article>
        <HeadingsBar />
      </div>
    </main>
  );
}

export async function prerender() {
  const { routes } = fileSystemRouter({
    dir: getDocsDir(),
    fileExtensions: ['.md'],
  });
  return routes.map(([pathname]) => ({
    doc: pathname.split('/').filter(Boolean),
  }));
}

function kebabCaseToNormal(str: string) {
  return str
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function getDocsDir() {
  return path.resolve(
    path.join(import.meta.dirname, '..', '..', '..', '..', '..', 'docs'),
  );
}
