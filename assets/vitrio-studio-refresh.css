@import url('/assets/vitrio-studio-editor-refresh.css?v=20261013-card-style-2');
@import url('/assets/partner-admin-selects.css');
@import url('/assets/vitrio-studio-account-refresh.css?v=20261016-single-subscription-1');
@font-face { font-family: Unbounded; src: url('/assets/fonts/unbounded-cyrillic.woff2') format('woff2'); font-weight: 300 900; font-display: swap; unicode-range: U+0250-052F,U+1E00-1FFF; }
@font-face { font-family: Unbounded; src: url('/assets/fonts/unbounded-latin.woff2') format('woff2'); font-weight: 300 900; font-display: swap; unicode-range: U+0000-024F; }
/* LOCAL REVIEW — user-pinned Vitrio product world, code-led.
THESIS: A focused image workspace, not a promotional dashboard.
OWN-WORLD: Continuous graphite chrome, white paper, 10px controls, Unbounded, silver 3D objects.
STORY: Choose a discipline, open a project, compose on the canvas, preserve versions.
FIRST VIEWPORT: 228px rail, 76px command bar, four visual project choices and a searchable library.
FORM: Existing Studio/AI workspace interactions; no new identity tournament (owner-pinned).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
*/
body.v-studio-refresh {
  --v-bg: #f4f4f4; --v-surface: #fff; --v-muted: #ededed; --v-ink: #171717;
  --v-copy: #686868; --v-faint: #737373; --v-line: #dedede;
  --v-accent: #171717; --v-accent-dark: #fff; --sr-rail: #191919; --sr-rail-text: #f5f5f5;
  --sr-rail-copy: #b0b0b0; --sr-rail-line: #373737; --sr-rail-selected: #323232;
  --sr-header: 76px; --sr-sidebar: 228px;
  background: var(--v-bg); color: var(--v-ink); color-scheme: light;
  font-family: Manrope, Arial, sans-serif; font-size: 14px;
  scrollbar-color: #aaa var(--v-bg); scrollbar-width: thin;
}

body.v-studio-refresh :where(a,button,input,select,textarea,summary,[tabindex]):focus-visible { outline: 0 !important; box-shadow: 0 1px 2px color-mix(in srgb,var(--v-ink) 9%,transparent), 0 0 0 3px color-mix(in srgb,var(--v-accent) 28%,transparent), 0 0 16px color-mix(in srgb,var(--v-accent) 20%,transparent); }
@media (forced-colors: active) { body.v-studio-refresh :where(a,button,input,select,textarea,summary,[tabindex]):focus-visible { outline: 2px solid CanvasText !important; outline-offset: 2px; box-shadow: none; } }
body.v-studio-refresh[data-studio-theme='dark'] {
  --v-bg: #111111; --v-surface: #202020; --v-muted: #2b2b2b; --v-ink: #f4f4f4;
  --v-copy: #b6b6b6; --v-faint: #aaa; --v-line: #383838; --v-accent: #f4f4f4;
  --v-accent-dark: #171717; --sr-rail: #171717; color-scheme: dark;
}
.v-studio-refresh ::selection { background: var(--v-ink); color: var(--v-surface); }
.v-studio-refresh :focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
body.v-studio-refresh .v-app :is(input:not([type]),input[type='text'],input[type='email'],input[type='password'],input[type='search'],input[type='url'],input[type='tel'],input[type='number'],textarea):focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--v-ink) 42%, var(--v-line));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--v-ink) 10%, transparent);
  background: var(--v-surface);
}
.v-studio-refresh :is(input,textarea) { caret-color: var(--v-ink); }
.v-studio-refresh button, .v-studio-refresh input, .v-studio-refresh select, .v-studio-refresh textarea { font-family: inherit; }
.v-studio-refresh .v-button { border-radius: 999px; min-height: 46px; box-shadow: none; font-weight: 600; }
.v-studio-refresh .v-button:hover { transform: none; box-shadow: none; }
.v-studio-refresh .v-button--accent { background: var(--v-accent); color: var(--v-accent-dark); }
.v-studio-refresh .v-button--accent:hover { background: var(--v-accent); opacity: .85; }
.v-studio-refresh .v-button--soft { background: var(--v-muted); color: var(--v-ink); border-color: transparent; }
.v-studio-refresh .v-icon-button { min-width: 44px; min-height: 44px; border-radius: 999px; background: transparent; color: var(--v-ink); box-shadow: none; }
.v-studio-refresh .v-icon-button:hover { background: var(--v-muted); }
.v-studio-refresh .v-app { min-height: 100dvh; background: var(--v-bg); }
.v-studio-refresh .v-app--studio { grid-template-rows: var(--sr-header) minmax(0,1fr); }
.v-studio-refresh .v-app--studio .v-save-status::before { background: var(--v-copy); box-shadow: none; }
.v-studio-refresh .v-app .v-app-header { position: sticky; top: 0; z-index: 30; height: var(--sr-header); padding: 0 30px; gap: 20px; background: var(--v-bg); border-bottom: 1px solid var(--v-line); }
.v-studio-refresh .v-app-header .v-logo { flex: 0 0 auto; width: 154px; }
.v-studio-refresh .v-app-header .v-logo img { height: 29px; width: auto; }
.v-studio-refresh .v-app-header .v-logo img {content:url('/assets/vitrio/brand/vitrio-dark-208.webp');filter:none}
.v-studio-refresh[data-studio-theme='dark'] .v-app-header .v-logo img {content:url('/assets/vitrio/brand/vitrio-light-208.webp');filter:none}
.sr-header-separator { width: 1px; height: 22px; background: var(--v-line); }
.sr-header-label { font-size: 14px; font-weight: 600; }
.v-studio-refresh .v-app-crumb { margin-left: 12px; color: var(--v-copy); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.v-studio-refresh .v-app-header-actions { gap: 12px; margin-left: auto; }
.v-studio-refresh .v-save-status { color: var(--v-copy); font-size: 11px; }
.v-studio-refresh .v-save-status.sr-visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); border: 0; white-space: nowrap; }
.v-studio-refresh .v-save-status.sr-visually-hidden::before { content: none; }
.sr-header-balance { display: flex; align-items: center; gap: 7px; min-height: 42px; border: 1px solid var(--v-line); border-radius: 999px; padding: 0 16px; background: var(--v-surface); color: var(--v-ink); font-size: 12px; white-space: nowrap; }
.sr-header-balance b { font-variant-numeric: tabular-nums; }
.v-studio-refresh .v-app .v-app-shell { display: grid; grid-template-columns: var(--sr-sidebar) minmax(0,1fr); min-height: calc(100dvh - var(--sr-header)); }
/*  Sidebar: three-zone flex layout.
    .sr-sidebar-top    — fixed: brand + new project + navigation (NEVER scrolls internally)
    .sr-sidebar-scroll — scrollable: only the "Недавние" project list
    .sr-sidebar-bottom — fixed: balance, account, logout (NEVER scrolls internally)

    Two fallback layers for short viewports:
    1) If top+scroll+bottom fit in 100dvh → only .sr-sidebar-scroll scrolls its projects.
    2) If they don't fit → .v-sidebar itself becomes a last-resort scroll container
       so the bottom block is always reachable by scrolling the sidebar as a whole. */
.v-studio-refresh .v-app .v-sidebar {
  position: sticky; top: var(--sr-header);
  display: flex; flex-direction: column;
  /* clamp: at least 60% of viewport, never taller than 100dvh */
  height: clamp(calc(100dvh - var(--sr-header)), 400px, calc(100dvh - var(--sr-header)));
  padding: 0;
  overflow-y: auto; overflow-x: hidden;    /* last-resort scroll for very short viewports */
  border: 0; background: var(--sr-rail); color: var(--sr-rail-text);
  scrollbar-color: #555 var(--sr-rail); scrollbar-width: thin;
}
.sr-sidebar-top {
  flex: 0 0 auto;                    /* never shrinks, never scrolls internally */
  padding: 24px 15px 0;
}
.sr-sidebar-scroll {
  flex: 1 1 0; min-height: 0;        /* takes remaining space, scrolls internally */
  overflow-y: auto; overflow-x: hidden;
  padding: 12px 15px 16px;
  scrollbar-color: #555 var(--sr-rail); scrollbar-width: thin;
}
.v-studio-refresh .v-sidebar .v-sidebar-new { width: 100%; min-height: 46px; margin: 0 0 27px; background: #f3f3f3; color: #181818; padding: 0 14px; font-size: 13px; }
.v-studio-refresh .v-sidebar .v-side-link { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 46px; margin: 2px 0; padding: 11px 15px; color: var(--sr-rail-copy); background: transparent; border: 0; border-radius: 999px; text-decoration: none; font-size: 13px; font-weight: 500; text-align: left; }
.v-studio-refresh .v-sidebar .v-side-link.active { background: var(--sr-rail-selected) !important; color: #fff; }
.v-studio-refresh .v-sidebar .v-side-link:hover { background: #292929; color: #fff; }
.v-studio-refresh .v-sidebar .v-side-link .v-icon { width: 18px; height: 18px; color: inherit; }
.v-studio-refresh .v-sidebar .sr-nav-arrow { margin-left: auto; width: 14px; }
.sr-nav-status { color: var(--sr-rail-copy); font-size: 12px; padding: 0 12px; }
.sr-recent { margin-top: 0; }
.sr-recent h2 { margin: 0 14px 12px; color: #aaa; font-size: 11px; font-weight: 500; }
.v-studio-refresh .v-sidebar .v-project-list { display: grid; gap: 3px; }
.v-studio-refresh .v-sidebar .v-project-item { color: #bbb; font-size: 12px; display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 8px 14px; border-radius: 12px; background: transparent; }
.v-studio-refresh .v-sidebar .v-project-item .v-icon { width: 15px; }
.v-studio-refresh .v-sidebar .v-project-item span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v-studio-refresh .v-sidebar .v-project-item:hover, .v-studio-refresh .v-sidebar .v-project-item.active { background: #292929; color: #fff; }
.sr-muted { margin: 0 14px; font-size: 12px; color: #aaa; }
.sr-sidebar-bottom { flex: 0 0 auto; padding: 20px 15px 16px; border-top: 1px solid var(--sr-rail-line); }
.v-studio-refresh .sr-subscription-cta {
  min-height: 58px;
  margin: 12px 0 10px;
  padding: 10px 11px;
  border: 0;
  border-radius: 10px;
  background: #cfff22;
  color: #171717;
  box-shadow: 0 8px 22px rgb(207 255 34 / .12);
  animation: none;
  cursor: pointer;
}
.v-studio-refresh .sr-subscription-cta::before { display: none; }
.v-studio-refresh .sr-subscription-cta > .v-icon:first-child { width: 19px; height: 19px; }
.v-studio-refresh .sr-subscription-cta small { font-size: 9px; }
.v-studio-refresh .sr-subscription-cta b { font-size: 10px; }
.v-studio-refresh .sr-subscription-cta:hover { transform: translateY(-1px); background: #cfff22; box-shadow: 0 10px 24px rgb(207 255 34 / .16); }
.sr-account { display: flex; align-items: center; gap: 10px; width: 100%; padding: 18px 5px 10px; margin-top: 16px; border-top: 1px solid var(--sr-rail-line); color: #fff; text-align: left; }
.sr-account > span:nth-child(2) { display: grid; gap: 3px; min-width: 0; }
.sr-account b { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sr-account small { color: #aaa; font-size: 10px; }
.sr-account-settings { display: grid; width: 32px; height: 32px; flex: 0 0 32px; margin-left: auto; place-items: center; padding: 0; border: 0; background: transparent; color: #aaa; }
.sr-account-settings:hover { background: transparent; color: #fff; }
.sr-account-settings .v-icon { width: 16px; height: 16px; }
.vitrio-body .sr-account-settings:focus { outline: 0 !important; box-shadow: none; }
.vitrio-body .sr-account-settings:focus-visible { outline: 1px solid #aaa !important; outline-offset: 3px; box-shadow: none !important; color: #fff; }
.v-studio-refresh .v-avatar { background: #3b3b3b; color: #fff; border-radius: 50%; width: 34px; height: 34px; flex: 0 0 34px; font-size: 12px; }
.v-studio-refresh .v-sidebar .v-side-logout { display: flex; align-items: center; gap: 10px; width: auto; min-height: 40px; padding: 8px; background: transparent; color: #aaa; border: 0; font-size: 11px; }
.v-studio-refresh .v-workspace { min-width: 0; padding: 42px clamp(24px,3.1vw,56px) 60px; }
.sr-start-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.sr-start-heading h1 { font-size: clamp(27px,2.8vw,40px); font-weight: 500; line-height: 1.15; letter-spacing: -.04em; margin: 0; }
.sr-start-heading p { margin: 12px 0 0; color: var(--v-copy); font-size: 14px; }
.sr-workspace-mark { display: grid; place-items: center; width: 52px; height: 52px; color: var(--v-copy); }
.sr-workspace-mark .v-icon { width: 32px; height: 32px; stroke-width: 1.1; }
.sr-create-types { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
.sr-create-type { display: flex; flex-direction: column; align-items: stretch; position: relative; min-width: 0; padding: 16px 20px 22px; border: 0; border-radius: 20px; background: var(--v-surface); color: var(--v-ink); text-align: left; transition: background-color .18s ease-out; }
.sr-create-type:hover { background: var(--v-muted); }
.sr-type-art { display: block; width: 100%; height: auto; object-fit: contain; }
.sr-create-type .sr-type-art { width: 170px; max-width: 100%; height: 160px; margin: 0 auto 14px; }
.sr-type-title { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 650; letter-spacing: -.025em; line-height: 1.3; }
.sr-type-title .v-icon { margin-left: auto; width: 15px; }
.sr-type-copy { margin-top: 9px; font-size: 12px; color: var(--v-copy); line-height: 1.5; }
.sr-type-detail { display: none; }
.sr-library { margin-top: 44px; }
.sr-library-head { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.sr-library-head h2 { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 23px; line-height: 1.3; font-weight: 500; letter-spacing: -.03em; }
.sr-library-head h2 > span { display: grid; place-items: center; min-width: 26px; height: 26px; border: 1px solid var(--v-line); border-radius: 999px; font-size: 11px; font-weight: 500; color: var(--v-copy); }
.sr-search { display: flex; align-items: center; gap: 9px; width: 230px; min-height: 44px; padding: 0 14px; border: 1px solid var(--v-line); border-radius: 999px; }
.sr-search > .v-icon { width: 15px; color: var(--v-copy); }
.sr-search input { width: 100%; min-width: 0; background: transparent; color: var(--v-ink); border: 0; font-size: 12px; }
.sr-search input::placeholder { color: var(--v-copy); }
.sr-library-tools { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 20px 0 22px; }
.sr-project-filters { display: flex; flex-wrap: wrap; gap: 5px; }
.sr-project-filters button { min-height: 38px; padding: 0 14px; background: transparent; border: 1px solid transparent; border-radius: 999px; color: var(--v-copy); font-size: 11px; }
.sr-project-filters button[aria-pressed='true'] { background: var(--v-ink); color: var(--v-surface); }
.sr-project-filters button:hover:not([aria-pressed='true']) { background: var(--v-muted); color: var(--v-ink); }
.sr-sort select { max-width: 155px; min-height: 40px; padding: 0 7px; background: transparent; border: 0; color: var(--v-copy); font-size: 11px; }
.v-studio-refresh .sr-projects .v-project-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 26px 20px; max-width: none; }
.v-studio-refresh .v-project-card-wrap .v-project-card { background: transparent; border: 0; border-radius: 0; box-shadow: none; overflow: visible; }
.v-studio-refresh .v-project-card-wrap .v-project-card:hover { transform: none; box-shadow: none; }
.v-studio-refresh .v-project-card > img, .v-studio-refresh .v-project-card-image { width: 100%; height: auto; aspect-ratio: 4/3; object-fit: cover; border-radius: 18px; background: var(--v-muted); }
.v-studio-refresh .v-project-card-image { background: var(--v-muted); display: grid; place-items: center; }
.v-studio-refresh .v-project-card-image::after { content: ''; width: 36px; height: 42px; border: 1px solid var(--v-copy); border-radius: 6px; transform: rotate(-8deg); }
.v-studio-refresh .v-project-card > span { padding: 14px 2px 0; }
.v-studio-refresh .v-project-card b { display: block; color: var(--v-ink); font-size: 14px; font-weight: 600; }
.v-studio-refresh .v-project-card small { display: block; color: var(--v-copy); font-size: 11px; margin-top: 5px; }
.v-studio-refresh .v-project-card-action { opacity: 1; width: 36px; height: 36px; min-height: 36px; top: 12px; right: 12px; background: #fff; color: #171717; border: 0; box-shadow: none; }
.v-studio-refresh .v-project-card-menu { border: 1px solid var(--v-line); box-shadow: none; background: var(--v-surface); color: var(--v-ink); border-radius: 14px; }
.sr-library-empty { padding: 48px 20px; text-align: center; border-top: 1px solid var(--v-line); color: var(--v-copy); }
.sr-library-empty .v-icon { width: 30px; height: 30px; }
.sr-library-empty h3 { font-size: 18px; color: var(--v-ink); font-weight: 500; }
.sr-library-empty p { font-size: 13px; }
.sr-visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.v-studio-refresh .v-dialog-backdrop { background: rgb(0 0 0 / .48); backdrop-filter: none; padding: 24px; }
.v-studio-refresh .v-download-backdrop { place-items: center; overflow-y: auto; }
.v-studio-refresh .v-download-dialog { margin-block: auto; }
.v-studio-refresh .v-download-item > b { min-width: 0; overflow: hidden; font-size: 13px; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
.v-studio-refresh .v-download-actions [data-download-all] { white-space: nowrap; }
.v-studio-refresh .v-dialog { background: var(--v-surface); color: var(--v-ink); border: 0; border-radius: 28px; padding: 30px; box-shadow: 0 28px 80px rgb(0 0 0 / .2); max-height: calc(100dvh - 48px); overflow-y: auto; }
.v-studio-refresh .v-dialog--project { width: min(820px,100%); }
.v-studio-refresh .v-project-dialog-head { align-items: flex-start; margin-bottom: 26px; }
.v-studio-refresh .v-project-dialog-head h2 { font-size: 28px; font-weight: 500; letter-spacing: -.03em; }
.v-studio-refresh .v-project-dialog-head p { color: var(--v-copy); font-size: 13px; margin-top: 8px; }
.v-studio-refresh .v-project-type-fieldset { border: 0; margin: 0 0 24px; padding: 0; }
.v-studio-refresh .v-project-type-fieldset legend { margin-bottom: 12px; font-size: 12px; color: var(--v-copy); }
.v-studio-refresh .v-project-type-grid { grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
.v-studio-refresh .v-project-type-card { position: relative; min-height: 230px; padding: 16px 12px; border: 1px solid var(--v-line); border-radius: 18px; background: var(--v-bg); box-shadow: none; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
.v-studio-refresh .v-project-type-card:has(input:checked) { background: var(--v-muted); border-color: var(--v-ink); box-shadow: inset 0 0 0 1px var(--v-ink); }
.v-studio-refresh .v-project-type-card:has(input:focus-visible) { outline: 2px solid var(--v-ink); outline-offset: 3px; }
.v-studio-refresh .v-project-type-card input { position: absolute; width: 18px; height: 18px; right: 10px; top: 10px; opacity: 1; accent-color: var(--v-ink); }
.v-studio-refresh .v-project-type-icon { width: 100%; height: 108px; padding: 0; background: transparent; color: var(--v-ink); }
.v-studio-refresh .v-project-type-icon .sr-type-art { width: 112px; height: 112px; margin: auto; }
.v-studio-refresh .v-project-type-copy b { font-size: 13px; color: var(--v-ink); font-weight: 650; }
.v-studio-refresh .v-project-type-copy small { color: var(--v-copy); font-size: 11px; line-height: 1.55; margin-top: 7px; }
.v-studio-refresh .v-field > span { color: var(--v-ink); font-size: 12px; font-weight: 700; }
.v-studio-refresh .v-field :is(input,select,textarea) { background: var(--v-bg); border: 1px solid var(--v-line); color: var(--v-ink); min-height: 46px; border-radius: 20px; box-shadow: none; }
.v-studio-refresh .v-field :is(input,textarea)::placeholder { color: var(--v-copy); }
.v-studio-refresh .v-dialog-actions { padding-top: 24px; margin-top: 0; }
.v-studio-refresh .v-dialog-actions .v-button { min-width: 124px; }
.v-studio-refresh .v-account-settings-shell, .v-studio-refresh .v-account-settings-content, .v-studio-refresh .v-account-settings-nav { background: var(--v-surface); color: var(--v-ink); }
.v-studio-refresh .v-account-settings :is(input,select) { background: var(--v-bg); color: var(--v-ink); border-color: var(--v-line); }
.v-studio-refresh .v-account-settings-nav button.active { background: var(--v-muted); color: var(--v-ink); }
.v-studio-refresh .v-account-plan-option:has(input:checked) { background: var(--v-muted); border-color: var(--v-ink); }
.v-studio-refresh .v-app-menu-panel { background: var(--v-surface); color: var(--v-ink); }
.v-studio-refresh .v-app-menu-link.active { background: var(--v-muted); color: var(--v-ink); }
.v-studio-refresh .v-app-menu .v-subscription-cta { background: var(--v-ink); color: var(--v-surface); box-shadow: none; animation: none; }
.v-studio-refresh .v-app-menu .v-subscription-cta::before { display: none; }
.v-studio-refresh .v-local-preview-note { position: fixed; top: 55px; left: 30px; z-index: 31; max-width: 175px; padding: 0; background: transparent; color: var(--v-copy); font: 8px/1.4 Manrope,Arial,sans-serif; pointer-events: none; }
.v-studio-refresh .v-app--studio .v-mobile-settings { display: none; }
.v-studio-refresh .v-app-header .sr-theme-toggle { color: var(--v-ink); background: transparent; }
.v-studio-refresh .v-app-header .sr-theme-toggle:hover { color: var(--v-ink); background: var(--v-muted); }
.v-studio-refresh .v-app-menu button.v-app-menu-link { width: 100%; border: 0; background: transparent; font: inherit; text-align: left; }
.v-studio-refresh .v-app-menu .v-studio-navigation-mark,
.v-studio-refresh .v-app-menu .v-studio-gpt-mark { width: 28px; height: 28px; object-fit: contain; }
.v-studio-refresh .v-app-menu-account .v-studio-currency-mark { width: 24px; height: 24px; object-fit: contain; }
.v-studio-refresh .v-app--studio .v-source-slot i { background: var(--v-surface); color: var(--v-copy); }
.v-studio-refresh .v-app--studio .v-result-item.active { background: var(--v-muted); border-color: var(--v-ink); }
.v-studio-refresh .v-app--studio .v-generation-cost { color: inherit; }
.v-studio-refresh .v-app--studio .v-generate .v-generation-cost b { color: inherit; }
.v-studio-refresh .v-app--studio .v-generation-cost img { filter: none; }
.v-studio-refresh .v-app--studio .v-generate-footer > div > span:first-child { display: none; }
.v-studio-refresh .v-app--studio .v-canvas-actions .v-studio-gpt-button { display: none; }
.v-studio-refresh .v-app--studio .v-canvas-actions .sr-fit-canvas { display: grid; }
.v-studio-refresh { --admin-line: var(--v-line); --admin-paper: var(--v-surface); --admin-ink: var(--v-ink); --admin-mist: var(--v-muted); --admin-slate: var(--v-copy); }
body.v-studio-refresh .v-app select.partner-admin-select-native,
body.v-studio-refresh .v-dialog select.partner-admin-select-native { position: absolute; width: 1px; height: 1px; min-height: 0; padding: 0; margin: 0; border: 0; clip-path: inset(50%); overflow: hidden; white-space: nowrap; }
.v-studio-refresh .partner-admin-select { width: 100%; }
.v-studio-refresh .partner-admin-select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 0; width: 100%; min-height: 46px; padding: 10px 15px; border: 1px solid var(--v-line); border-radius: 999px; background: var(--v-bg); color: var(--v-ink); font: inherit; font-size: 12px; text-align: left; }
.v-studio-refresh .sr-sort .partner-admin-select-trigger { border: 0; background: transparent; font-size: 11px; color: var(--v-copy); }
.v-studio-refresh .partner-admin-select-menu { border-radius: 16px; }
.v-studio-refresh .partner-admin-select-option { min-height: 44px; }
@media(min-width:901px) and (max-width:1180px) {
  body.v-studio-refresh { --sr-sidebar: 76px; }
  /* collapsed rail: padding lives on the fixed top and bottom zones now */
  .sr-sidebar-top { padding: 22px 12px 0; }
  .sr-sidebar-scroll { padding: 12px 12px 16px; }
  .sr-sidebar-bottom { padding: 18px 12px 14px; }
  .v-studio-refresh .v-sidebar .v-sidebar-new { padding: 0; }
  .v-studio-refresh .v-sidebar :is(.v-side-link,.v-project-item) { justify-content: center; padding: 12px 0; }
  .v-studio-refresh .v-sidebar :is(.v-sidebar-new,.v-side-link,.v-project-item,.v-side-logout) > span,
  .v-studio-refresh .v-sidebar .sr-nav-arrow, .sr-account > span:nth-child(2), .sr-recent, .v-studio-refresh .sr-nav-status { display: none; }
  .sr-account { justify-content: center; padding-inline: 0; }
  .sr-account > .v-avatar { display: none; }
  .sr-account-settings { margin-inline: auto; }
  .v-studio-refresh .v-sidebar .v-side-logout { margin-inline: auto; }
}
@media(max-width:1050px) {
  .sr-create-type { padding-inline: 14px; }
  .sr-type-title { font-size: 14px; }
  .sr-create-type .sr-type-art { height: 130px; }
  .sr-library-tools { align-items: flex-start; }
}
@media(max-width:900px) {
  body.v-studio-refresh { --sr-header: 64px; }
  .v-studio-refresh .v-app .v-app-shell { display: block; }
  .v-studio-refresh .v-app .v-sidebar { display: none; }
  .v-studio-refresh .v-app .v-app-header { padding: 0 20px; gap: 12px; }
  .v-studio-refresh .v-app-header .v-logo { width: auto; }
  .v-studio-refresh .v-app-header .v-logo img { height: 25px; }
  .sr-header-separator, .sr-header-label, .v-studio-refresh .v-app-crumb, .v-studio-refresh .v-save-status { display: none; }
  .v-studio-refresh .v-app-menu-button { display: grid; place-items: center; min-width: 44px; height: 44px; background: transparent; color: var(--v-ink); border: 0; }
  .v-studio-refresh .v-workspace { padding: 30px 24px 50px; }
  .v-studio-refresh .v-app-header-actions { gap: 5px; }
  .v-studio-refresh .v-local-preview-note { top: 47px; left: 20px; right: auto; bottom: auto; }
  .sr-project-filters { flex-wrap: nowrap; overflow-x: auto; max-width: 100%; padding-bottom: 4px; scrollbar-width: none; }
  .sr-project-filters button { flex: 0 0 auto; min-height: 44px; }
  .sr-library-tools { display: block; }
  .sr-sort { display: block; margin-top: 8px; }
  .sr-sort select { min-height: 44px; }
  .v-studio-refresh .v-project-card-action { width: 44px; height: 44px; }
}
@media(max-width:600px) {
  .v-studio-refresh .v-app .v-app-header { padding-inline: 16px; }
  .v-studio-refresh .v-local-preview-note { left: 16px; }
  .sr-header-balance { padding-inline: 11px; min-height: 38px; font-size: 12px; }
  .sr-header-balance span { display: none; }
  .v-studio-refresh .v-workspace { padding: 26px 16px 42px; }
  .sr-start-heading { margin-bottom: 22px; }
  .sr-start-heading h1 { font-size: 29px; max-width: 270px; }
  .sr-start-heading p { font-size: 12px; margin-top: 10px; max-width: 240px; }
  .sr-workspace-mark { display: none; }
  .sr-create-types { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
  .sr-create-type { border-radius: 18px; padding: 12px 14px 18px; }
  .sr-create-type .sr-type-art { width: 125px; height: 116px; margin-bottom: 8px; }
  .sr-type-title { font-size: 13px; gap: 4px; }
  .sr-type-title .v-icon { width: 12px; }
  .sr-type-copy { font-size: 11px; margin-top: 6px; }
  .sr-library { margin-top: 30px; }
  .sr-library-head { flex-wrap: wrap; gap: 16px; }
  .sr-library-head h2 { font-size: 23px; }
  .sr-search { width: 100%; }
  .sr-search input { font-size: 16px; }
  .sr-library-tools { margin-top: 14px; margin-bottom: 16px; }
  .v-studio-refresh .sr-projects .v-project-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 22px 12px; }
  .v-studio-refresh .v-project-card > img, .v-studio-refresh .v-project-card-image { border-radius: 14px; aspect-ratio: 1; }
  .v-studio-refresh .v-project-card b { font-size: 12px; }
  .v-studio-refresh .v-project-card small { font-size: 10px; }
  .v-studio-refresh .v-project-card-action { top: 6px; right: 6px; }
  .v-studio-refresh .v-dialog-backdrop { padding: 12px; }
  .v-studio-refresh .v-dialog { padding: 22px 18px; border-radius: 24px; max-height: calc(100dvh - 24px); }
  .v-studio-refresh .v-project-dialog-head h2 { font-size: 25px; }
  .v-studio-refresh .v-project-type-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .v-studio-refresh .v-project-type-card { min-height: 174px; padding: 10px; gap: 8px; }
  .v-studio-refresh .v-project-type-icon { height: 74px; }
  .v-studio-refresh .v-project-type-icon .sr-type-art { width: 80px; height: 80px; }
  .v-studio-refresh .v-project-type-copy b { font-size: 12px; }
  .v-studio-refresh .v-project-type-copy small { font-size: 10px; }
  .v-studio-refresh .v-field :is(input,select,textarea) { font-size: 16px; }
  .v-studio-refresh .v-dialog-actions { padding-top: 18px; display: flex; gap: 10px; }
  .v-studio-refresh .v-download-backdrop { align-items: center; padding: 12px; }
  .v-studio-refresh .v-download-dialog { overflow-y: auto; }
  .v-studio-refresh .v-download-actions { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr); gap: 8px; }
  .v-studio-refresh .v-download-actions .v-button { min-width: 0; width: 100%; margin: 0; padding-inline: 10px; font-size: 11px; }
  .v-studio-refresh .v-download-actions [data-download-all] { grid-column: 1; grid-row: 1; order: 0; gap: 6px; }
  .v-studio-refresh .v-download-actions [data-close] { grid-column: 2; grid-row: 1; order: 0; }
  .v-studio-refresh .v-dialog-actions .v-button { flex: 1; min-width: 0; }
}
@media(prefers-reduced-motion:reduce) {
  .v-studio-refresh *, .v-studio-refresh *::before, .v-studio-refresh *::after { scroll-behavior: auto; animation: none; transition: none; }
}

/* Owner refinement: unified chrome, Unbounded, stationary names and precise controls. */
body.v-studio-refresh { --vitrio-font: Unbounded, Arial, sans-serif; --sr-control: 10px; font-family: var(--vitrio-font); font-weight: 300; }
body.v-studio-refresh .v-app .v-app-header { background: var(--sr-rail); color: var(--sr-rail-text); border-color: var(--sr-rail); }
body.v-studio-refresh .v-app-header .v-logo img {content:url('/assets/vitrio/brand/vitrio-light-208.webp');filter:none}
body.v-studio-refresh .v-app-header :is(.v-app-crumb,.v-save-status) { color: var(--sr-rail-copy); }
body.v-studio-refresh .sr-header-separator { background: var(--sr-rail-line); }
body.v-studio-refresh .v-app-header :is(.sr-theme-toggle,.v-app-menu-button) { color: #eee; background: transparent; }
body.v-studio-refresh .v-app-header .sr-theme-toggle:hover { background: #333; color: #fff; }
body.v-studio-refresh .sr-header-balance { background: #292929; color: #eee; border-color: #414141; border-radius: var(--sr-control); font-size: 10px; }
body.v-studio-refresh .sr-header-balance .sr-currency-icon { width: 24px; height: 24px; object-fit: contain; }
body.v-studio-refresh .v-local-preview-note { color: #aaa; font-family: var(--vitrio-font); }
body.v-studio-refresh :is(.v-button,.v-icon-button,.partner-admin-select-trigger,.sr-search) { border-radius: var(--sr-control); }
body.v-studio-refresh .v-app .v-sidebar :is(.v-sidebar-new,.v-side-link) { border-radius: var(--sr-control); font-size: 11px; }
body.v-studio-refresh .v-sidebar .v-project-list { overflow: visible; }
body.v-studio-refresh .v-sidebar .v-project-item { min-width: 0; font-size: 9px; line-height: 1.6; align-items: center; overflow: visible; }
body.v-studio-refresh .v-sidebar .v-project-item span { min-width: 0; white-space: normal; overflow: visible; overflow-wrap: anywhere; text-overflow: clip; animation: none; transform: none; }
body.v-studio-refresh .v-sidebar .v-project-item svg { margin-top: 0; }
body.v-studio-refresh .sr-account b { font-size: 10px; }
body.v-studio-refresh .sr-account small { font-size: 8px; }
body.v-studio-refresh .sr-header-label { font-size: 12px; font-weight: 400; }
body.v-studio-refresh .v-app-crumb { font-size: 10px; }
body.v-studio-refresh .sr-start-heading h1 { font-size: clamp(24px,2.3vw,34px); font-weight: 400; letter-spacing: -.035em; }
body.v-studio-refresh .sr-start-heading p { font-size: 11px; font-weight: 300; }
body.v-studio-refresh .sr-type-title { font-size: 12px; font-weight: 450; }
body.v-studio-refresh .sr-type-copy { font-size: 10px; }
body.v-studio-refresh .sr-library-head h2 { font-size: 20px; font-weight: 400; }
body.v-studio-refresh .sr-library-tools { flex-wrap: wrap; }
body.v-studio-refresh .sr-project-filters { flex-wrap: wrap; overflow: visible; }
body.v-studio-refresh .sr-project-filters button { font-size: 9px; border-radius: 8px; padding-inline: 10px; }
body.v-studio-refresh .v-project-card b { font-size: 11px; font-weight: 400; white-space: normal; overflow-wrap: anywhere; }
body.v-studio-refresh .v-project-card small { font-size: 9px; line-height: 1.6; }
body.v-studio-refresh .sr-search input { font-size: 11px; }
body.v-studio-refresh .v-dialog :is(h2,.v-project-dialog-head h2) { font-size: 22px; font-weight: 400; }
body.v-studio-refresh .v-project-type-copy b { font-size: 11px; font-weight: 400; }
body.v-studio-refresh .v-project-type-copy small { font-size: 9px; }
body.v-studio-refresh .v-app--studio .v-project-heading h1 { font-size: clamp(15px,1.2vw,20px); font-weight: 400; white-space: normal; overflow: visible; overflow-wrap: anywhere; text-overflow: clip; line-height: 1.5; }
body.v-studio-refresh .v-app--studio .v-project-heading { min-width: 0; }
body.v-studio-refresh .v-app--studio :is(.v-button,.v-icon-button,.v-generate,.v-segments span,.v-ratios span,.v-studio-settings-tabs,.v-studio-settings-tabs button) { border-radius: var(--sr-control); }
body.v-studio-refresh .v-app--studio .v-field :is(input,select,textarea) { border-radius: var(--sr-control); }
body.v-studio-refresh .v-app--studio .v-settings-head h2 { font-size: 14px; font-weight: 400; }
body.v-studio-refresh .v-app--studio .v-settings-group { margin: 0; padding-top: 18px; padding-bottom: 18px; }
body.v-studio-refresh .v-app--studio .v-settings-group h3 { font-size: 11px; font-weight: 400; margin-bottom: 12px; }
body.v-studio-refresh .v-app--studio .v-segments span { font-size: 10px; font-weight: 400; padding-inline: 9px; }
body.v-studio-refresh .v-app--studio .v-scenario { min-height: 44px; padding: 10px 12px; border-radius: 10px; }
body.v-studio-refresh .v-app--studio .v-scenario b { font-size: 11px; font-weight: 400; }
body.v-studio-refresh .v-app--studio .v-scenario small,
body.v-studio-refresh .v-app--studio .v-setting-note { display: none; }
body.v-studio-refresh .v-app--studio .v-palette-auto > span { border-radius: 10px; }
body.v-studio-refresh .v-app--studio .v-palette-auto small { display: none; }
body.v-studio-refresh .v-app--studio .v-generate-footer .v-generate { font-size: 11px; border-radius: var(--sr-control); }
body.v-studio-refresh .v-app--studio .v-canvas-actions .v-icon-button,
body.v-studio-refresh .v-app--studio .v-settings-head .v-icon-button { border-radius: var(--sr-control); }
body.v-studio-refresh .v-app--studio .v-scenario-group .v-scenario { min-height: 44px; }
body.v-studio-refresh .v-app--studio .v-generate-footer > small { display: none; }
body.v-studio-refresh .v-app--studio .v-canvas-layer-tools { border-radius: 12px; }
body.v-studio-refresh .v-app--studio .v-source-remove,
body.v-studio-refresh .v-app--studio .v-result-add { border-radius: 8px; }
body.v-studio-refresh .v-app-menu-link { font-size: 11px; border-radius: 10px; }

body.v-subscription-dialog-open { overflow: hidden; }
.v-studio-promo-dialog,
.v-studio-plan-dialog {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #171717;
  font-family: Unbounded, Arial, sans-serif;
}
.v-studio-promo-dialog::backdrop,
.v-studio-plan-dialog::backdrop { background: rgb(5 6 6 / .76); }
.v-studio-promo-dialog[open] {
  --vitrio-font: Manrope, Arial, sans-serif;
  display: block;
  inset: 0;
  width: min(1410px, calc(100vw - 48px));
  height: fit-content;
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: 0;
  overflow: visible;
  color-scheme: light;
  animation: v-studio-promo-enter .3s cubic-bezier(.16,1,.3,1);
}
.v-studio-promo-dialog::backdrop { background: rgb(12 18 14 / .64); backdrop-filter: blur(8px); }
.v-studio-promo-sheet {
  position: relative;
  display: flex;
  width: 100%;
  max-height: calc(100dvh - 48px);
  min-height: min(824px, calc(100dvh - 48px));
  margin: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #c5cabf #fffdf8;
  border-radius: 28px;
  background: #fffdf8;
  box-shadow: 0 32px 90px rgb(0 0 0 / .35);
}
.v-studio-promo-art,
.v-studio-promo-art img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.v-studio-promo-art img { object-fit: cover; object-position: center; }
.v-studio-promo-copy { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; width: 48%; min-width: 0; padding: 50px clamp(28px, 5vw, 78px) 32px; background: linear-gradient(90deg,#fffdf8 0 80%,rgb(255 253 248 / .88) 91%,rgb(255 253 248 / 0) 100%); color: #111410; font-family: Manrope,Arial,sans-serif; }
.v-studio-promo-copy .v-logo { display: block; width: 176px; flex-shrink: 0; }
.v-studio-promo-copy .v-logo img { display: block; width: 100%;content:url('/assets/vitrio/brand/vitrio-dark-208.webp');filter:none}
.v-studio-promo-badge { display: inline-flex; align-items: center; gap: 9px; max-width: 100%; margin-top: 26px; padding: 9px 16px; border-radius: 999px; background: rgb(232 234 229 / .8); font-size: 18px; line-height: 1.35; font-weight: 500; }
.v-studio-promo-badge .v-icon { width: 23px; height: 23px; flex-shrink: 0; }
.v-studio-promo-copy h2 { margin: 22px 0 0; font-size: clamp(38px, 4.5vw, 66px); font-weight: 800; line-height: 1.03; letter-spacing: -.04em; }
.v-studio-promo-copy .v-studio-promo-description { max-width: 36ch; margin: 18px 0 0; color: #434740; font-size: 20px; line-height: 1.45; }
.v-studio-promo-actions { display: flex; flex-direction: column; align-items: stretch; gap: 5px; width: 100%; margin-top: 24px; }
.v-studio-promo-actions .v-button { justify-content: center; gap: 10px; min-height: 70px; width: 100%; padding: 12px 18px; border-radius: 18px; background: #cfff22; color: #111410; box-shadow: none; font-size: 28px; font-weight: 800; line-height: 1.2; }
.v-studio-promo-actions .v-button .v-icon { width: 25px; height: 25px; }
.v-studio-promo-actions .v-button:hover { background: #bff00b; box-shadow: 0 8px 20px rgb(38 52 10 / .13); }
.v-studio-promo-actions > [data-close-subscription] { align-self: flex-start; min-height: 44px; margin: 0; padding: 3px 0; border: 0; background: transparent; color: #62665f; font-size: 17px; font-weight: 400; line-height: 1.4; }
.v-studio-promo-actions > [data-close-subscription]:hover { color: #111410; text-decoration: underline; text-underline-offset: 4px; }
.v-studio-promo-benefits { display: grid; grid-template-columns: .75fr 1fr 1.3fr; align-items: start; gap: 12px; width: 100%; margin: 24px 0 0; padding: 0; list-style: none; }
.v-studio-promo-benefits li { display: grid; justify-items: center; gap: 7px; color: #434740; font-size: 15px; line-height: 1.4; text-align: center; }
.v-studio-promo-benefits .v-icon { width: 32px; height: 32px; color: #111410; }
.v-studio-promo-dialog :is(button,a):focus-visible { outline: 3px solid #37501e; outline-offset: 4px; }
.v-studio-promo-copy ::selection { background: #cfff22; color: #111410; }
@keyframes v-studio-promo-enter { from { opacity: .4; transform: translateY(12px) scale(.985); } to { opacity: 1; transform: none; } }
.v-studio-subscription-close { position: absolute; z-index: 3; top: 20px; right: 20px; display: grid; width: 44px; height: 44px; place-items: center; padding: 0; border: 0; border-radius: 10px; background: rgb(255 255 255 / .88); color: #171717; }
.v-studio-subscription-close .v-icon { width: 18px; height: 18px; }
.v-studio-promo-dialog > .v-studio-subscription-close { top: 16px; right: 16px; border-radius: 14px; background: #fff; }
@media (min-width: 761px) and (max-height: 800px) {
  .v-studio-promo-copy { padding: 28px clamp(28px, 4.2vw, 58px); }
  .v-studio-promo-copy .v-logo { width: 130px; }
  .v-studio-promo-badge { margin-top: 18px; padding: 7px 13px; font-size: 14px; }
  .v-studio-promo-copy h2 { margin-top: 16px; font-size: clamp(33px, 3.8vw, 50px); }
  .v-studio-promo-copy .v-studio-promo-description { margin-top: 14px; font-size: 16px; }
  .v-studio-promo-actions { margin-top: 18px; }
  .v-studio-promo-actions .v-button { min-height: 54px; font-size: 22px; }
  .v-studio-promo-benefits { margin-top: 16px; }
}
@media (max-width: 760px) {
  .v-studio-promo-dialog[open] { width: calc(100vw - 24px); max-height: calc(100dvh - 24px); }
  .v-studio-promo-sheet { flex-direction: column; min-height: 0; max-height: calc(100dvh - 24px); border-radius: 24px; }
  .v-studio-promo-copy { order: 1; width: 100%; padding: 24px; background: #fffdf8; }
  .v-studio-promo-copy .v-logo { width: 122px; }
  .v-studio-promo-badge { margin-top: 20px; padding: 7px 12px; font-size: 13px; }
  .v-studio-promo-badge .v-icon { width: 19px; height: 19px; }
  .v-studio-promo-copy h2 { margin-top: 16px; font-size: clamp(28px, 8.1vw, 42px); }
  .v-studio-promo-copy .v-studio-promo-description { max-width: 38ch; margin-top: 14px; font-size: 15px; line-height: 1.45; }
  .v-studio-promo-actions { margin-top: 18px; }
  .v-studio-promo-actions .v-button { min-height: 54px; border-radius: 16px; font-size: 21px; }
  .v-studio-promo-actions > [data-close-subscription] { font-size: 15px; }
  .v-studio-promo-benefits { margin-top: 16px; gap: 8px; }
  .v-studio-promo-benefits li { font-size: 12px; }
  .v-studio-promo-benefits .v-icon { width: 26px; height: 26px; }
  .v-studio-promo-art { position: relative; inset: auto; order: 2; flex-shrink: 0; width: 100%; height: clamp(176px, 52vw, 280px); }
  .v-studio-promo-art img { object-position: center bottom; }
  .v-studio-promo-dialog > .v-studio-subscription-close { top: 12px; right: 12px; background: #fff; }
}
@media (prefers-reduced-motion: reduce) {
  .v-studio-promo-dialog[open] { animation: none; }
  .v-studio-promo-dialog :is(button,a) { transition: none; }
}
.v-studio-plan-dialog { display: none; place-items: center; padding: 24px; }
.v-studio-plan-dialog[open] { display: grid; }
.v-studio-plan-sheet .v-studio-subscription-close { border-radius: 50%; }
.v-studio-plan-sheet { position: relative; width: min(980px, 100%); max-height: calc(100dvh - 48px); overflow: auto; padding: 38px; border-radius: 28px; background: #f6f5f1; box-shadow: 0 28px 80px rgb(0 0 0 / .32); scrollbar-width: thin; scrollbar-color: #adb2a7 transparent; scrollbar-gutter: stable both-edges; }
.v-studio-plan-heading { display: flex; justify-content: center; align-items: center; gap: 16px; padding-inline: 44px; text-align: center; }
.v-studio-plan-mark { display: block; flex-shrink: 0; width: 64px; height: 64px; }
.v-studio-plan-mark img { display: block; width: 64px; height: 64px; }
.v-studio-plan-heading h2 { margin: 0; font-size: 28px; font-weight: 500; letter-spacing: -.04em; text-wrap: balance; }
.v-studio-plan-options { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; margin-top: 28px; }
.v-studio-plan-card { display: flex; min-height: 268px; flex-direction: column; align-items: stretch; width: 100%; padding: 24px; border: 1px solid #deded9; border-radius: 16px; background: #fff; color: #171717; text-align: left; transition: transform .2s cubic-bezier(.22,1,.36,1),border-color .2s ease,box-shadow .2s ease; }
.v-studio-plan-card:hover { transform: translateY(-3px); border-color: #b8b9b3; box-shadow: 0 16px 34px rgb(17 19 21 / .1); }
.v-studio-plan-card:focus-visible { outline: 0; border-color: #9fcf00; box-shadow: 0 0 0 3px rgb(207 255 34 / .28),0 16px 34px rgb(17 19 21 / .1); }
@property --v-studio-plan-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@keyframes v-studio-plan-shimmer { to { --v-studio-plan-angle: 360deg; } }
.v-studio-plan-card--pro {
  position: relative;
  border: 3px solid transparent;
  padding: 22px;
  background: linear-gradient(#1b1e1b, #1b1e1b) padding-box,
    conic-gradient(from var(--v-studio-plan-angle, 0deg), #ff46bd, #a855ff, #f7a1ff, #772dff, #ff46bd) border-box;
  color: #f7f7f3;
}
.v-studio-plan-dialog[open]:not(.is-closing):not(.is-page-hidden) .v-studio-plan-card--pro { animation: v-studio-plan-shimmer 6s linear infinite; }
body.v-studio-refresh .v-studio-plan-card--pro:is(:hover, :focus-visible) { border-color: transparent; }
.v-studio-plan-dialog .v-studio-plan-card:focus-visible { outline: 2px solid #416600 !important; outline-offset: 4px; }
@media (forced-colors: active) {
  .v-studio-plan-dialog .v-studio-plan-card:focus-visible { outline-color: CanvasText; }
  .v-studio-plan-card--pro { background: Canvas; color: CanvasText; border-color: CanvasText; }
}
.v-studio-plan-badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 7px 16px;
  border-radius: 999px;
  background: #cfff22;
  color: #111;
  font-size: 10px;
  font-weight: 550;
  line-height: 1.4;
  white-space: nowrap;
}
.v-studio-plan-card-head { display: grid; gap: 9px; }
.v-studio-plan-card-head b { font-size: 18px; font-weight: 550; letter-spacing: -.035em; }
.v-studio-plan-card-head small { max-width: 29ch; color: #686b68; font-size: 10px; font-weight: 350; line-height: 1.55; }
.v-studio-plan-card--pro .v-studio-plan-card-head small { color: #b9bdb8; }
.v-studio-plan-benefits { display: grid; gap: 9px; margin-top: 24px; }
.v-studio-plan-benefits > span { display: grid; grid-template-columns: 7px minmax(0,1fr); align-items: center; gap: 9px; color: #434643; font-size: 10px; line-height: 1.45; }
.v-studio-plan-benefits > span::before { width: 7px; height: 7px; border-radius: 50%; background: #b6e900; content: ''; box-shadow: 0 0 0 3px rgb(207 255 34 / .16); }
.v-studio-plan-card--pro .v-studio-plan-benefits > span { color: #eef0eb; }
.v-studio-plan-action { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: auto; padding-top: 24px; }
.v-studio-plan-price { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; }
.v-studio-plan-action strong { font-size: 14px; font-weight: 550; line-height: 1.4; white-space: nowrap; }
.v-studio-plan-action small { color: #727672; font-size: 9px; line-height: 1.4; white-space: nowrap; }
.v-studio-plan-action .v-icon { justify-self: end; width: 18px; height: 18px; transition: transform .2s cubic-bezier(.22,1,.36,1); }
.v-studio-plan-card:hover .v-studio-plan-action .v-icon { transform: translateX(3px); }
.v-studio-plan-card--pro .v-studio-plan-action small { color: #aeb4ad; }
@media (max-width: 1180px) and (min-width: 901px) {
  .v-studio-refresh .sr-subscription-cta { min-height: 48px; justify-content: center; padding: 0; }
  .v-studio-refresh .sr-subscription-cta > span,
  .v-studio-refresh .sr-subscription-cta > .v-icon:last-child { display: none; }
}
@media (max-width: 640px) {
  .v-studio-subscription-close { top: max(16px, env(safe-area-inset-top)); right: 16px; background: #ededed; }
}
@media (max-width: 900px) {
  .v-studio-plan-dialog { padding: 10px; }
  .v-studio-plan-sheet { width: min(540px, 100%); max-height: calc(100dvh - 20px); padding: 22px 16px 16px; border-radius: 28px; }
  .v-studio-plan-heading { flex-direction: column; gap: 12px; padding-inline: 40px; }
  .v-studio-plan-mark,
  .v-studio-plan-mark img { width: 50px; height: 50px; }
  .v-studio-plan-heading h2 { font-size: 21px; }
  .v-studio-plan-options { grid-template-columns: 1fr; gap: 24px; margin-top: 24px; }
  .v-studio-plan-card { min-height: 178px; padding: 16px; }
  .v-studio-plan-card--pro { padding: 14px; }
  .v-studio-plan-card-head { gap: 5px; }
  .v-studio-plan-card-head b { font-size: 14px; }
  .v-studio-plan-card-head small { font-size: 9px; }
  .v-studio-plan-benefits { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px 14px; margin-top: 13px; }
  .v-studio-plan-benefits > span { gap: 7px; font-size: 9px; }
  .v-studio-plan-benefits > span:last-child { grid-column: 1 / -1; }
  .v-studio-plan-action { padding-top: 15px; }
  .v-studio-plan-action strong { font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .v-studio-plan-dialog[open] .v-studio-plan-card--pro { animation: none; }
  .v-studio-plan-card,
  .v-studio-plan-action .v-icon { transition: none; }
}
@media(max-width:600px) {
  body.v-studio-refresh .sr-start-heading h1 { font-size: 25px; }
  body.v-studio-refresh .sr-type-title { font-size: 10px; line-height: 1.6; }
  body.v-studio-refresh .sr-type-copy { font-size: 9px; }
  body.v-studio-refresh .v-project-card b { font-size: 10px; }
  body.v-studio-refresh .v-project-card small { font-size: 8px; }
  body.v-studio-refresh .sr-search input { font-size: 16px; }
  body.v-studio-refresh .v-app--studio .v-settings-group { padding-top: 14px; padding-bottom: 14px; }
  body.v-studio-refresh .v-app--studio .v-project-heading h1 { font-size: 14px; }
  body.v-studio-refresh .v-dialog :is(h2,.v-project-dialog-head h2) { font-size: 19px; }
}
/* Thumbnail creation keeps the approved rounded Studio control family. */
/* Product-card templates reuse the Studio thumbnail picker; all radios stay mounted. */
body.v-studio-refresh .v-card-template-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
body.v-studio-refresh .v-card-template {
  position: relative; display: flex; min-width: 0; flex-direction: column; overflow: hidden;
  border: 1px solid var(--u-line); border-radius: 16px; background: var(--u-paper); cursor: pointer;
  transition: var(--u-motion);
}
body.v-studio-refresh .v-card-template-preview { display: grid; width: 100%; aspect-ratio: 3/4; overflow: hidden; background: var(--u-hover); }
body.v-studio-refresh .v-card-template-preview img { display: block; width: 100%; height: 100%; object-fit: cover; }
body.v-studio-refresh .v-card-template-plain { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--v-ink); }
body.v-studio-refresh .v-card-template-plain .v-icon { width: 32px; height: 32px; }
body.v-studio-refresh .v-card-template-plain small { font-size: 10px; line-height: 1.4; }
body.v-studio-refresh .v-card-template-title { display: block; min-height: 44px; padding: 8px 6px; font-size: 10px; line-height: 1.45; text-align: center; text-wrap: balance; }
body.v-studio-refresh .v-card-template > input { position: absolute; z-index: 1; top: 7px; right: 7px; width: 16px; height: 16px; margin: 0; accent-color: var(--v-ink); }
body.v-studio-refresh .v-card-template:has(input:checked) { border-color: var(--v-ink); box-shadow: inset 0 0 0 1px var(--v-ink); }
body.v-studio-refresh .v-card-template:has(input:focus-visible) { outline: 2px solid var(--v-ink); outline-offset: 2px; }
@media (hover:hover) { body.v-studio-refresh .v-card-template:hover { border-color: var(--u-line-strong); } }
body.v-studio-refresh .v-card-template-more { margin-top: 12px; }
body.v-studio-refresh .v-card-template-more > summary { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border-radius: 999px; background: var(--u-hover); color: var(--v-ink); font-size: 10px; cursor: pointer; list-style: none; }
body.v-studio-refresh .v-card-template-more > summary::-webkit-details-marker { display: none; }
body.v-studio-refresh .v-card-template-more > summary .v-icon { width: 14px; height: 14px; transform: rotate(90deg); transition: transform 220ms cubic-bezier(.22,1,.36,1); }
body.v-studio-refresh .v-card-template-more[open] > summary .v-icon { transform: rotate(-90deg); }
body.v-studio-refresh .v-card-template-more > .v-card-template-grid { margin-top: 12px; }
body.v-studio-refresh .v-card-template-more .v-card-template-hide,
body.v-studio-refresh .v-card-template-more[open] .v-card-template-show { display: none; }
body.v-studio-refresh .v-card-template-more[open] .v-card-template-hide { display: inline; }
@media (prefers-reduced-motion:reduce) { body.v-studio-refresh .v-card-template-more > summary .v-icon { transition: none; } }
body.v-studio-refresh .v-thumbnail-settings .v-field :is(input,textarea) { min-height: 46px; border-radius: 16px; }
body.v-studio-refresh .v-thumbnail-settings .v-field textarea { min-height: 106px; resize: vertical; }
body.v-studio-refresh .v-thumbnail-settings .v-thumbnail-characters label > span { border-radius: 16px; }
body.v-studio-refresh .v-thumbnail-settings .v-thumbnail-template { border-radius: 16px; }
