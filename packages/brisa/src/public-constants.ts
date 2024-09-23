import type { RenderInitiatorType } from '@/types/server';

export const RenderInitiator = {
  INITIAL_REQUEST: 'INITIAL_REQUEST',
  SPA_NAVIGATION: 'SPA_NAVIGATION',
  SERVER_ACTION: 'SERVER_ACTION',
} satisfies RenderInitiatorType;

export const BOOLEANS_IN_HTML = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'disabled',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'seamless',
  'selected',
  'data-action',
]);
