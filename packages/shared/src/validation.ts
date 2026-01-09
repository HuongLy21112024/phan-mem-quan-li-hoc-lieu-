export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 số');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)');
  }

  return { valid: errors.length === 0, errors };
}

export function isValidCampus(campus: string): boolean {
  return ['hanoi', 'danang', 'hcm'].includes(campus);
}

export function isValidRole(role: string): boolean {
  return ['admin', 'lecturer', 'student'].includes(role);
}

export function isValidMaterialType(type: string): boolean {
  return ['slide', 'video', 'document', 'quiz', 'assignment'].includes(type);
}

export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .trim();
}

export function validatePagination(page?: number, limit?: number) {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(100, Math.max(1, limit || 10));
  
  return { page: validPage, limit: validLimit };
}
