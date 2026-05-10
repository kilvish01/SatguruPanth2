export const sanitizeText = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const sanitizeForUrl = (input: string): string => {
  return encodeURIComponent(sanitizeText(input));
};

export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return { valid: false, error: 'Phone number required' };
  if (cleaned.length !== 10) return { valid: false, error: 'Phone must be 10 digits' };
  if (!/^[6-9]/.test(cleaned)) return { valid: false, error: 'Invalid phone number' };
  return { valid: true };
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) return { valid: false, error: 'Email required' };
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email)) return { valid: false, error: 'Invalid email format' };
  if (email.length > 254) return { valid: false, error: 'Email too long' };
  return { valid: true };
};

export const validatePin = (pin: string): { valid: boolean; error?: string } => {
  const cleaned = pin.replace(/\D/g, '');
  if (cleaned.length !== 6) return { valid: false, error: 'PIN must be 6 digits' };
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length < 2) return { valid: false, error: 'Name too short' };
  if (name.length > 100) return { valid: false, error: 'Name too long' };
  if (!/^[a-zA-Z\s.'-]+$/.test(name)) return { valid: false, error: 'Invalid characters in name' };
  return { valid: true };
};

export const validateOtp = (otp: string): { valid: boolean; error?: string } => {
  const cleaned = otp.replace(/\D/g, '');
  if (cleaned.length !== 6) return { valid: false, error: 'OTP must be 6 digits' };
  return { valid: true };
};
