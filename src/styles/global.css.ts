/* system/src/styles/global.css.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 *
 * Global reset, typography, fonts and scrollbar styling — ported from the old
 * app's src/css/main.css + fonts.css to vanilla-extract globalStyle calls.
 */

import { globalFontFace, globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

/* ============================================================================
   FONTS — Comic Code (kept through the terminal/clunky redesign — it's a
   paid font, so the look changed shape/colour but not the typeface)
   ============================================================================ */
const comic = "Comic Code";

globalFontFace(comic, {
  src: "url('https://m.doughmination.gay/f/Comic-Code/woff2/ComicCode-Regular.woff2') format('woff2')",
  fontWeight: 400,
  fontStyle: "normal",
  fontDisplay: "swap",
});
globalFontFace(comic, {
  src: "url('https://m.doughmination.gay/f/Comic-Code/woff2/ComicCode-Italic.woff2') format('woff2')",
  fontWeight: 400,
  fontStyle: "italic",
  fontDisplay: "swap",
});
globalFontFace(comic, {
  src: "url('https://m.doughmination.gay/f/Comic-Code/woff2/ComicCode-Medium.woff2') format('woff2')",
  fontWeight: 500,
  fontStyle: "normal",
  fontDisplay: "swap",
});
globalFontFace(comic, {
  src: "url('https://m.doughmination.gay/f/Comic-Code/woff2/ComicCode-Bold.woff2') format('woff2')",
  fontWeight: 700,
  fontStyle: "normal",
  fontDisplay: "swap",
});

/* ============================================================================
   GLOBAL RESET & BASE STYLES
   ============================================================================ */
globalStyle("*", {
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  borderColor: vars.line,
});

globalStyle("html, body", {
  overflowX: "hidden",
  maxWidth: "100vw",
});

globalStyle("html", {
  scrollBehavior: "smooth",
});

globalStyle("body", {
  fontFamily: vars.fontComic,
  background: vars.bg,
  color: vars.text,
  minHeight: "100vh",
  fontSize: "15px",
  lineHeight: 1.6,
});

/* The site's wallpaper and fade (as in the inbox app), fixed behind every
   page. z-index -1 keeps it under all content, portals included. */
globalStyle("body::before, body::after", {
  content: '""',
  position: "fixed",
  inset: 0,
  zIndex: -1,
  pointerEvents: "none",
});
globalStyle("body::before", {
  background: "url('/background.avif') center / cover no-repeat",
  opacity: 0.5,
});
globalStyle("body::after", {
  background: [
    `linear-gradient(rgb(11 10 13 / 55%), rgb(11 10 13 / 80%) 55%, ${vars.bg})`,
    "radial-gradient(70% 60% at 20% 30%, rgb(235 69 158 / 12%), transparent 70%)",
  ].join(", "),
});

globalStyle(
  "h1, h2, h3, h4, h5, h6, label, input, select, textarea, button",
  {
    fontFamily: vars.fontComic,
  },
);

globalStyle("h1, h2, h3", {
  lineHeight: 1.25,
  textWrap: "balance",
});

/* Anchors inherit their surrounding colour and are not underlined by default.
   Without this, every next/link renders with the user-agent blue/purple
   underline, which wrecks card and nav styling. Content links opt back in
   via their own class. */
globalStyle("a", {
  color: "inherit",
  textDecoration: "none",
});

globalStyle("h1", {
  fontSize: "2.5rem",
  fontWeight: 700
});
globalStyle("h2", {
  fontSize: "2rem",
  fontWeight: 600
});
globalStyle("h3", {
  fontSize: "1.75rem",
  fontWeight: 600
});

globalStyle(
  "button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible",
  {
    outline: "none",
    boxShadow: `0 0 0 4px ${vars.accentDim}`,
  },
);

/* Mobile heading sizes */
globalStyle("h1", { "@media": { "screen and (max-width: 640px)": { fontSize: "2rem" } } });
globalStyle("h2", { "@media": { "screen and (max-width: 640px)": { fontSize: "1.75rem" } } });
globalStyle("h3", { "@media": { "screen and (max-width: 640px)": { fontSize: "1.5rem" } } });

/* ============================================================================
   SCROLLBAR — thin and quiet, as in the inbox app
   ============================================================================ */
globalStyle("*", {
  scrollbarWidth: "thin",
  scrollbarColor: "rgb(255 255 255 / 14%) transparent",
});

globalStyle("*, *::before, *::after", {
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none !important",
      animation: "none !important",
    },
  },
});
