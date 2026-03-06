const fs = require('fs');
const path = require('path');
const glob = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Replace font: Public Sans -> Be Vietnam Pro in Google Fonts links
    html = html.replace(/Public\+Sans/g, 'Be+Vietnam+Pro');

    // 2. Replace font family in Tailwind config and CSS
    html = html.replace(/["']Public Sans["']/g, '"Be Vietnam Pro"');

    // 3. Update borderRadius to most-rounded option
    // Replace the borderRadius config with larger values
    html = html.replace(
        /borderRadius:\s*\{[^}]+\}/g,
        'borderRadius: {"DEFAULT": "0.75rem", "lg": "1rem", "xl": "1.5rem", "2xl": "2rem", "full": "9999px"}'
    );

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Updated ${file}`);
});

console.log('\nTheme changes applied! Now rebuild pages with: node build-pages.cjs');
