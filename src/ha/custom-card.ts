/* eslint-disable @typescript-eslint/no-explicit-any */
export const addCustomCard = (type: string, name: string, description: string): void => {
  // Puts card into the UI card picker dialog
  (window as any).customCards = (window as any).customCards || [];
  (window as any).customCards.push({
    type,
    name,
    preview: true,
    description,
  });
};
