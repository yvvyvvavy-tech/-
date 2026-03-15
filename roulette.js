// roulette.js
// Логика чат-рулетки

const { users } = require('./userStore');

function findPartner(username) {
  const user = users.find(u => u.username === username);
  if (!user) return { error: 'Пользователь не найден' };
  let partner;
  if (user.role === 'collector') {
    partner = users.find(u => u.chatting === false && u.username !== username && u.role !== 'collector');
  } else {
    partner = users.find(u => u.chatting === false && u.username !== username);
  }
  if (!partner) return { error: 'Нет доступных пользователей' };
  user.chatting = true;
  partner.chatting = true;
  return { success: true, partner: partner.username, partnerId: partner.id };
}

module.exports = { findPartner };
