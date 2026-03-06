const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

/*
 * Adeleke University Brand Colors:
 * - Royal Blue (primary):  #003DA5
 * - AU Yellow (accent):    #F5B400
 * - White (background):    #FFFFFF
 * - Black (text/contrast): #0A0A0A
 */

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // ===== 1. Update the Tailwind config colors =====

    // Replace primary color: #193ce6 -> Royal Blue #003DA5
    html = html.replace(/#193ce6/g, '#003DA5');

    // Replace primary-dark variants
    html = html.replace(/#132bb3/g, '#002D7A');
    html = html.replace(/#122ab3/g, '#002D7A');

    // Replace primary-light variants
    html = html.replace(/#e0e5fc/g, '#E6EEF9');
    html = html.replace(/#e8ebfc/g, '#E6EEF9');
    html = html.replace(/#eef2ff/g, '#E6EEF9');

    // Replace background-light to white-ish
    html = html.replace(/"background-light":\s*"#f6f6f8"/g, '"background-light": "#FAFAFA"');
    html = html.replace(/"background-light":\s*"#f8f9fc"/g, '"background-light": "#FAFAFA"');

    // Replace surface-light to pure white
    html = html.replace(/"surface-light":\s*"#ffffff"/g, '"surface-light": "#FFFFFF"');

    // Replace dark backgrounds for better dark mode
    html = html.replace(/"background-dark":\s*"#111421"/g, '"background-dark": "#0A0A0A"');
    html = html.replace(/"surface-dark":\s*"#1e2130"/g, '"surface-dark": "#141414"');
    html = html.replace(/"surface-dark":\s*"#1e2235"/g, '"surface-dark": "#141414"');
    html = html.replace(/"surface-dark":\s*"#1e2336"/g, '"surface-dark": "#141414"');
    html = html.replace(/"surface-dark":\s*"#1c2136"/g, '"surface-dark": "#141414"');

    // ===== 2. Add AU Yellow accent to the Tailwind config =====
    // Inject accent colors into the colors block
    html = html.replace(
        /"primary":\s*"#003DA5"/g,
        '"primary": "#003DA5",\n                        "accent": "#F5B400",\n                        "accent-dark": "#D49B00",\n                        "accent-light": "#FFF5D6"'
    );

    // ===== 3. Apply accent yellow to key UI elements =====

    // Badges, status indicators — use accent yellow for "Live" badges
    html = html.replace(/bg-red-500 rounded-full animate-pulse/g, 'bg-accent rounded-full animate-pulse');

    // Accent highlights on hover states and active indicators
    // Replace green trending indicators with accent
    html = html.replace(/text-green-600 bg-green-50/g, 'text-accent-dark bg-accent-light');
    html = html.replace(/bg-green-50 dark:bg-green-900\/20/g, 'bg-accent-light dark:bg-accent/10');

    // "Live Election" badge - use accent
    html = html.replace(
        /text-primary uppercase tracking-wider bg-primary\/10/g,
        'text-accent-dark uppercase tracking-wider bg-accent-light'
    );

    // Step indicator badges - use accent
    html = html.replace(
        /text-primary bg-primary\/10 px-2 py-1 rounded/g,
        'text-accent-dark bg-accent-light px-2 py-1 rounded font-bold'
    );

    // Warning/important notices keep yellow (already aligned with AU Yellow)

    // Shadow colors - update from primary blue to royal blue
    html = html.replace(/shadow-primary\/20/g, 'shadow-[#003DA5]/20');
    html = html.replace(/shadow-primary\/30/g, 'shadow-[#003DA5]/25');
    html = html.replace(/shadow-primary\/40/g, 'shadow-[#003DA5]/30');

    // Replace the hover blue-700 with our darker royal blue
    html = html.replace(/hover:bg-blue-700/g, 'hover:bg-[#002D7A]');
    html = html.replace(/hover:bg-blue-600/g, 'hover:bg-[#00358F]');

    // ===== 4. Update text colors for stronger contrast =====
    // Main text - ensure dark black 
    html = html.replace(/"text-main":\s*"#0e101b"/g, '"text-main": "#0A0A0A"');
    html = html.replace(/"text-main":\s*"#0f172a"/g, '"text-main": "#0A0A0A"');
    html = html.replace(/"text-primary":\s*"#0e101b"/g, '"text-primary": "#0A0A0A"');

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Branded: ${file}`);
});

console.log('\n🎨 AU Brand colors applied! Rebuilding pages...');
