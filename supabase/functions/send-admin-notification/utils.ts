export const dateOnlyOptions: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "EAT",
};

export const dateTimeOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "EAT",
  timeZoneName: "short",
};

export const timeOnlyOptions: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "EAT",
};

export function calculateAge(birthDateString: string | null): string {
  if (!birthDateString) return "N/A";
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  } catch {
    return "N/A";
  }
}

export function formatPhoneNumberE164(
  phoneNumber: string | null | undefined
): string | null {
  if (!phoneNumber || phoneNumber.trim() === "") return null;
  const trimmedNumber = phoneNumber.trim().replace(/\s/g, "");
  if (trimmedNumber.startsWith("+")) return trimmedNumber;
  return `+${trimmedNumber}`;
}
