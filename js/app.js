AOS.init({
        duration: 900,
        once: true,
      });

      const menuBtn = document.getElementById("menuBtn");
      const mainNav = document.getElementById("mainNav");

      menuBtn.addEventListener("click", () => {
        mainNav.classList.toggle("show");
        menuBtn.classList.toggle("active");
      });

      document.querySelectorAll("nav a").forEach((link) => {
        link.addEventListener("click", () => {
          mainNav.classList.remove("show");
          menuBtn.classList.remove("active");
        });
      });

      const counters = document.querySelectorAll(".counter");
      let countersStarted = false;

      function startCounters() {
        if (countersStarted) return;
        countersStarted = true;

        counters.forEach((counter) => {
          const target = +counter.dataset.target;
          let current = 0;
          const increment = Math.ceil(target / 60);

          const updateCounter = () => {
            current += increment;

            if (current >= target) {
              counter.textContent = target;
            } else {
              counter.textContent = current;
              requestAnimationFrame(updateCounter);
            }
          };

          updateCounter();
        });
      }

      const statsSection = document.querySelector(".stats");

      if (statsSection && counters.length > 0) {
        const statsObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                startCounters();
              }
            });
          },
          { threshold: 0.3 },
        );

        statsObserver.observe(statsSection);
      }

      const filterButtons = document.querySelectorAll(".filter-btn");
      const productCards = document.querySelectorAll(".product-card");

      filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
          filterButtons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");

          const filter = button.dataset.filter;

          productCards.forEach((card) => {
            const category = card.dataset.category;
            if (filter === "all" || category === filter) {
              card.classList.remove("hidden");
            } else {
              card.classList.add("hidden");
            }
          });
        });
      });

      const galleryItems = document.querySelectorAll(".gallery-item");
      const lightbox = document.getElementById("lightbox");
      const lightboxImg = document.getElementById("lightboxImg");
      const lightboxClose = document.getElementById("lightboxClose");

      galleryItems.forEach((item) => {
        item.addEventListener("click", () => {
          const image = item.getAttribute("data-image");
          lightboxImg.src = image;
          lightbox.classList.add("show");
        });
      });

      lightboxClose.addEventListener("click", () => {
        lightbox.classList.remove("show");
      });

      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
          lightbox.classList.remove("show");
        }
      });

      const faqItems = document.querySelectorAll(".faq-item");

      faqItems.forEach((item) => {
        const question = item.querySelector(".faq-question");
        question.addEventListener("click", () => {
          faqItems.forEach((otherItem) => {
            if (otherItem !== item) {
              otherItem.classList.remove("active");
            }
          });
          item.classList.toggle("active");
        });
      });

      const btnTop = document.getElementById("btnTop");

      window.addEventListener("scroll", () => {
        if (window.scrollY > 450) {
          btnTop.classList.add("show");
        } else {
          btnTop.classList.remove("show");
        }
      });

      btnTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const contactForm = document.getElementById("contactForm");
      const submitBtn = document.getElementById("submitBtn");
      const formMessage = document.getElementById("formMessage");
      const toastContainer = document.getElementById("toastContainer");

      function setButtonLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle("loading", isLoading);
      }

      function showFormMessage(type, text) {
        const icon =
          type === "success" ? "fa-circle-check" : "fa-circle-exclamation";

        formMessage.className = `form-message ${type} show`;
        formMessage.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${text}</span>
  `;
      }

      function clearFormMessage() {
        formMessage.className = "form-message";
        formMessage.innerHTML = "";
      }

      function showToast(type, title, text) {
        if (!toastContainer) return;

        const icon =
          type === "success" ? "fa-circle-check" : "fa-circle-exclamation";

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${icon}"></i>
    </div>
    <div class="toast-text">
      <strong>${title}</strong>
      <span>${text}</span>
    </div>
  `;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
          toast.classList.add("show");
        });

        setTimeout(() => {
          toast.classList.remove("show");
          setTimeout(() => toast.remove(), 350);
        }, 3800);
      }

      contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const servicio = document.getElementById("servicio").value.trim();
        const mensaje = document.getElementById("mensaje").value.trim();

        clearFormMessage();

        if (!nombre || !telefono || !servicio || !mensaje) {
          showFormMessage(
            "error",
            "Por favor completa los campos obligatorios.",
          );
          showToast(
            "error",
            "Faltan datos",
            "Completa los campos requeridos antes de enviar.",
          );
          return;
        }

        try {
          setButtonLoading(true);

          // Construir el mensaje de WhatsApp
          let textoMensaje = `¡Hola! Me gustaría solicitar información.\n\n`;
          textoMensaje += `*Nombre:* ${nombre}\n`;
          if (correo) textoMensaje += `*Correo:* ${correo}\n`;
          textoMensaje += `*Teléfono:* ${telefono}\n`;
          textoMensaje += `*Servicio:* ${servicio}\n\n`;
          textoMensaje += `*Detalles:* ${mensaje}`;

          // Número de teléfono del Vivero (sin el +, solo los números)
          const numeroWhatsApp = "529842342665";

          // Crear la URL
          const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(textoMensaje)}`;

          // Abrir WhatsApp en una nueva pestaña
          // Añadimos un pequeño retraso solo para que la animación de carga se note
          setTimeout(() => {
            window.open(url, "_blank");

            showFormMessage(
              "success",
              "¡Casi listo! Se está abriendo WhatsApp para enviar tu mensaje.",
            );

            showToast(
              "success",
              "Abriendo WhatsApp...",
              "Completa el envío en la aplicación.",
            );

            contactForm.reset();
            setButtonLoading(false);
          }, 800);
        } catch (error) {
          console.error("Error:", error);
          showFormMessage("error", "Hubo un error al preparar el mensaje.");
          setButtonLoading(false);
        }
      });

// --- NEXT SCRIPT BLOCK --- 

const galleryData = {
        "Google maps": [
          "5116395777688276069.jpg",
          "5116395777688276070.jpg",
          "5116395777688276074.jpg",
          "5116395777688276075.jpg",
          "5116395777688276076.jpg",
          "5116395777688276077.jpg",
        ],
        "Vivero dentro": [
          "5116395777688276064.jpg",
          "5116395777688276065.jpg",
          "5116395777688276066.jpg",
          "5116395777688276067.jpg",
          "5116395777688276068.jpg",
          "5116395777688276071.jpg",
          "5116395777688276073.jpg",
        ],
        nuevo: [
          "IMG-20260420-WA0042.jpg",
          "IMG-20260420-WA0043.jpg",
          "IMG-20260420-WA0044.jpg",
          "IMG-20260420-WA0045.jpg",
          "IMG-20260420-WA0046.jpg",
          "IMG-20260420-WA0047.jpg",
          "IMG-20260420-WA0048.jpg",
          "IMG-20260420-WA0049.jpg",
          "IMG-20260420-WA0050.jpg",
          "IMG-20260420-WA0051.jpg",
          "IMG-20260420-WA0052.jpg",
          "IMG-20260420-WA0053.jpg",
          "IMG-20260420-WA0054.jpg",
          "IMG-20260420-WA0055.jpg",
          "IMG-20260420-WA0056.jpg",
          "IMG-20260420-WA0057.jpg",
          "IMG-20260420-WA0058.jpg",
          "IMG-20260420-WA0059.jpg",
          "IMG-20260420-WA0060.jpg",
          "IMG-20260420-WA0061.jpg",
          "IMG-20260420-WA0062.jpg",
          "IMG-20260420-WA0063.jpg",
          "IMG-20260420-WA0064.jpg",
          "IMG-20260420-WA0065.jpg",
          "IMG-20260420-WA0066.jpg",
          "IMG-20260420-WA0067.jpg",
          "IMG-20260420-WA0068.jpg",
          "IMG-20260420-WA0069.jpg",
          "IMG-20260420-WA0070.jpg",
          "IMG-20260420-WA0071.jpg",
          "IMG-20260420-WA0072.jpg",
          "IMG-20260420-WA0073.jpg",
          "IMG-20260420-WA0074.jpg",
          "IMG-20260420-WA0075.jpg",
          "IMG-20260420-WA0076.jpg",
          "IMG-20260420-WA0077.jpg",
          "IMG-20260420-WA0078.jpg",
          "IMG-20260420-WA0079.jpg",
          "IMG-20260420-WA0080.jpg",
        ],
      };

      document.addEventListener("DOMContentLoaded", () => {
        const carouselsContainer = document.getElementById(
          "gallery-carousels-container",
        );
        let currentLightboxArray = [];
        let currentLightboxIndex = 0;
        const customLightboxImg = document.getElementById("lightboxImg");

        function openLightboxGallery(imgArray, index) {
          currentLightboxArray = imgArray;
          currentLightboxIndex = index;
          updateLightboxImage();
          document.getElementById("lightbox").classList.add("show");
        }

        function updateLightboxImage() {
          if (!currentLightboxArray.length) return;
          customLightboxImg.src = currentLightboxArray[currentLightboxIndex];
        }

        document
          .getElementById("lightboxNext")
          .addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentLightboxArray.length === 0) return;
            currentLightboxIndex =
              (currentLightboxIndex + 1) % currentLightboxArray.length;
            updateLightboxImage();
          });

        document
          .getElementById("lightboxPrev")
          .addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentLightboxArray.length === 0) return;
            currentLightboxIndex =
              (currentLightboxIndex - 1 + currentLightboxArray.length) %
              currentLightboxArray.length;
            updateLightboxImage();
          });

        let touchstartX = 0;
        let touchendX = 0;
        const mainLightboxEl = document.getElementById("lightbox");

        mainLightboxEl.addEventListener(
          "touchstart",
          (e) => {
            touchstartX = e.changedTouches[0].screenX;
          },
          { passive: true },
        );

        mainLightboxEl.addEventListener(
          "touchend",
          (e) => {
            touchendX = e.changedTouches[0].screenX;
            const swipeThreshold = 50;
            if (touchendX < touchstartX - swipeThreshold) {
              document.getElementById("lightboxNext").click();
            }
            if (touchendX > touchstartX + swipeThreshold) {
              document.getElementById("lightboxPrev").click();
            }
          },
          { passive: true },
        );

        document.addEventListener("keydown", (e) => {
          if (!mainLightboxEl.classList.contains("show")) return;
          if (e.key === "ArrowRight") {
            document.getElementById("lightboxNext").click();
          } else if (e.key === "ArrowLeft") {
            document.getElementById("lightboxPrev").click();
          } else if (e.key === "Escape") {
            document.getElementById("lightboxClose").click();
          }
        });

        if (carouselsContainer) {
          for (const folderName in galleryData) {
            const images = galleryData[folderName];
            if (images.length === 0) continue;

            let title = "Otras fotos";
            if (folderName === "Vivero dentro") title = "Interior del Vivero";
            if (folderName === "Google maps") title = "Fotos principales";
            if (folderName === "nuevo") title = "Plantas Top Ventas";

            const wrapper = document.createElement("div");
            wrapper.className = "carousel-wrapper";
            wrapper.setAttribute("data-aos", "fade-up");

            const h3 = document.createElement("h3");
            h3.textContent = title;

            const carousel = document.createElement("div");
            carousel.className = "horizontal-carousel";

            const fullPaths = images.map((i) => `./assets/images/${i}`);

            images.forEach((imgName, index) => {
              const item = document.createElement("div");
              item.className = "carousel-item";
              item.innerHTML = `<img src="${fullPaths[index]}" alt="${title}" loading="lazy">`;

              item.addEventListener("click", () => {
                openLightboxGallery(fullPaths, index);
              });

              carousel.appendChild(item);
            });

            wrapper.appendChild(h3);
            wrapper.appendChild(carousel);

            const btnPrev = document.createElement("button");
            btnPrev.className = "carousel-nav-btn prev";
            btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
            btnPrev.setAttribute("aria-label", "Anterior");

            const btnNext = document.createElement("button");
            btnNext.className = "carousel-nav-btn next";
            btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
            btnNext.setAttribute("aria-label", "Siguiente");

            btnPrev.addEventListener("click", () => {
              carousel.scrollBy({ left: -380, behavior: "smooth" });
            });

            btnNext.addEventListener("click", () => {
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;
              if (carousel.scrollLeft >= maxScroll - 10) {
                carousel.scrollTo({ left: 0, behavior: "smooth" });
              } else {
                carousel.scrollBy({ left: 380, behavior: "smooth" });
              }
            });

            wrapper.appendChild(btnPrev);
            wrapper.appendChild(btnNext);
            carouselsContainer.appendChild(wrapper);

            let isHovered = false;
            carousel.addEventListener("mouseenter", () => (isHovered = true));
            carousel.addEventListener("mouseleave", () => (isHovered = false));
            carousel.addEventListener("touchstart", () => (isHovered = true), {
              passive: true,
            });
            carousel.addEventListener(
              "touchend",
              () => {
                setTimeout(() => (isHovered = false), 2000);
              },
              { passive: true },
            );

            setInterval(() => {
              if (isHovered) return;
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;
              if (maxScroll <= 0) return;

              if (carousel.scrollLeft >= maxScroll - 10) {
                carousel.scrollTo({ left: 0, behavior: "smooth" });
              } else {
                carousel.scrollBy({ left: 380, behavior: "smooth" });
              }
            }, 3500);
          }
        }

        const catalogImages = document.querySelectorAll(
          ".catalog-grid .product-image img",
        );
        if (catalogImages.length > 0) {
          const catalogImgPaths = Array.from(catalogImages).map((img) =>
            img.getAttribute("src"),
          );
          catalogImages.forEach((img, idx) => {
            img.style.cursor = "zoom-in";
            img.addEventListener("click", () => {
              if (typeof openLightboxGallery === "function") {
                openLightboxGallery(catalogImgPaths, idx);
              }
            });
          });
        }
      });

// --- NEXT SCRIPT BLOCK --- 

// Parallax Effect & Header Scrolled
      const heroBg = document.querySelector(".hero-bg");
      const headerEl = document.querySelector("header");

      window.addEventListener("scroll", () => {
        let scrolly = window.scrollY;

        // Parallax Only in Hero context
        if (heroBg && scrolly < window.innerHeight) {
          heroBg.style.transform = `translateY(${scrolly * 0.4}px)`;
        }

        // Header (only for non-mobile where header starts transparent)
        if (window.innerWidth > 860) {
          if (scrolly > 50) {
            headerEl.classList.add("scrolled");
          } else {
            headerEl.classList.remove("scrolled");
          }
        }
      });

      // Hide preloader when everything is loaded
      window.addEventListener("load", () => {
        const preloader = document.getElementById("preloader");
        if (preloader) {
          preloader.classList.add("fade-out");
          setTimeout(() => preloader.remove(), 600); // Remove from DOM after fade
        }

        // Ensure header updates correctly on load if we scrolled down and refreshed
        if (window.scrollY > 50 && window.innerWidth > 860) {
          headerEl.classList.add("scrolled");
        }
      });