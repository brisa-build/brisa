echo "Enter project name: "

read PROJECT_NAME

echo "Creating project $PROJECT_NAME"

mkdir $PROJECT_NAME

cd $PROJECT_NAME

$BRISA_VERSION="0.0.10"

echo ""
echo "🛠️  Installing brisa..."
echo ""

echo "{
  \"name\": \"$PROJECT_NAME\",
  \"module\": \"src/pages/index.tsx\",
  \"type\": \"module\",
  \"scripts\": {
    \"dev\": \"brisa dev\",
    \"build\": \"brisa build\",
    \"start\": \"brisa start\"
  },
  \"dependencies\": {
    \"brisa\": \"$BRISA_VERSION\"
  },
  \"devDependencies\": {
    \"bun-types\": \"latest\"
  },
  \"peerDependencies\": {
    \"typescript\": \"latest\"
  }
}" > package.json

echo "{
  \"compilerOptions\": {
    \"baseUrl\": \"./src\",
    \"lib\": [\"dom\", \"dom.iterable\", \"esnext\"],
    \"module\": \"esnext\",
    \"target\": \"esnext\",
    \"moduleResolution\": \"bundler\",
    \"moduleDetection\": \"force\",
    \"allowImportingTsExtensions\": true,
    \"noEmit\": true,
    \"composite\": true,
    \"strict\": true,
    \"downlevelIteration\": true,
    \"skipLibCheck\": true,
    \"jsx\": \"react-jsx\",
    \"jsxImportSource\": \"brisa\",
    \"allowSyntheticDefaultImports\": true,
    \"forceConsistentCasingInFileNames\": true,
    \"allowJs\": true,
    \"types\": [
      \"bun-types\", // add Bun global
      \"brisa\", // add dom and dom.iterable support
    ],
    // Please, do not modify this path alias configuration.
    // It's internally used in Brisa \"types.ts\" file to enable type-safe
    \"paths\": {
      \"@/*\": [\"*\"],
    }
  }
}" > tsconfig.json


echo "# $PROJECT_NAME

Project created with [Brisa](https://github.com/aralroca/brisa).

## Getting Started

### Installation

\`\`\`bash
bun install
\`\`\`

### Development

\`\`\`bash
bun dev
\`\`\`

### Build

\`\`\`bash
bun build
\`\`\`

### Start

\`\`\`bash
bun start
\`\`\`


" > README.md

mkdir src
mkdir src/pages
touch src/pages/index.tsx
echo "export default function Homepage() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}" > src/pages/index.tsx



echo "build
node_modules" > .gitignore

bun install

cd ..

echo ""
echo "✨ Project created successfully"
echo ""
echo "📀 Run: cd $PROJECT_NAME && bun dev"
