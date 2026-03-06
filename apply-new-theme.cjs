// Apply AU theme to the 4 new screens
const fs = require('fs');
const path = require('path');

const files = [
    'results.html',
    'profile.html',
    'admin-results.html',
    'admin-settings.html',
];

// AU Tailwind config block
const auConfig = `tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#003DA5",
                        "accent": "#F5B400",
                        "accent-dark": "#D49B00",
                        "accent-light": "#FFF5D6",
                        "primary-content": "#ffffff",
                        "primary-dark": "#002D7A",
                        "primary-light": "#E6EEF9",
                        "background-light": "#FAFAFA",
                        "background-dark": "#0A0A0A",
                        "surface-light": "#FFFFFF",
                        "surface-dark": "#141414",
                        "surface-border": "#2d3748",
                        "border-dark": "#2d3748",
                        "text-main": "#0A0A0A",
                        "text-muted": "#64748b",
                        "text-primary": "#0A0A0A",
                        "text-secondary": "#4e5a97",
                        "border-light": "#e2e8f0",
                    },
                    fontFamily: {
                        "display": ["Be Vietnam Pro", "sans-serif"],
                        "body": ["Be Vietnam Pro", "sans-serif"],
                        "sans": ["Be Vietnam Pro", "sans-serif"],
                    },
                    borderRadius: {"DEFAULT": "0.75rem", "lg": "1rem", "xl": "1.5rem", "2xl": "2rem", "full": "9999px"},
                },
            },
        }`;

const fontLink = '<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>';

files.forEach(file => {
    const filePath = path.join(__dirname, 'src', 'screens', file);
    if (!fs.existsSync(filePath)) { console.log('SKIP: ' + file + ' (not found)'); return; }
    let html = fs.readFileSync(filePath, 'utf8');

    // Replace tailwind config block
    html = html.replace(/tailwind\.config\s*=\s*\{[\s\S]*?\n\s*\}/m, auConfig);

    // Add Be Vietnam Pro font if not present
    if (!html.includes('Be+Vietnam+Pro')) {
        html = html.replace('</head>', fontLink + '\n</head>');
    }

    // Replace Inter/Lexend/Public Sans font references
    html = html.replace(/font-family:\s*['"]?(Inter|Lexend|Public Sans)['"]?/g, "font-family: 'Be Vietnam Pro'");
    html = html.replace(/"Inter"/g, '"Be Vietnam Pro"');
    html = html.replace(/"Lexend"/g, '"Be Vietnam Pro"');

    // Remove class="dark" from html tag (we manage dark mode via JS)
    html = html.replace('<html class="dark"', '<html');

    // Replace old primary colors
    html = html.replace(/#1979e6/g, '#003DA5');
    html = html.replace(/#1978e5/g, '#003DA5');
    html = html.replace(/#3f68e4/g, '#003DA5');
    html = html.replace(/#193ce6/g, '#003DA5');

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('OK: ' + file);
});

console.log('Theme applied to all new screens!');
