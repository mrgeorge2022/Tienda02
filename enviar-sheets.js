// ==========================================
// 🧾 RECOLECTAR Y ENVIAR PEDIDO A GOOGLE SHEETS / BASE DE DATOS
// ==========================================

// Variable global que se llenará desde config.json
let ENVIO_BASE_DATOS_URL = "";

// Recolecta los datos desde el objeto "pedido"
function recolectarDatosParaSheets(pedido) {
  const productosFormateados = (pedido.productos || [])
    .map(p => {
      const instrucciones = p.instrucciones ? ` (${p.instrucciones})` : "";
      return `${p.nombre} x${p.cantidad} - $${p.precio}${instrucciones}`;
    })
    .join("\n");

  const totalProductos = Number(pedido.subtotal || 0);
  const costoDomicilio = Number(pedido.costoDomicilio || 0);
  const totalPagar = totalProductos + costoDomicilio;

  return {
    tipoEntrega: pedido.tipoEntrega || "",
    numeroFactura: pedido.factura || "",
    fecha: pedido.fecha || "",
    hora: pedido.hora || "",
    nombre: pedido.cliente?.nombre || "",
    telefono: pedido.cliente?.telefono || "",
    mesa: pedido.cliente?.mesa || "",
    direccion: pedido.direccion || "",
    puntoReferencia: pedido.referencia || "",
    productos: productosFormateados || "",
    totalProductos,
    costoDomicilio,
    totalPagar,
    metodoPago: pedido.metodoPago || "No especificado",
    ubicacionGoogleMaps: pedido.ubicacion || "",
    observaciones: pedido.observaciones || ""
  };
}

// ==========================================
// 🚀 ENVIAR DATOS A GOOGLE SHEETS / BASE DE DATOS
// ==========================================
async function enviarPedidoASheets(pedido) {
  const datos = recolectarDatosParaSheets(pedido);

  if (!ENVIO_BASE_DATOS_URL) {
    console.error("⚠️ No se ha configurado la URL para envío a base de datos (apiUrls.envioBaseDatos).");
    return;
  }

  try {
    await fetch(ENVIO_BASE_DATOS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
  } catch (err) {
    console.error("❌ Error al enviar pedido:", err);
  }
}

// ==========================================
// ⚙️ CARGAR CONFIGURACIÓN DESDE config.json
// ==========================================
document.addEventListener("configCargado", (e) => {
  const config = e.detail;
  if (config?.apiUrls?.envioBaseDatos) {
    ENVIO_BASE_DATOS_URL = config.apiUrls.envioBaseDatos;
  } else {
    console.warn("⚠️ No se encontró apiUrls.envioBaseDatos en config.json");
  }
});
