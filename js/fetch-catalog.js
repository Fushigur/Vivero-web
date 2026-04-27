import { db } from "./firebase-config.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const catalogGrid = document.getElementById("catalogGrid");
  if (!catalogGrid) return;

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    // Inyectamos cada tarjeta nueva proveniente de la nube
    snapshot.forEach((doc) => {
      const data = doc.data();
      const article = document.createElement("article");
      article.className = "product-card firebase-card";
      article.dataset.category = data.category;
      article.setAttribute("data-aos", "fade-up");
      
      const waMessage = `¡Hola! Me interesa la planta "${data.name}". Puedes ver su foto aquí: ${data.imageUrl}`;
      const waUrl = `https://wa.me/529842342665?text=${encodeURIComponent(waMessage)}`;

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
    });

  } catch (err) {
    console.error("Error cargando el catálogo de Firebase:", err);
  }
});
