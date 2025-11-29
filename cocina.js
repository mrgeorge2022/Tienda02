let API_URL = ""; // ← se cargará dinámicamente desde config.json
let pedidosGlobal = [];
let ultimaVersion = "";

// ================================
// 🔹 1. CARGAR CONFIG Y EMPEZAR
// ================================
async function init() {
  try {
    const res = await fetch("config.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar config.json");

    const config = await res.json();
    API_URL = config.apiUrls.reciboBaseDatos; // fallback si no existe "cocina"


    // ⚙️ Inicializar controles de scroll
    setupScrollControls(); 

    // Cargar pedidos iniciales
    cargarPedidos();
    setInterval(cargarPedidos, 2000);
    
  } catch (err) {
    console.error("⚠️ Error cargando configuración:", err);
  }
}

// ================================
// 🔹 2. CARGAR PEDIDOS
// ================================
async function cargarPedidos() {
  const contenedor = document.getElementById("lista-pedidos");

  try {
    const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const pedidos = await res.json();
    const versionActual = JSON.stringify(pedidos);

    // Evita redibujar si no hay cambios
    if (versionActual === ultimaVersion) return;
    ultimaVersion = versionActual;

    // Formatea fecha
    pedidosGlobal = pedidos.map(p => {
      if (p.fecha && typeof p.fecha !== "string") {
        const d = new Date(p.fecha);
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const año = d.getFullYear();
        p.fecha = `${dia}/${mes}/${año}`;
      }
      return p;
    });

    filtrarPorFecha();
  } catch (err) {
    console.error("⚠️ Error cargando pedidos:", err);
    contenedor.innerHTML = `<p style="color:#ff7a00;">Error al cargar los pedidos, intenta recargar la página.</p>`;
  }
}

// ================================
// 🔹 3. FILTRAR POR FECHA Y TIPO
// ================================
function filtrarPorFecha() {
  const contenedor = document.getElementById("lista-pedidos");
  const resumenContenedor = document.getElementById("resumen-pedidos");
  contenedor.innerHTML = "";
  resumenContenedor.innerHTML = "";

  const valorFecha = document.getElementById("fecha").value;
  if (!valorFecha) return;

  const [año, mes, dia] = valorFecha.split("-");
  const fechaSeleccionada = `${dia}/${mes}/${año}`;

  // 🆕 Leer filtros activos del DOM (que ahora se actualiza con loadFilterState)
  const filtrosActivos = Array.from(document.querySelectorAll('#tipo-filtros .filter-input'))
      .filter(input => input.checked)
      .map(input => input.dataset.tipo);

  let pedidosFiltrados = pedidosGlobal.filter(p => p.fecha === fechaSeleccionada);
  
  // 🆕 Aplicar filtro de tipo
  if (filtrosActivos.length > 0) {
      pedidosFiltrados = pedidosFiltrados.filter(p => {
          const tipoPedido = (p.tipoEntrega || "").toLowerCase();
          if (tipoPedido.includes("domicilio") && filtrosActivos.includes("domicilio")) return true;
          if (tipoPedido.includes("mesa") && filtrosActivos.includes("mesa")) return true;
          if (tipoPedido.includes("recoger") && filtrosActivos.includes("recoger")) return true;
          return false;
      });
  } else {
    // Si no hay filtros activos (todos desmarcados), mostramos un mensaje
    contenedor.innerHTML = `<p>Ningún tipo de pedido (Domicilio, Mesa, Recoger) está seleccionado.</p>`;
    return;
  }

  // 🔹 Totales por tipo
  const totales = { domicilio: 0, mesa: 0, recoger: 0 };
  pedidosFiltrados.forEach(p => {
    const tipo = (p.tipoEntrega || "").toLowerCase();
    if (tipo.includes("domicilio")) totales.domicilio++;
    else if (tipo.includes("mesa")) totales.mesa++;
    else if (tipo.includes("recoger")) totales.recoger++;
  });

  // 🔹 Mostrar resumen antes de la lista
  resumenContenedor.innerHTML = `
    <div class="resumen-item" style="--color:#66bb6a;">
      <span class="resumen-circulo"></span>
      Recoger: <strong>${totales.recoger}</strong>
    </div>
    <div class="resumen-item" style="--color:#29b6f6;">
      <span class="resumen-circulo"></span>
      Mesa: <strong>${totales.mesa}</strong>
    </div>
    <div class="resumen-item" style="--color:#ff7043;">
      <span class="resumen-circulo"></span>
      Domicilio: <strong>${totales.domicilio}</strong>
    </div>
    <div class="resumen-item total-general">
      Total: <strong>${pedidosFiltrados.length}</strong>
    </div>
  `;

  // 🔹 Sin pedidos
  if (!pedidosFiltrados.length) {
    contenedor.innerHTML = `<p>No hay pedidos para el ${fechaSeleccionada} con los filtros activos.</p>`;
    return;
  }

  // 🔹 Mostrar pedidos
  const fragment = document.createDocumentFragment();
  pedidosFiltrados.slice().reverse().forEach(p => {
    const tipo = (p.tipoEntrega || "").toLowerCase();
    let claseTipo = "", icono = "📦 Otro";
    if (tipo.includes("domicilio")) { claseTipo = "domicilio"; icono = "Domicilio"; }
    else if (tipo.includes("mesa")) { claseTipo = "mesa"; icono = "Mesa"; }
    else if (tipo.includes("recoger")) { claseTipo = "recoger"; icono = "Recoger"; }

    const div = document.createElement("div");
    div.className = `pedido ${claseTipo}`;
    const idPedido = `pedido-${p.numeroFactura || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    div.id = idPedido;

    function extraerCantidad(producto) {
      const match = producto.match(/x\d+/i);
      return match ? match[0] : "";
    }

    let productosHTML = "";
    if (p.productos) {
      const productos = p.productos.split("\n");
      productos.forEach(prod => {
        let cantidad = extraerCantidad(prod);
        cantidad = cantidad.replace(/x/i, "");
        const resto = prod.replace(extraerCantidad(prod), "").trim();
        productosHTML += `
          <div class="cantidadproducto">
            <div class="producto-cantidad">${cantidad}</div>
            <div class="producto-detalle">${resto}</div>
          </div>
        `;
      });
    } else {
      productosHTML = "<div class='producto-item'>Sin productos</div>";
    }

    div.innerHTML = `
      <div class="tipo-entrega ${claseTipo}">${icono}</div>
      <div class="pedido-header">
        <div class="pedido-datos">
          <div class="pedido-numero"><strong>${p.numeroFactura || "Sin número"}</strong></div>
          <div class="pedido-hora">${p.hora || "--:--:--"}</div>
        </div>
      </div>

      <div class="pedido-cliente"><strong>Cliente:</strong> <span>${p.nombre || "Sin nombre"}</span></div>
      ${p.mesa ? `<div class="pedido-mesa"><strong>Mesa:</strong> <span>${p.mesa}</span></div>` : ""}
      <div class="pedido-productos productos">${productosHTML}</div>
      ${p.observaciones ? `
        <div class="pedido-observaciones observaciones">
          <em>OBSERVACIONES:</em> <span>${p.observaciones}</span>
        </div>` : ""}
      <button class="btn-imprimir" onclick="imprimirPedido('${idPedido}')">🖨️ Imprimir comanda</button>
    `;

    fragment.appendChild(div);
  });

  contenedor.appendChild(fragment);
}

// ------------------------------------
// 💾 FUNCIONES PARA PERSISTENCIA DE FILTROS
// ------------------------------------

/**
 * Guarda el estado actual de los interruptores de filtro en localStorage.
 */
function saveFilterState() {
  const filters = {};
  document.querySelectorAll('#tipo-filtros .filter-input').forEach(input => {
    filters[input.dataset.tipo] = input.checked;
  });
  localStorage.setItem('cocinaFilters', JSON.stringify(filters));
}

/**
 * Carga el estado guardado de los interruptores de filtro desde localStorage
 * y lo aplica a los checkboxes.
 */
function loadFilterState() {
  const savedState = localStorage.getItem('cocinaFilters');
  if (savedState) {
    try {
      const filters = JSON.parse(savedState);
      document.querySelectorAll('#tipo-filtros .filter-input').forEach(input => {
        const tipo = input.dataset.tipo;
        if (filters.hasOwnProperty(tipo)) {
          input.checked = filters[tipo];
        }
      });
    } catch (e) {
      console.error("Error al parsear el estado de filtros guardado:", e);
    }
  }
}

// ================================
// 🔹 4. ACTUALIZAR ESTADO (Mantenido)
// ================================
async function actualizarEstado(numeroFactura, tipo) {
  try {
    const payload = { accion: "actualizar", numeroFactura, tipo };
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) alert(`✅ Pedido ${numeroFactura} enviado (${tipo.toUpperCase()})`);
    else alert("❌ Error: " + (data.error || "Desconocido"));
  } catch (err) {
    alert("⚠️ No se pudo comunicar con el servidor");
    console.error(err);
  }
}

// ================================
// 🔹 5. LÓGICA DE SCROLL PULSANTE (Mantenido)
// ================================
function setupScrollControls() {
    const listaPedidos = document.getElementById('lista-pedidos');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    const scrollAmount = 260; 

    if (!listaPedidos || !scrollLeftBtn || !scrollRightBtn) return;

    scrollLeftBtn.addEventListener('click', () => {
        listaPedidos.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth' 
        });
    });

    scrollRightBtn.addEventListener('click', () => {
        listaPedidos.scrollBy({
            left: scrollAmount,
            behavior: 'smooth' 
        });
    });
}

// ================================
// 🔹 6. FUNCIÓN DE IMPRESIÓN (Mantenido)
// ================================
function imprimirPedido(idElemento) {
  const elemento = document.getElementById(idElemento);
  if (!elemento) {
    alert("Error: No se encontró el pedido para imprimir.");
    return;
  }
  const contenidoAImprimir = elemento.cloneNode(true);
  const botonImprimir = contenidoAImprimir.querySelector('.btn-imprimir');
  if(botonImprimir) botonImprimir.remove();
  const ventanaImpresion = window.open('', '_blank');
  ventanaImpresion.document.write(`
    <html>
      <head>
        <title>Comanda - ${idElemento}</title>
        <style>
          /* ⚙️ Estilos para impresión térmica (AJUSTADOS) */
          body { 
            font-family: 'monospace', 'Segoe UI', sans-serif; 
            margin: 0; 
            padding: 0; 
            color: #000;
            font-size: 11pt;
          }
          
          .comanda-wrapper {
            max-width: 300px; 
            width: 90%; 
            margin: 0 auto; 
            padding: 10px 5px; 
          }
          
          .pedido { 
            width: 100%;
            padding: 0;
            border: none;
            box-shadow: none;
            margin: 0;
          }
          .tipo-entrega { 
            margin: 5px 0 10px 0;
            text-align: center; 
            font-weight: normal; 
            padding: 5px; 
            color: #000;
            font-size: 12pt;
            border: 1px dashed #000;
            background: none; 
            text-transform: uppercase; 
          }
          .pedido-header { 
            border-bottom: 1px dashed #000; 
            margin-bottom: 10px; 
            padding-bottom: 5px;
            text-align: center; 
          }
          .pedido-datos { display: block; }
          .pedido-hora, .pedido strong { 
            color: #000; 
            font-weight: normal; 
            font-size: 8pt; 
          }
          .pedido-numero, .pedido-hora { 
            display: block; 
            text-align: center; 
          }
          .pedido-numero strong {
            color: #000; 
            font-size: 11pt; 
            font-weight: normal; 
          }
          .pedido-cliente, .pedido-mesa { 
            margin-bottom: 5px; 
            font-size: 11pt; 
            text-align: left; 
          }
          .pedido-cliente strong, .pedido-mesa strong { display: inline; }
          .pedido-cliente span, .pedido-mesa span { font-weight: normal; }
          .pedido-productos { padding: 0; margin-top: 10px; border: none; }
          .cantidadproducto { 
            display: flex; 
            align-items: flex-start; 
            padding: 3px 0; 
            border-bottom: 1px dashed #aaa; 
            gap: 5px; 
          }
          .producto-cantidad { 
            font-weight: normal; 
            font-size: 12pt; 
            min-width: 25px; 
            text-align: center; 
            border-right: 1px solid #000; 
            padding-right: 5px;
            flex-shrink: 0;
          }
          .producto-detalle { 
            font-size: 10pt; 
            font-weight: normal; 
            flex: 1; 
            word-break: break-word;
            line-height: 1.1; 
          }
          .observaciones { 
            margin-top: 10px; 
            color: #000; 
            font-size: 8pt; 
            font-weight: normal; 
            background: #fff; 
            padding: 5px 8px; 
            border-radius: 0;
            border: 1px dashed #000; 
          }
          .btn-imprimir, .pedido-direccion, .total-productos { display: none; }
        </style>
      </head>
      <body>
        <div class="comanda-wrapper">
          ${contenidoAImprimir.outerHTML}
        </div>
      </body>
    </html>
  `);


ventanaImpresion.document.close();
  
  // 🟢 SOLUCIÓN MÓVIL: Usa setTimeout para un breve retraso
  // y elimina el cierre inmediato, permitiendo que el diálogo de impresión se muestre
  setTimeout(() => {
    ventanaImpresion.print();
  }, 300); // Espera 300ms. Suficiente para cargar la impresión.
  
  // ventanaImpresion.close(); // ❌ COMENTAR O ELIMINAR ESTA LÍNEA
}



// ================================
// 🔹 7. INICIALIZACIÓN Y LISTENERS
// ================================

// 1. Cargar estado de filtros ANTES de inicializar la lógica de filtros y pedidos.
loadFilterState();

const hoy = new Date();
const año = hoy.getFullYear();
const mes = String(hoy.getMonth() + 1).padStart(2, "0");
const dia = String(hoy.getDate()).padStart(2, "0");

const fechaInput = document.getElementById("fecha");
fechaInput.value = `${año}-${mes}-${dia}`;
fechaInput.addEventListener("change", filtrarPorFecha);

// Añadir listeners a los filtros de tipo para que recarguen la vista Y guarden el estado
document.querySelectorAll('#tipo-filtros .filter-input').forEach(input => {
    input.addEventListener('change', () => {
        saveFilterState(); // 💾 Guardar estado en localStorage
        filtrarPorFecha();
    });
});

// Listener del botón recargar: Guarda el estado antes de recargar la página.
document.getElementById("btn-recargar").addEventListener("click", () => {
    saveFilterState(); // 💾 Guardar estado antes de recargar
    location.reload();
});


// ✅ Iniciar todo

init();
