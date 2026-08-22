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

  // Variables de Estado del Catálogo
  let allProducts = [];
  let activeCategory = "all";
  let activeSearchQuery = "";
  let currentPageLimit = 8;

  // Cargar Catálogo desde Firebase Firestore
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const uniqueCategories = new Set();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const product = {
        id: doc.id,
        name: data.name || "",
        category: data.category || "otro",
        badge: data.badge || "",
        description: data.description || "",
        imageUrl: data.imageUrl || ""
      };
      
      allProducts.push(product);
      
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });

    // Inicializar Renderizado Paginado
    filterAndRenderProducts();

    // Cargar Categorías oficiales desde Firebase
    let categoriesList = [];
    try {
      const catQ = query(collection(db, "categories"), orderBy("name", "asc"));
      const catSnapshot = await getDocs(catQ);
      catSnapshot.forEach(docSnap => {
        categoriesList.push({
          id: docSnap.id,
          name: docSnap.data().name
        });
      });
    } catch (catErr) {
      console.warn("No se pudo cargar la colección oficial de categorías, se usará fallback:", catErr);
    }

    // Fallback: Si la colección oficial está vacía, usamos las categorías de los productos
    if (categoriesList.length === 0 && uniqueCategories.size > 0) {
      uniqueCategories.forEach(category => {
        categoriesList.push({
          id: category.toLowerCase().trim(),
          name: category.charAt(0).toUpperCase() + category.slice(1)
        });
      });
      categoriesList.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Lógica de botones dinámicos de categorías
    const filterContainer = document.getElementById("filterButtonsContainer");
    if (filterContainer && categoriesList.length > 0) {
      categoriesList.forEach(category => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.dataset.filter = category.id;
        btn.textContent = category.name;
        filterContainer.appendChild(btn);
      });

      // Configurar clicks de botones de filtrado
      const allFilterBtns = filterContainer.querySelectorAll(".filter-btn");
      allFilterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          allFilterBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          activeCategory = btn.dataset.filter;
          currentPageLimit = 8; // Resetear paginación al cambiar de filtro
          filterAndRenderProducts();
        });
      });
    }

  } catch (err) {
    console.error("Error cargando el catálogo de Firebase:", err);
  }

  // Función Unificada de Filtrado y Renderizado
  function filterAndRenderProducts() {
    catalogGrid.innerHTML = "";

    // Filtrar por categoría activa Y término de búsqueda
    const filtered = allProducts.filter(product => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      
      const searchLower = activeSearchQuery.toLowerCase().trim();
      const nameLower = product.name.toLowerCase();
      const descLower = product.description.toLowerCase();
      const catLower = product.category.toLowerCase();
      
      const matchesSearch = !searchLower || 
        nameLower.includes(searchLower) || 
        descLower.includes(searchLower) ||
        catLower.includes(searchLower);
        
      return matchesCategory && matchesSearch;
    });

    // Paginación
    const visibleProducts = filtered.slice(0, currentPageLimit);

    if (filtered.length === 0) {
      catalogGrid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--muted);">
          <i class="fas fa-search-minus" style="font-size: 3rem; margin-bottom: 1rem; color: rgba(47, 111, 31, 0.2);"></i>
          <p style="font-size: 1.1rem; font-weight: 500;">No encontramos plantas que coincidan con tu búsqueda.</p>
          <p style="font-size: 0.95rem; opacity: 0.8; margin-top: 5px;">Prueba buscando otro tipo o limpia el buscador.</p>
        </div>
      `;
    }

    // Dibujar tarjetas visibles
    visibleProducts.forEach(data => {
      const article = document.createElement("article");
      article.className = "product-card firebase-card product-card-fade-in";
      article.dataset.category = data.category;
      
      const waMessage = `¡Hola! Me interesa la planta "${data.name}". Puedes ver su foto aquí: ${data.imageUrl}`;
      const waUrl = `https://wa.me/529842342665?text=${encodeURIComponent(waMessage)}`;

      article.innerHTML = `
        <div class="product-image">
          <img loading="lazy" src="${data.imageUrl}" alt="${data.name}" style="cursor: zoom-in;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' fill=\'%232f6f1f\'><rect width=\'100\' height=\'100\' fill=\'%23f4faf0\'/><path d=\'M50 25c-8.3 0-15 6.7-15 15 0 5 2.5 9.5 6.3 12.2l-3.3 22.8h24l-3.3-22.8c3.8-2.7 6.3-7.2 6.3-12.2 0-8.3-6.7-15-15-15zm0 5c5.5 0 10 4.5 10 10 0 3.7-2 6.8-5 8.7V38c0-1.7-1.3-3-3-3s-3 1.3-3 3v10.7c-3-1.9-5-5-5-8.7 0-5.5 4.5-10 10-10zm-6 40l1.8-12h8.4l1.8 12H44z\' fill=\'%232f6f1f\'/></svg>';" />
          ${data.badge ? `<span class="product-badge">${data.badge}</span>` : ""}
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

      // Evento de zoom en Lightbox global
      const img = article.querySelector(".product-image img");
      img.addEventListener("click", () => {
        if (typeof window.openLightboxGalleryGlobal === "function") {
          // Obtener todas las imágenes visibles en el grid actual para navegar entre ellas
          const visibleImgs = Array.from(document.querySelectorAll("#catalogGrid .product-image img")).map(el => el.getAttribute("src"));
          const currentIdx = visibleImgs.indexOf(data.imageUrl);
          window.openLightboxGalleryGlobal(visibleImgs, currentIdx >= 0 ? currentIdx : 0);
        }
      });

      catalogGrid.appendChild(article);
    });

    // Controlar visibilidad del botón Cargar Más
    const loadMoreContainer = document.getElementById("catalogLoadMoreContainer");
    if (loadMoreContainer) {
      if (filtered.length > currentPageLimit) {
        loadMoreContainer.style.display = "flex";
      } else {
        loadMoreContainer.style.display = "none";
      }
    }
  }

  // --- LÓGICA DEL BUSCADOR ---
  const searchInput = document.getElementById("catalogSearchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeSearchQuery = e.target.value;
      currentPageLimit = 8; // Resetear límite al buscar

      if (clearSearchBtn) {
        clearSearchBtn.style.display = activeSearchQuery.length > 0 ? "block" : "none";
      }

      filterAndRenderProducts();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
      }
      activeSearchQuery = "";
      clearSearchBtn.style.display = "none";
      currentPageLimit = 8;
      filterAndRenderProducts();
    });
  }

  // --- LÓGICA DE BOTÓN CARGAR MÁS ---
  const btnLoadMore = document.getElementById("btnLoadMore");
  if (btnLoadMore) {
    btnLoadMore.addEventListener("click", () => {
      currentPageLimit += 8;
      filterAndRenderProducts();
    });
  }

  // ==========================================
  // --- LÓGICA DEL QUIZ / ASISTENTE VIRTUAL ---
  // ==========================================
  const quizModal = document.getElementById("quizModal");
  const btnOpenQuiz = document.getElementById("btnOpenQuiz");
  const btnCloseQuiz = document.getElementById("btnCloseQuiz");
  const quizProgressBar = document.getElementById("quizProgressBar");
  const quizSteps = document.querySelectorAll(".quiz-step");
  const quizPrevBtns = document.querySelectorAll(".btn-quiz-prev");
  const btnRestartQuiz = document.getElementById("btnRestartQuiz");
  const quizResultsContainer = document.getElementById("quizResultsContainer");

  let quizAnswers = {
    step1: null, // ubicación (sombra, sol, semisombra)
    step2: null, // cuidado (facil, estandar)
    step3: null  // objetivo (flores, verde, huerto)
  };
  let currentQuizStep = 1;

  // Abrir Quiz
  if (btnOpenQuiz && quizModal) {
    btnOpenQuiz.addEventListener("click", () => {
      quizModal.classList.add("show");
      document.body.style.overflow = "hidden"; // Desactivar scroll fondo
      resetQuiz();
    });
  }

  // Cerrar Quiz
  if (btnCloseQuiz && quizModal) {
    btnCloseQuiz.addEventListener("click", () => {
      quizModal.classList.remove("show");
      document.body.style.overflow = ""; // Reactivar scroll fondo
    });
  }

  // Cerrar Quiz al hacer clic fuera del contenido
  if (quizModal) {
    quizModal.addEventListener("click", (e) => {
      if (e.target === quizModal) {
        quizModal.classList.remove("show");
        document.body.style.overflow = "";
      }
    });
  }

  // Resetear Quiz
  function resetQuiz() {
    quizAnswers = { step1: null, step2: null, step3: null };
    currentQuizStep = 1;
    updateQuizStepView();
    // Limpiar selección visual en las tarjetas
    document.querySelectorAll(".quiz-option-card").forEach(card => {
      card.classList.remove("selected");
    });
  }

  // Reiniciar Quiz desde Resultados
  if (btnRestartQuiz) {
    btnRestartQuiz.addEventListener("click", resetQuiz);
  }

  // Navegar al paso anterior
  quizPrevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentQuizStep > 1) {
        currentQuizStep--;
        updateQuizStepView();
      }
    });
  });

  // Configurar clicks de tarjetas de opciones
  const optionCards = document.querySelectorAll(".quiz-option-card");
  optionCards.forEach(card => {
    card.addEventListener("click", () => {
      const stepEl = card.closest(".quiz-step");
      const stepNum = parseInt(stepEl.dataset.step);
      const answer = card.dataset.answer;

      // Remover selección en hermanos de este paso
      stepEl.querySelectorAll(".quiz-option-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      // Guardar respuesta
      quizAnswers[`step${stepNum}`] = answer;

      // Avanzar al siguiente paso tras una micro-espera
      setTimeout(() => {
        currentQuizStep = stepNum + 1;
        updateQuizStepView();
        
        // Si llegamos al final (Paso 4), calcula y muestra resultados
        if (currentQuizStep === 4) {
          calculateAndRenderResults();
        }
      }, 350);
    });
  });

  // Actualizar Paso y Progreso visual del Quiz
  function updateQuizStepView() {
    quizSteps.forEach(step => {
      step.classList.remove("active");
      if (parseInt(step.dataset.step) === currentQuizStep) {
        step.classList.add("active");
      }
    });

    // Actualizar Barra de Progreso
    const percentage = ((currentQuizStep - 1) / 3) * 100;
    if (quizProgressBar) {
      // Si está en el paso 1, mostrar 25% de base
      quizProgressBar.style.width = currentQuizStep === 1 ? "25%" : `${Math.max(25, percentage)}%`;
    }
  }

  // Calcular Matches y Dibujar Resultados
  function calculateAndRenderResults() {
    if (!quizResultsContainer) return;
    quizResultsContainer.innerHTML = "";

    // Algoritmo de Puntuación Inteligente
    const scoredProducts = allProducts.map(product => {
      let score = 0;

      // 1. Evaluar Ubicación (Paso 1)
      const ubi = quizAnswers.step1;
      const cat = product.category.toLowerCase();
      const desc = product.description.toLowerCase();
      const name = product.name.toLowerCase();

      if (ubi === "sombra") {
        if (cat === "sombra") score += 12;
        if (desc.includes("interior") || desc.includes("sombra") || desc.includes("poca luz") || desc.includes("indestructible")) score += 6;
        if (cat === "florales" && !desc.includes("interior")) score -= 8;
      } else if (ubi === "sol") {
        if (cat === "florales") score += 12;
        if (desc.includes("sol") || desc.includes("exterior") || desc.includes("clima cálido") || desc.includes("árbol") || desc.includes("sol directo")) score += 6;
        if (cat === "sombra") score -= 10;
      } else if (ubi === "semisombra") {
        if (cat === "ornamental") score += 12;
        if (desc.includes("semisombra") || desc.includes("terraza") || desc.includes("balcón") || desc.includes("luz indirecta")) score += 6;
      }

      // 2. Evaluar Nivel de Cuidado (Paso 2)
      const cuidado = quizAnswers.step2;
      const esResistente = desc.includes("resistente") || desc.includes("poca agua") || desc.includes("indestructible") || desc.includes("fácil") || desc.includes("facil") || cat === "sombra";
      
      if (cuidado === "facil") {
        if (esResistente) score += 10;
        if (product.badge.toLowerCase().includes("indestructible") || product.badge.toLowerCase().includes("fácil")) score += 6;
      } else {
        score += 5; // Cuidado regular se adapta a casi cualquiera
      }

      // 3. Evaluar Interés / Objetivo (Paso 3)
      const obj = quizAnswers.step3;
      if (obj === "flores") {
        if (cat === "florales") score += 15;
        if (desc.includes("flor") || desc.includes("flores") || desc.includes("florece") || desc.includes("color")) score += 10;
      } else if (obj === "verde") {
        if (cat === "ornamental" || cat === "sombra") score += 8;
        if (desc.includes("follaje") || desc.includes("hojas") || desc.includes("verde") || desc.includes("elegante")) score += 12;
        if (desc.includes("flor")) score -= 3; // Menos foco a flores
      } else if (obj === "huerto") {
        if (desc.includes("huerto") || desc.includes("comida") || desc.includes("comestible") || desc.includes("fruto") || desc.includes("chile") || desc.includes("aromática") || name.includes("chile") || name.includes("habanero")) {
          score += 25;
        }
      }

      return { product, score };
    });

    // Ordenar de mayor a menor puntaje
    scoredProducts.sort((a, b) => b.score - a.score);

    // Obtener los mejores 3 matches
    const topMatches = scoredProducts.slice(0, 3);

    // Inyectar tarjetas de recomendación
    topMatches.forEach((match, idx) => {
      const p = match.product;
      const card = document.createElement("div");
      card.className = "quiz-result-card";
      
      const matchBadge = idx === 0 ? "¡Match Perfecto! 💚" : "Excelente Opción ✨";
      
      const waMessage = `¡Hola! Hice el test de plantas en su sitio web y obtuve como recomendación ideal la planta "${p.name}". ¿Tienen existencias disponibles? Foto: ${p.imageUrl}`;
      const waUrl = `https://wa.me/529842342665?text=${encodeURIComponent(waMessage)}`;

      card.innerHTML = `
        <div class="quiz-result-badge">${matchBadge}</div>
        <div class="quiz-result-image">
          <img src="${p.imageUrl}" alt="${p.name}" />
        </div>
        <div class="quiz-result-content">
          <h4>${p.name}</h4>
          <p>${p.description}</p>
          <a href="${waUrl}" target="_blank" class="btn-main" style="padding: 0.8rem 1rem; width: 100%; text-align: center; margin-top: auto;">
            <i class="fab fa-whatsapp" style="margin-right: 5px;"></i> Pedir Planta
          </a>
        </div>
      `;

      quizResultsContainer.appendChild(card);
    });
  }

});
