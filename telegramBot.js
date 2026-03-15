bot.command('webapp', (ctx) => {
  ctx.reply('Открой приложение внутри Telegram:', {
    reply_markup: {
      inline_keyboard: [[{
        text: 'Открыть Web App',
        web_app: { url: 'https://ВАШ_ДОМЕН/iphone-app/index.html' }
      }]]
    }
  });
});
bot.command('open_app', (ctx) => {
  ctx.reply('Открой приложение для создания айфона: http://localhost:8000/iphone-app/index.html');
});
const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
// const CHANNEL_USERNAME = 'cfffcffii'; // username канала без @

bot.start((ctx) => ctx.reply('Привет! Я бот, который может создать айфон. Используй команду /create_iphone.'));

bot.command('create_iphone', (ctx) => {
  ctx.reply('Поздравляю! Ты виртуально создал айфон 📱');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
