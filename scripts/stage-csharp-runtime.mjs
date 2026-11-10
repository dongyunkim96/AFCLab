import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const published = join(root, 'csharp/Afc.Browser/bin/Release/net10.0/publish/wwwroot/_framework');
const destination = join(root, 'public/csharp-runtime');

if (!existsSync(join(published, 'dotnet.js'))) {
  console.error('Run dotnet publish csharp/Afc.Browser -c Release first.');
  process.exit(1);
}

mkdirSync(destination, { recursive: true });
cpSync(published, join(destination, '_framework'), {
  recursive: true,
  filter: path => !['.br', '.gz', '.map'].includes(extname(path)),
});
cpSync(join(root, 'csharp/Afc.Browser/notices'), join(destination, 'notices'), { recursive: true });
console.log('Staged C# browser runtime under public/csharp-runtime.');
