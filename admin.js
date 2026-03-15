// admin.js
// Функции администратора

const { users } = require('./userStore');

function isAdmin(username) {
  return ['admin', '1', '2', '3'].includes(username);
}

function getAllUsers() {
  return users;
}

module.exports = { isAdmin, getAllUsers };
