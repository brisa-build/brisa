import { gzipSync, type BuildArtifact } from 'bun';
import { brotliCompressSync } from 'node:zlib';
import fs from 'node:fs';
import { join } from 'node:path';

import { getConstants } from '@/constants';
import layoutBuild from '@/utils/client-build/layout-build';
import { getEntrypointsRouter } from '@/utils/get-entrypoints';
import getI18nClientMessages from '@/utils/get-i18n-client-messages';
import generateDynamicTypes from '@/utils/generate-dynamic-types';
import clientPageBuild from '@/utils/client-build/pages-build';

const TS_REGEX = /\.tsx?$/;

export async function clientBuild(
  pages: BuildArtifact[],
  {
    allWebComponents,
    webComponentsPerEntrypoint,
    integrationsPath,
    layoutPath,
    pagesRoutes,
  }: {
    allWebComponents: Record<string, string>;
    webComponentsPerEntrypoint: Record<string, Record<string, string>>;
    integrationsPath?: string | null;
    layoutPath?: string | null;
    pagesRoutes: ReturnType<typeof getEntrypointsRouter>;
  },
) {
  const { BUILD_DIR, I18N_CONFIG, IS_PRODUCTION } = getConstants();
  const pagesClientPath = join(BUILD_DIR, 'pages-client');
  const internalPath = join(BUILD_DIR, '_brisa');
  const layoutBuildPath = layoutPath ? getBuildPath(layoutPath) : '';
  const writes = [];

  // During hotreloading it is important to clean pages-client because
  // new client files are generated with hash, this hash can change
  // and many files would be accumulated during development.
  //
  // On the other hand, in production it will always be empty because
  // the whole build is cleaned at startup.
  if (fs.existsSync(pagesClientPath)) {
    fs.rmSync(pagesClientPath, { recursive: true });
  }
  // Create pages-client
  fs.mkdirSync(pagesClientPath);

  if (!fs.existsSync(internalPath)) fs.mkdirSync(internalPath);

  const clientSizesPerPage: Record<string, Blob['size']> = {};
  const layoutWebComponents = webComponentsPerEntrypoint[layoutBuildPath];
  const layoutCode = layoutBuildPath
    ? await layoutBuild({
        layoutPath: layoutBuildPath,
        allWebComponents,
        pageWebComponents: layoutWebComponents,
        integrationsPath,
      })
    : null;

  const pagesData = await clientPageBuild(pages, {
    webComponentsPerEntrypoint,
    layoutWebComponents,
    allWebComponents,
    integrationsPath,
    layoutHasContextProvider: layoutCode?.useContextProvider,
  });

  for (const data of pagesData) {
    let { size, rpc, lazyRPC, code, unsuspense, useI18n, i18nKeys, pagePath } =
      data;
    const clientPagePath = pagePath.replace('pages', 'pages-client');
    const route = pagePath.replace(BUILD_DIR, '');

    // If there are no actions in the page but there are actions in
    // the layout, then it is as if the page also has actions.
    if (!rpc && layoutCode?.rpc) {
      size += layoutCode.rpc.length;
      rpc = layoutCode.rpc;
    }

    // It is not necessary to increase the size here because this
    // code even if it is necessary to generate it if it does not
    // exist yet, it is not part of the initial size of the page
    // because it is loaded in a lazy way.
    if (!lazyRPC && layoutCode?.lazyRPC) {
      lazyRPC = layoutCode.lazyRPC;
    }

    // If there is no unsuspense in the page but there is unsuspense
    // in the layout, then it is as if the page also has unsuspense.
    if (!unsuspense && layoutCode?.unsuspense) {
      size += layoutCode.unsuspense.length;
      unsuspense = layoutCode.unsuspense;
    }

    // fix i18n when it is not defined in the page but it is defined
    // in the layout
    if (!useI18n && layoutCode?.useI18n) {
      useI18n = layoutCode.useI18n;
    }
    if (layoutCode?.i18nKeys.size) {
      i18nKeys = new Set([...i18nKeys, ...layoutCode.i18nKeys]);
    }

    clientSizesPerPage[route] = size;

    if (!size) continue;

    const hash = Bun.hash(code);
    const clientPage = clientPagePath.replace('.js', `-${hash}.js`);
    clientSizesPerPage[route] = 0;

    // create _unsuspense.js and _unsuspense.txt (list of pages with unsuspense)
    clientSizesPerPage[route] += addExtraChunk(unsuspense, '_unsuspense', {
      pagesClientPath,
      pagePath,
      writes,
    });

    // create _rpc-[versionhash].js and _rpc.txt (list of pages with actions)
    clientSizesPerPage[route] += addExtraChunk(rpc, '_rpc', {
      pagesClientPath,
      pagePath,
      writes,
    });

    // create _rpc-lazy-[versionhash].js
    clientSizesPerPage[route] += addExtraChunk(lazyRPC, '_rpc-lazy', {
      pagesClientPath,
      pagePath,
      skipList: true,
      writes,
    });

    if (!code) continue;

    if (useI18n && i18nKeys.size && I18N_CONFIG?.messages) {
      for (const locale of I18N_CONFIG?.locales ?? []) {
        const i18nPagePath = clientPage.replace('.js', `-${locale}.js`);
        const messages = getI18nClientMessages(locale, i18nKeys);
        const i18nCode = `window.i18nMessages={...window.i18nMessages,...(${JSON.stringify(messages)})};`;

        writes.push(Bun.write(i18nPagePath, i18nCode));

        // Compression in production
        if (IS_PRODUCTION) {
          writes.push(
            Bun.write(
              `${i18nPagePath}.gz`,
              gzipSync(new TextEncoder().encode(i18nCode)),
            ),
          );
          writes.push(
            Bun.write(`${i18nPagePath}.br`, brotliCompressSync(i18nCode)),
          );
        }
      }
    }

    // create page file
    writes.push(
      Bun.write(clientPagePath.replace('.js', '.txt'), hash.toString()),
    );
    writes.push(Bun.write(clientPage, code));

    // Compression in production
    if (IS_PRODUCTION) {
      const gzipClientPage = gzipSync(new TextEncoder().encode(code));

      writes.push(Bun.write(`${clientPage}.gz`, gzipClientPage));
      writes.push(Bun.write(`${clientPage}.br`, brotliCompressSync(code)));
      clientSizesPerPage[route] += gzipClientPage.length;
    }
  }

  writes.push(
    Bun.write(
      join(internalPath, 'types.ts'),
      generateDynamicTypes({ allWebComponents, pagesRoutes }),
    ),
  );

  // Although on Mac it can work without await, on Windows it does not and it is mandatory
  await Promise.all(writes);

  return clientSizesPerPage;
}

function addExtraChunk(
  code: string,
  filename: string,
  {
    pagesClientPath,
    pagePath,
    skipList = false,
    writes,
  }: {
    pagesClientPath: string;
    pagePath: string;
    skipList?: boolean;
    writes: Promise<any>[];
  },
) {
  const { BUILD_DIR, VERSION, IS_PRODUCTION } = getConstants();
  const jsFilename = `${filename}-${VERSION}.js`;

  if (!code) return 0;

  if (!skipList && fs.existsSync(join(pagesClientPath, jsFilename))) {
    const listPath = join(pagesClientPath, `${filename}.txt`);

    writes.push(
      Bun.write(
        listPath,
        `${fs.readFileSync(listPath).toString()}\n${pagePath.replace(BUILD_DIR, '')}`,
      ),
    );

    return 0;
  }

  writes.push(Bun.write(join(pagesClientPath, jsFilename), code));

  if (!skipList) {
    writes.push(
      Bun.write(
        join(pagesClientPath, `${filename}.txt`),
        pagePath.replace(BUILD_DIR, ''),
      ),
    );
  }

  if (IS_PRODUCTION) {
    const gzipUnsuspense = gzipSync(new TextEncoder().encode(code));

    writes.push(
      Bun.write(join(pagesClientPath, `${jsFilename}.gz`), gzipUnsuspense),
    );
    writes.push(
      Bun.write(
        join(pagesClientPath, `${jsFilename}.br`),
        brotliCompressSync(code),
      ),
    );
    return gzipUnsuspense.length;
  }

  return code.length;
}

function getBuildPath(path: string) {
  const { SRC_DIR, BUILD_DIR } = getConstants();
  return path.replace(SRC_DIR, BUILD_DIR).replace(TS_REGEX, '.js');
}
