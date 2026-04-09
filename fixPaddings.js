const glob = require('fs/promises'); 
async function run() { 
  const files = [ 
    'src/app/dashboard/vistos/page.tsx', 
    'src/app/dashboard/turismo/page.tsx', 
    'src/app/dashboard/perda-nacionalidade/page.tsx', 
    'src/app/dashboard/compra-venda/page.tsx', 
    'src/app/dashboard/acoes-trabalhistas/page.tsx', 
    'src/app/dashboard/acoes-civeis/page.tsx', 
    'src/app/dashboard/acoes-criminais/page.tsx' 
  ]; 
  for (const f of files) { 
    const content = await glob.readFile(f, 'utf8'); 
    const newContent = content.replace(/className="space-y-6 p-6"/g, 'className="flex flex-col gap-5 sm:gap-6 h-full"'); 
    await glob.writeFile(f, newContent); 
    console.log('Updated ' + f); 
  } 
} 
run();
