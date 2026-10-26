const projectData = {
  still: {
    index: "01 / 03 · COFFEE FILM",
    title: "Aftertaste",
    image: "./assets/project-still.png",
    alt: "Aftertaste 咖啡品牌短片概念视觉",
    year: "2026",
    type: "咖啡品牌短片",
    role: "概念 / 拍摄 / 剪辑",
    format: "45秒概念短片",
    summary:
      "以一杯咖啡从制作到冷却的过程为线索，讨论味道如何在时间里变化。画面刻意放慢，把注意力交给液体、光线和手部动作，让产品不只是被看见，也被感受到。",
    notes: [
      "用极少的镜头完成叙事，以声音和节奏替代解释。",
      "同时适配竖屏与横屏，让同一套素材进入不同发布场景。",
      "项目为自发概念练习，所有画面围绕产品质感与日常停留展开。",
    ],
  },
  afterhours: {
    index: "02 / 03 · SPATIAL STUDY",
    title: "After Hours",
    image: "./assets/project-afterhours.png",
    alt: "After Hours 酒店空间影像概念视觉",
    year: "2025",
    type: "空间影像随笔",
    role: "摄影 / 剪辑 / 文字",
    format: "12帧影像与1条短片",
    summary:
      "从酒店前台下班后的空场出发，记录灯光、走廊和无人时刻。这个项目关注的是空间在失去功能之后，如何显露出另一种情绪和秩序。",
    notes: [
      "以固定机位和长镜头观察光线在墙面上的移动。",
      "保留现场的安静感，减少音乐和转场对情绪的解释。",
      "项目为自发观察练习，不涉及任何真实客户或住客信息。",
    ],
  },
  signals: {
    index: "03 / 03 · DIGITAL EXPERIENCE",
    title: "Small Signals",
    image: "./assets/project-signals.png",
    alt: "Small Signals 物联网界面概念视觉",
    year: "2026",
    type: "居住空间交互界面",
    role: "概念 / 界面 / 前端原型",
    format: "交互原型与视觉系统",
    summary:
      "把灯光、温度、空气和声音这些日常信号，转译成一张安静的空间界面。它不要求用户不断操作，而是让环境状态以更少的提示被感知。",
    notes: [
      "先梳理信息优先级，再决定哪些数据应该出现在界面里。",
      "使用克制的动效和留白，避免智能设备常有的提醒噪音。",
      "项目结合物联网背景，停留在概念原型和前端体验层面。",
    ],
  },
};

const body = document.body;
const header = document.querySelector("#site-header");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const localTime = document.querySelector("#local-time");
const progressBar = document.querySelector(".scroll-progress");
const cursor = document.querySelector(".cursor");
const projectDialog = document.querySelector("#project-dialog");
const dialogClose = document.querySelector(".project-dialog__close");
const dialogImage = document.querySelector("#dialog-image");
const dialogIndex = document.querySelector("#dialog-index");
const dialogTitle = document.querySelector("#dialog-title");
const dialogSummary = document.querySelector("#dialog-summary");
const dialogDetails = document.querySelector("#dialog-details");
const dialogNotes = document.querySelector("#dialog-notes");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

let lastFocusedElement = null;

function syncBodyLock() {
  const menuOpen = siteNav.classList.contains("is-open");
  const dialogOpen = projectDialog.open;
  body.classList.toggle("is-locked", menuOpen || dialogOpen);
}

function closeMenu() {
  siteNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.querySelector("span").textContent = "目录";
  menuToggle
    .querySelector("path")
    .setAttribute("d", "M4 8h16M4 16h16");
  syncBodyLock();
}

function toggleMenu() {
  const isOpen = siteNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.querySelector("span").textContent = isOpen ? "关闭" : "目录";
  menuToggle
    .querySelector("path")
    .setAttribute("d", isOpen ? "M6 6l12 12M18 6 6 18" : "M4 8h16M4 16h16");
  syncBodyLock();
}

function updateClock() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  });

  localTime.textContent = formatter.format(now);
  localTime.setAttribute("datetime", now.toISOString());
}

function updateScrollState() {
  const scrollTop = window.scrollY;
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? scrollTop / scrollableHeight : 0;

  header.classList.toggle("is-scrolled", scrollTop > 24);
  progressBar.style.setProperty("--scroll-progress", String(progress));
}

function populateDialog(project) {
  dialogImage.src = project.image;
  dialogImage.alt = project.alt;
  dialogIndex.textContent = project.index;
  dialogTitle.textContent = project.title;
  dialogSummary.textContent = project.summary;

  const entries = [
    ["年份", project.year],
    ["类型", project.type],
    ["职责", project.role],
    ["成果", project.format],
  ];

  dialogDetails.replaceChildren(
    ...entries.map(([label, value]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      group.append(term, description);
      return group;
    }),
  );

  dialogNotes.replaceChildren(
    ...project.notes.map((note, index) => {
      const paragraph = document.createElement("p");
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      paragraph.append(number, document.createTextNode(note));
      return paragraph;
    }),
  );
}

function openProject(projectId, trigger) {
  const project = projectData[projectId];

  if (!project || !projectDialog) {
    return;
  }

  lastFocusedElement = trigger || document.activeElement;
  populateDialog(project);
  projectDialog.showModal();
  projectDialog.scrollTop = 0;
  dialogClose.focus();
  syncBodyLock();
}

function closeProjectDialog() {
  if (projectDialog.open) {
    projectDialog.close();
  }
}

function setupRevealAnimations() {
  const revealTargets = document.querySelectorAll(
    ".section-heading, .project, .about__heading, .about__statement, .about__principles, .manifesto blockquote, .contact__main, .contact__footer, .site-footer",
  );

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  revealTargets.forEach((target) => target.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function setupCursor() {
  const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (!supportsFinePointer || prefersReducedMotion.matches) {
    return;
  }

  body.classList.add("cursor-ready");

  window.addEventListener(
    "pointermove",
    (event) => {
      cursor.classList.add("is-active");
      cursor.style.setProperty("--cursor-x", `${event.clientX}px`);
      cursor.style.setProperty("--cursor-y", `${event.clientY}px`);
    },
    { passive: true },
  );

  document.documentElement.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-active");
  });

  document.addEventListener("pointerover", (event) => {
    cursor.classList.toggle(
      "is-view",
      Boolean(event.target.closest('[data-cursor="view"]')),
    );
  });

  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) {
      cursor.classList.remove("is-view");
    }
  });
}

menuToggle.addEventListener("click", toggleMenu);

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (siteNav.classList.contains("is-open")) {
    closeMenu();
  }
});

window.addEventListener(
  "resize",
  () => {
    if (window.innerWidth > 900 && siteNav.classList.contains("is-open")) {
      closeMenu();
    }
  },
  { passive: true },
);

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-project]");

  if (!trigger) {
    return;
  }

  event.preventDefault();
  openProject(trigger.dataset.project, trigger);
});

dialogClose.addEventListener("click", closeProjectDialog);

projectDialog.addEventListener("close", () => {
  syncBodyLock();
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
});

projectDialog.addEventListener("click", (event) => {
  if (event.target === projectDialog) {
    closeProjectDialog();
  }
});

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState, { passive: true });

setupRevealAnimations();
setupCursor();
updateClock();
updateScrollState();
window.setInterval(updateClock, 30_000);
