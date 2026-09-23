const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

function replaceInFile(filePath) {
  // Only process certain file types
  if (!/\.(ts|tsx|md|yml|css|json)$/.test(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Rename OceanChat -> Bravechat
  content = content.replace(/OceanChat/g, 'Bravechat');
  content = content.replace(/Ocean<span className="text-ocean-secondary">Chat<\/span>/g, 'Brave<span className="text-ocean-secondary">chat</span>');
  content = content.replace(/oceanchat\.app/g, 'bravechat.app');
  content = content.replace(/oceanchat\.dev/g, 'bravechat.dev');

  // 2. Fix Vietnamese accents clipping (leading-none / leading-tight -> leading-snug)
  // Only target the specific classes in classNames
  content = content.replace(/leading-none/g, 'leading-snug');
  content = content.replace(/leading-tight/g, 'leading-snug');

  // 3. Fix dark text contrast by shifting opacities and using ocean-light instead of ocean-secondary for text
  content = content.replace(/text-ocean-secondary\/30/g, 'text-ocean-secondary/50');
  content = content.replace(/text-ocean-secondary\/40/g, 'text-ocean-secondary/60');
  content = content.replace(/text-ocean-secondary\/50/g, 'text-ocean-light/60');
  content = content.replace(/text-ocean-secondary\/60/g, 'text-ocean-light/70');
  content = content.replace(/text-ocean-secondary\/70/g, 'text-ocean-light/80');
  content = content.replace(/text-ocean-secondary\/80/g, 'text-ocean-light/90');
  content = content.replace(/text-ocean-secondary\/90/g, 'text-ocean-light/90');
  
  // Also fix standard text-ocean-secondary in paragraph texts to be brighter
  // We can do this safely if we look at specific components, but a safer way is to just apply the above.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const targetDirs = [
  path.join(__dirname, 'apps/web/src'),
  path.join(__dirname, 'docs'),
  path.join(__dirname, 'README.md'),
  path.join(__dirname, 'docker-compose.yml')
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    if (fs.statSync(dir).isDirectory()) {
      walkDir(dir, replaceInFile);
    } else {
      replaceInFile(dir);
    }
  }
});

console.log("Replacements complete.");
