echo "Enter project name: "

read PROJECT_NAME

echo "Creating project $PROJECT_NAME"

mkdir $PROJECT_NAME

cd $PROJECT_NAME

echo "Creating package.json"

bun init -y

echo "Installing brisa"

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
    \"brisa\": \"0.0.2\"
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
    \"baseUrl\": \".\",
    \"lib\": [
      \"ESNext\"
    ],
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
      \"bun-types\" // add Bun global
    ],
    // Please, do not modify this path alias configuration.
    // It's internally used in Brisa "types.ts" file to enable type-safe
    \"paths\": {
      \"@/*\": [\"src/*\"],
    }
  }
}" > tsconfig.json


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

bun install

cd ..