const fs = require('fs');
const path = require('path');

function processDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        if (item === 'node_modules' || item === 'backend' || item === '.git') continue;
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (item.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalLength = content.length;
            // Replace all variations of display=swap for Material Symbols
            content = content.replace(/family=Material\+Symbols\+Outlined:wght,FILL@100\.\.700,0\.\.1(?:&amp;|&)display=swap/g, 'family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=block');
            content = content.replace(/family=Material\+Symbols\+Outlined:wght,FILL@100\.\.700,0\.\.1(?:&amp;|&|%26)display=swap/g, 'family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=block');

            if (content !== fs.readFileSync(fullPath, 'utf8')) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(__dirname);
