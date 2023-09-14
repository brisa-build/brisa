import fs from "node:fs/promises";
import path from "node:path";
import getRootDir from "../get-root-dir";

const MANDATORY_TAGS = ["html", "head", "body", "title"];
const MANDATORY_TAGS_SET = new Set(MANDATORY_TAGS);
const projectDir = getRootDir();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const srcDir = path.join(projectDir, "src");
const supportedFormats = ["tsx", "ts", "js"];
const supportedPaths = [
  path.join(srcDir, "layout", "index"),
  path.join(srcDir, "layout"),
];

async function isCustomLayout() {
  const promises = supportedPaths.flatMap((path) =>
    supportedFormats.map((format) => fs.exists(`${path}.${format}`)),
  );

  const results = await Promise.all(promises);

  return results.some((exist) => exist);
}

const existCustomLayoutAtTheBeginning = await isCustomLayout();

export default async function LoadLayout({
  children,
}: {
  children: JSX.Element;
}) {
  const checkCustomLayout = IS_PRODUCTION
    ? existCustomLayoutAtTheBeginning
    : await isCustomLayout();

  if (!checkCustomLayout) {
    return (
      <html>
        <head>
          <title>Bunrise</title>
        </head>
        <body>{children}</body>
      </html>
    );
  }

  const CustomLayout = await import(path.join(srcDir, "layout"));

  if (!IS_PRODUCTION && !(await hasAllMandatoryTags(CustomLayout.default))) {
    console.error(
      `Missing mandatory tag in custom layout (${MANDATORY_TAGS.join(
        ", ",
      )}). Please check your layout file. You can experiment some problems with your JavaScript client code`,
    );
  }

  return <CustomLayout.default>{children}</CustomLayout.default>;
}

async function hasAllMandatoryTags(element: JSX.Element) {
  const mandatory = new Set();

  console.log(JSON.stringify(element))
  JSON.stringify(element, (key, value) => {
    if (key === "type" && MANDATORY_TAGS_SET.has(value)) mandatory.add(value);
    return value;
  });

  return mandatory.size === MANDATORY_TAGS_SET.size;
}
