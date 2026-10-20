
const SUPABASE_URL = "https://wgrpfvrsyjvjwrbccqyr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ZNfks9_OvIFysDWiVyS5Tg_-pnOSiRt";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("navigation");
  const year = document.getElementById("current-year");
  const filterBar = document.getElementById("gallery-filters");
  const memoryGrid = document.getElementById("memory-grid");
  const quoteContainer = document.getElementById("quote-container");

  let memories = [];
  let selectedFilter = "all";

  if (year) year.textContent = new Date().getFullYear();

  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start"
      });

      history.replaceState(null, "", targetId);
    });
  });

  function showEmpty(container, title, message, emoji) {
    if (!container) return;

    container.replaceChildren();

    const state = document.createElement("div");
    state.className = "empty-state";

    const icon = document.createElement("span");
    icon.textContent = emoji;

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    state.append(icon, heading, paragraph);
    container.appendChild(state);
  }

  function renderMemories() {
    if (!memoryGrid) return;

    const visible = memories.filter((memory) => {
      if (memory.category === "quote") return false;
      return selectedFilter === "all" ||
        memory.category === selectedFilter;
    });

    if (!visible.length) {
      showEmpty(
        memoryGrid,
        "Our memory chest awaits!",
        "Approved screenshots and builds will appear here.",
        "🧰"
      );
      return;
    }

    memoryGrid.replaceChildren();

    visible.forEach((memory) => {
      const card = document.createElement("article");
      card.className = "memory-card";

      if (memory.image_path) {
        const image = document.createElement("img");
        const { data } = supabaseClient.storage
          .from("smp-memories")
          .getPublicUrl(memory.image_path);

        // For the private bucket, approved images will use signed URLs below.
        image.alt = memory.title || "SMP memory";
        image.loading = "lazy";
        image.dataset.imagePath = memory.image_path;
        card.appendChild(image);
        loadMemoryImage(image, memory.image_path);
      }

      const content = document.createElement("div");
      content.className = "memory-card-content";

      const category = document.createElement("span");
      category.className = "memory-category";
      category.textContent = memory.category || "memory";

      const heading = document.createElement("h3");
      heading.textContent = memory.title || "Untitled memory";

      const description = document.createElement("p");
      description.textContent = memory.description || "";

      const date = document.createElement("small");
      date.textContent = memory.event_date
        ? new Date(`${memory.event_date}T12:00:00`).toLocaleDateString()
        : "";

      content.append(category, heading, description, date);
      card.appendChild(content);
      memoryGrid.appendChild(card);
    });
  }

  async function loadMemoryImage(image, path) {
    const { data, error } = await supabaseClient.storage
      .from("smp-memories")
      .createSignedUrl(path, 3600);

    if (!error && data?.signedUrl) {
      image.src = data.signedUrl;
    } else {
      image.remove();
      console.error("Could not load archive image:", error?.message);
    }
  }

  function renderQuotes() {
    if (!quoteContainer) return;

    const quotes = memories.filter(
      (memory) => memory.category === "quote" && memory.quote_text
    );

    quoteContainer.replaceChildren();

    if (!quotes.length) {
      const placeholder = document.createElement("div");
      placeholder.className = "quote-placeholder";

      const icon = document.createElement("span");
      icon.textContent = "💬";

      const message = document.createElement("p");
      message.textContent = "The next legendary quote could be yours.";

      const small = document.createElement("small");
      small.textContent = "Our best quotes will live here.";

      placeholder.append(icon, message, small);
      quoteContainer.appendChild(placeholder);
      return;
    }

    quotes.forEach((memory) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      const quote = document.createElement("blockquote");
      quote.textContent = `“${memory.quote_text}”`;

      card.appendChild(quote);

      if (memory.player_name) {
        const author = document.createElement("p");
        author.className = "quote-author";
        author.textContent = `— ${memory.player_name}`;
        card.appendChild(author);
      }

      if (memory.title) {
        const title = document.createElement("small");
        title.textContent = memory.title;
        card.appendChild(title);
      }

      quoteContainer.appendChild(card);
    });
  }

  if (filterBar) {
    filterBar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;

      filterBar.querySelectorAll("[data-filter]").forEach((filter) => {
        filter.classList.toggle("active", filter === button);
        filter.setAttribute(
          "aria-pressed",
          filter === button ? "true" : "false"
        );
      });

      selectedFilter = button.dataset.filter;
      renderMemories();
    });

    filterBar.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.classList.contains("active") ? "true" : "false"
      );
    });
  }

  async function loadMemories() {
    if (memoryGrid) {
      showEmpty(memoryGrid, "Opening the memory chest…", "Loading approved memories.", "📦");
    }

    const { data, error } = await supabaseClient
      .from("memories")
      .select("id, title, description, category, image_path, quote_text, player_name, event_date, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load memories:", error.message);
      showEmpty(
        memoryGrid,
        "The memory chest is locked for now.",
        "We couldn't load the archive. Please try again later.",
        "🔒"
      );
      return;
    }

    memories = data || [];
    renderMemories();
    renderQuotes();
    console.info("Strange SMP memories loaded:", memories.length);
  }

  loadMemories();
});
