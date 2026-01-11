export const formatCurrencyVND = (value) => {
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDateTimeVN = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN')}`;
};
