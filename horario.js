// =====================================
// CONFIGURACIÓN (desde config.json)
// =====================================
let SCHEDULE_APPS_SCRIPT_URL = "";
let BUSINESS_TIMEZONE = "America/Bogota"; // Valor predeterminado de seguridad
window.tiendaAbierta = false;

// =====================================
// UTILIDADES
// =====================================
function safeGetField(item, keyName) {
  const keysToTry = [];
  keysToTry.push(keyName);
  keysToTry.push(keyName.replace(/\s/g, "_"));
  keysToTry.push(
    keyName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s/g, "_")
  );

  const normalized = keyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  keysToTry.push(normalized);
  keysToTry.push(normalized.replace(/ /g, "_"));
  keysToTry.push(normalized.replace(/ /g, ""));
  keysToTry.push(keyName.replace(/ /g, "_"));
  const uniqueKeys = [...new Set(keysToTry)];

  for (const key of uniqueKeys) {
    if (item.hasOwnProperty(key)) return item[key];
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (item.hasOwnProperty(capitalizedKey)) return item[capitalizedKey];
  }
  return null;
}

function parseHour(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    const hh = Math.floor(value);
    const mm = Math.round((value - hh) * 60);
    return { h: hh, m: mm };
  }
  const s = String(value || "").trim();
  if (s.length === 0) return null;
  const match = s.match(/^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?$/);
  if (match) {
    return { h: parseInt(match[1]), m: parseInt(match[2] || "0") };
  }
  return null;
}

function normalizeDayName(text) {
  const input = String(text || "").trim();
  if (input.length === 0) return "";
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const mapping = {
    domingo: "Domingo",
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
  };
  return mapping[normalized] || "";
}

// =====================================
// CARGAR DESDE GOOGLE SHEETS
// =====================================
async function loadSchedule() {
  try {
    const header = document.getElementById("status-header");
    if (header) {
      header.textContent = "Cargando horario...";
      header.style.background = "#e67e22";
      document.getElementById("status-subtext").textContent = "";
    }

    let apiUrl = SCHEDULE_APPS_SCRIPT_URL;
    if (!apiUrl || apiUrl === "TU_URL_DE_APPS_SCRIPT_DEL_HORARIO") {
      setClosed("ERROR", "Fallo de configuración de URL.");
      return;
    }

    const res = await fetch(apiUrl, {
      cache: "no-cache",
      headers: { Accept: "application/json" },
    });

    if (!res.ok)
      throw new Error(`Fallo en la petición (Código: ${res.status}).`);

    const apiResponse = await res.json();

    if (apiResponse.status !== "success" || !Array.isArray(apiResponse.data)) {
      throw new Error("Respuesta de API inválida o incompleta.");
    }

    const schedule = apiResponse.data
      .map((item) => {
        const apiDayValue = safeGetField(item, "Día");
        const normalizedDay = normalizeDayName(apiDayValue);

        const rawEstado = safeGetField(item, "Estado");
        const isTrue = String(rawEstado || "FALSE").toLowerCase() === "true";

        const rawNextDayFlag = safeGetField(item, "Día Siguiente");
        const closesNextDay =
          String(rawNextDayFlag || "FALSE").toLowerCase() === "true";

        return {
          day: normalizedDay,
          open: parseHour(safeGetField(item, "Hora Inicio")),
          close: parseHour(safeGetField(item, "Hora Fin")),
          estado: isTrue,
          closesNextDay: closesNextDay,
          nextDayCloseTime: parseHour(safeGetField(item, "Hora Día Siguiente")),
        };
      })
      .filter((item) => item.day.length > 0);

    displaySchedule(schedule);
  } catch (err) {
    const el = document.getElementById("status-header");
    if (el) {
      el.textContent =
        "No se pudo cargar el horario, intenta recargar la página.";
      el.style.background = "#e67e22";
      document.getElementById("status-subtext").textContent =
        err.message || "Error desconocido.";
    }
  }
}

// =====================================
// DETERMINAR ESTADO ACTUAL
// =====================================
function displaySchedule(schedule) {
  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const now = new Date();
  const localNow = new Date(now.toLocaleString("en-US",{timeZone: BUSINESS_TIMEZONE}));
  const currentDayIndex = localNow.getDay();
  const currentDay = days[currentDayIndex];

  const today = schedule.find(s => s.day === currentDay);
  const yesterday = schedule.find(s => s.day === days[(currentDayIndex + 6) % 7]); // día anterior

  // --- 1. Revisar si la tienda sigue abierta por el día anterior ---
  if (yesterday && yesterday.estado && yesterday.closesNextDay && yesterday.nextDayCloseTime) {
    const yesterdayClose = new Date(localNow);
    yesterdayClose.setHours(yesterday.nextDayCloseTime.h, yesterday.nextDayCloseTime.m, 0, 0);
    // El cierre del día anterior siempre es el día actual
    if (localNow < yesterdayClose) {
      // La tienda sigue abierta por el cierre del día anterior
      const diffMin = Math.floor((yesterdayClose - localNow) / 60000);
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      const mensaje = diffMin <= 15
        ? `Cerramos pronto a las ${formatTime(yesterday.nextDayCloseTime)}`
        : h >= 1
          ? `Cerramos a las ${formatTime(yesterday.nextDayCloseTime)} (en ${h} h ${m} min)`
          : `Cerramos en ${m} minuto${m !== 1 ? "s" : ""}`;
      setOpen("¡La tienda está abierta!", mensaje);
      window.tiendaAbierta = true;
      return;
    }
  }

  // --- 2. Lógica normal para hoy ---
  if (!today || !today.estado) {
    if (schedule.length === 0) {
      setClosed("CERRADO", "No se encontró información de horario.");
      window.tiendaAbierta = false;
      return;
    }
    const { nextDay, daysUntil } = findNextOpenDay(schedule, currentDayIndex);
    if (nextDay) {
      const msg = daysUntil === 1
        ? `Volvemos mañana a las ${formatTime(nextDay.open)}`
        : `Abrimos el ${nextDay.day.toLowerCase()} a las ${formatTime(nextDay.open)} (${daysUntil} día${daysUntil>1?"s":""})`;
      setClosed("Hoy la tienda no abre", msg);
    } else {
      setClosed("Cerrado temporalmente", "No hay próximos horarios disponibles.");
    }
    window.tiendaAbierta = false;
    return;
  }

  if (!today.open || !today.close) {
    setClosed("CERRADO", "Horario inválido para el día de hoy.");
    window.tiendaAbierta = false;
    return;
  }

  const open = new Date(localNow);
  open.setHours(today.open.h, today.open.m, 0, 0);

  let close = new Date(localNow);
  let displayedCloseTime = today.close;

  if (today.closesNextDay && today.nextDayCloseTime) {
    close.setHours(today.nextDayCloseTime.h, today.nextDayCloseTime.m, 0, 0);
    close.setDate(close.getDate() + 1);
    displayedCloseTime = today.nextDayCloseTime;
  } else {
    close.setHours(today.close.h, today.close.m, 0, 0);
    if (close <= open) close.setDate(close.getDate()+1);
  }

  if (localNow >= open && localNow < close) {
    const diffMin = Math.floor((close - localNow)/60000);
    const h = Math.floor(diffMin/60);
    const m = diffMin % 60;
    const mensaje = diffMin <= 15
      ? `Cerramos pronto a las ${formatTime(displayedCloseTime)}`
      : h >= 1
        ? `Cerramos a las ${formatTime(displayedCloseTime)} (en ${h} h ${m} min)`
        : `Cerramos en ${m} minuto${m !== 1?"s":""}`;
    setOpen("¡La tienda está abierta!", mensaje);
    window.tiendaAbierta = true;
    return;
  }

  if (localNow < open) {
    const diffMin = Math.floor((open - localNow)/60000);
    const h = Math.floor(diffMin/60);
    const m = diffMin % 60;
    const msg = h>0 ? `Abrimos hoy a las ${formatTime(today.open)} (en ${h} h ${m} min)` : `Abrimos en ${m} minuto${m!==1?"s":""}`;
    setClosed("Aún no abrimos", msg);
    window.tiendaAbierta = false;
    return;
  }

  const { nextDay, daysUntil } = findNextOpenDay(schedule, currentDayIndex);
  if (nextDay) {
    const msg = daysUntil === 1
      ? `Volvemos mañana a las ${formatTime(nextDay.open)}`
      : `Abrimos el ${nextDay.day.toLowerCase()} a las ${formatTime(nextDay.open)} (${daysUntil} día${daysUntil>1?"s":""})`;
    setClosed("Cerramos por hoy", msg);
  } else {
    setClosed("Cerramos por hoy", "No hay próximos horarios disponibles.");
  }
  window.tiendaAbierta = false;
}


function findNextOpenDay(schedule, currentIndex) {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  for (let i = 1; i <= 7; i++) {
    const nextIndex = (currentIndex + i) % 7;
    const next = schedule.find((s) => s.day === days[nextIndex]);
    if (next && next.estado) {
      return { nextDay: next, daysUntil: i };
    }
  }
  return { nextDay: null, daysUntil: null };
}

function formatTime({ h, m }) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// =====================================
// VISUALIZACIÓN
// =====================================
function setOpen(title, subtitle = "") {
  const header = document.getElementById("status-header");
  const sub = document.getElementById("status-subtext");
  if (!header) return;
  header.style.background = "#27ae27";
  header.style.color = "#fff";
  header.textContent = title;
  if (sub) sub.textContent = subtitle;
}

function setClosed(title, subtitle = "") {
  const header = document.getElementById("status-header");
  const sub = document.getElementById("status-subtext");
  if (!header) return;
  header.style.background = "#e74c3c";
  header.style.color = "#fff";
  header.textContent = title;
  if (sub) sub.textContent = subtitle;
}

// =====================================
// AUTOEJECUCIÓN Y REFRESCO
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("configCargado", (e) => {
    const config = e.detail;

    if (config?.apiUrls?.horario) {
      SCHEDULE_APPS_SCRIPT_URL = config.apiUrls.horario;
    }
    if (config?.configuracionHorario?.timezone) {
      BUSINESS_TIMEZONE = config.configuracionHorario.timezone;
    }

    loadSchedule();
  });
});
