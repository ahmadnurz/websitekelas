/* ========================================
   RUANG TEKNIK KOMPUTER — INTERAKSI HALAMAN
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Elemen yang dipakai beberapa fitur di bawah.
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const navItems = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("main section[id]");
  const galleryCards = document.querySelectorAll(".gallery-card");
  const lightbox = document.querySelector(".lightbox");
  const lightboxImage = document.querySelector("#lightbox-image");
  const lightboxCaption = document.querySelector("#lightbox-caption");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxPrev = document.querySelector(".lightbox-prev");
  const lightboxNext = document.querySelector(".lightbox-next");
  const cardsArray = Array.from(galleryCards);
  let currentIndex = 0;
  let previousFocus = null;

  // Tahun pada footer otomatis menyesuaikan tahun perangkat pengguna.
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Menu navigasi ponsel: buka/tutup saat tombol hamburger ditekan.
  function closeMenu() {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka menu");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Buka menu" : "Tutup menu");
    navLinks.classList.toggle("is-open", !isOpen);
  });

  // Tutup menu setelah pengguna memilih bagian halaman.
  navItems.forEach((item) => {
    item.addEventListener("click", closeMenu);
  });
  navLinks.querySelectorAll(".nav-cta").forEach((item) => {
    item.addEventListener("click", closeMenu);
  });

  // Saat layout kembali ke desktop, pastikan menu ponsel tidak tertinggal terbuka.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) closeMenu();
  });

  // Animasi elemen ketika mulai terlihat di layar.
  // Jika browser tidak mendukung IntersectionObserver, semua elemen langsung ditampilkan.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Sorot menu sesuai bagian halaman yang sedang paling terlihat.
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeId = entry.target.id;
        navItems.forEach((item) => {
          const isActive = item.getAttribute("href") === `#${activeId}`;
          item.classList.toggle("active", isActive);
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ========================================
  // SISTEM ALBUM & INTEGRASI GOOGLE DRIVE
  // ========================================

  // Tempelkan URL Deployment Web App Google Apps Script kamu di sini:
  const GOOGLE_DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbw-x7ku_dM0AHc7jFsZPtE_tHTpHMWfYk4cwfdlaPFvYosisdeOlr6fwxA59iBMivRMOQ/exec";

  // Data awal / cadangan untuk album
  const albumData = {
    semua: [
      {
        url: "https://lh3.googleusercontent.com/d/1NFjsiBcnvuvbmK8N9hhNSXtZPx8VtLR5=w1600",
        thumb: "https://lh3.googleusercontent.com/d/1NFjsiBcnvuvbmK8N9hhNSXtZPx8VtLR5=w900",
        caption: "IMG-20261006-WA0004 — Semua Dokumentasi"
      }
    ],
    random: [
      {
        url: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=90",
        thumb: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=85",
        caption: "Momen acak dan seru kelas — Album Random"
      }
    ],
    cerita: [
      {
        url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=90",
        thumb: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1100&q=85",
        caption: "Potongan memori perjalanan kita — Album Cerita Kita (Belum ada foto di folder Google Drive)"
      }
    ]
  };

  const lightboxCounter = document.querySelector("#lightbox-counter");
  let currentAlbumKey = "semua";
  let currentPhotoIndex = 0;

  // Fungsi memperbarui gambar cover & jumlah foto di setiap kartu album
  function updateCardCovers(counts) {
    galleryCards.forEach((card) => {
      const albumKey = card.dataset.album || "semua";
      const photos = albumData[albumKey] || [];

      // Update foto cover jika ada foto di album
      if (photos.length > 0) {
        let coverPhoto = photos[0];

        // Khusus album SEMUA: jadikan foto IMG-20261006-WA0004 sebagai sampul utama
        if (albumKey === "semua") {
          const targetCover = photos.find(
            (p) => (p.name && p.name.includes("IMG-20261006-WA0004")) || p.id === "1NFjsiBcnvuvbmK8N9hhNSXtZPx8VtLR5"
          );
          if (targetCover) {
            coverPhoto = targetCover;
          }
        }

        const img = card.querySelector("img");
        if (img && coverPhoto.thumb) {
          img.src = coverPhoto.thumb;
        }
        card.dataset.full = coverPhoto.url;
        card.dataset.caption = coverPhoto.caption || card.dataset.caption;
      }

      // Update badge dengan jumlah foto riil dari Drive
      const badge = card.querySelector(".album-badge");
      if (badge && counts) {
        let label = "SEMUA";
        let count = counts.total || 0;
        if (albumKey === "random") {
          label = "RANDOM";
          count = counts.random || 0;
        } else if (albumKey === "cerita") {
          label = "CERITA KITA";
          count = counts.cerita || 0;
        }
        badge.textContent = `${label} (${count})`;
      }
    });
  }

  // Tarik foto otomatis dari Google Drive (dengan anti-cache agar selalu instan terupdate)
  if (GOOGLE_DRIVE_API_URL && GOOGLE_DRIVE_API_URL.trim() !== "") {
    const fetchUrl = GOOGLE_DRIVE_API_URL + (GOOGLE_DRIVE_API_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
    fetch(fetchUrl, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data dari Google Apps Script");
        return res.json();
      })
      .then((data) => {
        if (data.status === "success") {
          if (Array.isArray(data.all)) {
            albumData.semua = data.all;
          }
          if (Array.isArray(data.random)) {
            albumData.random = data.random;
          }
          if (Array.isArray(data.cerita)) {
            albumData.cerita = data.cerita;
          }
          updateCardCovers({
            total: (data.all || []).length,
            random: (data.random || []).length,
            cerita: (data.cerita || []).length
          });
        }
      })
      .catch((err) => {
        console.warn("Info sinkronisasi Google Drive:", err);
      });
  }

  // ========================================
  // LIGHTBOX (NAVIGASI FOTO DALAM ALBUM)
  // ========================================
  function getCurrentAlbumPhotos() {
    return albumData[currentAlbumKey] || [];
  }

  let isAnimatingPhoto = false;

  function updateLightboxContent(index, direction = 0) {
    const photos = getCurrentAlbumPhotos();
    if (!photos.length) return;

    currentPhotoIndex = (index + photos.length) % photos.length;
    const photo = photos[currentPhotoIndex];

    if (direction !== 0 && !isAnimatingPhoto) {
      isAnimatingPhoto = true;
      const animOut = direction > 0 ? "anim-slide-left" : "anim-slide-right";
      const animIn = direction > 0 ? "anim-from-right" : "anim-from-left";

      lightboxImage.classList.add(animOut);

      setTimeout(() => {
        lightboxImage.src = photo.url || photo.thumb;
        lightboxImage.alt = photo.caption || "Foto album kelas";
        lightboxImage.classList.remove(animOut);
        lightboxImage.classList.add(animIn);

        // Paksa reflow browser agar transisi masuk berjalan mulus
        void lightboxImage.offsetWidth;

        requestAnimationFrame(() => {
          lightboxImage.classList.remove(animIn);
          setTimeout(() => {
            isAnimatingPhoto = false;
          }, 220);
        });
      }, 150);
    } else {
      lightboxImage.src = photo.url || photo.thumb;
      lightboxImage.alt = photo.caption || "Foto album kelas";
      lightboxImage.className = "";
    }

    if (lightboxCaption) {
      lightboxCaption.textContent = photo.caption || "";
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
      lightboxCounter.style.display = photos.length > 1 ? "inline-block" : "none";
    }

    if (lightboxPrev && lightboxNext) {
      const showArrows = photos.length > 1;
      lightboxPrev.style.display = showArrows ? "flex" : "none";
      lightboxNext.style.display = showArrows ? "flex" : "none";
    }
  }

  function openLightbox(albumKey, initialIndex = 0) {
    previousFocus = document.activeElement;
    currentAlbumKey = albumKey;
    updateLightboxContent(initialIndex, 0);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    lightboxImage.src = "";
    lightboxImage.className = "";
    isAnimatingPhoto = false;
    if (previousFocus) previousFocus.focus();
  }

  function prevImage() {
    updateLightboxContent(currentPhotoIndex - 1, -1);
  }

  function nextImage() {
    updateLightboxContent(currentPhotoIndex + 1, 1);
  }

  galleryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const albumKey = card.dataset.album || "semua";
      let startIndex = 0;
      if (albumKey === "semua") {
        const photos = albumData.semua || [];
        const foundIdx = photos.findIndex(
          (p) => (p.name && p.name.includes("IMG-20261006-WA0004")) || p.id === "1NFjsiBcnvuvbmK8N9hhNSXtZPx8VtLR5"
        );
        if (foundIdx !== -1) startIndex = foundIdx;
      }
      openLightbox(albumKey, startIndex);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", (event) => {
      event.stopPropagation();
      prevImage();
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener("click", (event) => {
      event.stopPropagation();
      nextImage();
    });
  }

  // Klik area gelap di luar foto juga menutup lightbox.
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  // Tombol Escape menutup galeri foto atau menu ponsel; Panah kiri/kanan untuk navigasi foto.
  document.addEventListener("keydown", (event) => {
    if (lightbox.classList.contains("is-open")) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") prevImage();
      if (event.key === "ArrowRight") nextImage();
      return;
    }
    if (event.key === "Escape") closeMenu();
  });

  // Dukungan usap layar (swipe) di ponsel untuk geser foto.
  let touchStartX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) prevImage();
      else nextImage();
    }
  }, { passive: true });
});
