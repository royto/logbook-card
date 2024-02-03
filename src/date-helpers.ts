export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const DEFAULT_HOURS_TO_SHOW: number = 5 * 24;

export const calculateStartDate = (hoursToShow = DEFAULT_HOURS_TO_SHOW): Date => {
  return new Date(new Date().setHours(new Date().getHours() - hoursToShow));
};

export const dayToHours = (nbOfDays: number): number => nbOfDays * 24;
