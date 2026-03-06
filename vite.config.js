import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                verify: resolve(__dirname, 'verify.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                ballot: resolve(__dirname, 'ballot.html'),
                confirmation: resolve(__dirname, 'confirmation.html'),
                adminLogin: resolve(__dirname, 'admin-login.html'),
                admin: resolve(__dirname, 'admin.html'),
                monitoring: resolve(__dirname, 'monitoring.html'),
                createElection: resolve(__dirname, 'create-election.html'),
                adminResults: resolve(__dirname, 'admin-results.html'),
                adminSettings: resolve(__dirname, 'admin-settings.html'),
                results: resolve(__dirname, 'results.html'),
                profile: resolve(__dirname, 'profile.html'),
                elections: resolve(__dirname, 'elections.html'),
                signup: resolve(__dirname, 'signup.html'),
            },
        },
    },
})
