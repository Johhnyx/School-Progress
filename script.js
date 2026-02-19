document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const toDays = (ms) => ms / (1000 * 60 * 60 * 24);

  function parseLocalDate(isoDate, endOfDay = false) {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (endOfDay) dt.setHours(23, 59, 59, 999);
    else dt.setHours(0, 0, 0, 0);
    return dt;
  }

  // První pondělí v daném měsíci (monthIndex: 0=leden ... 11=prosinec)
  function firstMondayOfMonth(year, monthIndex) {
    const d = new Date(year, monthIndex, 1);
    const day = d.getDay(); // Ne=0, Po=1, ...
    const daysToMonday = (8 - day) % 7;
    d.setDate(d.getDate() + daysToMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // =========================
  // TÝDEN (jen Po–Pá) + víkend mód
  // =========================
  const dayJs = now.getDay(); // Ne=0, Po=1, ... So=6
  const isWeekend = (dayJs === 0 || dayJs === 6);

  const workdayIndex =
    dayJs === 1 ? 0 :
    dayJs === 2 ? 1 :
    dayJs === 3 ? 2 :
    dayJs === 4 ? 3 :
    dayJs === 5 ? 4 : 4; // víkend bereme jako konec týdne

  const timeInDay = (now.getHours() / 24) + (now.getMinutes() / 1440);
  const weekProgress = isWeekend ? 100 : ((workdayIndex + timeInDay) / 5) * 100;

  // =========================
  // MĚSÍC (reálná délka dle kalendáře)
  // =========================
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = ((now.getDate() - 1 + timeInDay) / daysInMonth) * 100;

  // =========================
  // ŠKOLNÍ ROK (co nejpřesněji – pevně pro relevantní roky)
  // =========================
  const SCHOOL_YEARS = [
    { start: "2023-09-04", end: "2024-06-30" },
    { start: "2024-09-02", end: "2025-06-30" },
    { start: "2025-09-01", end: "2026-06-30" },
    { start: "2026-09-01", end: "2027-06-30" },
  ];

  function getCurrentSchoolYearRange(date) {
    for (const y of SCHOOL_YEARS) {
      const s = parseLocalDate(y.start, false);
      const e = parseLocalDate(y.end, true);
      if (date >= s && date <= e) return { start: s, end: e };
    }

    // mezi roky / prázdniny -> vezmi nejbližší další školní rok
    for (let i = 0; i < SCHOOL_YEARS.length - 1; i++) {
      const end = parseLocalDate(SCHOOL_YEARS[i].end, true);
      const nextStart = parseLocalDate(SCHOOL_YEARS[i + 1].start, false);
      if (date > end && date < nextStart) {
        return { start: nextStart, end: parseLocalDate(SCHOOL_YEARS[i + 1].end, true) };
      }
    }

    // fallback
    const last = SCHOOL_YEARS[SCHOOL_YEARS.length - 1];
    return { start: parseLocalDate(last.start, false), end: parseLocalDate(last.end, true) };
  }

  const schoolRange = getCurrentSchoolYearRange(now);
  const yearTotalDays = toDays(schoolRange.end - schoolRange.start);
  const yearPassedDays = toDays(now - schoolRange.start);
  const yearProgress = clamp01(yearPassedDays / yearTotalDays) * 100;

  // =========================
  // CELKEM (4 ročníky dohromady)
  // =========================
  const hsStart = parseLocalDate("2023-09-04", false);
  const hsEnd = parseLocalDate("2027-06-30", true);

  const totalDaysHS = toDays(hsEnd - hsStart);
  const passedDaysHS = toDays(now - hsStart);
  const totalProgress = clamp01(passedDaysHS / totalDaysHS) * 100;

  // =========================
  // MATURITA (orientačně – KVĚTEN 2027)
  // Nastavíme to jako "první pondělí v květnu 2027"
  // =========================
  const maturitaDate = firstMondayOfMonth(2027, 4); // 4 = květen
  maturitaDate.setHours(23, 59, 59, 999);

  const daysUntilMaturita = Math.ceil(toDays(maturitaDate - now));

  // =========================
  // Render
  // =========================
  const setBar = (id, pct) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };

  setBar("week-progress", weekProgress);
  setBar("month-progress", monthProgress);
  setBar("year-progress", yearProgress);
  setBar("total-progress", totalProgress);

  // Týden: víkend mód
  const weekFill = document.getElementById("week-progress");
  const weekLabel = document.getElementById("week-label");

  if (isWeekend) {
    weekFill.classList.add("weekend");
    weekLabel.textContent = "Weekend 😎";
  } else {
    weekFill.classList.remove("weekend");
    weekLabel.textContent = `Týden: ${weekProgress.toFixed(1)}%`;
  }

  document.getElementById("month-label").textContent = `Měsíc: ${monthProgress.toFixed(1)}%`;
  document.getElementById("year-label").textContent = `Školní rok: ${yearProgress.toFixed(1)}%`;
  document.getElementById("total-label").textContent = `Celkem: ${totalProgress.toFixed(1)}%`;

  // Maturita: jen měsíc, ale pořád počítáme dny k "typickému startu" v květnu
  document.getElementById("maturita-label").textContent =
    (daysUntilMaturita >= 0)
      ? `Zbývá ${daysUntilMaturita} dní do maturity`
      : `Maturita už je za tebou (${Math.abs(daysUntilMaturita)} dní zpět).`;
});
