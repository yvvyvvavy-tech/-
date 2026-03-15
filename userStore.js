// userStore.js
// Хранение пользователей, регистрация, авторизация

const users = [];
// Добавить пользователя admin
users.push({ username: 'admin', password: 'admin123', age: 30, gender: 'мужской', role: 'admin', chatting: false, rating: 0, vip: false, id: 0 });

function registerUser(username, password, age, gender, role = 'user', id) {
  if (age < 18 || age > 99) return { error: 'Возраст должен быть от 18 до 99' };
  if (users.find(u => u.username === username)) return { error: 'Пользователь уже существует' };
  users.push({ username, password, age, gender, role, chatting: false, rating: 0, vip: false, id });
  return { success: true };
}

function loginUser(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return { error: 'Неверный логин или пароль' };
  return { success: true, user };
}

function getStats() {
  return {
    total: users.length,
    chatting: users.filter(u => u.chatting).length
  };
}

module.exports = { registerUser, loginUser, getStats, users };
