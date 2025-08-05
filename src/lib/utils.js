import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export const getAvatarEmoji = (avatarId) => {
  const emojiMap = {
    'avatar-1': '👨🏻', 'avatar-2': '👩🏻', 'avatar-3': '👨🏽', 'avatar-4': '👩🏽',
    'avatar-5': '👨🏿', 'avatar-6': '👩🏿', 'avatar-7': '👦🏻', 'avatar-8': '👧🏽',
    'avatar-9': '👨🏿‍🦱', 'avatar-10': '👩🏿‍🦱', 'avatar-11': '👨🏽‍🦲', 'avatar-12': '👩🏿‍🦲'
  };
  return emojiMap[avatarId] || '👤';
};