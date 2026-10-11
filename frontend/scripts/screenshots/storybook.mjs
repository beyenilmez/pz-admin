export async function prepareStory(
  page,
  { serverUrl, story, theme, language, dimensions },
) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.screenshotEvents = [];
    const timer = setInterval(() => {
      // Storybook exposes its preview lifecycle through this channel.
      // eslint-disable-next-line no-underscore-dangle
      const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
      if (!channel) return;
      for (const event of [
        "storyFinished",
        "storyErrored",
        "storyThrewException",
        "playFunctionThrewException",
      ]) {
        channel.on(event, (data) =>
          window.screenshotEvents.push({ event, data }),
        );
      }
      clearInterval(timer);
    }, 1);
  });
  const url = new URL("iframe.html", serverUrl);
  url.searchParams.set("id", story);
  url.searchParams.set("viewMode", "story");
  url.searchParams.set(
    "globals",
    `theme:${theme};locale:${language};presentation:window`,
  );
  await page.goto(url.href);
  await page.waitForFunction(() => window.screenshotEvents.length > 0, null, {
    timeout: 30_000,
  });
  const events = await page.evaluate(() => window.screenshotEvents);
  if (
    events.some(
      ({ event, data }) =>
        event !== "storyFinished" || data?.status === "error",
    )
  ) {
    throw new Error(`${story}: ${JSON.stringify(events).slice(0, 1500)}`);
  }
  await page.waitForFunction(
    ({ language: expectedLanguage, theme: colorScheme }) =>
      document.documentElement.lang === expectedLanguage &&
      document.documentElement.dataset.mantineColorScheme === colorScheme,
    { language, theme },
  );
  await page.mouse.move(0, 0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((image) => image.checkVisibility())
        .map((image) => image.decode()),
    );
  });
  const frame = page.locator("[data-capture-window]");
  const bounds = await frame.boundingBox();
  if (
    bounds?.width !== dimensions.width ||
    bounds.height !== dimensions.height
  ) {
    throw new Error(`${story}: unexpected window dimensions`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return frame;
}
