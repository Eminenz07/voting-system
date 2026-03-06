const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

let count = 0;

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let html = fs.readFileSync(filePath, 'utf-8');

    // Pattern to match dashboard/profile style mobile headers that just have a menu button and text
    const pattern1 = /<button class="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">\s*<span class="material-symbols-outlined">menu<\/span>\s*<\/button>\s*<span class="font-bold text-lg text-slate-900 dark:text-white">Adeleke University<\/span>/g;

    // Replace with menu + AU Logo + Text
    const newHeaderElements = `<button class="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
<span class="material-symbols-outlined">menu</span>
</button>
<img src="/assets/au-logo.jpg" alt="Adeleke University Logo" class="size-8 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700 bg-white" />
<span class="font-bold text-lg text-slate-900 dark:text-white">Adeleke University</span>`;

    if (pattern1.test(html)) {
        html = html.replace(pattern1, newHeaderElements);
        fs.writeFileSync(filePath, html, 'utf-8');
        count++;
        console.log('Updated mobile header in ' + file);
    }
});

console.log('Done! Updated mobile headers in ' + count + ' files.');
