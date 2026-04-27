import { auth, db, storage } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
  collection, 
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";

// DOM Elements
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const btnLogout = document.getElementById("btnLogout");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const btnLogin = document.getElementById("btnLogin");
const loginError = document.getElementById("loginError");

const addPlantForm = document.getElementById("addPlantForm");
const btnSubmitPlant = document.getElementById("btnSubmitPlant");
const uploadMessage = document.getElementById("uploadMessage");

const plantImageInput = document.getElementById("plantImage");
const imagePreview = document.getElementById("imagePreview");
const uploadText = document.getElementById("uploadText");

// Elementos del Modal
const deleteModal = document.getElementById("deleteModal");
const btnCancelDelete = document.getElementById("btnCancelDelete");
const btnConfirmDelete = document.getElementById("btnConfirmDelete");
let plantToDeleteId = null;
let buttonToDeleteEl = null;

let selectedFile = null;

// Variables Modo Edición
let editModeId = null;
let currentImageUrl = null;
const formTitle = document.getElementById("formTitle");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const plantNameInput = document.getElementById("plantName");
const plantCategoryInput = document.getElementById("plantCategory");
const plantBadgeInput = document.getElementById("plantBadge");
const plantDescriptionInput = document.getElementById("plantDescription");

// Control de Sesión Acual
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Está logueado
    loginSection.classList.remove("show");
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    dashboardSection.classList.add("show");
    btnLogout.classList.remove("hidden");
    loadPlants();
  } else {
    // No está logueado
    loginSection.classList.remove("hidden");
    loginSection.classList.add("show");
    dashboardSection.classList.remove("show");
    dashboardSection.classList.add("hidden");
    btnLogout.classList.add("hidden");
  }
});

// Iniciar Sesión
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  btnLogin.disabled = true;
  btnLogin.textContent = "Verificando...";

  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    // onAuthStateChanged manejará el cambio de pantalla
  } catch (error) {
    loginError.textContent = "Credenciales incorrectas o usuario no encontrado.";
    console.error(error);
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = "Entrar al Sistema";
  }
});

// Cerrar Sesión
btnLogout.addEventListener("click", () => {
  signOut(auth);
});

// Preview de Imagen
plantImageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file;
    uploadText.textContent = file.name;
    const reader = new FileReader();
    reader.onload = function(e) {
      imagePreview.src = e.target.result;
      imagePreview.classList.remove("hidden");
    }
    reader.readAsDataURL(file);
  } else {
    selectedFile = null;
    uploadText.textContent = "Haz clic para seleccionar la imagen";
    imagePreview.classList.add("hidden");
    imagePreview.src = "";
  }
});

// Subir Planta Nueva a Firebase
addPlantForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!editModeId && !selectedFile) {
    showMsg("Por favor, selecciona una imagen.", false);
    return;
  }

  try {
    btnSubmitPlant.disabled = true;
    btnSubmitPlant.textContent = "Guardando resolviendo base de datos...";
    showMsg("", true);

    let finalImageUrl = currentImageUrl; // Si no cambia la foto, mantendremos la actual

    // 1. Subir imagen a ImgBB si hubo una NUEVA imagen
    if (selectedFile) {
      const formData = new FormData();
      formData.append("image", selectedFile);
      
      const imbbResponse = await fetch("https://api.imgbb.com/1/upload?key=a54443db809f2172b0f1ab270b94eeff", {
        method: "POST",
        body: formData
      });
      
      const imgbbData = await imbbResponse.json();
      if (!imgbbData.success) {
        throw new Error("ImgBB falló: " + (imgbbData.error ? imgbbData.error.message : "Desconocido"));
      }
      finalImageUrl = imgbbData.data.url;
    }
    
    // Obtener los valores del form
    const plantName = plantNameInput.value;
    const plantCategory = plantCategoryInput.value;
    const plantBadge = plantBadgeInput.value;
    const plantDescription = plantDescriptionInput.value;

    if (editModeId) {
      // MODO EDICION: Actualizar documento
      await updateDoc(doc(db, "products", editModeId), {
        name: plantName,
        category: plantCategory,
        badge: plantBadge,
        description: plantDescription,
        imageUrl: finalImageUrl
      });
      showMsg("¡Planta actualizada exitosamente!", true);
    } else {
      // MODO CREACION: Guardar nuevo documento en Firestore
      await addDoc(collection(db, "products"), {
        name: plantName,
        category: plantCategory,
        badge: plantBadge,
        description: plantDescription,
        imageUrl: finalImageUrl,
        createdAt: serverTimestamp()
      });
      showMsg("¡Planta agregada exitosamente al catálogo visual!", true);
    }

    addPlantForm.reset();
    plantImageInput.dispatchEvent(new Event("change")); // Limpiar preview
    resetEditMode();
    loadPlants(); // Recargar la lista

  } catch (error) {
    console.error("Error al publicar:", error);
    showMsg("Hubo un error al subir la planta: " + error.message, false);
  } finally {
    btnSubmitPlant.disabled = false;
    btnSubmitPlant.textContent = editModeId ? "Guardar Cambios" : "Subir al Catálogo Público";
  }
});

function showMsg(text, isSuccess) {
  uploadMessage.textContent = text;
  uploadMessage.className = "status-msg " + (isSuccess ? "success" : "error-msg");
}

async function loadPlants() {
  const container = document.getElementById("plantsListContainer");
  if(!container) return;
  container.innerHTML = '<p id="loadingPlants" style="text-align: center; color: var(--primary);">Cargando tus plantas...</p>';
  
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    container.innerHTML = ""; // Limpiar antes de pintar

    if(snapshot.empty) {
      container.innerHTML = '<p style="text-align:center; color:var(--gray);">Aún no tienes plantas subidas.</p>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      const row = document.createElement("div");
      row.className = "admin-plant-row";
      row.innerHTML = `
        <div class="admin-plant-info">
          <img src="${data.imageUrl}" alt="${data.name}">
          <div>
            <h4>${data.name}</h4>
            <span>${data.category}</span>
          </div>
        </div>
        <div class="admin-actions">
          <button class="btn-edit" data-id="${id}">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-delete" data-id="${id}">
            <i class="fas fa-trash-alt"></i> Borrar
          </button>
        </div>
      `;

      // Evento Editar
      const btnEdit = row.querySelector(".btn-edit");
      btnEdit.addEventListener("click", () => {
        // Llenar datos en el formulario
        editModeId = id;
        currentImageUrl = data.imageUrl;
        plantNameInput.value = data.name;
        plantCategoryInput.value = data.category;
        plantBadgeInput.value = data.badge;
        plantDescriptionInput.value = data.description;
        
        imagePreview.src = data.imageUrl;
        imagePreview.classList.remove("hidden");
        uploadText.textContent = "Haz clic para cambiar imagen (opcional)";
        
        formTitle.textContent = "Editando Planta: " + data.name;
        btnSubmitPlant.textContent = "Guardar Cambios";
        btnCancelEdit.classList.remove("hidden");
        
        // Scroll hacia arriba
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      // Evento de borrado (Abre el modal)
      const btnDelete = row.querySelector(".btn-delete");
      btnDelete.addEventListener("click", () => {
        plantToDeleteId = id;
        buttonToDeleteEl = btnDelete;
        deleteModal.classList.remove("hidden");
        deleteModal.classList.add("show");
      });

      container.appendChild(row);
    });
  } catch (error) {
    console.error("Error al cargar lista:", error);
    container.innerHTML = '<p style="color:red; text-align:center;">Hubo un error de conexión.</p>';
  }
}

// Lógica de los botones del Modal
btnCancelDelete.addEventListener("click", () => {
  deleteModal.classList.remove("show");
  deleteModal.classList.add("hidden");
  plantToDeleteId = null;
  buttonToDeleteEl = null;
});

btnConfirmDelete.addEventListener("click", async () => {
  if (plantToDeleteId) {
    btnConfirmDelete.disabled = true;
    btnConfirmDelete.textContent = "Borrando...";
    buttonToDeleteEl.innerHTML = "Borrando...";
    
    try {
      await deleteDoc(doc(db, "products", plantToDeleteId));
      loadPlants(); // Refrescar lista visual
    } catch(err) {
      alert("Error al borrar: " + err.message);
    } finally {
      deleteModal.classList.remove("show");
      deleteModal.classList.add("hidden");
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.textContent = "Sí, eliminar";
      plantToDeleteId = null;
      buttonToDeleteEl = null;
    }
  }
});

function resetEditMode() {
  editModeId = null;
  currentImageUrl = null;
  formTitle.textContent = "Agregar Nueva Planta";
  btnSubmitPlant.textContent = "Subir al Catálogo Público";
  btnCancelEdit.classList.add("hidden");
  uploadText.textContent = "Haz clic para seleccionar la imagen";
}

btnCancelEdit.addEventListener("click", () => {
  addPlantForm.reset();
  plantImageInput.dispatchEvent(new Event("change"));
  resetEditMode();
  showMsg("", true);
});

// === LOGICA IMPORTACION AUTOMATICA DE LOTE ===
const btnImportBatch = document.getElementById("btnImportBatch");
if (btnImportBatch) {
  btnImportBatch.addEventListener("click", async () => {
    const plantsToImport = [
      { name: "Alocasia Variegada", img: "Alocasia bariegadaAlocasia bariegada.jpg", category: "ornamental", badge: "Exclusiva" },
      { name: "Alocasia", img: "Alocasia.jpg", category: "ornamental", badge: "Nueva" },
      { name: "Ave de Paraíso", img: "Ave de paraíso.jpg", category: "florales", badge: "Destacado" },
      { name: "Begonia", img: "Begonia.jpg", category: "ornamental", badge: "Colorida" },
      { name: "Bromelia Variegada", img: "Bromelia bariegada.jpg", category: "ornamental", badge: "Exótica" },
      { name: "Chile Habanero", img: "Chile abanero.jpg", category: "ornamental", badge: "Huerto" },
      { name: "Coralito", img: "Coralito o lágrimas de Cupido.jpg", category: "florales", badge: "Hermosa" },
      { name: "Corona de Cristo Rosada", img: "Corana de cristo rosada de flores pequeñas.jpg", category: "florales", badge: "Top Ventas" },
      { name: "Corona de Cristo Roja", img: "Corona de Cristo roja.jpg", category: "florales", badge: "Top Ventas" },
      { name: "Drácena Roja", img: "Dracena roja.jpg", category: "ornamental", badge: "Colorida" },
      { name: "Helecho Monedas", img: "Elecho monedas.jpg", category: "sombra", badge: "Novedad" },
      { name: "Espárragos", img: "Esparagos.jpg", category: "sombra", badge: "Follaje" },
      { name: "Filodendro Pink", img: "Filodendro pink.jpg", category: "ornamental", badge: "Exclusiva" },
      { name: "Pata de Vaca", img: "Flores pata de vaca.jpg", category: "florales", badge: "Árbol" },
      { name: "Geranio Rojo", img: "Geranio roja.jpg", category: "florales", badge: "Tradicional" },
      { name: "Ixora Enana", img: "Ixora enana.jpg", category: "florales", badge: "Resistente" },
      { name: "Mona Lisa", img: "Mona lisa.jpg", category: "florales", badge: "Elegante" },
      { name: "Payasitos", img: "Payasitos.jpg", category: "florales", badge: "Colorida" },
      { name: "Pino Ciprés", img: "Pino cipres.jpg", category: "ornamental", badge: "Exterior" },
      { name: "Trébol de la Suerte", img: "Trébol de la suerte.jpg", category: "ornamental", badge: "Buena Suerte" },
      { name: "Zamioculcas", img: "Zamioculcas.jpg", category: "sombra", badge: "Interior" }
    ];

    const confirmed = confirm(`¿Quieres importar automáticamente estas ${plantsToImport.length} plantas al catálogo de Firebase?`);
    if (!confirmed) return;

    btnImportBatch.disabled = true;
    btnImportBatch.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo a Firebase...';

    try {
      for (const plant of plantsToImport) {
        await addDoc(collection(db, "products"), {
          name: plant.name,
          category: plant.category,
          badge: plant.badge,
          description: "Hermosa planta lista para darle vida a tu espacio. Cómprala en Vivero Elizabeht Flores.",
          imageUrl: `./assets/images/${plant.img}`,
          createdAt: serverTimestamp()
        });
      }
      alert("¡Importación exitosa! Las 21 plantas ya están guardadas en la base de datos.");
      loadPlants(); // Recargar visualmente
      btnImportBatch.style.display = 'none'; // Ocultar para evitar duplicados
    } catch (err) {
      alert("Hubo un error al importar: " + err.message);
      btnImportBatch.disabled = false;
      btnImportBatch.innerHTML = '<i class="fas fa-magic"></i> Importar Automáticamente Plantas Nuevas';
    }
  });
}
