module.exports = {
  apps: [{
    name: 'fortuna',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Логирование
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Автоматический перезапуск
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Настройки памяти
    max_memory_restart: '1G',
    
    // Настройки перезапуска
    min_uptime: '10s',
    max_restarts: 10,
    
    // Настройки кластера
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Переменные окружения
    env_file: '.env'
  }]
};