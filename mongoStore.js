// mongoStore.js
// Хранение пользователей в памяти (без базы данных)

let users = [];

async function connect() {
  // Не требуется для локального хранения
}

async function registerUser(username, password, age, gender, role = 'user', id) {
  if (age < 18 || age > 99) return { error: 'Возраст должен быть от 18 до 99' };
  const exists = users.find(u => u.username === username);
  if (exists) return { error: 'Пользователь уже существует' };
  users.push({ username, password, age, gender, role, chatting: false, rating: 0, vip: false, id });
  return { success: true };
}

async function loginUser(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return { error: 'Неверный логин или пароль' };
  return { success: true, user };
}

async function getStats() {
  const total = users.length;
  const chatting = users.filter(u => u.chatting).length;
  return { total, chatting };
}

async function findPartner(username) {
  const user = users.find(u => u.username === username);
  if (!user) return { error: 'Пользователь не найден' };
  if (user.chatting) return { error: 'Вы уже в диалоге. Остановите диалог.' };
  let partner = users.find(u => !u.chatting && u.username !== username && (user.role === 'collector' ? u.role !== 'collector' : true));
  if (!partner) return { error: 'Нет доступных пользователей' };
  partner.chatting = true;
  partner.partnerId = user.id;
  user.chatting = true;
  user.partnerId = partner.id;
  return { success: true, partner: partner.username, partnerId: partner.id };
}

async function stopChat(username) {
  const user = users.find(u => u.username === username);
  if (user) {
    user.chatting = false;
    user.partnerId = null;
  }
  // Сбросить у партнера
  const partner = users.find(u => u.partnerId === user?.id);
  if (partner) {
    partner.chatting = false;
    partner.partnerId = null;
  }
}

module.exports = { connect, registerUser, loginUser, getStats, findPartner, stopChat, users };