const fs = require('fs');
const path = require('path');

const accentCSS = `
<style id="au-brand-overrides">
  /* ===== AU Brand Colors Override ===== */
  /* Royal Blue: #003DA5 | AU Yellow: #F5B400 | White: #FAFAFA | Black: #0A0A0A */

  /* Active sidebar items get yellow left border */
  .bg-primary\\/10 { border-left: 4px solid #F5B400 !important; }

  /* Progress bars: yellow fill */
  .bg-primary.rounded-full[style*="width"] { background-color: #F5B400 !important; }
  div[class*="bg-primary"][class*="rounded-full"][class*="h-1"],
  div[class*="bg-primary"][class*="rounded-full"][class*="h-2"],
  div[class*="bg-primary"][class*="rounded-full"][class*="h-1.5"] {
    background-color: #F5B400 !important;
  }

  /* Live/ENDS SOON badges: yellow instead of red */
  .bg-red-500.rounded-full, .bg-red-500.px-2 {
    background-color: #F5B400 !important;
    color: #000 !important;
  }

  /* Camera scan frame corners: yellow */
  [class*="border-t-4"][class*="border-primary"],
  [class*="border-b-4"][class*="border-primary"],
  [class*="border-l-4"][class*="border-primary"],
  [class*="border-r-4"][class*="border-primary"] {
    border-color: #F5B400 !important;
  }

  /* Scan line glow: yellow */
  [class*="bg-primary"][class*="shadow-"][style*="width:80%"],
  [class*="animate-scanline"] div[class*="bg-primary"] {
    background-color: #F5B400 !important;
    box-shadow: 0 0 15px rgba(245,180,0,0.8) !important;
  }

  /* Selected candidate card border: yellow */
  [class*="border-primary"][class*="shadow-lg"] {
    border-color: #F5B400 !important;
    box-shadow: 0 10px 25px rgba(245,180,0,0.15) !important;
  }

  /* Selected candidate radio dot: yellow */
  [class*="bg-primary"][class*="rounded-full"][class*="group-hover\\:scale"] {
    background-color: #F5B400 !important;
  }

  /* Verified check badges on candidates: yellow */
  [class*="bg-primary"][class*="rounded-full"][class*="p-1"] {
    background-color: #F5B400 !important;
    color: #000 !important;
  }

  /* KPI/stat card accent lines at bottom */
  div[class*="bg-primary"][class*="h-1"][class*="rounded-full"] {
    background-color: #F5B400 !important;
  }

  /* Step badges: yellow-tinted bg */
  [class*="bg-primary\\/10"][class*="px-2"][class*="py-1"] {
    background-color: #FFF5D6 !important;
    color: #8B6D00 !important;
  }

  /* Capture button (verify screen): yellow ring */
  button[class*="bg-primary"][class*="rounded-full"][class*="shadow-lg"] {
    background-color: #F5B400 !important;
    color: #000 !important;
  }

  /* Stat card icon backgrounds: slightly yellow-tinted */
  .bg-primary\\/10 > .material-symbols-outlined {
    color: #003DA5 !important;
  }

  /* University logo wrapper ring */
  .rounded-lg.bg-primary\\/10.text-primary {
    box-shadow: inset 0 0 0 2px rgba(245,180,0,0.3);
  }
</style>
`;

// Process all built HTML files in root
const rootDir = __dirname;
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Remove old overrides if re-running
    html = html.replace(/<style id="au-brand-overrides">[\s\S]*?<\/style>/g, '');

    // Inject before </head>
    html = html.replace('</head>', accentCSS + '</head>');

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('OK: ' + file);
});

console.log('Brand yellow accent CSS injected!');
