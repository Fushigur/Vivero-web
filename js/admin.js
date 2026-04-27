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
  
  if (!selectedFile) {
    showMsg("Por favor, selecciona una imagen.", false);
    return;
  }

  try {
    btnSubmitPlant.disabled = true;
    btnSubmitPlant.textContent = "Subiendo imagen resolviendo base de datos...";
    showMsg("", true);

    // 1. Subir imagen a ImgBB (Gratis Total)
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
    
    // 2. Obtener la URL pública de la imagen desde ImgBB
    const imageUrl = imgbbData.data.url;
    // 3. Obtener los valores del form
    const plantName = document.getElementById("plantName").value;
    const plantCategory = document.getElementById("plantCategory").value;
    const plantBadge = document.getElementById("plantBadge").value;
    const plantPrice = document.getElementById("plantPrice").value;
    const plantDescription = document.getElementById("plantDescription").value;

    // 4. Guardar en Firestore
    await addDoc(collection(db, "products"), {
      name: plantName,
      category: plantCategory,
      badge: plantBadge,
      priceLabel: plantPrice,
      description: plantDescription,
      imageUrl: imageUrl,
      createdAt: serverTimestamp()
    });

    // Éxito
    showMsg("¡Planta agregada exitosamente al catálogo visual!", true);
    addPlantForm.reset();
    plantImageInput.dispatchEvent(new Event("change")); // Limpiar preview
    loadPlants(); // Recargar la lista

  } catch (error) {
    console.error("Error al publicar:", error);
    showMsg("Hubo un error al subir la planta: " + error.message, false);
  } finally {
    btnSubmitPlant.disabled = false;
    btnSubmitPlant.textContent = "Subir al Catálogo Público";
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
        <button class="btn-delete" data-id="${id}">
          <i class="fas fa-trash-alt"></i> Borrar
        </button>
      `;

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
