const { Telegraf } = require('telegraf');
const mongoStore = require('./mongoStore');
const admin = require('./admin');
require('dotenv').config();
// Подключение к MongoDB
mongoStore.connect().then(() => {
  console.log('MongoDB connected');
});
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
let currentUsers = {};
let loginSteps = {};

// Главное меню с кнопками
const mainMenu = {
  reply_markup: {
    keyboard: [
      ['Регистрация', 'Вход', 'Профиль'],
      ['Статистика', 'Начать чат', 'Остановить поиск'],
      ['Остановить диалог', 'Админ-панель']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

const authMenu = {
  reply_markup: {
    keyboard: [
      ['Регистрация', 'Вход']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

bot.start((ctx) => {
  ctx.reply('Бот прекратил свою деятельность 15 марта 2026 года.', {
    reply_markup: {
      remove_keyboard: true
    }
  });
});

// Регистрация
const registrationSteps = {};
bot.on('text', async (ctx) => {
    // Остановить диалог
    if (text === 'Остановить диалог') {
      let username = currentUsers[ctx.from.id];
      if (!username) {
        ctx.reply('Сначала выполните вход или регистрацию.', mainMenu);
        return;
      }
      // Сбросить chatting у себя
      await mongoStore.stopChat(username);
      // Сбросить chatting у собеседника
      const user = await mongoStore.users.findOne({ username });
      if (user && user.chatting) {
        // Найти партнера
        const partner = await mongoStore.users.findOne({ chatting: true, username: { $ne: username } });
        if (partner) {
          await mongoStore.stopChat(partner.username);
        }
      }
      ctx.reply('Диалог остановлен.', mainMenu);
      return;
    }
  const text = ctx.message.text;
  // Профиль
  if (text === 'Профиль') {
    let username = currentUsers[ctx.from.id];
    if (!username) {
      ctx.reply('Сначала выполните вход или регистрацию.', mainMenu);
      return;
    }
    const user = await mongoStore.users.findOne({ username });
    if (!user) {
      ctx.reply('Пользователь не найден.', mainMenu);
      return;
    }
    let vip = user.rating && user.rating >= 10 ? ' 👑 VIP' : '';
    ctx.reply(`Профиль:\nЛогин: ${user.username}\nВозраст: ${user.age}\nПол: ${user.gender || 'не указан'}\nРейтинг: ${user.rating || 0}${vip}`, mainMenu);
    return;
  }
  // ...existing code...
  const userId = ctx.from.id;
  if (registrationSteps[userId]) {
    const step = registrationSteps[userId].step;
    if (step === 1) {
      registrationSteps[userId].username = text;
      registrationSteps[userId].step = 2;
      return ctx.reply('Введите пароль:');
    }
    if (step === 2) {
      registrationSteps[userId].password = text;
      registrationSteps[userId].step = 3;
      return ctx.reply('Введите возраст (18-99):');
    }
    if (step === 3) {
      const age = parseInt(text);
      if (isNaN(age) || age < 18 || age > 99) {
        return ctx.reply('Возраст должен быть от 18 до 99. Введите возраст:');
      }
      registrationSteps[userId].age = age;
      registrationSteps[userId].step = 4;
      return ctx.reply('Укажите пол (мужской/женский):');
    }
    if (step === 4) {
      const gender = text.toLowerCase();
      if (gender !== 'мужской' && gender !== 'женский') {
        return ctx.reply('Пол должен быть "мужской" или "женский". Введите пол:');
      }
      const { username, password, age } = registrationSteps[userId];
      // Добавить id пользователя
      const result = await mongoStore.registerUser(username, password, age, gender, 'user', userId);
      delete registrationSteps[userId];
      if (result.error) {
        return ctx.reply('Ошибка регистрации: ' + result.error, mainMenu);
      }
      return ctx.reply('Регистрация успешна!', mainMenu);
    }
  }
  // Вход
  if (loginSteps && loginSteps[userId]) {
    const step = loginSteps[userId].step;
    if (step === 1) {
      loginSteps[userId].username = text;
      loginSteps[userId].step = 2;
      return ctx.reply('Введите пароль:');
    }
    if (step === 2) {
      const username = loginSteps[userId].username;
      const password = text;
      const result = await mongoStore.loginUser(username, password);
      delete loginSteps[userId];
      if (result.error) {
        return ctx.reply('Ошибка входа: ' + result.error, mainMenu);
      }
      currentUsers[userId] = username;
      ctx.reply('Вход успешен!', mainMenu);
      return;
    }
  }
  // Регистрация
  if (text === 'Регистрация') {
    registrationSteps[userId] = { step: 1 };
    return ctx.reply('Введите логин:');
  }
  // Вход
  if (text === 'Вход') {
    loginSteps[userId] = { step: 1 };
    return ctx.reply('Введите логин:');
  }
  // Вход
  if (text === 'Вход') {
    ctx.reply('Функция входа пока не реализована.', mainMenu);
    return;
  }
  // Статистика
  if (text === 'Статистика') {
    const stats = await mongoStore.getStats();
    ctx.reply(`Всего пользователей: ${stats.total}\nСейчас общаются: ${stats.chatting}`, mainMenu);
    return;
  }
  // Начать чат
  if (text === 'Начать чат') {
    let username = currentUsers[ctx.from.id];
    if (!username) {
      ctx.reply('Сначала выполните вход или регистрацию.', mainMenu);
      return;
    }
    let result;
    let attempts = 0;
    while (attempts < 10) {
      result = await mongoStore.findPartner(username);
      if (!result.error) break;
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }
    if (result.error) {
      ctx.reply('Ошибка: ' + result.error + '\nПопробуйте позже.', mainMenu);
      return;
    }
    const partner = await mongoStore.users.findOne({ username: result.partner });
    let vip = partner.rating && partner.rating >= 10 ? ' 👑 VIP' : '';
    ctx.reply(`Вы подключены к собеседнику: ${partner.username}\nВозраст: ${partner.age}\nПол: ${partner.gender || 'не указан'}\nРейтинг: ${partner.rating || 0}${vip}`, mainMenu);
    if (result.partnerId) {
      try {
        await bot.telegram.sendMessage(result.partnerId, `Вы подключены к собеседнику: ${username}`);
      } catch (e) {}
    }
    return;
  }
  // Админ-панель
  if (text === 'Админ-панель') {
    let username = currentUsers[ctx.from.id];
    if (!username || !admin.isAdmin(username)) {
      ctx.reply('Доступ только для администраторов.', mainMenu);
      return;
    }
    const usersArr = await mongoStore.users.find({}).toArray();
    let usersList = usersArr.map(u => {
      let vip = u.rating && u.rating >= 10 ? ' 👑 VIP' : '';
      return `${u.username} | ${u.age} | ${u.gender || 'не указан'} | Рейтинг: ${u.rating || 0}${vip}`;
    }).join('\n');
    ctx.reply('Список пользователей:\n' + usersList, mainMenu);
    ctx.reply('Чтобы заблокировать пользователя, напишите: Блокировать <логин>', mainMenu);
    return;
  }
  // Блокировка пользователя
  if (text.startsWith('Блокировать ')) {
    let username = currentUsers[ctx.from.id];
    if (!username || !admin.isAdmin(username)) {
      ctx.reply('Доступ только для администраторов.', mainMenu);
      return;
    }
    const toBlock = text.split(' ')[1];
    const user = await mongoStore.users.findOne({ username: toBlock });
    if (!user) {
      ctx.reply('Пользователь не найден.', mainMenu);
      return;
    }
    await mongoStore.users.updateOne({ username: toBlock }, { $set: { blocked: true } });
    ctx.reply(`Пользователь ${toBlock} заблокирован.`, mainMenu);
    return;
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
