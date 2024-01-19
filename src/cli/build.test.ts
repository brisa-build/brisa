import {
  describe,
  it,
  expect,
  mock,
  beforeEach,
  afterEach,
  spyOn,
} from "bun:test";
import fs from "node:fs";
import path from "node:path";
import build from "./build";
import { getConstants } from "@/constants";

const mockCompileAll = mock(async () => true);
const mockGenerateStaticExport = mock(async () => true);
const mockLog = mock((v: string) => {});

describe("cli", () => {
  describe("build", () => {
    beforeEach(() => {
      spyOn(process, "exit").mockImplementation(() => null as never);
      spyOn(console, "log").mockImplementation((v) => mockLog(v));
      mock.module("@/utils/compile-all", () => ({
        default: async () => (await mockCompileAll()) || true,
      }));
      mock.module("@/utils/generate-static-export", () => ({
        default: async () => (await mockGenerateStaticExport()) || true,
      }));
    });

    afterEach(() => {
      mockCompileAll.mockRestore();
      mockGenerateStaticExport.mockRestore();
      mock.restore();
    });

    it("should remove the build directory if it exists", async () => {
      spyOn(fs, "existsSync").mockImplementationOnce((v) => true);
      spyOn(fs, "rmSync").mockImplementationOnce((v) => null);

      await build();
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalled();
    });

    it("should NOT remove the build directory if does not exist", async () => {
      spyOn(fs, "existsSync").mockImplementationOnce((v) => false);
      spyOn(fs, "rmSync").mockImplementationOnce((v) => null);

      await build();
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it("should copy the prebuild directory to the build directory", async () => {
      const { ROOT_DIR, BUILD_DIR } = getConstants();
      const originPrebuildPath = path.join(ROOT_DIR, "prebuild");
      const finalPrebuildPath = path.join(BUILD_DIR, "prebuild");

      spyOn(fs, "existsSync").mockImplementation((v) =>
        (v as string).includes("prebuild"),
      );
      spyOn(fs, "cpSync").mockImplementationOnce(() => null);

      await build();
      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(fs.cpSync).toHaveBeenCalledWith(
        originPrebuildPath,
        finalPrebuildPath,
        { recursive: true },
      );
    });

    it('should call compileAll if no "output" field is defined in the configuration', async () => {
      await build();
      expect(mockCompileAll).toHaveBeenCalled();
      expect(mockGenerateStaticExport).not.toHaveBeenCalled();
    });

    it("should not call generateStaticExport in development when is static export", async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: false,
        IS_STATIC_EXPORT: true,
        CONFIG: {
          output: "static",
        },
      };
      await build();
      expect(mockCompileAll).toHaveBeenCalled();
      expect(mockGenerateStaticExport).not.toHaveBeenCalled();
    });

    it("should call generateStaticExport in production when is static export", async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        IS_STATIC_EXPORT: true,
        CONFIG: {
          output: "static",
        },
      };
      await build();
      expect(mockCompileAll).toHaveBeenCalled();
      expect(mockGenerateStaticExport).toHaveBeenCalled();
    });
  });
});
