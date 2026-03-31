const fs = require('fs');
const path = require('path');

const screens = [
    // Student pages
    { src: 'login.html', dest: 'index.html', id: 'login', pageJs: 'login.js' },
    { src: 'signup.html', dest: 'signup.html', id: 'signup', pageJs: 'signup.js' },
    { src: 'verify.html', dest: 'verify.html', id: 'verify', pageJs: 'verify.js' },
    { src: 'dashboard.html', dest: 'dashboard.html', id: 'dashboard', pageJs: 'dashboard.js' },
    { src: 'elections.html', dest: 'elections.html', id: 'elections', pageJs: 'elections.js' },
    { src: 'ballot.html', dest: 'ballot.html', id: 'ballot', pageJs: 'ballot.js' },
    { src: 'confirmation.html', dest: 'confirmation.html', id: 'confirmation', pageJs: 'confirmation.js' },
    { src: 'results.html', dest: 'results.html', id: 'results', pageJs: 'results.js' },
    { src: 'profile.html', dest: 'profile.html', id: 'profile', pageJs: 'profile.js' },
    // Admin pages
    { src: 'admin-login.html', dest: 'admin-login.html', id: 'admin-login', pageJs: 'admin-login.js' },
    { src: 'admin.html', dest: 'admin.html', id: 'admin', pageJs: 'admin.js' },
    { src: 'monitoring.html', dest: 'monitoring.html', id: 'monitoring', pageJs: 'monitoring.js' },
    { src: 'create-election.html', dest: 'create-election.html', id: 'create-election', pageJs: 'create-election.js' },
    { src: 'admin-results.html', dest: 'admin-results.html', id: 'admin-results', pageJs: 'admin-results.js' },
    { src: 'admin-settings.html', dest: 'admin-settings.html', id: 'admin-settings', pageJs: 'admin-settings.js' },
    { src: 'edit-election.html', dest: 'edit-election.html', id: 'edit-election', pageJs: 'edit-election.js' },
];

const sharedScript = fs.readFileSync(path.join(__dirname, 'src', 'shared.js'), 'utf8');

screens.forEach(({ src, dest, id, pageJs }) => {
    const srcPath = path.join(__dirname, 'src', 'screens', src);
    let html = fs.readFileSync(srcPath, 'utf8');

    // Read page-specific JS
    const pageJsPath = path.join(__dirname, 'src', 'pages', pageJs);
    const pageScript = fs.existsSync(pageJsPath) ? fs.readFileSync(pageJsPath, 'utf8') : '';

    // Inject shared + page-specific script before </body>
    const inject = `
<script>
${sharedScript}
${pageScript}
</script>
`;
    html = html.replace('</body>', inject + '</body>');

    const destPath = path.join(__dirname, dest);
    fs.writeFileSync(destPath, html, 'utf8');
    console.log('OK: ' + src + ' -> ' + dest);
});

console.log('All pages built!');
