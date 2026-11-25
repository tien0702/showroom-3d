export const uid = (prefix = 'i') => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
