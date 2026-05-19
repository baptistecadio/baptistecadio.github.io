// ===============================
// Navbar burger (HEADER uniquement)
// ===============================
function initNavbarBurger() {
  const burgers = Array.from(document.querySelectorAll(".navbar-burger"));

  if (burgers.length === 0) return;

  burgers.forEach((burger) => {
    const targetId = burger.dataset.target;
    const target = document.getElementById(targetId);

    if (!target) return;

    burger.addEventListener("click", () => {
      burger.classList.toggle("is-active");
      target.classList.toggle("is-active");
    });
  });
}

// ===============================
// Footer (année dynamique)
// ===============================
function initFooter() {
  const yearEl = document.getElementById("footerYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// ===============================
// Gallery filters
// ===============================
function initGalleryFilters() {
  const filterLinks = document.querySelectorAll("[data-gallery-filter]");
  // Note: galleries are generated dynamically now, so we need to query them after generation
  // But this function runs after generatePortfolio in DOMContentLoaded, so it should be fine.

  if (!filterLinks.length) return;

  filterLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      // Re-query galleries in case they were generated
      const galleries = document.querySelectorAll("[data-gallery]");

      const target = link.dataset.galleryFilter;

      // Onglet actif
      document.querySelectorAll(".gallery-filters li").forEach((li) => {
        li.classList.remove("is-active");
      });
      link.parentElement.classList.add("is-active");

      // Galerie visible
      galleries.forEach((grid) => {
        if (grid.dataset.gallery === target) {
          grid.classList.remove("is-hidden");
        } else {
          grid.classList.add("is-hidden");
        }
      });
    });
  });
}

// ===============================
// Contact form (Formspree)
// ===============================
function initContactForm() {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");

  if (!form || !statusEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Envoi en cours…";

    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        statusEl.textContent = "Message envoyé. Merci !";
        form.reset();
      } else {
        statusEl.textContent = "Oups, l’envoi a échoué. Réessaie.";
      }
    } catch (error) {
      statusEl.textContent = "Erreur réseau. Vérifie ta connexion.";
    }
  });
}

// ===============================
// Dynamic Portfolio Generation
// ===============================
function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function generatePortfolio(projectsData) {
  const wrapper = document.querySelector(".gallery__wrapper");

  if (!wrapper || !projectsData) return;

  // Group projects by category
  const categories = {};
  projectsData.forEach(project => {
    if (!categories[project.category]) {
      categories[project.category] = [];
    }
    categories[project.category].push(project);
  });

  // Keep track of created modals to append them at the end or inside wrapper
  const modalsFragment = document.createDocumentFragment();

  // Create grid for each category
  Object.keys(categories).forEach(cat => {
    const grid = document.createElement("div");
    grid.className = "columns is-multiline is-variable is-5 gallery__grid";
    grid.dataset.gallery = cat;

    // Default visibility: only 'photo' is visible initially, others hidden
    if (cat !== "photo") {
      grid.classList.add("is-hidden");
    }

    categories[cat].forEach(project => {
      const col = document.createElement("div");
      col.className = "column is-12-mobile is-6-tablet is-4-desktop";

      const article = document.createElement("article");
      article.className = "gallery-item";

      const thumbDiv = document.createElement("div");
      thumbDiv.className = "gallery-item__thumb";

      // Color class (placeholder ou fond coloré)
      if (project.colorClass) {
        thumbDiv.classList.add(project.colorClass);
      }

      // Image de fond si thumbnail disponible
      if (project.thumbnail) {
        const img = document.createElement("img");
        img.src = project.thumbnail;
        img.alt = project.title;
        img.className = "gallery-item__bg";
        thumbDiv.appendChild(img);
      }

      // Overlay titre / sous-titre (toujours présent)
      const contentDiv = document.createElement("div");
      contentDiv.className = "gallery-item__content";

      const h3 = document.createElement("h3");
      h3.className = "gallery-item__title";
      h3.textContent = project.title;
      contentDiv.appendChild(h3);

      if (project.subtitle) {
        const span = document.createElement("span");
        span.className = "gallery-item__subtitle";
        span.textContent = project.subtitle;
        contentDiv.appendChild(span);
      }

      if (project.date) {
        const dateEl = document.createElement("time");
        dateEl.className = "gallery-item__date";
        dateEl.dateTime = project.date;
        dateEl.textContent = new Date(project.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
        contentDiv.appendChild(dateEl);
      }

      thumbDiv.appendChild(contentDiv);

      // Modal si media ou videos disponibles
      const hasMedia = project.media && project.media.length > 0;
      const hasVideos = project.videos && project.videos.length > 0;

      if (hasMedia || hasVideos) {
        thumbDiv.style.cursor = "pointer";
        thumbDiv.id = `trigger-${project.id}`;

        const modal = createProjectModalElement(project);
        modalsFragment.appendChild(modal);

        thumbDiv.addEventListener("click", () => {
          openModal(project);
        });
      }

      article.appendChild(thumbDiv);
      col.appendChild(article);
      grid.appendChild(col);
    });

    wrapper.appendChild(grid);
  });

  // Append all modals
  document.body.appendChild(modalsFragment);
}

function createProjectModalElement(project) {
  const modal = document.createElement("div");
  modal.id = `modal-${project.id}`;
  modal.className = "modal portfolio-project-modal";

  const bg = document.createElement("div");
  bg.className = "modal-background";

  // Close on bg click
  bg.addEventListener("click", () => {
    modal.classList.remove("is-active");
  });

  const content = document.createElement("div");
  content.className = "modal-content";

  const box = document.createElement("div");
  box.className = "box";

  const splitView = document.createElement("div");
  splitView.className = "modal-split-view";

  // Left: Gallery Container ou vidéos
  const galleryWrapper = document.createElement("div");
  galleryWrapper.className = "modal-gallery-wrapper";

  if (project.videos && project.videos.length > 0) {
    const videoContainer = document.createElement("div");
    videoContainer.id = `container-${project.id}`;
    videoContainer.className = "modal-video-container";

    project.videos.forEach(video => {
      const link = document.createElement("a");
      link.href = video.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "modal-video-thumb";

      // Résolution de la miniature
      const youtubeId = getYoutubeId(video.url);
      const thumbSrc = video.thumbnail
        ? video.thumbnail
        : youtubeId
          ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
          : project.thumbnail || null;

      if (thumbSrc) {
        const thumbImg = document.createElement("img");
        thumbImg.src = thumbSrc;
        thumbImg.alt = video.title || project.title;
        thumbImg.className = "modal-video-thumb__img";
        link.appendChild(thumbImg);
      }

      if (youtubeId) {
        const playIcon = document.createElement("div");
        playIcon.className = "modal-video-thumb__play";
        playIcon.innerHTML = `<svg viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/><path d="M45 24 27 14v20" fill="#fff"/></svg>`;
        link.appendChild(playIcon);
      }

      if (video.title) {
        const caption = document.createElement("span");
        caption.className = "modal-video-thumb__caption";
        caption.textContent = video.title;
        link.appendChild(caption);
      }

      videoContainer.appendChild(link);
    });

    galleryWrapper.appendChild(videoContainer);
  } else {
    const masonryContainer = document.createElement("div");
    masonryContainer.id = `container-${project.id}`;
    masonryContainer.className = "shooting-masonry" + (project.category === "graphisme" ? " shooting-masonry--2col" : "");
    galleryWrapper.appendChild(masonryContainer);
  }

  // Right: Sidebar Description
  const sidebar = document.createElement("div");
  sidebar.className = "modal-sidebar";

  const title = document.createElement("h2");
  title.className = "title is-3 has-text-white";
  title.textContent = project.title;
  sidebar.appendChild(title);

  if (project.subtitle) {
    const sub = document.createElement("h3");
    sub.className = "subtitle is-5 has-text-primary";
    sub.textContent = project.subtitle;
    sidebar.appendChild(sub);
  }

  if (project.date) {
    const dateEl = document.createElement("time");
    dateEl.className = "modal-project-date";
    dateEl.dateTime = project.date;
    dateEl.textContent = new Date(project.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    sidebar.appendChild(dateEl);
  }

  if (project.description && project.description.length > 0) {
    const descDiv = document.createElement("div");
    descDiv.className = "content has-text-light";
    project.description.forEach(pText => {
      const p = document.createElement("p");
      p.textContent = pText;
      descDiv.appendChild(p);
    });
    sidebar.appendChild(descDiv);
  }

  splitView.appendChild(galleryWrapper);
  splitView.appendChild(sidebar);
  box.appendChild(splitView);
  content.appendChild(box);

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close is-large";
  closeBtn.setAttribute("aria-label", "close");

  // Close on btn click
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("is-active");
  });

  modal.appendChild(bg);
  modal.appendChild(content);
  modal.appendChild(closeBtn);

  return modal;
}

function openModal(project) {
  const modal = document.getElementById(`modal-${project.id}`);
  const container = document.getElementById(`container-${project.id}`);

  if (modal && container) {
    // Vidéos : déjà remplies à la création, rien à faire
    // Photos : lazy load si vide
    if (!project.videos && container.children.length === 0 && project.media) {
      project.media.forEach(imgSrc => {
        const item = document.createElement("div");
        item.className = "masonry-item";

        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = "";
        img.loading = "lazy";

        item.appendChild(img);
        container.appendChild(item);
      });
    }
    modal.classList.add("is-active");
  }
}

// ===============================
// Load Projects from JSON (portfolio page)
// ===============================
async function loadProjects() {
  try {
    const response = await fetch("../js/projects.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const projectsData = await response.json();
    generatePortfolio(projectsData);
    initGalleryFilters();

    const hash = window.location.hash.slice(1);
    if (hash) {
      const target = projectsData.find(p => p.id === hash);
      if (target) {
        const filterLink = document.querySelector(`[data-gallery-filter="${target.category}"]`);
        if (filterLink) filterLink.click();
        setTimeout(() => openModal(target), 50);
      }
    }
  } catch (error) {
    console.error("Could not load projects:", error);
  }
}

// ===============================
// Recent Projects (index page)
// ===============================
const CATEGORY_LABELS = {
  photo: "Photographie",
  graphisme: "Graphisme",
  audiovisuel: "Audiovisuel",
  communication: "Communication",
};

async function loadRecentProjects() {
  const wrapper = document.querySelector(".recent-projects__grid");
  if (!wrapper) return;

  try {
    const response = await fetch("js/projects.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const projects = await response.json();

    const recent = projects
      .filter(p => p.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    recent.forEach(project => {
      const thumbnail = project.thumbnail
        ? project.thumbnail.replace("../images/", "images/")
        : null;

      const dateLabel = project.date
        ? new Date(project.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        : "";

      const catLabel = CATEGORY_LABELS[project.category] || project.category;

      const article = document.createElement("article");
      article.className = "recent-card";

      article.innerHTML = `
        <a href="/pages/portfolio.html#${project.id}" class="recent-card__link">
          <div class="recent-card__thumb">
            ${thumbnail ? `<img src="${thumbnail}" alt="${project.title}" class="recent-card__img" loading="lazy" />` : ""}
            <div class="recent-card__overlay">
              <span class="recent-card__cat">${catLabel}</span>
            </div>
          </div>
          <div class="recent-card__body">
            <h3 class="recent-card__title">${project.title}</h3>
            ${project.subtitle ? `<p class="recent-card__subtitle">${project.subtitle}</p>` : ""}
            <time class="recent-card__date" datetime="${project.date}">${dateLabel}</time>
          </div>
        </a>`;

      wrapper.appendChild(article);
    });
  } catch (error) {
    console.error("Could not load recent projects:", error);
  }
}


// ===============================
// DOMContentLoaded
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const headerEl = document.getElementById("header");
  const footerEl = document.getElementById("footer");

  /* ===============================
     HEADER (partial)
     =============================== */
  if (headerEl) {
    fetch(headerEl.dataset.partialPath || "../partials/header.html")
      .then((response) => response.text())
      .then((html) => {
        headerEl.innerHTML = html;
        initNavbarBurger();
      })
      .catch((err) => {
        console.warn("Impossible de charger le header :", err);
        initNavbarBurger();
      });
  } else {
    initNavbarBurger();
  }

  /* ===============================
     FOOTER (partial, sans burger)
     =============================== */
  if (footerEl) {
    fetch(footerEl.dataset.partialPath || "../partials/footer.html")
      .then((response) => response.text())
      .then((html) => {
        footerEl.innerHTML = html;
        initFooter();
      })
      .catch((err) => {
        console.warn("Impossible de charger le footer :", err);
        initFooter();
      });
  } else {
    initFooter();
  }

  /* ===============================
     Autres features
     =============================== */
  initContactForm();

  // Portfolio page
  if (document.querySelector(".gallery__wrapper")) {
    loadProjects();
  }

  // Index page
  if (document.querySelector(".recent-projects__grid")) {
    loadRecentProjects();
  }
});
