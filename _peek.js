const fs=require('fs');const t=fs.readFileSync('js/menu.js','utf8');const i=t.lastIndexOf('data-menu-empty');console.log(t.slice(i-80,i+400));
