export function generatePeriodNumber(timeSlot, sequence) {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeCode = timeSlot === "30s" ? "30" : timeSlot === "1min" ? "60" : "180";
  const seqStr = sequence.toString().padStart(4, '0');
  return `${dateStr}-${timeCode}-${seqStr}`;
}
