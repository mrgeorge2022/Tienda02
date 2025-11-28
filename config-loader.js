// ==========================================
// ⚙️ CARGAR CONFIGURACIÓN (LOCAL O REMOTA)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1️⃣ Cargar archivo base local
    const response = await fetch("config.json");
    if (!response.ok) throw new Error("No se pudo cargar config.json");
    const baseConfig = await response.json();

    let config = baseConfig;

    // 2️⃣ Si el JSON contiene una fuente remota, cargar desde el Apps Script
    if (baseConfig.fuenteConfiguracion) {
      try {
        console.log("⏳ Cargando configuración desde Apps Script...");
        const remoteRes = await fetch(baseConfig.fuenteConfiguracion);
        if (remoteRes.ok) {
          config = await remoteRes.json();
          console.log("✅ Configuración cargada desde Apps Script (modo remoto).");
        } else {
          console.warn("⚠️ No se pudo obtener configuración remota, usando config.json local.");
        }
      } catch (err) {
        console.warn("⚠️ Error al conectar con Apps Script, usando config.json local.", err);
      }
    }

    // === 📍 DETECTAR PÁGINA ACTUAL ===
    const path = location.pathname.toLowerCase();

    // === 🏷️ TÍTULO DE PESTAÑA ===
    if (path.includes("domicilio")) {
      document.title = `Domicilio | ${config.nombreRestaurante || "Mi Restaurante"}`;
    } else if (path.includes("factura")) {
      document.title = `Factura | ${config.nombreRestaurante || "Mi Restaurante"}`;
    } else {
      document.title = config.tituloPagina || config.nombreRestaurante || "Mi Tienda";
    }

    // === 🖼️ FAVICON ===
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      favicon.type = "image/png";
      document.head.appendChild(favicon);
    }
    favicon.href = config.favicon || config.logoHeader || config.logo || "img/icono_tienda.png";

    // === 🏠 NOMBRE DEL RESTAURANTE ===
    const headerName = document.querySelector(".header-info h1");
    if (headerName) headerName.textContent = config.nombreRestaurante || "Mi Restaurante";

    // === 🖼️ LOGO DEL HEADER ===
    const headerLogo = document.querySelector(".header-logo");
    if (headerLogo)
      headerLogo.src = config.logoHeader || config.logo || "img/icono_tienda.png";

    // === 🧭 CATEGORÍAS + SECCIONES ===
    if (Array.isArray(config.categorias)) {
      const nav = document.querySelector(".categories");
      const menuContainer = document.querySelector(".menu-sections");

      if (nav) nav.innerHTML = "";
      if (menuContainer) menuContainer.innerHTML = "";

      config.categorias.forEach((cat, index) => {
        const id = cat.id || cat.nombre.toLowerCase().replace(/\s+/g, "-");

        // --- Botón ---
        if (nav) {
          const btn = document.createElement("button");
          btn.className = "category-btn";
          if (index === 0) btn.classList.add("active");
          btn.dataset.target = id;
          btn.textContent = `${cat.emoji || ""} ${cat.nombre}`;
          btn.onclick = () => scrollToSection(id);
          nav.appendChild(btn);
        }

        // --- Sección ---
        if (menuContainer) {
          const section = document.createElement("section");
          section.id = id;
          section.className = "menu-section";
          section.innerHTML = `
            <h2 class="section-title">${cat.emoji || ""} ${cat.nombre}</h2>
            <div class="products-grid" id="${id}-grid"></div>
          `;
          menuContainer.appendChild(section);
        }
      });
    }

    // === 🌐 REDES SOCIALES ===
    (function updateFooterSocialLinks(config) {
      if (!config || !config.redes) return;
      const redes = config.redes;
      const anchors = Array.from(document.querySelectorAll(".footer-socials a"));
      if (anchors.length === 0) return;

      const applyUrl = (aEl, url, label) => {
        if (!aEl) return;
        if (url && url.trim()) {
          aEl.href = url;
          aEl.setAttribute("aria-label", label || url);
          aEl.target = "_blank";
          aEl.style.display = "";
        } else {
          aEl.href = "#";
          aEl.style.display = "none";
        }
      };

      anchors.forEach(a => {
        const img = a.querySelector("img");
        const alt = img?.alt?.toLowerCase() || "";
        if (alt.includes("whatsapp")) applyUrl(a, redes.whatsapp, "WhatsApp");
        else if (alt.includes("instagram")) applyUrl(a, redes.instagram, "Instagram");
        else if (alt.includes("facebook")) applyUrl(a, redes.facebook, "Facebook");
      });
    })(config);

    // === 📱 CÓDIGO QR ===
    const qr = document.querySelector(".footer-qr img");
    if (qr) qr.src = config.footerQR || "img/QR_tienda.png";

    // === 🖼️ LOGO FOOTER ===
    const footerLogo = document.querySelector(".footer-logo");
    if (footerLogo)
      footerLogo.src = config.footerLogo || config.logoFooter || config.logo || "img/logo.png";

    // === 🏠 SEDE ===
    if (config.sede) {
      const { nombre, direccion, telefono } = config.sede;
      const footerBranch = document.querySelector(".footer-branches p");
      if (footerBranch) {
        footerBranch.innerHTML = `
          <strong>Sedes</strong><br>
          ${nombre || ""}<br>
          ${direccion || ""}<br>
          <span class="telefono">${telefono || ""}</span>
        `;
      }
    }

    // === 🏪 BOTÓN CREAR TIENDA ===
    const createStoreBtn = document.querySelector(".create-store-btn");
    if (createStoreBtn && config.crearTienda) {
      createStoreBtn.href = config.crearTienda;
    } else if (createStoreBtn) {
      createStoreBtn.style.display = "none";
    }

    // === 🎨 COLORES PERSONALIZADOS ===
    if (config.colores && typeof config.colores === "object") {
      const root = document.documentElement;
      Object.entries(config.colores).forEach(([variable, valor]) => {
        root.style.setProperty(variable, valor);
      });
    }

    // === 📡 Emitir evento global ===
    document.dispatchEvent(new CustomEvent("configCargado", { detail: config }));

    // === ✅ Página lista ===
    document.body.classList.add("loaded");

  } catch (error) {
    console.error("⚠️ Error al cargar configuración:", error);
  }
});
