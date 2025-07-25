
function validateEmail(email) {
  const emailRegex = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/';
  return passwordRegex.test(password);
}

module.exports = { validateEmail, validatePassword };