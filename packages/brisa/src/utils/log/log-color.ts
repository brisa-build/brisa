import { enableANSIColors } from '@/utils/supports-basic-color';

export const greenLog = (text: string) =>
  enableANSIColors ? `\x1b[32m${text}\x1b[0m` : text;

export const yellowLog = (text: string) =>
  enableANSIColors ? `\x1b[33m${text}\x1b[0m` : text;

export const redLog = (text: string) =>
  enableANSIColors ? `\x1b[31m${text}\x1b[0m` : text;

export const blueLog = (text: string) =>
  enableANSIColors ? `\x1b[34m${text}\x1b[0m` : text;

export const cyanLog = (text: string) =>
  enableANSIColors ? `\x1b[36m${text}\x1b[0m` : text;

export const boldLog = (text: string) =>
  enableANSIColors ? `\x1b[1m${text}\x1b[0m` : text;
