// Local review of the Vitrio product family; no payment or generation replacement.
import { initPartnerAdminSelects } from '/assets/partner-admin-selects.js';
let studioSelects;
export const studioRefreshEnabled = () => document.body.classList.contains('v-studio-refresh');
export function resizeCanvasFrame(frame,direction,dx,dy) {
  const original={x:Number(frame.x),y:Number(frame.y),width:Number(frame.width),height:Number(frame.height)};
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  if(!Number.isFinite(original.x+original.y+original.width+original.height)||!['nw','ne','se','sw'].includes(direction))return {...original,fit:'cover'};
  const signX=direction.includes('w')?-1:1,signY=direction.includes('n')?-1:1;
  const denominator=original.width**2+original.height**2;
  const projected=denominator?(original.width*(original.width+signX*Number(dx||0))+original.height*(original.height+signY*Number(dy||0)))/denominator:1;
  const scale=clamp(Number.isFinite(projected)?projected:1,Math.max(8/original.width,8/original.height),Math.min(100/original.width,100/original.height));
  const width=original.width*scale,height=original.height*scale;
  const anchorX=direction.includes('w')?original.x+original.width:original.x;
  const anchorY=direction.includes('n')?original.y+original.height:original.y;
  return {x:direction.includes('w')?anchorX-width:anchorX,y:direction.includes('n')?anchorY-height:anchorY,width,height,fit:'cover'};
}
const assets = '/assets/vitrio/studio-refresh';
const types = [
  ['product', 'Карточки товаров', 'Фото, сцены и инфографика', 'Для маркетплейсов'],
  ['merch', 'Мерч', 'От идеи до предмета', 'Одежда и аксессуары'],
  ['website', 'Дизайн сайта', 'Первый экран вашего бренда', 'Визуальные концепты'],
  ['thumbnail', 'Превью для видео', 'Композиция, которая цепляет', 'YouTube и видеоплатформы'],
];
export function studioTypeArt(type) {
  const key = types.some(([id]) => id === type) ? type : 'product';
  const name = key === 'thumbnail' ? 'thumbnail-20261012' : key;
  return `<img class="sr-type-art" src="${assets}/${name}-384.webp" srcset="${assets}/${name}-256.webp 256w, ${assets}/${name}-384.webp 384w" sizes="(max-width: 600px) 120px, 180px" width="384" height="384" alt="" decoding="async">`;
}
export function studioRefreshHeader(title, { logo, icon, esc, state }) {
  return `<header class="v-app-header sr-mobile-bar">${logo()}<div class="v-app-header-actions"><button class="sr-theme-toggle v-icon-button" type="button" data-studio-theme-toggle aria-label="Включить тёмную тему">${icon('circleCheck')}</button><button class="sr-header-balance" type="button" data-open-account-settings data-account-tab-target="packs" aria-label="Баланс: ${state.user?.credits ?? 0} звёзд. Пополнить">${currencyIcon()}<b data-credit-balance>${state.user?.credits ?? 0}</b><span>Stars</span></button><button class="v-app-menu-button" type="button" data-open-app-menu aria-label="Открыть навигацию" aria-expanded="false" aria-controls="v-app-menu">${icon('menu')}</button></div></header>`;
}
const navIcon = (name, className='') => `<span class="sr-nav-icon ${className}"><img src="${assets}/navigation/${name}-96.webp" srcset="${assets}/navigation/${name}-192.webp 2x" width="96" height="96" alt="" aria-hidden="true"></span>`;
const projectRowIcon = () => '<span class="sr-nav-icon sr-project-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M3.75 7.5h6l1.8 2h8.7v8.75a1.75 1.75 0 0 1-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75V7.5Z"/><path d="M3.75 7.5V5.75A1.75 1.75 0 0 1 5.5 4h4.15l1.8 2h7.05a1.75 1.75 0 0 1 1.75 1.75V9.5"/></svg></span>';
const currencyIcon = () => '<img class="sr-currency-icon" src="/assets/vitrio/studio-subscription/plan-stars-96.webp" width="96" height="96" alt="" aria-hidden="true">';
export function studioRefreshSidebar({ icon, esc, state, studioPathIs, logo, studioGptMark, subscriptionCta }) {
  const name = esc(state.user?.name || 'Пользователь');
  const nav = (path, label, glyph) => `<a class="v-side-link ${studioPathIs(path) ? 'active' : ''}" href="/vitrio${path}" data-go title="${label}">${navIcon(glyph)}<span>${label}</span></a>`;
  const demoNames = { 'demo-headphones':'Наушники', 'demo-serum':'Сыворотка', 'demo-teddy':'Мягкая игрушка', 'demo-lamp':'Свет', 'demo-sneakers':'Кроссовки', 'demo-bag':'Сумка' };
  const projectName = (project) => document.documentElement.dataset.localPreview === 'true' && demoNames[project.id] ? demoNames[project.id] : project.title;
  return `<aside class="v-sidebar"><div class="sr-sidebar-top"><div class="sr-sidebar-brand">${logo()}</div><button class="v-button v-button--accent v-sidebar-new" data-create title="Новый проект">${icon('plus')}<span>Новый проект</span></button><nav class="sr-primary-nav" aria-label="Рабочее пространство">${nav('/projects','Мои проекты','projects')}${nav('/studio','Редактор','editor')}<button class="v-side-link sr-gpt-link" type="button" data-open-studio-gpt title="Vitrio GPT"><span class="sr-nav-icon">${studioGptMark()}</span><span data-studio-gpt-label>Vitrio GPT</span>${icon('arrow','sr-nav-arrow')}</button><p class="sr-nav-status" data-studio-gpt-status role="status" hidden></p></nav></div><div class="sr-sidebar-scroll"><div class="sr-recent"><h2>Недавние</h2><div class="v-project-list">${state.projects.slice(0,5).map(p=>`<a class="v-project-item ${state.project?.id===p.id?'active':''}" href="/vitrio/studio?id=${encodeURIComponent(p.id)}" data-go title="${esc(p.title)}">${projectRowIcon()}<b>${esc(projectName(p))}</b></a>`).join('') || '<p class="sr-muted">Здесь будут ваши проекты</p>'}</div></div></div><div class="sr-sidebar-bottom"><nav aria-label="Помощь и аккаунт">${nav('/contest','Конкурс','contest')}${nav('/support','Поддержка','support')}</nav>${subscriptionCta('sr-subscription-cta')}<div class="sr-sidebar-tools"><button class="sr-sidebar-balance" type="button" data-open-account-settings data-account-tab-target="packs" aria-label="Баланс: ${state.user?.credits ?? 0} звёзд. Пополнить">${currencyIcon()}<span><b data-credit-balance>${state.user?.credits ?? 0}</b><small>Stars</small></span></button><button class="sr-theme-toggle" type="button" data-studio-theme-toggle aria-label="Включить тёмную тему">${icon('circleCheck')}</button></div><div class="sr-account"><span class="v-avatar" aria-hidden="true">${name.slice(0,1)}</span><span><b data-account-name>${name}</b><small>Настройки аккаунта</small></span><button class="sr-account-settings" type="button" data-open-account-settings aria-label="Настройки профиля">${icon('settings')}</button></div><button class="v-side-logout" type="button" data-logout title="Выйти">${icon('logout')}<span>Выйти</span></button></div></aside>`;
}
export function studioRefreshProjects({ state, icon, projectCardMarkup }) {
  return `<main class="v-workspace sr-projects"><header class="sr-start-heading"><div><h1>Что создадим сегодня?</h1><p>Ваша идея. Четыре способа воплотить её.</p></div><span class="sr-workspace-mark" aria-hidden="true">${icon('sparkle')}</span></header><section class="sr-create-types" aria-label="Создать проект">${types.map(([key,title,copy,detail])=>`<button class="sr-create-type" type="button" data-create="${key}">${studioTypeArt(key)}<span class="sr-type-title">${title}${icon('arrow')}</span><span class="sr-type-copy">${copy}</span><span class="sr-type-detail">${detail}</span></button>`).join('')}</section><section class="sr-library" aria-labelledby="sr-library-title"><header class="sr-library-head"><h2 id="sr-library-title">Мои проекты <span>${state.projects.length}</span></h2><label class="sr-search">${icon('search')}<input type="search" data-project-search placeholder="Найти проект" aria-label="Найти проект по названию"></label></header><div class="sr-library-tools"><div class="sr-project-filters" role="group" aria-label="Тип проектов"><button type="button" data-project-filter="all" aria-pressed="true">Все проекты</button>${types.map(([key,title])=>`<button type="button" data-project-filter="${key}" aria-pressed="false">${title}</button>`).join('')}${state.projects.some(project=>project.projectType==='logo')?'<button type="button" data-project-filter="logo" aria-pressed="false">Логотипы (архив)</button>':''}</div><label class="sr-sort"><span class="sr-visually-hidden">Сортировка</span><select data-project-sort><option value="recent">Сначала новые</option><option value="name">По названию</option></select></label></div><div class="v-project-grid">${state.projects.map((project,index)=>projectCardMarkup(project).replace('<article ', `<article data-filter-type="${types.some(([key])=>key===project.projectType)||project.projectType==='logo'?project.projectType:'product'}" data-sort-index="${index}" `)).join('')}</div><div class="sr-library-empty" data-project-empty ${state.projects.length?'hidden':''}>${icon('folder')}<h3>${state.projects.length?'Ничего не найдено':'Начните с новой идеи'}</h3><p>${state.projects.length?'Попробуйте другое название или тип проекта.':'Выберите направление выше — исходники и все версии останутся в проекте.'}</p></div></section></main>`;
}
export function bindStudioRefresh() {
  if (!studioRefreshEnabled()) return;
  const settingsPanel = document.querySelector('[data-settings]');
  if (settingsPanel) {
    settingsPanel.querySelectorAll('.v-scenario').forEach(node => {
      const help = node.querySelector('small')?.textContent;
      if (help) node.title = help;
    });
  }
  const gear = 'M9.5 3h5l.6 2.3 2 .9 2.1-.7 2.5 4.3-1.6 1.7v2.3l1.6 1.7-2.5 4.3-2.2-.7-2 .9-.5 2.3h-5L9 20l-2-.9-2.2.7-2.5-4.3L4 13.8v-2.3L2.3 9.8l2.5-4.3 2.2.7 2-.9L9.5 3ZM15.5 12.5a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0';
  document.querySelectorAll('[data-open-settings] svg path, .sr-account > svg path').forEach(path => path.setAttribute('d',gear));
  if (!studioSelects) studioSelects = initPartnerAdminSelects(document);
  else studioSelects.refresh();
  document.querySelector('.v-studio-generate-button')?.setAttribute('aria-label', 'Сгенерировать изображение');
  document.querySelector('[data-open-settings]')?.setAttribute('aria-expanded', 'false');
  document.querySelector('[data-open-settings]')?.setAttribute('aria-controls', 'sr-generation-settings');
  const settings = document.querySelector('[data-settings]');
  if (settings) {
    settings.id = 'sr-generation-settings';
    settings.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !settings.classList.contains('open')) return;
      const controls = [...settings.querySelectorAll('button,input,select,textarea,a[href]')].filter(node => !node.disabled && node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
  let theme = 'light';
  try { theme = localStorage.getItem('vitrio-studio-theme') === 'dark' ? 'dark' : 'light'; } catch {}
  const applyTheme = () => {
    document.body.dataset.studioTheme = theme;
    document.querySelectorAll('[data-studio-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.innerHTML = `<svg class="v-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${theme === 'dark' ? 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0' : 'M20.5 13a8.5 8.5 0 0 1-9.5-9.5A8.5 8.5 0 1 0 20.5 13Z'}"/></svg>`;
    });
  };
  applyTheme();
  document.querySelectorAll('[data-studio-theme-toggle]').forEach(button => button.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('vitrio-studio-theme', theme); } catch {}
    applyTheme();
  }));
  const search = document.querySelector('[data-project-search]');
  const cards = [...document.querySelectorAll('[data-filter-type]')];
  if (document.documentElement.dataset.localPreview === 'true') {
    for (const id of ['demo-headphones','demo-serum','demo-teddy','demo-lamp','demo-sneakers','demo-bag']) {
      const img = document.querySelector(`.v-project-card[href$="id=${id}"] > img`);
      if (img) {
        img.src = `${assets}/demo/${id}-640.webp`;
        img.srcset = `${assets}/demo/${id}-320.webp 320w, ${assets}/demo/${id}-640.webp 640w`;
        img.sizes = '(max-width:600px) 45vw, (max-width:1180px) 28vw, 25vw';
        img.loading = 'lazy'; img.decoding = 'async';
      }
    }
  }
  let filter = 'all';
  const update = () => {
    const query = (search?.value || '').trim().toLocaleLowerCase('ru');
    cards.forEach(card => { card.hidden = (filter !== 'all' && card.dataset.filterType !== filter) || !card.querySelector('.v-project-card b').textContent.toLocaleLowerCase('ru').includes(query); });
    const empty = document.querySelector('[data-project-empty]');
    if (empty) empty.hidden = cards.some(card => !card.hidden);
  };
  search?.addEventListener('input', update);
  document.querySelectorAll('[data-project-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.projectFilter;
    document.querySelectorAll('[data-project-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    update();
  }));
  document.querySelector('[data-project-sort]')?.addEventListener('change', event => {
    const grid = document.querySelector('.v-project-grid');
    cards.sort((a,b) => event.target.value === 'name' ? a.querySelector('.v-project-card b').textContent.localeCompare(b.querySelector('.v-project-card b').textContent,'ru') : Number(a.dataset.sortIndex)-Number(b.dataset.sortIndex)).forEach(card=>grid.append(card));
  });
}
