// Custom alarm tone for Al-Khal reminders (stored as a data URL in LocalStorage)
const TONE_KEY = "madar-reminder-tone";
const TONE_NAME_KEY = "madar-reminder-tone-name";

export const getReminderTone = (): string | null => {
  try {
    return localStorage.getItem(TONE_KEY);
  } catch {
    return null;
  }
};

export const getReminderToneName = (): string | null => {
  try {
    return localStorage.getItem(TONE_NAME_KEY);
  } catch {
    return null;
  }
};

export const setReminderTone = (dataUrl: string, name: string) => {
  localStorage.setItem(TONE_KEY, dataUrl);
  localStorage.setItem(TONE_NAME_KEY, name);
  window.dispatchEvent(new CustomEvent("madar:tone-changed"));
};

export const clearReminderTone = () => {
  localStorage.removeItem(TONE_KEY);
  localStorage.removeItem(TONE_NAME_KEY);
  window.dispatchEvent(new CustomEvent("madar:tone-changed"));
};

/** Max ~2MB audio file (base64 inflates ~33%, LocalStorage caps around 5MB). */
export const MAX_TONE_BYTES = 2 * 1024 * 1024;
