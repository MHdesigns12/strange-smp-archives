
const SUPABASE_URL = "https://mhdesigns12.github.io/strange-smp-archives/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ZNfks9_OvIFysDWiVyS5Tg_-pnOSiRt";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

"use strict";

// Strange SMP Archives — website interactions

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("navigation");
  const year = document.getElementById("current-year");
  const filterBar = document.getElementById("gallery-filters");

  // Automatically update the copyright year.
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Mobile navigation.
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

  // Gallery filter selection.
  // Actual filtering of uploaded memories will be connected later.
  if (filterBar) {
    filterBar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");

      if (!button) return;

      filterBar.querySelectorAll("[data-filter]").forEach((filter) => {
        filter.classList.remove("active");
        filter.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");

      // Save the selected category for the gallery integration.
      filterBar.dataset.selectedFilter = button.dataset.filter;
    });

    filterBar.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.classList.contains("active") ? "true" : "false"
      );
    });
  }

  // Friendly scroll behavior for internal links.
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

  // This is a presentation-only status message.
  // Real database connectivity will be added in a later step.
  console.info("Strange SMP Archives interface initialized.");
});


(async () => {
  const { data, error } = await supabaseClient
    .from("memories")
    .select("id")
    .eq("approved", true)
    .limit(1);

  if (error) {
    console.error("Strange SMP database test failed:", error.message);
  } else {
    console.log("Strange SMP database connected successfully!");
  }
})();
