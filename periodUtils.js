// periodUtils.js

// Function to get start time of the current time slot based on interval
export const getSlotStartTime = (interval) => {
  const now = new Date();

  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  let totalSeconds = minutes * 60 + seconds;

  // Slot duration in seconds
  let slotDuration = 60; // default 1 minute

  if (interval === 30) {
    slotDuration = 30;
  } else if (interval === 60) {
    slotDuration = 60;
  } else if (interval === 180) {
    slotDuration = 180;
  }

  const slotIndex = Math.floor(totalSeconds / slotDuration);
  const slotStartSeconds = slotIndex * slotDuration;

  const slotStart = new Date(now);
  slotStart.setMinutes(0);
  slotStart.setSeconds(0);
  slotStart.setMilliseconds(0);
  slotStart.setSeconds(slotStartSeconds);

  return slotStart;
};

// Function to generate period number: YYYYMMDD-XXXX
export const generatePeriodNumber = (interval) => {
  const now = new Date();
  const datePart = now.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

  const slotStart = getSlotStartTime(interval);
  const totalSeconds =
    slotStart.getHours() * 3600 +
    slotStart.getMinutes() * 60 +
    slotStart.getSeconds();

  const slotDuration = interval;
  const periodIndex = Math.floor(totalSeconds / slotDuration) + 1;

  const sequence = String(periodIndex).padStart(4, "0");
  return `${datePart}-${sequence}`;
};
