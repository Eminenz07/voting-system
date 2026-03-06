const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

// Simple replacements — no complex regex, just literal string swaps
const replacements = [
    // Ensure accent color in config
    ['secondary": "#FFD700"', 'accent": "#F5B400"'],

    // Camera frame corners: blue -> yellow
    ['border-t-4 border-l-4 border-primary', 'border-t-4 border-l-4 border-[#F5B400]'],
    ['border-t-4 border-r-4 border-primary', 'border-t-4 border-r-4 border-[#F5B400]'],
    ['border-b-4 border-l-4 border-primary', 'border-b-4 border-l-4 border-[#F5B400]'],
    ['border-b-4 border-r-4 border-primary', 'border-b-4 border-r-4 border-[#F5B400]'],

    // Ballot number badges: yellow
    ['bg-primary/90 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded', 'bg-[#F5B400] text-black backdrop-blur-sm text-xs font-bold px-2 py-1 rounded'],

    // Step indicator: yellow 
    ['text-primary bg-primary/10 px-2 py-1 rounded', 'text-[#8B6D00] bg-[#FFF5D6] px-2 py-1 rounded'],
    ['text-accent-dark bg-accent-light px-2 py-1 rounded', 'text-[#8B6D00] bg-[#FFF5D6] px-2 py-1 rounded'],

    // Live badge: yellow instead of red
    ['font-bold text-white bg-red-500 px-2 py-1 rounded-full', 'font-bold text-black bg-[#F5B400] px-2 py-1 rounded-full'],

    // Progress bar fill: yellow accent
    ['bg-primary rounded-full transition-all duration-500', 'bg-[#F5B400] rounded-full transition-all duration-500'],

    // Selected candidate check: yellow
    ['bg-primary text-white rounded-full p-1 opacity-100', 'bg-[#F5B400] text-black rounded-full p-1 opacity-100'],

    // Sidebar active item: add yellow left bar
    ['bg-primary/10 text-primary group transition-colors" href', 'bg-primary/10 text-primary border-l-4 border-[#F5B400] group transition-colors" href'],

    // University logo ring
    ['rounded-lg bg-primary/10 text-primary">', 'rounded-lg bg-primary/10 text-primary ring-2 ring-[#F5B400]/40">'],

    // Capture button: yellow
    ['bg-primary rounded-full shadow-lg group-hover:scale-90', 'bg-[#F5B400] rounded-full shadow-lg group-hover:scale-90'],

    // Primary button shadows: darken
    ['shadow-primary/20', 'shadow-primary/30'],
];

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    replacements.forEach(([find, replace]) => {
        html = html.split(find).join(replace);
    });

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('OK: ' + file);
});

console.log('Done!');
