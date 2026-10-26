/* system/src/styles/theme.css.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import {
  createGlobalTheme,
  createGlobalThemeContract,
  globalStyle,
} from "@vanilla-extract/css";

/** Token -> literal CSS custom-property name (accentAlt => var(--accent-alt)). */
export const vars = createGlobalThemeContract({
  accent: "accent",
  accentAlt: "accent-alt",
  success: "success",
  danger: "danger",
  warning: "warning",
  info: "info",
  rosewater: "rosewater",
  maroon: "maroon",
  peach: "peach",
  teal: "teal",
  sky: "sky",
  sapphire: "sapphire",
  lavender: "lavender",
  bgDeep: "bg-deep",
  bgRaised: "bg-raised",
  bg: "bg",
  surface: "surface",
  surfaceHi: "surface-hi",
  surfaceHigher: "surface-higher",
  textFaint: "text-faint",
  textDim: "text-dim",
  textMuted: "text-muted",
  textSoft: "text-soft",
  text: "text",
  fontComic: "font-comic",
  line: "line",
  accentLine: "accent-line",
  accentDim: "accent-dim",
  panel: "panel",
  radius: "radius",
  radiusSm: "radius-sm",
});

/** Not flavor-dependent, but goes through the same contract so it's always
 *  referenced via var(--font-comic) — never inlined as a raw string, which
 *  trips up the CSS serializer on the quote+comma combo. */
const FONT_COMIC_VALUE = "'Comic Code', ui-monospace, monospace";

/**
 * One palette, applied globally — matched to the inbox app (email/src/web/
 * app.css), which itself follows the main site's theme.css: translucent raised
 * surfaces over a fixed wallpaper, hairline borders, rounded cards that pick up
 * an accent ring on hover, pill buttons. The old token names are kept so every
 * component follows along; the surface shades are now translucent whites.
 */
createGlobalTheme(":root", vars, {
  accent: "#eb459e",
  accentAlt: "#c9327f",
  success: "#eb459e",
  danger: "#ff5c7a",
  warning: "#eb459e",
  info: "#a49eab",
  rosewater: "#f7c6e0",
  maroon: "#c9327f",
  peach: "#f07ab8",
  teal: "#a49eab",
  sky: "#a49eab",
  sapphire: "#7d7785",
  lavender: "#f07ab8",
  bgDeep: "#070609",
  bgRaised: "rgb(255 255 255 / 3.5%)",
  bg: "#0b0a0d",
  surface: "rgb(255 255 255 / 3.5%)",
  surfaceHi: "rgb(255 255 255 / 6%)",
  surfaceHigher: "rgb(255 255 255 / 9%)",
  textFaint: "#6a6470",
  textDim: "#857f8c",
  textMuted: "#a49eab",
  textSoft: "#d3ced8",
  text: "#ece9ef",
  fontComic: FONT_COMIC_VALUE,
  line: "rgb(255 255 255 / 9%)",
  accentLine: "rgb(235 69 158 / 40%)",
  accentDim: "rgb(235 69 158 / 14%)",
  panel: "rgb(11 10 13 / 72%)",
  radius: "1rem",
  radiusSm: "0.5rem",
});
globalStyle(":root", { colorScheme: "dark" });
