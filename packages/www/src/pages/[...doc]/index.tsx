import { notFound, type RequestContext } from 'brisa';
import path from 'node:path';
import fs from 'node:fs';
import { loadMarkdownFromPath } from '@/helpers/markdown-loader';
import SideBar from '@/components/side-bar';
import BreadcrumbNav from '@/components/breadcrumb-nav';
import HeadingsBar from '@/components/headings-bar';
import { fileSystemRouter } from 'brisa/server';

export function Head({}, { store, route }: RequestContext) {
  const md = getMarkdownContent(route);
  const name = (route.params?.doc as string[])
    ?.map?.(kebabCaseToNormal)
    .join(' / ');
  const title = `${name} | Brisa`;
  const description = md?.data?.description;
  const keywords = md?.data?.keywords;

  store.set('md', md);

  return (
    <>
      <title id="title">{title}</title>
      <meta id="meta:title" name="title" content={title} />
      <meta id="og:title" property="og:title" content={title} />
      <meta id="twitter:title" property="twitter:title" content={title} />
      {keywords && <meta id="keywords" name="keywords" content={keywords} />}
      {description && (
        <>
          <meta
            id="meta:description"
            name="description"
            content={description}
          />
          <meta
            id="og:description"
            property="og:description"
            content={description}
          />
          <meta
            id="twitter:description"
            property="twitter:description"
            content={description}
          />
        </>
      )}
    </>
  );
}

export default async function Documentation({}, { store }: RequestContext) {
  const { element } = store.get('md') ?? notFound();
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

function getMarkdownContent(route: RequestContext['route']) {
  const pathnameParts = route.params?.doc as string[];
  let filePath = path.join(
    getDocsDir(),
    ...pathnameParts.slice(0, -1),
    pathnameParts.at(-1) + '.md',
  );

  if (!fs.existsSync(filePath)) {
    filePath = filePath.replace('.md', '/index.md');
  }

  return fs.existsSync(filePath) ? loadMarkdownFromPath(filePath) : null;
}
