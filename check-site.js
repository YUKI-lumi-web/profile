const path = require("node:path");
const {
  chromium,
} = require("C:/Users/28986/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");

const browserPath =
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const baseUrl = "http://127.0.0.1:4173";
const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const horizontalOverflow = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.position !== "fixed" &&
          style.position !== "absolute" &&
          (rect.right > viewportWidth + 1 || rect.left < -1)
        );
      })
      .slice(0, 12)
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        rect: element.getBoundingClientRect().toJSON(),
      }));

    const images = [...document.images]
      .filter((image) => image.getAttribute("src"))
      .map((image) => ({
        src: image.getAttribute("src"),
        loaded: image.complete && image.naturalWidth > 0,
        naturalWidth: image.naturalWidth,
      }));

    const titleRect = document
      .querySelector(".hero__title")
      .getBoundingClientRect();
    const objectRect = document
      .querySelector(".hero__object")
      .getBoundingClientRect();
    const heroImage = document.querySelector(".hero__object img");
    const heroImageRect = heroImage.getBoundingClientRect();
    const heroImageStyle = getComputedStyle(heroImage);
    const overlap =
      titleRect.right > objectRect.left &&
      titleRect.left < objectRect.right &&
      titleRect.bottom > objectRect.top &&
      titleRect.top < objectRect.bottom;

    return {
      viewportWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow,
      images,
      heroOverlap: overlap,
      heroTitle: titleRect.toJSON(),
      heroObject: objectRect.toJSON(),
      heroImage: {
        rect: heroImageRect.toJSON(),
        width: heroImageStyle.width,
        height: heroImageStyle.height,
        aspectRatio: heroImageStyle.aspectRatio,
        objectFit: heroImageStyle.objectFit,
      },
      sections: document.querySelectorAll("main section").length,
      projects: document.querySelectorAll(".project").length,
    };
  });
}

async function run() {
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
  });

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const desktop = await desktopContext.newPage();
  const desktopErrors = [];
  const desktopHttpErrors = [];

  desktop.on("console", (message) => {
    if (message.type() === "error") {
      desktopErrors.push(message.text());
    }
  });
  desktop.on("pageerror", (error) => desktopErrors.push(error.message));
  desktop.on("response", (response) => {
    if (response.status() >= 400) {
      desktopHttpErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await desktop.goto(baseUrl, { waitUntil: "networkidle" });
  await desktop.evaluate(() => document.fonts.ready);
  await desktop.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await desktop.waitForTimeout(700);
  await desktop.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "instant" }),
  );
  await desktop.waitForTimeout(500);

  const desktopReport = await inspectPage(desktop);
  check(desktopErrors.length === 0, `Desktop console errors: ${desktopErrors}`);
  check(
    desktopHttpErrors.length === 0,
    `Desktop HTTP errors: ${desktopHttpErrors}`,
  );
  check(
    desktopReport.documentScrollWidth <= desktopReport.viewportWidth + 1,
    "Desktop has horizontal overflow",
  );
  check(
    desktopReport.horizontalOverflow.length === 0,
    `Desktop overflowing elements: ${JSON.stringify(desktopReport.horizontalOverflow)}`,
  );
  check(
    desktopReport.images.every((image) => image.loaded),
    `Desktop images failed: ${JSON.stringify(desktopReport.images)}`,
  );
  check(!desktopReport.heroOverlap, "Desktop hero title overlaps the hero artwork");
  check(desktopReport.projects === 3, "Expected three project cards");

  await desktop.screenshot({
    path: path.join(__dirname, "screenshots", "desktop-full.png"),
    fullPage: true,
  });

  await desktop.locator('[data-project="still"]').first().click();
  await desktop.waitForFunction(
    () => document.querySelector("#project-dialog").open,
  );
  check(
    (await desktop.locator("#dialog-title").textContent()).trim() ===
      "Aftertaste",
    "Project dialog did not show the expected project",
  );
  check(
    await desktop
      .locator("#dialog-image")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
    "Desktop project dialog image did not load",
  );
  check(
    await desktop.locator("#project-dialog").evaluate((dialog) => dialog.open),
    "Project dialog did not open",
  );
  await desktop.screenshot({
    path: path.join(__dirname, "screenshots", "desktop-dialog.png"),
  });
  await desktop.locator(".project-dialog__close").click();
  await desktop.waitForFunction(
    () => !document.querySelector("#project-dialog").open,
  );
  check(
    !(await desktop.locator("body").evaluate((element) =>
      element.classList.contains("is-locked"),
    )),
    "Desktop body remained locked after closing the dialog",
  );
  await desktopContext.close();

  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 1,
  });
  const tablet = await tabletContext.newPage();
  await tablet.goto(baseUrl, { waitUntil: "networkidle" });
  const tabletReport = await inspectPage(tablet);
  check(
    tabletReport.documentScrollWidth <= tabletReport.viewportWidth + 1,
    "Tablet has horizontal overflow",
  );
  check(
    tabletReport.horizontalOverflow.length === 0,
    `Tablet overflowing elements: ${JSON.stringify(tabletReport.horizontalOverflow)}`,
  );
  check(
    tabletReport.images.every((image) => image.loaded),
    `Tablet images failed: ${JSON.stringify(tabletReport.images)}`,
  );
  await tablet.screenshot({
    path: path.join(__dirname, "screenshots", "tablet-full.png"),
    fullPage: true,
  });
  await tabletContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await mobileContext.newPage();
  const mobileErrors = [];
  const mobileHttpErrors = [];

  mobile.on("console", (message) => {
    if (message.type() === "error") {
      mobileErrors.push(message.text());
    }
  });
  mobile.on("pageerror", (error) => mobileErrors.push(error.message));
  mobile.on("response", (response) => {
    if (response.status() >= 400) {
      mobileHttpErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await mobile.waitForTimeout(700);
  await mobile.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "instant" }),
  );
  await mobile.waitForTimeout(400);

  const mobileReport = await inspectPage(mobile);
  check(mobileErrors.length === 0, `Mobile console errors: ${mobileErrors}`);
  check(mobileHttpErrors.length === 0, `Mobile HTTP errors: ${mobileHttpErrors}`);
  check(
    mobileReport.documentScrollWidth <= mobileReport.viewportWidth + 1,
    "Mobile has horizontal overflow",
  );
  check(
    mobileReport.horizontalOverflow.length === 0,
    `Mobile overflowing elements: ${JSON.stringify(mobileReport.horizontalOverflow)}`,
  );
  check(
    mobileReport.images.every((image) => image.loaded),
    `Mobile images failed: ${JSON.stringify(mobileReport.images)}`,
  );
  check(!mobileReport.heroOverlap, "Mobile hero title overlaps the hero artwork");

  await mobile.locator(".menu-toggle").click();
  check(
    (await mobile.locator(".menu-toggle").getAttribute("aria-expanded")) ===
      "true",
    "Mobile menu did not set aria-expanded",
  );
  check(
    await mobile.locator("#site-nav").evaluate((element) =>
      element.classList.contains("is-open"),
    ),
    "Mobile menu did not open",
  );
  await mobile.locator(".menu-toggle").click();
  check(
    (await mobile.locator(".menu-toggle").getAttribute("aria-expanded")) ===
      "false",
    "Mobile menu did not close",
  );

  await mobile.screenshot({
    path: path.join(__dirname, "screenshots", "mobile-full.png"),
    fullPage: true,
  });

  await mobile.locator('[data-project="signals"]').first().click();
  await mobile.waitForFunction(
    () => document.querySelector("#project-dialog").open,
  );
  check(
    (await mobile.locator("#dialog-title").textContent()).trim() ===
      "Small Signals",
    "Mobile project dialog did not show the expected project",
  );
  await mobile.waitForFunction(
    () => {
      const image = document.querySelector("#dialog-image");
      return image.complete && image.naturalWidth > 0;
    },
  );
  await mobile.screenshot({
    path: path.join(__dirname, "screenshots", "mobile-dialog.png"),
  });
  await mobile.locator(".project-dialog__close").click();
  await mobileContext.close();

  const narrowContext = await browser.newContext({
    viewport: { width: 320, height: 720 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const narrow = await narrowContext.newPage();
  await narrow.goto(baseUrl, { waitUntil: "networkidle" });
  const narrowReport = await inspectPage(narrow);
  check(
    narrowReport.documentScrollWidth <= narrowReport.viewportWidth + 1,
    "Narrow mobile has horizontal overflow",
  );
  check(
    narrowReport.horizontalOverflow.length === 0,
    `Narrow mobile overflowing elements: ${JSON.stringify(narrowReport.horizontalOverflow)}`,
  );
  await narrow.screenshot({
    path: path.join(__dirname, "screenshots", "mobile-narrow.png"),
    fullPage: true,
  });
  await narrowContext.close();
  await browser.close();

  console.log(
    JSON.stringify(
      {
        desktop: desktopReport,
        tablet: tabletReport,
        mobile: mobileReport,
        narrow: narrowReport,
        failures,
      },
      null,
      2,
    ),
  );

  if (failures.length) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
