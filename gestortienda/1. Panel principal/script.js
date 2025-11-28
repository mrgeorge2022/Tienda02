const API_URL =
  "https://script.google.com/macros/s/AKfycbxE5905w07prM6Om7B972nZilOZOEi_IUgX2Cixf98F9t-U8A9ClVxq5pyRjXAt5Zg/exec";
let products = [];
let originalData = {};
let isNewProduct = false;




// ==== LOADER ANIMACION ====
const loader = document.getElementById("loaderOverlay");
const loaderText = document.getElementById("loaderText");

function showLoader(message = "Cargando...") {
  loaderText.textContent = message;
  loader.classList.add("active");
}

function hideLoader() {
  loader.classList.remove("active");
}


async function fetchProducts() {
  showLoader("Cargando productos...");
  const res = await fetch(API_URL);
  products = await res.json();
  renderProducts(products);
  hideLoader();
}


// ==== Renderizar tarjetas ====
// ==== Renderizar tarjetas ====
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  list.forEach((p) => {
    const isActive =
      p.activo === true ||
      p.activo === "TRUE" ||
      p.activo === 1 ||
      p.activo === "1";

    // 🧮 Formatear precio en pesos colombianos (COP)
    const formattedPrice = Number(p.precio)
      ? Number(p.precio).toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        })
      : "$0";

    const card = document.createElement("div");
    card.className = "card";
    card.id = `product-${p.id}`; // 💡 Se agregó ID único para cada producto

    card.innerHTML = `
      <img src="${
        p.imagen || "https://mrgeorge2022.github.io/Uploader/imagenes/default.jpg"
      }" alt="${p.nombre}">
      <span class="badge ${isActive ? "activo" : "inactivo"}">
        ${isActive ? "Activo" : "Inactivo"}
      </span>
      <div class="card-content">
        <h3>${p.nombre}</h3>
        <p class="categoria">${p.categoria}</p>
        <p class="precio"><b>${formattedPrice}</b></p>
      </div>
    `;

    card.onclick = () => openModal(p);
    grid.appendChild(card);
  });
}





// ==== Modal ====
const modal = document.getElementById("productModal");
const closeModalBtn = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
closeModalBtn.onclick = () => (modal.style.display = "none");

// ==== Abrir modal para editar ====
function openModal(p) {
  isNewProduct = false;
  fillModal(p);
  originalData = { ...p };
  resetSaveButton();
  deleteBtn.style.display = "inline-block";
  modal.style.display = "flex";
}

// ==== Abrir modal vacío para nuevo producto ====
document.getElementById("addProductBtn").onclick = () => {
  isNewProduct = true;
  const nextId = getNextId();
  clearModal();
  document.getElementById("editId").value = nextId;
  deleteBtn.style.display = "none";
  modal.style.display = "flex";
  saveBtn.textContent = "➕ Agregar Producto";
  saveBtn.style.background = "#007bff";
};

function getNextId() {
  const ids = products.map((p) => parseInt(p.id)).filter((n) => !isNaN(n));
  return Math.max(...ids) + 1;
}

// ==== Llenar modal ====
function fillModal(p) {
  document.getElementById("editId").value = p.id;
  document.getElementById("editNombre").value = p.nombre;
  document.getElementById("editCategoria").value = p.categoria;
  document.getElementById("editConfig").value = p.config || "";
  document.getElementById("editPrecio").value = p.precio;
  document.getElementById("editImagen").value = p.imagen;
  document.getElementById("editDescripcion").value = p.descripcion;

  // --- Estado activo/inactivo ---
  const isActive =
    p.activo === true || p.activo === "TRUE" || p.activo === 1 || p.activo === "1";

  const checkbox = document.getElementById("editActivo");
  const label = document.getElementById("activoLabel");

  checkbox.checked = isActive;

  // 🔹 Sincronizar texto y color al abrir modal
  if (isActive) {
    label.textContent = "Activo 🟢";
    label.classList.remove("inactivo");
    label.classList.add("activo");
  } else {
    label.textContent = "Inactivo 🔴";
    label.classList.remove("activo");
    label.classList.add("inactivo");
  }

  // Imagen de vista previa
  document.getElementById("modalImg").src =
    p.imagen || "https://via.placeholder.com/300x180?text=Sin+Imagen";
}


function clearModal() {
  document
    .querySelectorAll("#productModal input, #productModal textarea")
    .forEach((el) => (el.value = ""));
  document.getElementById("editActivo").checked = true;
  document.getElementById("modalImg").src =
    "https://mrgeorge2022.github.io/Uploader/imagenes/default.jpg";
  document.getElementById("editConfig").value = "";
}


// ==== FORMATEO AUTOMÁTICO DE NOMBRE Y PRECIO ====

// 🧩 Capitalizar cada palabra del nombre del producto
const inputNombre = document.getElementById("editNombre");
inputNombre.addEventListener("input", (e) => {
  let valor = e.target.value
    .toLowerCase()
    .replace(/\s+/g, " ") // elimina espacios dobles
    .trim()
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase()); // capitaliza cada palabra
  e.target.value = valor;
});

// 💰 Permitir cualquier cantidad de dígitos y formatear como COP
const inputPrecio = document.getElementById("editPrecio");

inputPrecio.addEventListener("input", (e) => {
  let cursorPos = e.target.selectionStart;
  let valorOriginal = e.target.value;


  if (soloNumeros === "") {
    e.target.value = "";
    return;
  }

  // Formatear con puntos cada 3 dígitos desde el final
  let valorFormateado = "";
  let len = soloNumeros.length;
  for (let i = 0; i < len; i++) {
    valorFormateado = soloNumeros[len - 1 - i] + valorFormateado;
    if ((i + 1) % 3 === 0 && i !== len - 1) {
      valorFormateado = "." + valorFormateado;
    }
  }

  e.target.value = valorFormateado;

  // Ajustar la posición del cursor
  let diff = e.target.value.length - valorOriginal.length;
  e.target.selectionStart = e.target.selectionEnd = cursorPos + diff;
});




// 🧮 Función auxiliar: convertir formato visual a número puro (sin puntos)
function getNumericValue(precioFormateado) {
  return precioFormateado.replace(/\./g, "");
}

 // ==== Detectar cambios ====

document
  .querySelectorAll(
    "#productModal input, #productModal textarea, #productModal select"
  )
  .forEach((el) => {
    const eventType =
      el.tagName.toLowerCase() === "select" ? "change" : "input";
    el.addEventListener(eventType, () => {
      if (!isNewProduct && hasChanges()) {
        activateSaveButton();
      } else if (!hasChanges()) {
        resetSaveButton();
      }
    });
  });

// ==== CAMBIO VISUAL DEL ESTADO ACTIVO ====
document.getElementById("editActivo").addEventListener("change", (e) => {
  const label = document.getElementById("activoLabel");
  if (e.target.checked) {
    label.textContent = "Activo 🟢";
    label.classList.remove("inactivo");
    label.classList.add("activo");
  } else {
    label.textContent = "Inactivo 🔴";
    label.classList.remove("activo");
    label.classList.add("inactivo");
  }
});

function hasChanges() {
  return (
    document.getElementById("editNombre").value !== originalData.nombre ||
    document.getElementById("editCategoria").value !== originalData.categoria ||
    document.getElementById("editConfig").value !==
      (originalData.config || "") ||
    document.getElementById("editPrecio").value != originalData.precio ||
    document.getElementById("editImagen").value !== originalData.imagen ||
    document.getElementById("editDescripcion").value !==
      originalData.descripcion ||
    document.getElementById("editActivo").checked !=
      (originalData.activo === true ||
        originalData.activo === "TRUE" ||
        originalData.activo === 1)
  );
}

function activateSaveButton() {
  saveBtn.textContent = isNewProduct ? "➕ Agregar Producto" : "🔄 Actualizar";
  saveBtn.classList.add("btn-active");
  saveBtn.style.background = isNewProduct ? "#007bff" : "#28a745";
  saveBtn.style.transform = "scale(1.08)";
}

function resetSaveButton() {
  saveBtn.textContent = isNewProduct ? "➕ Agregar Producto" : "💾 Guardar";
  saveBtn.classList.remove("btn-active");
  saveBtn.style.background = "#ff7b00";
  saveBtn.style.transform = "scale(1)";
}

// ==== Vista previa de imagen ====
document.getElementById("editImagen").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  document.getElementById("modalImg").src =
    url || "https://via.placeholder.com/300x180?text=Sin+Imagen";
});

// ==== Guardar / Actualizar ====
saveBtn.onclick = async () => {
  const body = {
    id: document.getElementById("editId").value,
    nombre: document.getElementById("editNombre").value.trim(),
    categoria: document.getElementById("editCategoria").value,
    config: document.getElementById("editConfig").value,
    precio: getNumericValue(document.getElementById("editPrecio").value),
    imagen: document.getElementById("editImagen").value.trim(),
    descripcion: document.getElementById("editDescripcion").value.trim(),
    activo: document.getElementById("editActivo").checked,
  };

  const action = isNewProduct ? "add" : "update";

  showLoader(isNewProduct ? "Agregando nuevo producto..." : "Actualizando producto...");

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action, ...body }),
  });

  hideLoader();
  modal.style.display = "none";
  fetchProducts();
};



// ==== Eliminar ====
deleteBtn.onclick = async () => {
  const id = document.getElementById("editId").value;
  if (!confirm("¿Eliminar este producto?")) return;

  showLoader("Eliminando producto...");
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  });
  hideLoader();

  modal.style.display = "none";
  fetchProducts();
};


// ==== Buscador ====
document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q)
  );
  renderProducts(filtered);
});

fetchProducts();

// === PANEL LATERAL (MENU HAMBURGUESA) ===
function openSidePanel() {
  const panel = document.getElementById('sidePanel');
  if (panel) panel.classList.add('open');
  panel && panel.setAttribute('aria-hidden', 'false');
}

function closeSidePanel() {
  const panel = document.getElementById('sidePanel');
  if (panel) panel.classList.remove('open');
  panel && panel.setAttribute('aria-hidden', 'true');
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closePanel');
  const panel = document.getElementById('sidePanel');

  if (menuBtn) menuBtn.addEventListener('click', openSidePanel);
  if (closeBtn) closeBtn.addEventListener('click', closeSidePanel);

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidePanel();
  });

  // Cerrar al hacer click fuera del panel
  document.addEventListener('click', (e) => {
    if (!panel) return;
    if (!panel.classList.contains('open')) return;
    if (!panel.contains(e.target) && !menuBtn.contains(e.target)) {
      closeSidePanel();
    }
  });
});
