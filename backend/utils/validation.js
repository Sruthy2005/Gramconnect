const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePhone = (phone) => {
  const re = /^\d{10}$/;
  return re.test(phone);
};

const validatePasswordStrength = (password) => {
  return password && password.length >= 8;
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePasswordStrength
};
