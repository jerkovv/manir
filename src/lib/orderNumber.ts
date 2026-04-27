const ORDER_NUMBER_START = 5100;
const LEGACY_ORDER_OFFSET = ORDER_NUMBER_START - 1;

export function displayOrderNumber(orderNumber: number | string | null | undefined): string {
  const value = Number(orderNumber);
  if (!Number.isFinite(value) || value <= 0) return "";

  const normalized = Math.trunc(value);
  return String(normalized >= ORDER_NUMBER_START ? normalized : normalized + LEGACY_ORDER_OFFSET);
}