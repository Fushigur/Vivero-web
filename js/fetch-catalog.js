import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const catalogGrid = document.getElementById("catalogGrid");
  if (!catalogGrid) return;

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const uniqueCategories = new Set();
    const articles = [];

    // Inyectamos cada tarjeta nueva proveniente de la nube
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        uniqueCategories.add(data.category);
      }

      const article = document.createElement("article");
      article.className = "product-card firebase-card";
      article.dataset.category = data.category || "otro";
      article.setAttribute("data-aos", "fade-up");

      const waMessage = `¡Hola! Me interesa la planta "${data.name}". Puedes ver su foto aquí: ${data.imageUrl}`;
      const waUrl = `https://wa.me/529842047672?text=${encodeURIComponent(waMessage)}`;

      article.innerHTML = `
        <div class="product-image">
          <img loading="lazy" src="${data.imageUrl}" alt="${data.name}" />
          <span class="product-badge">${data.badge}</span>
        </div>
        <div class="product-content">
          <h3>${data.name}</h3>
          <p>${data.description}</p>
          <div class="product-meta" style="justify-content: center;">
            <a href="${waUrl}" target="_blank" class="btn-main" style="padding: 0.8rem 1rem; width: 100%; text-align: center;">
              <i class="fab fa-whatsapp" style="margin-right: 5px;"></i> Pedir Planta
            </a>
          </div>
        </div>
      `;
      // Añadimos al inicio (prepend) para que aprenzan primero
      catalogGrid.prepend(article);
      articles.push(article);
    });

    // Lógica de creación de botones dinámicos
    const filterContainer = document.getElementById("filterButtonsContainer");
    if (filterContainer && uniqueCategories.size > 0) {
      uniqueCategories.forEach(category => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.dataset.filter = category;
        // Capitalizar la primera letra
        btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        filterContainer.appendChild(btn);
      });

      // Lógica de filtrado al hacer click
      const allFilterBtns = filterContainer.querySelectorAll(".filter-btn");
      allFilterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          // Remover active de todos
          allFilterBtns.forEach(b => b.classList.remove("active"));
          // Agregar active al clickeado
          btn.classList.add("active");

          const filterValue = btn.dataset.filter;

          // Mostrar/ocultar artículos
          catalogGrid.querySelectorAll(".product-card").forEach(card => {
            if (filterValue === "all" || card.dataset.category === filterValue) {
              card.style.display = "block";
            } else {
              card.style.display = "none";
            }
          });
        });
      });
    }

  } catch (err) {
    console.error("Error cargando el catálogo de Firebase:", err);
  }
});
