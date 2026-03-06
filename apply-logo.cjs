const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

let count = 0;
files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Replace the specific AU circle placeholder with the new image tag
    const searchString = '<div class="flex items-center justify-center w-10 h-10 rounded-full bg-[#F5B400] text-white font-bold text-sm shadow-md">AU</div>';
    const replaceString = '<img src="/assets/au-logo.jpg" alt="Adeleke University Logo" class="w-10 h-10 rounded-full object-cover border-2 border-[#F5B400]/50 shadow-sm bg-white" />';

    if (html.includes(searchString)) {
        html = html.split(searchString).join(replaceString);
        fs.writeFileSync(filePath, html, 'utf8');
        count++;
        console.log('Updated ' + file);
    }
});

console.log('Done! Updated ' + count + ' files.');
