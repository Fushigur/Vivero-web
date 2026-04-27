import { auth, db, storage } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
  collection, 
  addDoc,
  serverTimestamp 
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

    // 1. Subir imagen al Storage
    const timestamp = Date.now();
    const imageRef = ref(storage, `catalog/${timestamp}_${selectedFile.name}`);
    await uploadBytes(imageRef, selectedFile);
    
    // 2. Obtener la URL pública de la imagen
    const imageUrl = await getDownloadURL(imageRef);

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
