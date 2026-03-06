/**
 * Remove sidebar <aside> panels from all HTML files.
 * Keeps only the floating FAB navigation.
 */
const fs = require('fs');
const path = require('path');

// Process both root HTML and source screen templates
const rootFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html')).map(f => path.join(__dirname, f));
const screensDir = path.join(__dirname, 'src', 'screens');
const screenFiles = fs.existsSync(screensDir) ? fs.readdirSync(screensDir).filter(f => f.endsWith('.html')).map(f => path.join(screensDir, f)) : [];
const allFiles = [...rootFiles, ...screenFiles];

let count = 0;

allFiles.forEach(filePath => {
    const file = path.basename(filePath);
    let html = fs.readFileSync(filePath, 'utf-8');

    // Remove <aside ...>...</aside> blocks (including nested content)
    // Use a simple state machine approach for nested tags
    let result = '';
    let i = 0;
    let removed = false;

    while (i < html.length) {
        // Check for <aside
        if (html.substring(i, i + 6).toLowerCase() === '<aside') {
            // Find the matching closing </aside>
            let depth = 0;
            let j = i;
            while (j < html.length) {
                if (html.substring(j, j + 6).toLowerCase() === '<aside') {
                    depth++;
                    j += 6;
                } else if (html.substring(j, j + 8).toLowerCase() === '</aside>') {
                    depth--;
                    if (depth === 0) {
                        j += 8;
                        break;
                    }
                    j += 8;
                } else {
                    j++;
                }
            }
            // Skip the entire aside block
            i = j;
            removed = true;
        } else {
            result += html[i];
            i++;
        }
    }

    // Also remove sidebar-related wrapper divs that have specific patterns
    // Fix the main content to take full width when sidebar is removed
    if (removed) {
        // Remove any leftover flex wrapper that assumed sidebar exists
        // Make main content full width: replace md:ml-64, ml-64, pl-64 etc.
        result = result.replace(/\bml-64\b/g, 'ml-0');
        result = result.replace(/\bmd:ml-64\b/g, 'md:ml-0');
        result = result.replace(/\blg:ml-64\b/g, 'lg:ml-0');
        result = result.replace(/\bpl-64\b/g, 'pl-0');
        result = result.replace(/\bmd:pl-64\b/g, 'md:pl-0');

        fs.writeFileSync(filePath, result, 'utf-8');
        count++;
        console.log(`✓ Removed sidebar from ${file}`);
    }
});

console.log(`\nDone! Removed sidebars from ${count} files.`);
