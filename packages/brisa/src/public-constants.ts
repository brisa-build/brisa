import type { InitiatorType } from '@/types/server';

export const Initiator = {
  INITIAL_REQUEST: 'INITIAL_REQUEST',
  SPA_NAVIGATION: 'SPA_NAVIGATION',
  SERVER_ACTION: 'SERVER_ACTION',
  API_REQUEST: 'API_REQUEST',
} satisfies InitiatorType;

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
