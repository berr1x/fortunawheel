import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../services/prisma.service';

/**
 * Конфигурация для AdminJS админ-панели
 * Настраивает интерфейс для управления данными через веб-интерфейс
 * 
 * @param prismaService - Сервис для работы с базой данных
 * @param configService - Сервис для работы с конфигурацией
 * @returns Конфигурация AdminJS
 */
export const createAdminConfig = async (prismaService: PrismaService, configService: ConfigService) => {
  // Динамический импорт AdminJS и Prisma адаптера
  const AdminJS = (await import('adminjs')).default;
  const { Database, Resource } = await import('@adminjs/prisma');
  AdminJS.registerAdapter({ Database, Resource });

  return {
    // Основные настройки AdminJS
    adminJsOptions: {
      rootPath: '/admin', // URL путь для админ-панели
      
      // Настройка ресурсов (таблиц) для управления
      resources: [
        {
          // Управление пользователями
          resource: { model: prismaService.users, client: prismaService },
          options: {
            listProperties: ['id', 'email', 'created_at'],     // Поля для отображения в списке
            editProperties: ['email'],                         // Поля доступные для редактирования
            filterProperties: ['email'],                       // Поля для фильтрации
          },
        },
        {
          // Управление покупками (интеграция с Tilda)
          resource: { model: prismaService.purchases, client: prismaService },
          options: {
            listProperties: ['id', 'order_id', 'amount', 'spins_earned', 'customer_email', 'created_at'],
            editProperties: ['order_id', 'amount', 'spins_earned', 'customer_email'],
            filterProperties: ['order_id', 'customer_email'],
          },
        },
        {
          // Управление призами
          resource: { model: prismaService.prizes, client: prismaService },
          options: {
            listProperties: ['id', 'name', 'total_quantity', 'quantity_remaining', 'type'],
            editProperties: ['name', 'total_quantity', 'quantity_remaining', 'type'],
            filterProperties: ['name', 'type'],
          },
        },
        {
          // Управление сессиями прокрутки колеса
          resource: { model: prismaService.spin_sessions, client: prismaService },
          options: {
            listProperties: ['id', 'spins_total', 'spins_used', 'is_active', 'created_at'],
            editProperties: ['spins_total', 'spins_used', 'is_active'],
          },
        },
        {
          // Управление результатами прокруток
          resource: { model: prismaService.spin_results, client: prismaService },
          options: {
            listProperties: ['id', 'status', 'created_at'],
            editProperties: ['status'],
            filterProperties: ['status'],
          },
        },
        {
          // Управление очередью email
          resource: { model: prismaService.email_queue, client: prismaService },
          options: {
            listProperties: ['id', 'subject', 'is_sent', 'send_after', 'sent_at'],
            editProperties: ['subject', 'body', 'is_sent'],
            filterProperties: ['is_sent'],
          },
        },
      ],
    },
    
    // Настройки аутентификации для админ-панели
    auth: {
      // Функция проверки логина и пароля администратора
      authenticate: async (email: string, password: string) => {
        const adminEmail = configService.get('ADMIN_EMAIL');
        const adminPassword = configService.get('ADMIN_PASSWORD');
        
        if (email === adminEmail && password === adminPassword) {
          return { email: adminEmail };
        }
        return null;
      },
      cookieName: 'adminjs',
      cookiePassword: configService.get('JWT_SECRET', 'admin-secret'),
    },
    
    // Настройки сессий
    sessionOptions: {
      resave: true,
      saveUninitialized: true,
      secret: configService.get('JWT_SECRET', 'admin-secret'),
    },
  };
};