const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

const enlargedHeader = `<div class="flex items-center gap-3 sm:gap-4">
        <img src="/assets/au-logo.jpg" alt="Adeleke University Logo" class="size-12 sm:size-16 rounded-full object-cover border-2 sm:border-4 border-[#F5B400]/50 shadow-sm bg-white" />
        <div>
          <h2 class="text-xl sm:text-2xl font-black text-[#003DA5] dark:text-white leading-tight tracking-tight">Adeleke University</h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold tracking-wide">Voting Portal</p>
        </div>
      </div>`;

// This regex matches the previously injected header blocks that look roughly like the gap-3 wrapper
// We will look for <div class="flex items-center gap-3"> that contains Adeleke University and Voting Portal
let count = 0;

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let html = fs.readFileSync(filePath, 'utf-8');

    // Pattern to match the existing injected header
    const oldHeaderPattern = /<div class="flex items-center gap-3">\s*<img src="\/assets\/au-logo\.jpg"[^>]*>\s*<div>\s*<h2[^>]*>Adeleke University<\/h2>\s*<p[^>]*>Voting Portal<\/p>\s*<\/div>\s*<\/div>/gs;

    // Pattern to match the original mobile header that had <span class="material-symbols-outlined text-xl">school</span>
    // Let's replace the mobile header with the AU logo
    const oldMobileHeaderPattern = /<div class="size-8 rounded-lg bg-primary\/10 flex items-center justify-center text-primary">\s*<span class="material-symbols-outlined text-xl">school<\/span>\s*<\/div>\s*<h1 class="text-sm font-bold[^>]*>Adeleke University<\/h1>/gs;
    const newMobileHeader = `<img src="/assets/au-logo.jpg" alt="Adeleke University Logo" class="size-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700 bg-white" />
          <h1 class="text-base font-bold text-[#003DA5] dark:text-white hidden sm:block tracking-tight">Adeleke University</h1>`;

    let modified = false;

    if (oldHeaderPattern.test(html)) {
        html = html.replace(oldHeaderPattern, enlargedHeader);
        modified = true;
    }

    if (oldMobileHeaderPattern.test(html)) {
        html = html.replace(oldMobileHeaderPattern, newMobileHeader);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, html, 'utf-8');
        console.log('Updated headers in ' + file);
    }
});
console.log('Done! Updated headers in ' + count + ' files.');
