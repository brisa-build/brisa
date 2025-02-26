/**
 * Credits to https://github.com/sapphi-red/vitepress-plugins/blob/main/packages/vitepress-plugin-tabs
 */
import type MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';

type Params = {
  shareStateKey: string | undefined;
};

const parseTabsParams = (input: string): Params => {
  const match = input.match(/key:(\S+)/);
  return {
    shareStateKey: match?.[1],
  };
};

const tabMarker = '=';
const tabMarkerCode = tabMarker.charCodeAt(0);
const minTabMarkerLen = 2;

const ruleBlockTab = (
  state: any,
  startLine: number,
  endLine: number,
  silent: boolean,
) => {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  if (state.parentType !== 'container') {
    return false;
  }

  if (pos + minTabMarkerLen > max) {
    return false;
  }

  const marker = state.src.charCodeAt(pos);
  if (marker !== tabMarkerCode) {
    return false;
  }

  const mem = pos;
  pos = state.skipChars(pos + 1, marker);
  const tabMarkerLen = pos - mem;

  if (tabMarkerLen < minTabMarkerLen - 1) {
    return false;
  }

  if (silent) {
    return true;
  }

  let nextLine = startLine;
  let endStart = mem;
  let endPos = pos;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      break;
    }

    endStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const max = state.eMarks[nextLine];

    if (endStart < max && state.sCount[nextLine] < state.blkIndent) {
      break;
    }

    const startCharCode = state.src.charCodeAt(endStart);
    if (startCharCode !== tabMarkerCode) {
      continue;
    }

    const p = state.skipChars(endStart + 1, marker);
    if (p - endStart !== tabMarkerLen) {
      continue;
    }
    endPos = p;
    break;
  }

  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = 'tab';
  state.lineMax = nextLine;

  const startToken = state.push('tab_open', 'div', 1);
  startToken.markup = state.src.slice(mem, pos);
  startToken.block = true;
  startToken.info = state.src.slice(pos, max).trimStart();
  startToken.map = [startLine, nextLine - 1];

  state.md.block.tokenize(state, startLine + 1, nextLine);

  const endToken = state.push('tab_close', 'div', -1);
  endToken.markup = state.src.slice(endStart, endPos);
  endToken.block = true;

  state.parentType = oldParent;
  state.lineMax = oldLineMax;
  state.line = nextLine;
  return true;
};

export const tabsPlugin = (md: MarkdownIt) => {
  md.use(container, 'tabs', {
    render(tokens: any[], index: number) {
      const token = tokens[index];
      if (token.nesting === 1) {
        const params = parseTabsParams(token.info);
        const shareStateKeyProp = params.shareStateKey
          ? `label="${md.utils.escapeHtml(params.shareStateKey)}"`
          : '';
        return `
            <md-tabs ${shareStateKeyProp}>
              <template shadowrootmode="open">
                <link rel="stylesheet" href="/styles/content.css" />
                <div class="tablist" role="tablist">
                  <button
                    id="tab-TypeScript"
                    key="TypeScript"
                    role="tab"
                    title="TypeScript"
                    aria-label="TypeScript"
                    class="active"
                    aria-selected
                    aria-controls="panel-TypeScript"
                    tabindex="0"
                  >
                    TypeScript
                  </button>
                </div>
                <slot name="TypeScript" />
              </template>
          `;
      } else {
        return `</md-tabs>\n`;
      }
    },
  });

  md.block.ruler.after('container_tabs', 'tab', ruleBlockTab);
  const renderTab = (tokens: any, index: number) => {
    const token = tokens[index];
    if (token.nesting === 1) {
      const label = token.info;
      const labelProp = `slot="${md.utils.escapeHtml(label)}" label="${md.utils.escapeHtml(label)}"`;
      return `<span ${labelProp}>\n`;
    } else {
      return `</span>\n`;
    }
  };
  md.renderer.rules['tab_open'] = renderTab;
  md.renderer.rules['tab_close'] = renderTab;
};
