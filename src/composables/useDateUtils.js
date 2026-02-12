/**
 * Возвращает отформатированную дату.
 * @param {string | Date} date - Дата в виде строки или объекта Date.
 * @param {Intl.DateTimeFormatOptions} options - Опции форматирования.
 * @returns {string} - Отформатированная строка.
 */
export function useFormatDate() {
  const formatDate = (date, options) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('ru-RU', options).format(dateObj);
    } catch (e) {
      console.error('Invalid date for formatting:', date);
      return 'Неверная дата';
    }
  };

  /**
   * Форматирует дату в виде "17 сентября 2025"
   */
  const toLongDate = (date) => formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' });

  /**
   * Форматирует дату в виде "17.09.2025"
   */
  const toShortDate = (date) => formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  /**
   * Форматирует дату и время в виде "17 сентября 2025 г., 12:30"
   */
  const toDateTime = (date) => formatDate(date, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    formatDate,
    toLongDate,
    toShortDate,
    toDateTime
  };
}