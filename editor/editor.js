// ============================================================================
// 🧩 EDITOR DE CONFIGURACIÓN - TIENDA
// Archivo: editor.js
// Descripción: Editor visual para modificar config.json y descargar cambios.
// ============================================================================

// ============================================================================
// 🔹 VARIABLES GLOBALES
// ============================================================================
let originalConfig = {};
let configModificado = false;

// ============================================================================
// 🚀 INICIALIZACIÓN PRINCIPAL
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("editor-container");
  const btn = document.getElementById("btn-action");

  try {
    const res = await fetch("../config.json");
    if (!res.ok) throw new Error("No se pudo cargar config.json");
    originalConfig = await res.json();
  } catch (err) {
    container.innerHTML = `<p style="color:red;text-align:center;">❌ Error al cargar config.json: ${err.message}</p>`;
    return;
  }

  renderEditor(originalConfig);
  agregarBotonDescargaOriginal();
  actualizarBoton(false);

  // Acción principal del botón
  btn.addEventListener("click", () => {
    if (configModificado) {
      const updatedConfig = collectConfig();
      downloadJSON(updatedConfig, "config_actualizado.json");
    } else {
      alert("✅ Configuración aceptada sin cambios.");
    }
  });

  // 🔁 Monitor de cambios global
  document.addEventListener("input", verificarCambiosReales);
});

// ============================================================================
// 🧱 RENDERIZAR EDITOR COMPLETO
// ============================================================================
function renderEditor(config) {
  const c = document.getElementById("editor-container");
  c.innerHTML = `
    <!-- 🏠 INFORMACIÓN GENERAL -->
    <div id="seccion-general" class="section">
      <h2>🏠 Información General</h2>
      ${renderInput("tituloPagina", config.tituloPagina, "Título de la pestaña")}
      ${renderInput("nombreRestaurante", config.nombreRestaurante, "Nombre del Restaurante")}
      ${renderInput("logo", config.logo, "Logo principal")}
      ${renderInput("footerLogo", config.footerLogo, "Logo del pie de página")}
      ${renderInput("footerQR", config.footerQR, "Código QR del footer")}
      ${renderInput("numeroWhatsAppMensajes", config.numeroWhatsAppMensajes, "WhatsApp de pedidos")}
      ${renderInput("crearTienda", config.crearTienda, "Enlace 'Crear Tienda'")}
    </div>
    
    <!-- 🎨 COLORES -->
    <div id="seccion-colores" class="section">
      <h2>🎨 Colores del Tema</h2>
      <div id="contenedor-colores" class="color-grid">
        ${Object.entries(config.colores || {}).map(([k, v]) =>
          renderColorInput(`color-${k}`, v, k, obtenerDescripcionColor(k))
        ).join('')}
      </div>
    </div>

    <!-- 🍽️ CATEGORÍAS -->
    <div id="seccion-categorias" class="section">
      <h2>🍽️ Categorías del Menú</h2>
      <div id="categorias-container">
        ${(config.categorias || []).map((cat, i) => renderCategoria(cat, i)).join('')}
      </div>
      <button id="btn-agregar-categoria" onclick="addCategory()">➕ Agregar Categoría</button>
    </div>

    <!-- 🌐 REDES -->
    <div id="seccion-redes" class="section">
      <h2>🌐 Redes Sociales</h2>
      ${Object.entries(config.redes || {}).map(([k, v]) =>
        renderInput(`red-${k}`, v, k)
      ).join('')}
    </div>

    <!-- 🏢 SEDE -->
    <div id="seccion-sede" class="section">
      <h2>🏢 Información de la Sede</h2>
      ${renderInput("sede-nombre", config.sede?.nombre, "Nombre")}
      ${renderInput("sede-direccion", config.sede?.direccion, "Dirección")}
      ${renderInput("sede-telefono", config.sede?.telefono, "Teléfono")}
      ${renderInput("sede-lat", config.coordenadasSede?.[0], "Latitud")}
      ${renderInput("sede-lng", config.coordenadasSede?.[1], "Longitud")}
    </div>

    <!-- 🔗 APIs -->
    <div id="seccion-apis" class="section">
      <h2>🔗 Enlaces a APIs</h2>
      ${Object.entries(config.apiUrls || {}).map(([k, v]) =>
        renderInput(`api-${k}`, v, k)
      ).join('')}
    </div>
  `;
}

// ============================================================================
// 🧩 CAMPOS
// ============================================================================
function renderInput(id, value = "", label = "") {
  return `
    <div class="campo">
      <label for="${id}">${label}</label>
      <input id="${id}" value="${value || ""}">
    </div>
  `;
}

function renderColorInput(id, value = "", label = "", descripcion = "") {
  const hexValue = parseColor(value);
  return `
    <div class="color-card">
      <label for="${id}" class="color-label">${label}</label>
      <div class="color-pair">
        <input type="color" id="${id}-picker" value="${hexValue}" onchange="syncColorInput('${id}', this.value)">
        <input type="text" id="${id}" value="${value}" oninput="syncColorPicker('${id}', this.value)">
        <div class="color-preview" id="${id}-preview" style="background:${value};"></div>
      </div>
      ${descripcion ? `<small>${descripcion}</small>` : ""}
    </div>
  `;
}

function syncColorInput(id, color) {
  document.getElementById(id).value = color;
  document.getElementById(id + "-preview").style.background = color;
  verificarCambiosReales();
}

function syncColorPicker(id, value) {
  document.getElementById(id + "-picker").value = parseColor(value);
  document.getElementById(id + "-preview").style.background = value;
  verificarCambiosReales();
}

function parseColor(v) {
  const hex = v.match(/#([0-9A-Fa-f]{6})/);
  return hex ? hex[0] : "#ffffff";
}

function actualizarPreview(id, color) {
  const preview = document.getElementById(id + "-preview");
  if (preview) preview.style.background = color;
}

// ============================================================================
// 🎨 DESCRIPCIÓN DE COLORES
// ============================================================================
function obtenerDescripcionColor(nombre) {
  const map = {
    "--bg-body": "Fondo principal del sitio.",
    "--header": "Encabezado con color o imagen.",
    "--accent": "Color de acento y botones.",
    "--card-bg": "Fondo de las tarjetas de producto.",
    "--bg-skeleton": "Color del efecto de carga.",
    "--bg-start": "Inicio del degradado shimmer.",
    "--bg-end": "Fin del degradado shimmer.",
    "--muted": "Texto o elementos secundarios."
  };
  return map[nombre] || "Variable personalizada.";
}

// ============================================================================
// 🟩 CATEGORÍAS
// ============================================================================
function renderCategoria(cat, i) {
  return `
    <div class="category-row" data-index="${i}">
      <input placeholder="ID" value="${cat.id}">
      <input placeholder="Emoji" value="${cat.emoji}">
      <input placeholder="Nombre" value="${cat.nombre}">
      <button onclick="removeCategory(${i})">✖</button>
    </div>
  `;
}

function addCategory() {
  const c = document.getElementById("categorias-container");
  const div = document.createElement("div");
  div.className = "category-row";
  div.innerHTML = `
    <input placeholder="ID">
    <input placeholder="Emoji">
    <input placeholder="Nombre">
    <button onclick="this.parentElement.remove(); verificarCambiosReales()">✖</button>
  `;
  c.appendChild(div);
  verificarCambiosReales();
}

function removeCategory(i) {
  document.querySelector(`[data-index="${i}"]`)?.remove();
  verificarCambiosReales();
}

// ============================================================================
// 💾 GUARDADO Y DESCARGA
// ============================================================================
function actualizarBoton(cambio) {
  const btn = document.getElementById("btn-action");
  if (cambio) {
    btn.textContent = "💾 Descargar JSON actualizado";
    btn.classList.add("cambios");
  } else {
    btn.textContent = "✅ Aceptar configuración";
    btn.classList.remove("cambios");
  }
}

function collectConfig() {
  const cfg = structuredClone(originalConfig);

  ["tituloPagina","nombreRestaurante","logo","footerLogo","footerQR","crearTienda","numeroWhatsAppMensajes"]
    .forEach(k => cfg[k] = document.getElementById(k)?.value || "");

  cfg.colores = {};
  document.querySelectorAll("[id^='color-']").forEach(el => {
    if (!el.id.endsWith("-picker")) cfg.colores[el.id.replace("color-", "")] = el.value;
  });

  cfg.redes = {};
  document.querySelectorAll("[id^='red-']").forEach(el => cfg.redes[el.id.replace("red-", "")] = el.value);

  // 🧠 API URLs
  cfg.apiUrls = {};
  document.querySelectorAll("[id^='api-']").forEach(el => {
    cfg.apiUrls[el.id.replace("api-", "")] = el.value;
  });


  cfg.categorias = Array.from(document.querySelectorAll(".category-row")).map(r => {
    const [id, emoji, nombre] = r.querySelectorAll("input");
    return { id: id.value, emoji: emoji.value, nombre: nombre.value };
  });

  return cfg;
}

// ============================================================================
// 🧠 DETECTOR DE CAMBIOS REALES + COLOR EN INPUTS
// ============================================================================

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function verificarCambiosReales() {
  const actual = collectConfig();
  configModificado = !deepEqual(actual, originalConfig);
  actualizarBoton(configModificado);

  // Recorre todos los inputs y resalta solo los que cambiaron
  document.querySelectorAll("input").forEach(input => {
    const id = input.id;
    let originalValue = "";

    if (id.startsWith("color-")) {
      originalValue = originalConfig.colores?.[id.replace("color-", "")] || "";
    } else if (id.startsWith("red-")) {
      originalValue = originalConfig.redes?.[id.replace("red-", "")] || "";
    } else if (id.startsWith("api-")) {
      originalValue = originalConfig.apiUrls?.[id.replace("api-", "")] || "";
    } else if (id.startsWith("sede-")) {
      const campo = id.replace("sede-", "");
      originalValue =
        originalConfig.sede?.[campo] ||
        originalConfig.coordenadasSede?.[campo === "lat" ? 0 : 1] ||
        "";
    } else if (
      ["tituloPagina", "nombreRestaurante", "logo", "footerLogo", "footerQR",
       "crearTienda", "numeroWhatsAppMensajes"].includes(id)
    ) {
      originalValue = originalConfig[id] || "";
    } else {
      // Para los inputs de categorías
      const fila = input.closest(".category-row");
      if (fila) {
        const index = parseInt(fila.dataset.index);
        const campo = input.placeholder.toLowerCase();
        const catOriginal = originalConfig.categorias?.[index];
        originalValue = catOriginal ? catOriginal[campo] || "" : "";
      }
    }

    // 🎨 Aplica estilo solo al campo modificado
    if (input.value.trim() !== originalValue.trim()) {
      input.style.backgroundColor = "#ffb040f6";
    } else {
      input.style.outline = "";
      input.style.backgroundColor = "";
    }
  });
}


// ============================================================================
// 🔽 DESCARGA JSONS
// ============================================================================
function downloadJSON(obj, filename = "config.json") {
  const dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
  const a = document.createElement("a");
  a.href = dataStr;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function agregarBotonDescargaOriginal() {
  const btnOriginal = document.createElement("button");
  btnOriginal.textContent = "⬇️ Descargar JSON original";
  btnOriginal.id = "btn-original";
  btnOriginal.style.margin = "1rem auto";
  btnOriginal.style.display = "block";
  btnOriginal.style.background = "#444";
  btnOriginal.style.color = "#fff";
  btnOriginal.style.padding = "0.6rem 1.2rem";
  btnOriginal.style.border = "none";
  btnOriginal.style.borderRadius = "8px";
  btnOriginal.style.cursor = "pointer";
  btnOriginal.style.fontWeight = "600";
  btnOriginal.style.transition = "all 0.25s ease";
  btnOriginal.addEventListener("click", () => downloadJSON(originalConfig, "config_original.json"));

  const container = document.getElementById("editor-container");
  container.parentNode.insertBefore(btnOriginal, container);
}

// ============================================================================
// 🎨 PREVIEW EN VIVO DE COLORES (GENERAL)
// ============================================================================
document.addEventListener("input", e => {
  if (e.target.id?.startsWith("color-")) {
    const id = e.target.id;
    const preview = document.getElementById(id + "-preview");
    if (preview) preview.style.background = e.target.value;
  }
  if (e.target.id?.endsWith("-picker")) {
    const idBase = e.target.id.replace("-picker", "");
    const inputTexto = document.getElementById(idBase);
    const preview = document.getElementById(idBase + "-preview");
    if (inputTexto) inputTexto.value = e.target.value;
    if (preview) preview.style.background = e.target.value;
  }
});
