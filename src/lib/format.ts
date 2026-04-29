export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatDateTime = (date: string | Date) =>
  new Date(date).toLocaleString("sr-Latn-RS");
