const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'signup.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Font: Public Sans -> Be Vietnam Pro
html = html.split('Public+Sans').join('Be+Vietnam+Pro');
html = html.split('"Public Sans"').join('"Be Vietnam Pro"');
html = html.split("'Public Sans'").join("'Be Vietnam Pro'");

// 2. Border radius: update to more rounded
html = html.replace(
    /borderRadius:\s*\{[^}]+\}/g,
    'borderRadius: {"DEFAULT": "0.75rem", "lg": "1rem", "xl": "1.5rem", "2xl": "2rem", "full": "9999px"}'
);

// 3. Primary color: #193ce6 -> Royal Blue #003DA5
html = html.split('#193ce6').join('#003DA5');
html = html.split('#132bb3').join('#002D7A');
html = html.split('#122ab3').join('#002D7A');

// 4. Background tweaks
html = html.replace(/"background-light":\s*"#f6f6f8"/g, '"background-light": "#FAFAFA"');
html = html.replace(/"background-light":\s*"#f8f9fc"/g, '"background-light": "#FAFAFA"');
html = html.replace(/"background-dark":\s*"#111421"/g, '"background-dark": "#0A0A0A"');
html = html.replace(/"surface-dark":\s*"#1e2130"/g, '"surface-dark": "#141414"');

fs.writeFileSync(filePath, html, 'utf8');
console.log('Theme applied to signup.html');
