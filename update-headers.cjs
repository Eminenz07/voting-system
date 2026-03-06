/**
 * Replace page-specific headers (Dashboard, Dashboard Overview, etc.)
 * with branded "Adeleke University Voting Portal" header + logo placeholder.
 */
const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

// The branded header replacement - AU logo circle + title
const brandedHeader = `<div class="flex items-center gap-3">
        <img src="/assets/au-logo.jpg" alt="Adeleke University Logo" class="w-10 h-10 rounded-full object-cover border-2 border-[#F5B400]/50 shadow-sm bg-white" />
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">Adeleke University</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Voting Portal</p>
        </div>
      </div>`;

let count = 0;

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let html = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Pattern 1: Desktop header with Dashboard + date (student dashboard)
    // <div>
    //   <h2 ...>Dashboard</h2>
    //   <p ...>Today is October 24, 2023</p>
    // </div>
    const dashDatePattern = /<div>\s*<h2[^>]*>Dashboard<\/h2>\s*<p[^>]*>Today is[^<]*<\/p>\s*<\/div>/gs;
    if (dashDatePattern.test(html)) {
        html = html.replace(dashDatePattern, brandedHeader);
        modified = true;
    }

    // Pattern 2: Admin header with Dashboard Overview + Welcome (admin dashboard)
    // <div>
    //   <h2 ...>Dashboard Overview</h2>
    //   <p ...>Welcome back, Administrator</p>
    // </div>
    const adminPattern = /<div>\s*<h2[^>]*>Dashboard Overview<\/h2>\s*<p[^>]*>Welcome back[^<]*<\/p>\s*<\/div>/gs;
    if (adminPattern.test(html)) {
        html = html.replace(adminPattern, brandedHeader);
        modified = true;
    }

    // Pattern 3: Any "Page Title" + subtitle header in admin pages
    // Match headers like "Create New Election / Set up..." , "Election Monitoring / Real-time...", "Results Report", "Settings"
    const genericHeaderPatterns = [
        /<div>\s*<h2[^>]*>Create New Election<\/h2>\s*<p[^>]*>[^<]*<\/p>\s*<\/div>/gs,
        /<div>\s*<h2[^>]*>Election Monitoring<\/h2>\s*<p[^>]*>[^<]*<\/p>\s*<\/div>/gs,
        /<div>\s*<h2[^>]*>Results Report<\/h2>\s*<p[^>]*>[^<]*<\/p>\s*<\/div>/gs,
        /<div>\s*<h2[^>]*>Profile &amp; Settings<\/h2>\s*<p[^>]*>[^<]*<\/p>\s*<\/div>/gs,
        /<div>\s*<h2[^>]*>Profile & Settings<\/h2>\s*<p[^>]*>[^<]*<\/p>\s*<\/div>/gs,
    ];

    for (const pat of genericHeaderPatterns) {
        if (pat.test(html)) {
            html = html.replace(pat, brandedHeader);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, html, 'utf-8');
        count++;
        console.log(`✓ Updated header in ${file}`);
    }
});

console.log(`\nDone! Updated headers in ${count} files.`);
