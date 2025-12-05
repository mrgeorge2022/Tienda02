let API_URL = ""; // ← se cargará dinámicamente desde config.json
let pedidosGlobal = [];
let ultimaVersion = "";




// ================================
// 🔹 1. CARGAR CONFIG Y EMPEZAR (Modificada)
// ================================
async function init() {
    try {
        const res = await fetch("config.json", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar config.json");

        const config = await res.json();
        API_URL = config.apiUrls.reciboBaseDatos; 

        // ⚙️ Inicializar controles de scroll de botones
        setupScrollControls(); 
        
        // 🆕 Inicializar scroll horizontal con rueda
        setupMouseWheelScroll(); 

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
// ================================
// 🔹 2. CARGAR PEDIDOS (Modificada para Sonido)
// ================================
async function cargarPedidos() {
  const contenedor = document.getElementById("lista-pedidos");
  // 🆕 Obtener el elemento de audio
  const alertaAudio = document.getElementById("alerta-sonido");

  try {
    const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const pedidos = await res.json();
    const versionActual = JSON.stringify(pedidos);

    // Evita redibujar si no hay cambios
    if (versionActual === ultimaVersion) {
        // Si no hay cambios, salimos sin hacer nada
        return; 
    }
    
    // 🔔 LÓGICA DE SONIDO: Si hay una diferencia entre versiones Y no es la primera carga (ultimaVersion != "")
    if (ultimaVersion !== "") {
        // Reiniciamos el audio si ya estaba en reproducción
        alertaAudio.currentTime = 0; 
        alertaAudio.play().catch(error => {
            // Manejo de error por auto-reproducción bloqueada por el navegador
            console.log("El navegador bloqueó la auto-reproducción de la alerta de sonido.", error);
            // Podrías mostrar un mensaje pidiendo al usuario hacer un clic en la página
        });
    }

    ultimaVersion = versionActual; // Actualizar la versión solo después de comprobar


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
    const idPedido = `${p.numeroFactura
      
    }`;
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
// 🔹 5. LÓGICA DE SCROLL PULSANTE (Híbrida - Clic Rápido / Mantenido)
// ================================
function setupScrollControls() {
    const listaPedidos = document.getElementById('lista-pedidos');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    
    // --- Valores de Scroll ---
    const SCROLL_AMOUNT_CLICK = 230;    // ⬅️ Desplazamiento para un clic rápido
    const SCROLL_AMOUNT_CONT = 20;      // ⬅️ Desplazamiento por intervalo (continuo)
    const SCROLL_INTERVAL = 50;         // ⬅️ Frecuencia del scroll en ms (suavidad)
    const HOLD_DELAY = 250;             // ⬅️ Retraso en ms antes de iniciar el scroll continuo
    
    let scrollTimer = null; // Para el scroll continuo
    let holdTimeout = null; // Para el temporizador de inicio del scroll continuo

    if (!listaPedidos || !scrollLeftBtn || !scrollRightBtn) return;

    /**
     * Inicia el scroll continuo en la dirección especificada.
     * @param {number} direction - -1 para izquierda, 1 para derecha.
     */
    function startContinuousScrolling(direction) {
        if (scrollTimer) return;
        scrollTimer = setInterval(() => {
            listaPedidos.scrollBy({
                left: direction * SCROLL_AMOUNT_CONT,
                behavior: 'auto' // Debe ser 'auto' para un scroll continuo fluido
            });
        }, SCROLL_INTERVAL);
    }

    /**
     * Detiene ambos temporizadores (Timeout y Interval).
     * @param {number} direction - -1 para izquierda, 1 para derecha.
     */
    function stopScrolling(direction) {
        if (holdTimeout) {
            clearTimeout(holdTimeout);
            holdTimeout = null;
            
            // Si se suelta el clic antes de que inicie el scroll continuo (Timeout),
            // ejecutamos el scroll único de 230px.
            if (!scrollTimer) {
                 listaPedidos.scrollBy({
                    left: direction * SCROLL_AMOUNT_CLICK,
                    behavior: 'smooth' // Se usa 'smooth' para el clic rápido
                });
            }
        }
        
        if (scrollTimer) {
            clearInterval(scrollTimer);
            scrollTimer = null;
        }
    }

    /**
     * Manejador de la pulsación (mousedown/touchstart).
     * @param {number} direction - -1 para izquierda, 1 para derecha.
     */
    function handleStart(direction) {
        // Limpiamos por seguridad
        stopScrolling(direction); 
        
        // 1. Iniciamos el temporizador de espera.
        // Si el usuario sigue pulsando después de HOLD_DELAY, iniciamos el scroll continuo.
        holdTimeout = setTimeout(() => {
            holdTimeout = null; // El timeout ya se ejecutó
            startContinuousScrolling(direction);
        }, HOLD_DELAY);
    }


    // --- Configuración para el botón de SCROLL IZQUIERDA ---
    scrollLeftBtn.addEventListener('mousedown', () => handleStart(-1));
    scrollLeftBtn.addEventListener('mouseup', () => stopScrolling(-1));
    scrollLeftBtn.addEventListener('mouseleave', () => stopScrolling(-1));
    
    // Dispositivos táctiles
    scrollLeftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleStart(-1);
    }, { passive: false });
    scrollLeftBtn.addEventListener('touchend', () => stopScrolling(-1));


    // --- Configuración para el botón de SCROLL DERECHA ---
    scrollRightBtn.addEventListener('mousedown', () => handleStart(1));
    scrollRightBtn.addEventListener('mouseup', () => stopScrolling(1));
    scrollRightBtn.addEventListener('mouseleave', () => stopScrolling(1));
    
    // Dispositivos táctiles
    scrollRightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleStart(1);
    }, { passive: false });
    scrollRightBtn.addEventListener('touchend', () => stopScrolling(1));
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
        <title>${idElemento}</title>
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
            font-size: 11pt; 
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
            font-size: 11pt; 
            text-align: center; 
          }
          .pedido-cliente strong, .pedido-mesa strong { display: inline; }
          .pedido-cliente span, .pedido-mesa span { font-weight: normal; }
          .pedido-productos { padding: 0; margin-top: 10px; border: none; }
          .cantidadproducto { 
            display: flex; 
            align-items: center; 
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
/* ⚠️ CORRECCIÓN CLAVE: Ocultar elementos SOLO en la impresión. */
            /* Esto mantiene la visualización de los botones de control en pantalla. */
            @media print {
              .btn-imprimir, 
              .pedido-direccion, 
              .total-productos, 
              .acciones-pedido { 
                display: none !important; 
              }      
            }

            /* Asegurar que se muestren los botones en la pantalla de previsualización */
            @media screen {
                .acciones-pedido { display: flex; justify-content: center; } 
            }
</style>
      </head>
        <body>
          <div class="comanda-wrapper">
            ${contenidoAImprimir.outerHTML}
            
            <div class="espacio-corte" style="height: 30px;"></div> 

            <div class="acciones-pedido" style="text-align: center; margin-top: 15px;">
              <button id="btn-imprimir-final" style="padding: 10px 20px; font-size: 16px; margin: 5px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 5px;">Imprimir</button>
              <button id="btn-cerrar-final" style="padding: 10px 20px; font-size: 16px; margin: 5px; cursor: pointer; background-color: #f44336; color: white; border: none; border-radius: 5px;">Cerrar</button>
            </div>
          </div>
        </body>
      </html>
    `);


ventanaImpresion.document.close();
  
  // 🟢 1. Los botones se vuelven funcionales INMEDIATAMENTE
  ventanaImpresion.document.getElementById('btn-imprimir-final').addEventListener('click', () => {
      // Re-impresión manual si la automática se cancela.
      ventanaImpresion.print();
  });

  ventanaImpresion.document.getElementById('btn-cerrar-final').addEventListener('click', () => {
      // Cierre manual de la ventana por el usuario.
      ventanaImpresion.close();
  });

  // 🔄 2. Disparar la impresión automática DESPUÉS del retraso. 
  setTimeout(() => {
    // Cuando se llama a print(), el CSS con @media print oculta los botones.
    ventanaImpresion.print(); 
  }, 200); 
  
  // Es crucial NO llamar a ventanaImpresion.close() aquí.
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

// ================================
// 🔹 8. SCROLL HORIZONTAL CON RUEDA
// ================================
function setupMouseWheelScroll() {
    const listaPedidos = document.getElementById('lista-pedidos');

    if (!listaPedidos) return;

    listaPedidos.addEventListener('wheel', (e) => {
        // e.deltaY representa el desplazamiento vertical (scroll normal de la rueda)
        // e.preventDefault() detiene el scroll vertical por defecto en la página
        e.preventDefault(); 
        
        // Traducimos el desplazamiento vertical (e.deltaY) a desplazamiento horizontal (scrollLeft)
        // El factor de 1.5 a 2x se usa para hacer el scroll horizontal más sensible
        listaPedidos.scrollLeft += e.deltaY * 2; 
        
        // Opcional: También puedes usar e.deltaX si usas un trackpad o ratón con scroll lateral
        // listaPedidos.scrollLeft += e.deltaX;
    });
}

// Listener del botón recargar: Guarda el estado antes de recargar la página.
document.getElementById("btn-recargar").addEventListener("click", () => {
    saveFilterState(); // 💾 Guardar estado antes de recargar
    location.reload();
});


// ✅ Iniciar todo
init();