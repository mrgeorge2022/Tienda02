// =======================================================
// Archivo: productos-variable.js
// Propósito: Centralizar funciones reutilizables para productos configurables
// como pizzas y almuerzos. Expone el objeto global `ProductosVariable`.
// =======================================================

(function () {

  // ========================================
  // 🧹 UTILIDAD: Eliminar opciones previas
  // ========================================
  function removeProductConfigOptions() {
    const existing = document.getElementById("extra-options");
    if (existing) existing.remove();
  }

  // ========================================
  // 🧩 RENDER PRINCIPAL DE OPCIONES
  // ========================================
  function renderProductConfigOptions(configType) {
    removeProductConfigOptions();
    if (!configType) return;

    const type = String(configType).toLowerCase().trim();
    const modalContainer = document.querySelector("#product-modal .product-modal-content");
    const instructionsSection = document.querySelector(".instructions-section");
    if (!modalContainer || !instructionsSection) return;

    const customOptions = document.createElement("div");
    customOptions.id = "extra-options";
    customOptions.style.marginTop = "10px";

    // =======================================================
    // 🍕 SECCIÓN: CONFIGURACIÓN DE PIZZAS
    // =======================================================
    if (type === "manualpizza") {
      customOptions.innerHTML = `
        <h4 style="margin-bottom: 8px;">Personaliza tu pizza</h4>

        <label style="font-weight: bold;">Tamaño:</label>
        <div id="pizza-size" style="margin-bottom: 10px;">
            <label><input type="checkbox" value="Personal"> Personal</label><br>
            <label><input type="checkbox" value="Mediana"> Mediana</label><br>
            <label><input type="checkbox" value="Grande"> Grande</label><br>
        </div>

        <label style="font-weight: bold;">Ingredientes:</label>
        <div id="pizza-ingredients" style="margin-bottom: 10px;">
            <label><input type="checkbox" value="Peperoni"> Peperoni</label><br>
            <label><input type="checkbox" value="Extra queso"> Extra queso</label><br>
            <label><input type="checkbox" value="Champiñones"> Champiñones</label><br>
            <label><input type="checkbox" value="Tocineta"> Tocineta</label><br>
        </div>
      `;
    }

    // =======================================================
    // 🍛 SECCIÓN: CONFIGURACIÓN DE ALMUERZOS
    // =======================================================
    else if (type === "manualalmuerzo") {
      customOptions.innerHTML = `
        <h4 style="margin-bottom: 8px;">Personaliza tu almuerzo</h4>

        <label style="font-weight: bold;">Proteína:</label>
        <div id="almuerzo-proteina" style="margin-bottom: 10px;">
            <label><input type="checkbox" value="Carne asada"> Carne asada</label><br>
            <label><input type="checkbox" value="Carne en bistec"> Carne en bistec</label><br>
            <label><input type="checkbox" value="Chuleta de cerdo"> Chuleta de cerdo</label><br>
            <label><input type="checkbox" value="Masa de cerdo"> Masa de cerdo</label><br>
            <label><input type="checkbox" value="Pollo frito"> Pollo frito</label><br>
        </div>

        <label style="font-weight: bold;">Grano:</label>
        <div id="almuerzo-grano" style="margin-bottom: 10px;">
            <label><input type="checkbox" value="Lentejas"> Lentejas</label><br>
            <label><input type="checkbox" value="Frijoles"> Frijoles</label><br>
        </div>

        <label style="font-weight: bold;">Ensalada:</label>
        <div id="almuerzo-ensalada" style="margin-bottom: 10px;">
            <label><input type="checkbox" value="Aguacate, tomate y cebolla"> Aguacate, tomate y cebolla</label><br>
            <label><input type="checkbox" value="Lechuga, pepino y cebolla"> Lechuga, pepino y cebolla</label><br>
        </div>

        <label style="font-weight: bold;">Sobremesa (opcional):</label>
        <div id="almuerzo-sobremesa" style="margin-bottom: 10px;">
            <label><input type="checkbox" value="Patacones"> Patacones</label><br>
            <label><input type="checkbox" value="Papas a la francesa"> Papas a la francesa</label><br>
            <label><input type="checkbox" value="Tajadas amarillas"> Tajadas amarillas</label><br>
        </div>
      `;

      // ⚙️ Limitar selección: solo una opción por categoría principal
      setTimeout(() => {
        const limitarUnaSeleccion = (selector) => {
          const opciones = document.querySelectorAll(`${selector} input[type="checkbox"]`);
          opciones.forEach(chk => {
            chk.addEventListener("change", (e) => {
              if (e.target.checked) {
                opciones.forEach((o) => {
                  if (o !== e.target) o.checked = false;
                });
              }
            });
          });
        };

        limitarUnaSeleccion("#almuerzo-proteina");
        limitarUnaSeleccion("#almuerzo-grano");
        limitarUnaSeleccion("#almuerzo-ensalada");
        limitarUnaSeleccion("#almuerzo-sobremesa"); // ✅ ahora sobremesa solo permite 1 o ninguna
      }, 50);
    }

    // =======================================================
    // 🚫 CASO: TIPO DESCONOCIDO
    // =======================================================
    else {
      customOptions.innerHTML = `<div style="color:#666; font-size:0.9rem;">Opciones adicionales disponibles</div>`;
    }

    // Insertar en el modal
    modalContainer.insertBefore(customOptions, instructionsSection);
  }

  // ========================================
  // 📋 RECOGER OPCIONES SELECCIONADAS
  // ========================================
  function collectProductConfigInstructions() {
    const parts = [];

    // -----------------------------
    // 🍕 PIZZA
    // -----------------------------
    const pizzaSize = Array.from(document.querySelectorAll('#pizza-size input[type="checkbox"]:checked')).map((i) => i.value);
    const pizzaIngredients = Array.from(document.querySelectorAll('#pizza-ingredients input[type="checkbox"]:checked')).map((i) => i.value);
    const pizzaNotes = document.getElementById("pizza-extra")?.value?.trim();

    if (pizzaSize.length) parts.push(`Tamaño: ${pizzaSize.join(", ")}`);
    if (pizzaIngredients.length) parts.push(`Ingredientes: ${pizzaIngredients.join(", ")}`);
    if (pizzaNotes) parts.push(`Notas: ${pizzaNotes}`);

    // -----------------------------
    // 🍛 ALMUERZO
    // -----------------------------
    const proteinas = Array.from(document.querySelectorAll('#almuerzo-proteina input[type="checkbox"]:checked')).map(i => i.value);
    const granos = Array.from(document.querySelectorAll('#almuerzo-grano input[type="checkbox"]:checked')).map(i => i.value);
    const ensaladas = Array.from(document.querySelectorAll('#almuerzo-ensalada input[type="checkbox"]:checked')).map(i => i.value);
    const sobremesas = Array.from(document.querySelectorAll('#almuerzo-sobremesa input[type="checkbox"]:checked')).map(i => i.value);

    // 🔒 Validar campos obligatorios
    const isAlmuerzo = document.getElementById("almuerzo-proteina") !== null;
    if (isAlmuerzo) {
      if (proteinas.length === 0 || granos.length === 0 || ensaladas.length === 0) {
        alert("🍽️ Por favor selecciona una proteína, un grano y una ensalada antes de continuar.");
        return null;
      }
    }

    if (proteinas.length) parts.push(`Proteína: ${proteinas.join(", ")}`);
    if (granos.length) parts.push(`Grano: ${granos.join(", ")}`);
    if (ensaladas.length) parts.push(`Ensalada: ${ensaladas.join(", ")}`);
    if (sobremesas.length) parts.push(`Sobremesa: ${sobremesas.join(", ")}`);

    return parts.join(" | ");
  }

  // ========================================
  // 🌎 EXPORTAR FUNCIONES
  // ========================================
  window.ProductosVariable = {
    renderProductConfigOptions,
    removeProductConfigOptions,
    collectProductConfigInstructions,
  };

})();
