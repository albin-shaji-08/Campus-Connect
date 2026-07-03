// Utilities for formatting and converting dates for inputs and display
export function toInputValue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  // convert to local datetime-local string: YYYY-MM-DDTHH:mm
  const tzOffset = d.getTimezoneOffset() * 60000; // offset in ms
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

export function formatEventShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatEventLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
