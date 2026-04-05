/**
 * PM2 ECOSYSTEM CONFIGURATION - PRODUCTION
 * =========================================
 * Configuración profesional de PM2 para Granja Mari Pepa
 * 
 * Características:
 * - Cluster mode para frontend (aprovecha múltiples CPUs)
 * - Monitoreo de memoria y auto-restart
 * - Logging estructurado con rotación
 * - Health checks integrados
 * - Graceful shutdown
 */

module.exports = {
    apps: [
        // ============================================
        // BACKEND API (Express + ODBC)
        // ============================================
        {
            name: 'mari-pepa-backend',
            cwd: './backend',
            script: 'server.js',

            // Modo fork porque ODBC pool maneja conexiones
            instances: 1,
            exec_mode: 'fork',

            // Auto-restart
            autorestart: true,
            watch: false,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Límites de memoria (reinicia si excede)
            max_memory_restart: '1G',

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,

            // Entorno de producción
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
                HOST: '127.0.0.1'
            },

            // Logging estructurado
            error_file: '/var/log/mari-pepa/backend-error.log',
            out_file: '/var/log/mari-pepa/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
            merge_logs: true,

            // Backoff exponencial en reinicios
            exp_backoff_restart_delay: 100
        },

        // ============================================
        // FRONTEND (Next.js SSR)
        // ============================================
        {
            name: 'mari-pepa-frontend',
            cwd: './frontend',
            script: 'server.js',

            // Fork mode (más fiable con custom server.js + process.send('ready'))
            instances: 1,
            exec_mode: 'fork',

            // Auto-restart
            autorestart: true,
            watch: false,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Límites de memoria
            max_memory_restart: '512M',

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 15000,

            // Entorno de producción
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                NEXT_TELEMETRY_DISABLED: '1'
            },

            // Logging
            error_file: '/var/log/mari-pepa/frontend-error.log',
            out_file: '/var/log/mari-pepa/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
            merge_logs: true,

            // Backoff exponencial en reinicios
            exp_backoff_restart_delay: 100
        },

        // ============================================
        // CLOUDFLARE TUNNEL
        // ============================================
        {
            name: 'mari-pepa-tunnel',
            script: '/usr/local/bin/cloudflared',
            args: 'tunnel --config /home/gmp/.cloudflared/config-mari-pepa.yml run',
            interpreter: 'none',

            // Fork mode (proceso único)
            instances: 1,
            exec_mode: 'fork',

            // Auto-restart
            autorestart: true,
            watch: false,
            max_restarts: 20,
            min_uptime: '30s',
            restart_delay: 5000,

            // No necesita wait_ready (cloudflared gestiona su propia conexión)
            wait_ready: false,

            // Logging
            error_file: '/var/log/mari-pepa/tunnel-error.log',
            out_file: '/var/log/mari-pepa/tunnel-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
            merge_logs: true,

            exp_backoff_restart_delay: 1000
        }
    ],

    // ============================================
    // DEPLOY CONFIGURATION
    // ============================================
    deploy: {
        production: {
            user: 'gmp',
            host: ['192.168.1.230'],
            ref: 'origin/main',
            repo: 'https://github.com/jlp717/granja_mari_pepa.git',
            path: '/var/www/mari-pepa',
            'post-deploy': 'bash deploy/scripts/post-deploy.sh'
        }
    }
};
