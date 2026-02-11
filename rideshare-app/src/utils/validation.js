/**
 * Validation Utilities
 * 
 * Shared validation functions for forms throughout the app.
 */

const emailLooksValid = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  
  const isUcsbEmail = (email) => 
    email.trim().toLowerCase().endsWith("@ucsb.edu");
  
  const digitsOnly = (s) => s.replace(/[^\d]/g, "");
  
  const formatPhone = (value) => {
    const d = value.replace(/\D/g, "").slice(0, 10);
    const len = d.length;
  
    if (len === 0) return "";
    if (len < 4) return `(${d}`;
    if (len < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };
  
  const passwordHasMinLength = (password) => password.trim().length >= 8;
  
  const passwordHasSpecial = (password) => 
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  const passwordHasUppercase = (password) => /[A-Z]/.test(password);
  
  const isValidPhone = (phone) => digitsOnly(phone).length === 10;
  
  module.exports = {
    emailLooksValid,
    isUcsbEmail,
    digitsOnly,
    formatPhone,
    passwordHasMinLength,
    passwordHasSpecial,
    passwordHasUppercase,
    isValidPhone,
  };