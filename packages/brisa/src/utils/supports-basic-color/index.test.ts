import { it, expect, describe, beforeEach, afterEach, spyOn } from 'bun:test';
import os from 'node:os';
import tty from 'node:tty';
import supportsBasicColor from '.';

describe('supportsBasicColor', () => {
  let envBackup: NodeJS.ProcessEnv;

  beforeEach(() => {
    envBackup = { ...process.env };
  });

  afterEach(() => {
    process.env = envBackup;
  });

  it('should return true when FORCE_COLOR is set to "true"', () => {
    process.env.FORCE_COLOR = 'true';
    expect(supportsBasicColor()).toBeTrue();
  });

  it('should return false when FORCE_COLOR is set to "false"', () => {
    process.env.FORCE_COLOR = 'false';
    expect(supportsBasicColor()).toBeFalse();
  });

  it('should return true when running in a TTY', () => {
    const mockTTY = spyOn(tty, 'isatty').mockReturnValue(true);
    expect(supportsBasicColor()).toBeTrue();
    mockTTY.mockRestore();
  });

  it('should return false when not running in a TTY and no FORCE_COLOR is set', () => {
    const mockTTY = spyOn(tty, 'isatty').mockReturnValue(false);
    expect(supportsBasicColor()).toBeFalse();
    mockTTY.mockRestore();
  });

  it('should return true on Windows 10 with appropriate build version', () => {
    const mockPlatform = spyOn(process, 'platform').mockReturnValue(
      'win32' as never,
    );
    const mockOSRelease = spyOn(os, 'release').mockReturnValue('10.0.14931');
    expect(supportsBasicColor()).toBeTrue();
    mockPlatform.mockRestore();
    mockOSRelease.mockRestore();
  });

  it('should return true when TERM is set to a valid value', () => {
    process.env.TERM = 'xterm-256color';
    expect(supportsBasicColor()).toBeTrue();
  });

  it('should return false when TERM is set to "dumb"', () => {
    process.env.TERM = 'dumb';
    expect(supportsBasicColor()).toBeFalse();
  });

  it('should return true when TERM is not set and in a TTY', () => {
    delete process.env.TERM;
    spyOn(tty, 'isatty').mockReturnValue(true);
    expect(supportsBasicColor()).toBeTrue();
  });
});
