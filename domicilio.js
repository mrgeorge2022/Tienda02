// ================================
// 🗺️ MAPA LEAFLET - DOMICILIO CON RUTA, COSTO Y BUSCADOR INTELIGENTE + BARRIOS PREDEFINIDOS
// ================================
let map, markerUsuario, routingControl;
let tiendaCoords = [10.393386, -75.482885]; // valor por defecto cenro de cartagena
let nombreTienda = "Mi Restaurante";

// 🧩 Cargar configuración desde config.json
async function cargarConfig() {
  try {
    const res = await fetch("config.json");
    if (!res.ok) throw new Error("No se pudo cargar config.json");
    const data = await res.json();

    // ✅ Asignamos dinámicamente los valores
    if (data?.coordenadasSede) tiendaCoords = data.coordenadasSede;
    if (data?.logo) logoTienda = data.logo;
    if (data?.sede?.nombre) nombreTienda = data.sede.nombre;

    return data; // devolvemos la configuración cargada
  } catch (error) {
    console.error("⚠️ Error cargando config.json:", error);
    return null;
  }
}

let costoDomicilio = 0;

// ================================
// 🎨 ÍCONOS PERSONALIZADOS
// ================================
// 🗺️ Crear ícono dinámico desde JSON
function crearIconoTienda() {
  return L.icon({
    iconUrl: logoTienda, // 👈 aquí usamos lo que venga desde config.json
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

const usuarioIcon = L.icon({
  iconUrl: "iconos/pinubicacion.png",
  iconSize: [45, 45],
  iconAnchor: [22.5, 45],
  popupAnchor: [0, -45],
});

// ================================
// 🏙️ LISTA COMPLETA DE BARRIOS PREDEFINIDOS
// ================================
const barrios = [
  { nombre: "13 de Junio", lat: 10.4037266, lon: -75.4879953 },
  { nombre: "20 de Julio", lat: 10.3749516, lon: -75.5006668 },
  { nombre: "7 de Agosto", lat: 10.4007794, lon: -75.5018699 },
  { nombre: "Alameda La Victoria", lat: 10.3791826, lon: -75.4769453 },
  { nombre: "Albornoz", lat: 10.35881, lon: -75.508105 },
  { nombre: "Alcibia", lat: 10.411365, lon: -75.516892 },
  { nombre: "Almirante Colon", lat: 10.387142, lon: -75.495863 },
  { nombre: "Alto Bosque", lat: 10.3903451, lon: -75.5207063 },
  { nombre: "Altos de San Isidro", lat: 10.3931686, lon: -75.512303 },
  { nombre: "Amberes", lat: 10.407023, lon: -75.5167363 },
  { nombre: "Anita", lat: 10.394817, lon: -75.473328 },
  { nombre: "Antonio Jose de Sucre", lat: 10.3722948, lon: -75.5046559 },
  { nombre: "Armenia", lat: 10.4062931, lon: -75.5080387 },
  { nombre: "Bellavista", lat: 10.376461, lon: -75.502243 },
  { nombre: "Blas de Lezo", lat: 10.387031, lon: -75.485765 },
  { nombre: "Bocagrande", lat: 10.405891, lon: -75.552825 },
  { nombre: "Bosquecito", lat: 10.391857, lon: -75.514306 },
  { nombre: "Boston", lat: 10.4108684, lon: -75.5154435 },
  { nombre: "Bruselas", lat: 10.4047899, lon: -75.5207842 },
  { nombre: "Calamares", lat: 10.3945605, lon: -75.4967836 },
  { nombre: "Camaguey", lat: 10.394539, lon: -75.494286 },
  { nombre: "Camilo Torres", lat: 10.372893, lon: -75.479075 },
  { nombre: "Canapote", lat: 10.439959, lon: -75.521436 },
  { nombre: "Castillogrande", lat: 10.394448, lon: -75.551608 },
  { nombre: "Ceballos", lat: 10.387307, lon: -75.504192 },
  { nombre: "Centro", lat: 10.422906, lon: -75.5521903 },
  { nombre: "Cesar Florez", lat: 10.376401, lon: -75.473555 },
  { nombre: "Chambacu", lat: 10.426481, lon: -75.541073 },
  { nombre: "Chiquinquira", lat: 10.403887, lon: -75.492022 },
  { nombre: "Ciudad Bicentenario", lat: 10.424804, lon: -75.447705 },
  { nombre: "Ciudadela 2000", lat: 10.372117, lon: -75.472351 },
  { nombre: "Crespo", lat: 10.4461, lon: -75.517723 },
  { nombre: "El Bosque", lat: 10.399689, lon: -75.521158 },
  { nombre: "El Cabrero", lat: 10.43275, lon: -75.541469 },
  { nombre: "El Campestre", lat: 10.3799354, lon: -75.4969239 },
  { nombre: "El Carmelo", lat: 10.3799691, lon: -75.4884188 },
  { nombre: "El Country", lat: 10.39025, lon: -75.497403 },
  { nombre: "El Educador", lat: 10.3749419, lon: -75.4831604 },
  { nombre: "El Gallo", lat: 10.3957709, lon: -75.476628 },
  { nombre: "El Laguito", lat: 10.395596, lon: -75.562828 },
  { nombre: "El Pozon", lat: 10.4058351, lon: -75.4559939 },
  { nombre: "El Prado", lat: 10.3995144, lon: -75.5187062 },
  { nombre: "El Recreo", lat: 10.3872453, lon: -75.4731004 },
  { nombre: "El Reposo", lat: 10.3731723, lon: -75.4884171 },
  { nombre: "El Rubi", lat: 10.3922534, lon: -75.4866898 },
  { nombre: "El Socorro", lat: 10.3826749, lon: -75.4805847 },
  { nombre: "Escallon Villa", lat: 10.4033999, lon: -75.4975375 },
  { nombre: "España", lat: 10.4078959, lon: -75.51271 },
  { nombre: "Espinal", lat: 10.4245276, lon: -75.5387966 },
  { nombre: "Fredonia", lat: 10.4025103, lon: -75.4743761 },
  { nombre: "Getsemani", lat: 10.4220621, lon: -75.5462784 },
  { nombre: "Henequen", lat: 10.3667403, lon: -75.4952979 },
  { nombre: "Jose Antonio Galan", lat: 10.4005054, lon: -75.5111283 },
  { nombre: "Juan Xxiii", lat: 10.3998149, lon: -75.5161146 },
  { nombre: "Junin", lat: 10.4053328, lon: -75.5103871 },
  { nombre: "La Boquilla", lat: 10.4795548, lon: -75.4914976 },
  { nombre: "La Campiña", lat: 10.393008, lon: -75.501799 },
  { nombre: "La Candelaria", lat: 10.409656, lon: -75.5147479 },
  { nombre: "La Carolina", lat: 10.3981671, lon: -75.463544 },
  { nombre: "La Castellana", lat: 10.3943422, lon: -75.4870679 },
  { nombre: "La Concepcion", lat: 10.3923316, lon: -75.4749581 },
  { nombre: "La Consolata", lat: 10.3772673, lon: -75.4803556 },
  { nombre: "La Floresta", lat: 10.3986099, lon: -75.4879327 },
  { nombre: "La Maria", lat: 10.4196885, lon: -75.5197706 },
  { nombre: "La Matuna", lat: 10.4260029, lon: -75.5446837 },
  { nombre: "La Paz", lat: 10.4266349, lon: -75.5200058 },
  { nombre: "La Quinta", lat: 10.4154697, lon: -75.5263495 },
  { nombre: "La Sierrita", lat: 10.3687766, lon: -75.4742395 },
  { nombre: "La Victoria", lat: 10.3780343, lon: -75.4840456 },
  { nombre: "Las Delicias", lat: 10.3919565, lon: -75.486281 },
  { nombre: "Las Gaviotas", lat: 10.3979513, lon: -75.4928545 },
  { nombre: "Las Palmeras", lat: 10.4009203, lon: -75.4750055 },
  { nombre: "Libano", lat: 10.4075717, lon: -75.507711 },
  { nombre: "Lo Amador", lat: 10.4220915, lon: -75.5334753 },
  { nombre: "Los Alpes", lat: 10.3969992, lon: -75.4788781 },
  { nombre: "Los Angeles", lat: 10.3950913, lon: -75.4906405 },
  { nombre: "Los Caracoles", lat: 10.3900563, lon: -75.4922707 },
  { nombre: "Los Cerros", lat: 10.3953755, lon: -75.5175767 },
  { nombre: "Los Comuneros", lat: 10.4375132, lon: -75.520237 },
  { nombre: "Los Corales", lat: 10.3887831, lon: -75.5010197 },
  { nombre: "Los Ejecutivos", lat: 10.3986137, lon: -75.4935784 },
  { nombre: "Los Jardines", lat: 10.3760225, lon: -75.4842346 },
  { nombre: "Los Santanderes", lat: 10.3877703, lon: -75.5056651 },
  { nombre: "Luis Carlos Galan", lat: 10.375871, lon: -75.4944876 },
  { nombre: "Manga", lat: 10.4123522, lon: -75.5356003 },
  { nombre: "Marbella", lat: 10.4395122, lon: -75.5304071 },
  { nombre: "Maria Cano", lat: 10.3747031, lon: -75.4798621 },
  { nombre: "Martinez Martelo", lat: 10.4083077, lon: -75.5213923 },
  { nombre: "Nariño", lat: 10.4294961, lon: -75.5341587 },
  { nombre: "Nelson Mandela", lat: 10.3677945, lon: -75.4755481 },
  { nombre: "Nueva Granada", lat: 10.3943748, lon: -75.5066559 },
  { nombre: "Nueve de Abril", lat: 10.3978513, lon: -75.5063111 },
  { nombre: "Nuevo Bosque", lat: 10.3884296, lon: -75.5031932 },
  { nombre: "Nuevo Porvenir", lat: 10.4017736, lon: -75.4751901 },
  { nombre: "Olaya St. Central", lat: 10.4016596, lon: -75.4903776 },
  { nombre: "Olaya St. Estela", lat: 10.4059385, lon: -75.4849565 },
  { nombre: "Olaya St. La Magdalena", lat: 10.4061142, lon: -75.4810257 },
  { nombre: "Olaya St. La Puntilla", lat: 10.4061351, lon: -75.4832572 },
  { nombre: "Olaya St. Rafael Nuñez", lat: 10.4094068, lon: -75.5060581 },
  { nombre: "Olaya St. Ricaurte", lat: 10.4048913, lon: -75.4790955 },
  { nombre: "Olaya St. 11 de Noviembre", lat: 10.4091415, lon: -75.4953191 },
  { nombre: "Pablo Vi - Ii", lat: 10.4339086, lon: -75.5267787 },
  { nombre: "Palestina", lat: 10.4342349, lon: -75.5216256 },
  { nombre: "Paraguay", lat: 10.401994, lon: -75.5193511 },
  { nombre: "Pedro Salazar", lat: 10.4369705, lon: -75.527192 },
  { nombre: "Petares", lat: 10.4350261, lon: -75.5287511 },
  { nombre: "Pie de La Popa", lat: 10.4197881, lon: -75.5319991 },
  { nombre: "Pie del Cerro", lat: 10.4211255, lon: -75.5384216 },
  { nombre: "Piedra de Bolivar", lat: 10.4051009, lon: -75.5075545 },
  { nombre: "Providencia", lat: 10.3923316, lon: -75.4749581 },
  { nombre: "Recreo", lat: 10.3872453, lon: -75.4731004 },
  { nombre: "Republica de Chile", lat: 10.3968171, lon: -75.5178692 },
  { nombre: "Republica de Venezuela", lat: 10.4002924, lon: -75.4936718 },
  { nombre: "Rossedal", lat: 10.3726834, lon: -75.4814671 },
  { nombre: "San Antonio", lat: 10.395484, lon: -75.4906573 },
  { nombre: "San Diego", lat: 10.4268463, lon: -75.5473659 },
  { nombre: "San Fernando", lat: 10.3791777, lon: -75.476848 },
  { nombre: "San Francisco", lat: 10.4369621, lon: -75.5154309 },
  { nombre: "San Isidro", lat: 10.3894771, lon: -75.5052676 },
  { nombre: "San Jose de Los Campanos", lat: 10.3839754, lon: -75.4616423 },
  { nombre: "San Pedro", lat: 10.3919612, lon: -75.485742 },
  { nombre: "San Pedro Martir", lat: 10.3797544, lon: -75.4864726 },
  { nombre: "San Pedro y Libertad", lat: 10.4353034, lon: -75.5290032 },
  { nombre: "Santa Clara", lat: 10.3818484, lon: -75.5015975 },
  { nombre: "Santa Lucia", lat: 10.3945593, lon: -75.4798974 },
  { nombre: "Santa Maria", lat: 10.4374815, lon: -75.5189223 },
  { nombre: "Santa Monica", lat: 10.3905247, lon: -75.4788541 },
  { nombre: "Sectores Unidos", lat: 10.3698626, lon: -75.4777117 },
  { nombre: "Tacarigua", lat: 10.39071, lon: -75.4903781 },
  { nombre: "Ternera", lat: 10.3835112, lon: -75.4676809 },
  { nombre: "Tesca", lat: 10.4066354, lon: -75.4911371 },
  { nombre: "Torices", lat: 10.4297104, lon: -75.5373685 },
  { nombre: "Urbanizacion Colombiaton", lat: 10.4151485, lon: -75.4442429 },
  { nombre: "Urbanizacion Simon Bolivar", lat: 10.378948, lon: -75.4656564 },
  { nombre: "Viejo Porvenir", lat: 10.3986145, lon: -75.4796529 },
  { nombre: "Villa Barraza", lat: 10.3695829, lon: -75.5064084 },
  { nombre: "Villa Estrella", lat: 10.4019641, lon: -75.4625122 },
  { nombre: "Villa Fanny", lat: 10.370144, lon: -75.4766714 },
  { nombre: "Villa Olimpica", lat: 10.4035276, lon: -75.4968093 },
  { nombre: "Villa Rosita", lat: 10.3984574, lon: -75.4706008 },
  { nombre: "Villa Rubia", lat: 10.3755573, lon: -75.4787337 },
  { nombre: "Villa Sandra", lat: 10.3934867, lon: -75.4892745 },
  { nombre: "Villas de La Candelaria", lat: 10.4021184, lon: -75.4617875 },
  { nombre: "Vista Hermosa", lat: 10.3800563, lon: -75.5023808 },
  { nombre: "Zapatero", lat: 10.388979, lon: -75.5223224 },
  { nombre: "Zaragocilla", lat: 10.4001171, lon: -75.500964 },
];

// ================================
// 🗺️ INICIALIZAR MAPA
// ================================
function initMap() {
  map = L.map("map").setView(tiendaCoords, 13);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  map.zoomControl.setPosition("bottomleft");

  // 🟢 Usamos la función que genera el ícono dinámicamente
  const tiendaIcon = crearIconoTienda();

  const markerTienda = L.marker(tiendaCoords, { icon: tiendaIcon }).addTo(map);
  markerTienda.bindPopup("<b>Mr. George</b><br>📍 Tienda principal");

  markerUsuario = L.marker(tiendaCoords, {
    icon: usuarioIcon,
    draggable: true,
  });

  markerUsuario.on("dragend", async () => {
    const { lat, lng } = markerUsuario.getLatLng();
    await detectarDireccion(lat, lng);
    calcularRutaYCostos([lat, lng]);
  });

  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    await mostrarMarcadorUsuario(lat, lng);
    await detectarDireccion(lat, lng);
    calcularRutaYCostos([lat, lng]);
  });
}

// ================================
// 🟢 Mostrar marcador del usuario
// ================================
async function mostrarMarcadorUsuario(lat, lng) {
  markerUsuario.setLatLng([lat, lng]);
  if (!map.hasLayer(markerUsuario)) markerUsuario.addTo(map);
}

// ================================
// 📍 Botón: Ubicación actual
// ================================
document.getElementById("btn-ubicacion").addEventListener("click", () => {
  if (!navigator.geolocation)
    return alert("Tu navegador no soporta geolocalización.");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 15);
      await mostrarMarcadorUsuario(latitude, longitude);
      await detectarDireccion(latitude, longitude);
      calcularRutaYCostos([latitude, longitude]);
    },
    () => alert("No se pudo obtener la ubicación actual.")
  );
});

// ================================
// 🔍 BUSCADOR COMBINADO (Barrios + Nominatim)
// ================================
const searchInput = document.getElementById("buscar");
const suggestionsEl = document.getElementById("suggestions");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  suggestionsEl.innerHTML = "";

  if (!query) {
    suggestionsEl.style.display = "none";
    return;
  }

  let resultados = 0;

  // 📍 1. Si el usuario escribió coordenadas (con o sin paréntesis)
  const coordRegex = /^\(?\s*-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+\s*\)?$/;

  if (coordRegex.test(query)) {
    // 🧹 Limpiar los paréntesis y espacios
    const clean = query.replace(/[()]/g, "").trim();
    const [latStr, lonStr] = clean.split(",");
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    const div = document.createElement("div");
    div.textContent = `📍 Coordenadas: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    div.addEventListener("click", async () => {
      searchInput.value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      suggestionsEl.style.display = "none";
      map.setView([lat, lon], 15);
      await mostrarMarcadorUsuario(lat, lon);
      detectarDireccion(lat, lon);
      calcularRutaYCostos([lat, lon]);
    });
    suggestionsEl.appendChild(div);
    resultados++;
  }

  // 🏘️ Buscar coincidencias en los barrios
  const locales = barrios.filter((b) => b.nombre.includes(query));
  locales.forEach((b) => {
    const div = document.createElement("div");
    div.textContent = `📍 ${b.nombre}`;
    div.addEventListener("click", async () => {
      searchInput.value = b.nombre;
      suggestionsEl.style.display = "none";
      map.setView([b.lat, b.lon], 15);
      await mostrarMarcadorUsuario(b.lat, b.lon);
      detectarDireccion(b.lat, b.lon);
      calcularRutaYCostos([b.lat, b.lon]);
    });
    suggestionsEl.appendChild(div);
    resultados++;
  });

  // 🌍 Buscar con Nominatim
  if (query.length > 3) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ", Cartagena"
        )}`
      );
      const data = await res.json();
      data.slice(0, 4).forEach((place) => {
        const div = document.createElement("div");
        div.textContent = `📍 ${place.display_name}`;
        div.addEventListener("click", async () => {
          const lat = parseFloat(place.lat);
          const lon = parseFloat(place.lon);
          searchInput.value = place.display_name;
          suggestionsEl.style.display = "none";
          map.setView([lat, lon], 15);
          await mostrarMarcadorUsuario(lat, lon);
          detectarDireccion(lat, lon);
          calcularRutaYCostos([lat, lon]);
        });
        suggestionsEl.appendChild(div);
        resultados++;
      });
    } catch (error) {
      console.warn("🌐 Error con Nominatim:", error);
    }
  }

  suggestionsEl.style.display = resultados > 0 ? "block" : "none";
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".overlay")) suggestionsEl.style.display = "none";
});

// ================================
// 🧠 DETECTAR DIRECCIÓN REAL
// ================================
async function detectarDireccion(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "es" } });
    const data = await res.json();

    if (data?.display_name) {
      const input = document.getElementById("buscar");
      input.value = data.display_name;
    }
  } catch (error) {
    console.error("❌ Error al detectar dirección:", error);
  }
}

// ================================
// 🚗 CALCULAR RUTA Y COSTOS CON MÍNIMO Y RECARGO NOCTURNO
// ================================
function calcularRutaYCostos(destino) {
  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: [L.latLng(tiendaCoords), L.latLng(destino)],
    lineOptions: {
      styles: [
        { color: "rgba(255,255,255,0.25)", weight: 8 },
        { color: "#007bff", weight: 5, opacity: 0.8 },
      ],
    },
    addWaypoints: false,
    draggableWaypoints: false,
    createMarker: () => null,
    show: false,
  })
    .on("routesfound", (e) => {
      const distanciaKm = e.routes[0].summary.totalDistance / 1000;
      let costoBase = distanciaKm * 2500;

      // 🕒 Hora real
      const hora = new Date().getHours();
      let recargoTexto = "";
      let recargo = 0;

      // 1️⃣ Redondear al siguiente cien y mínimo 3000
      costoBase = Math.max(redondearACien(costoBase), 3000);

      // 2️⃣ Aplicar recargo nocturno sobre el valor ya redondeado
      if (hora >= 22 || hora < 6) {
        recargo = costoBase * 0.2; // +20%
        recargoTexto = " (+20%)";
      }

      // 3️⃣ Sumar recargo y redondear de nuevo al siguiente cien
      costoDomicilio = redondearACien(costoBase + recargo);

      // Actualizar la UI
      actualizarCostos(recargoTexto, hora);
    })
    .addTo(map);

  const style = document.createElement("style");
  style.innerHTML = `.leaflet-routing-container { display: none !important; }`;
  document.head.appendChild(style);
}

// 💰 ACTUALIZAR COSTOS con recargo y hora real
function actualizarCostos(recargoTexto = "", hora = new Date().getHours()) {
  const subtotal = Number(localStorage.getItem("cartTotal")) || 0;
  const total = subtotal + costoDomicilio;

  const formatoPesos = (valor) =>
    valor.toLocaleString("es-CO", { minimumFractionDigits: 0 });

  document.getElementById("subtotal").textContent = `$${formatoPesos(
    subtotal
  )}`;
  document.getElementById("domicilio-cost").textContent = `$${formatoPesos(
    costoDomicilio
  )}${recargoTexto}`;
  document.getElementById("total").textContent = `$${formatoPesos(total)}`;

  document.getElementById("recargo-nocturno").style.display =
    hora >= 22 || hora < 6 ? "block" : "none";
}

// ================================
// 🔵 REDONDEAR AL CIENTO MÁS CERCANO
// ================================
function redondearACien(valor) {
  return Math.ceil(valor / 100) * 100;
}

// ================================
// ✅ VALIDACIONES DEL FORMULARIO DEL CLIENTE
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("customer-name");
  const phoneInput = document.getElementById("customer-phone");
  const mesaInput = document.getElementById("customer-mesa");

  // 🧍 Solo letras y espacios en el nombre
  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
  });

  // 📞 Solo números y un solo +
  phoneInput.addEventListener("input", () => {
    // Permite un + solo al inicio y luego solo dígitos
    phoneInput.value = phoneInput.value
      .replace(/[^\d+]/g, "") // Elimina cualquier carácter que no sea número o +
      .replace(/(?!^)\+/g, ""); // Elimina cualquier + que no esté al inicio
  });

  // 🍽️ Solo números en número de mesa
  if (mesaInput) {
    mesaInput.addEventListener("input", () => {
      mesaInput.value = mesaInput.value.replace(/\D/g, "");
    });
  }
});

// ================================
// 🧾 FINALIZAR PEDIDO (SIEMPRE PIDE DATOS) Y ENVIAR A WHATSAPP
// ================================
function finalizarPedido() {
  // ⚠️ Verificar si el cliente seleccionó una ubicación válida
  if (!markerUsuario || !map.hasLayer(markerUsuario)) {
    alert("Por favor selecciona una ubicación antes de continuar.");
    return;
  }

  const { lat, lng } = markerUsuario.getLatLng();

  // Si el marcador no se ha movido de la posición inicial de la tienda
  if (lat === tiendaCoords[0] && lng === tiendaCoords[1]) {
    alert("Por favor selecciona una ubicación válida antes de continuar.");
    return;
  }

  // Mostrar siempre el modal para confirmar nombre y teléfono
  const modal = document.getElementById("customer-modal");
  const form = document.getElementById("customer-form");

  // Precargar valores guardados (si existen)
  document.getElementById("customer-name").value =
    localStorage.getItem("customerName") || "";
  document.getElementById("customer-phone").value =
    localStorage.getItem("customerPhone") || "";

  modal.classList.add("show");

  form.onsubmit = (e) => {
    e.preventDefault();

    const nombre = document.getElementById("customer-name").value.trim();
    const telefono = document.getElementById("customer-phone").value.trim();

    if (!nombre || !telefono) {
      alert("Por favor completa tu nombre y teléfono antes de continuar.");
      return;
    }

    // Guardar datos para próximos pedidos
    localStorage.setItem("customerName", nombre);
    localStorage.setItem("customerPhone", telefono);

    modal.classList.remove("show");

    // Continuar con el flujo de envío a WhatsApp
    enviarPedidoDomicilio(nombre, telefono);
  };
}

// ================================
// 🚀 CONSTRUIR Y ENVIAR PEDIDO (DOMICILIO)
// ================================
function enviarPedidoDomicilio(nombre, telefono) {
  const direccion = document.getElementById("buscar").value.trim();
  const referencia = document.getElementById("referencia").value.trim();
  const metodoPago = localStorage.getItem("metodoPago") || "No especificado";
  const observaciones = localStorage.getItem("cartObservaciones") || "";
  const { lat, lng } = markerUsuario.getLatLng();

  const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  const subtotal = Number(localStorage.getItem("cartTotal")) || 0;
  const totalPagar = subtotal + costoDomicilio;
  const propina = Math.round(totalPagar * 0.1);
  const totalConPropina = totalPagar + propina;

  // Generar factura
  const factura = generarFacturaId(nombre, telefono);

  const pedido = {
    tipoEntrega: "Domicilio",
    factura,
    fecha: new Date().toLocaleDateString("es-CO"),
    hora: new Date().toLocaleTimeString("es-CO", { hour12: false }),
    cliente: { nombre, telefono },
    direccion,
    referencia,
    productos: carrito.map((p) => ({
      nombre: p.name,
      precio: p.price,
      cantidad: p.quantity,
      instrucciones: p.instructions || "",
    })),
    subtotal,
    costoDomicilio,
    total: totalPagar,
    metodoPago,
    propina,
    totalConPropina,
    observaciones,
    ubicacion: `https://www.google.com/maps?q=${lat},${lng}`,
  };

  enviarPedidoWhatsApp(pedido);
  enviarPedidoASheets(pedido);

  // ✅ VACIAR CARRITO AUTOMÁTICAMENTE DESPUÉS DE ENVIAR PEDIDO
  try {
    localStorage.removeItem("cart");
    if (typeof cart !== "undefined") cart = [];
    if (typeof updateCartDisplay === "function") updateCartDisplay();
    if (typeof renderCartItems === "function") renderCartItems();
  } catch (e) {}
}

// ================================
// 🧮 Generar ID de factura único
// ================================
function generarFacturaId(nombre, telefono) {
  const prefijo = nombre.substring(0, 3).toUpperCase();
  const sufijo = telefono.slice(-3);
  const now = new Date();
  const año = now.getFullYear().toString().slice(-2);
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  const hora = String(now.getHours()).padStart(2, "0");
  const minutos = String(now.getMinutes()).padStart(2, "0");
  const segundos = String(now.getSeconds()).padStart(2, "0");
  return `#${prefijo}${sufijo}${año}${mes}${dia}${hora}${minutos}${segundos}`;
}

// ================================
// 🔧 Cerrar modal
// ================================
function closeCustomerModal() {
  document.getElementById("customer-modal").classList.remove("show");
}

// ================================
// 🗺️ Inicialización
// ================================
window.addEventListener("DOMContentLoaded", async () => {
  await cargarConfig(); // primero carga el JSON
  initMap(); // luego inicializa el mapa
  actualizarCostos(); // finalmente actualiza los costos
});

//boton de localicacion automatica en una posicion buena

const panel = document.getElementById("panel-totales");
const btnLocate = document.getElementById("btn-ubicacion");

function posicionarBoton() {
  // Altura total del panel
  const alturaPanel = panel.offsetHeight;

  // Posicionamos el botón justo encima del panel
  btnLocate.style.bottom = `${alturaPanel + 20}px`; // +10px para separarlo un poco
}

// Inicial
posicionarBoton();

// Actualiza la posición si cambia el tamaño del panel
const observer = new MutationObserver(posicionarBoton);
observer.observe(panel, { childList: true, subtree: true, attributes: true });

// También al redimensionar la ventana
window.addEventListener("resize", posicionarBoton);
