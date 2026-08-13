// Mirrors website/src/utils/riyadhTime.ts exactly — this app is Saudi-only,
// so every booking date/time must be anchored to Asia/Riyadh regardless of
// the device's own timezone, and must match the website's math bit-for-bit
// since both clients feed the same backend/ERP.

interface RiyadhNow {
  year: number;
  month: number;
  day: number;
  hour: number;
}

export function getRiyadhNow(): RiyadhNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);

  return {year: get('year'), month: get('month'), day: get('day'), hour: get('hour')};
}

function toDateString({year, month, day}: {year: number; month: number; day: number}): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getRiyadhDateStrings(count = 7): string[] {
  const {year, month, day} = getRiyadhNow();
  // Anchor at Riyadh's current calendar day (as a UTC-based Date used only
  // for day-increment arithmetic — Riyadh has no DST, so a flat day loop is safe).
  const base = new Date(Date.UTC(year, month - 1, day));

  return Array.from({length: count}, (_, index) => {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() + index);
    return toDateString({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    });
  });
}

export function isRiyadhSlotDisabled(dateStr: string, startHour: number): boolean {
  const riyadhNow = getRiyadhNow();
  const todayStr = toDateString(riyadhNow);
  return dateStr === todayStr && startHour <= riyadhNow.hour;
}

const RIYADH_UTC_OFFSET_HOURS = 3;

// Riyadh has no DST, so a fixed UTC+3 offset always holds. `dateStr` is the
// calendar day the customer picked (Riyadh-local); `startHour` is the slot's
// Riyadh-local start hour — subtracting the offset yields the correct UTC instant.
export function toRiyadhISOString(dateStr: string, startHour: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, startHour - RIYADH_UTC_OFFSET_HOURS)).toISOString();
}
