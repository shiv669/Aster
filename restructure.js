const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);

// Directories to create
const dirs = [
  'apps/web',
  'apps/server/src/modules/upload',
  'apps/server/src/modules/schema',
  'apps/server/src/modules/validation',
  'apps/server/src/modules/repair',
  'apps/server/src/modules/export',
  'apps/server/src/middleware',
  'apps/server/src/routes',
  'apps/server/src/utils',
  'apps/server/src/types',
  'packages/shared/src',
  'packages/parser/src',
  'packages/prompts/src',
  'packages/validation/src',
  'packages/ui/src',
  'packages/logger/src',
  'packages/ai/src',
  'docs/decisions',
  'scripts'
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
});

// Move Next.js frontend to apps/web
const filesToMove = [
  'src',
  'public',
  'next.config.mjs',
  'postcss.config.mjs',
  'tailwind.config.ts',
  'tsconfig.json',
  'components.json',
  'eslint.config.mjs',
  'next-env.d.ts'
];

filesToMove.forEach(item => {
  const oldPath = path.join(root, item);
  const newPath = path.join(root, 'apps/web', item);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
});

// Update root package.json for workspaces
const packageJsonPath = path.join(root, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Write the original package.json to apps/web
  fs.writeFileSync(path.join(root, 'apps/web/package.json'), JSON.stringify(pkg, null, 2));

  // Create new root package.json
  const rootPkg = {
    name: "aster",
    private: true,
    workspaces: [
      "apps/*",
      "packages/*"
    ],
    scripts: {
      "dev:web": "npm run dev --workspace=apps/web",
      "dev:server": "npm run dev --workspace=apps/server",
      "dev": "npm run dev:web & npm run dev:server"
    }
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(rootPkg, null, 2));
}

console.log("Repository successfully restructured according to Aster Architecture.md!");
