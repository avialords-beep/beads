import { studioRefreshEnabled, studioRefreshHeader, studioRefreshSidebar, studioRefreshProjects, studioTypeArt, resizeCanvasFrame, bindStudioRefresh } from '/assets/vitrio-studio-refresh.js?v=20261012-studio-unified-1';
import { loadCloudPaymentsRuntime, prewarmCloudPaymentsRuntime, preparedBankHandoff } from '/assets/vitrio-payment-handoff.js?v=20261013-payment-unified-1';
import { createPaymentPreparation } from '/assets/vitrio-payment-preparation.js?v=20261013-payment-unified-1';
import { readPasswordResetToken, clearPasswordResetToken } from '/assets/password-reset-token.js?v=20261008-recovery-1';
import { loadVitrioLegalDocuments } from '/assets/vitrio-privacy-ui.js?v=20261012-privacy-1';
import { mountSupportWorkspace } from '/assets/vitrio-support.js?v=20261018-support-chat-1';
const app = document.querySelector('#vitrio-app');
const TOKEN_KEY = 'vitrio_token';
const ASSET = '/assets/vitrio';
const TURNSTILE_SITE_KEY = '0x4AAAAAAEMScieAW26t7BYH';
const state = { user: null, projects: [], thumbnailTemplates: [], cardTemplates: [], project: null, sources: [], activeSource: 0, activeResult: 0, studioView: 'canvas', settingsOpen: false, settingsTab: 'generation', saving: false, generationActive: false, generationPreview: null, videoBusy: new Set(), watchedVideos: new Set(), videoTarget: null, saveRevision: 0, canvasLayoutRevision: 0, contestTimer: 0, contestEndsAt: null, subscriptionOfferEligible: false, subscriptionPromoShown: false };
let vitrioGenerationViewRevision=0,activeVitrioGenerationProgress=null;
function stopVitrioGenerationView(){vitrioGenerationViewRevision+=1;activeVitrioGenerationProgress?.stop();activeVitrioGenerationProgress=null;state.generationActive=false;state.generationPreview=null;}
const VITRIO_BILLING_PRODUCTS = {
  start: { type: 'subscription', name: 'Vitrio Start', price: 300, credits: 80, dailyPrice: 60, dailyCredits: 16, periods:{week:{price:300,credits:80,days:5},month:{price:1090,credits:360,days:30},year:{price:10990,credits:4800,days:365}} },
  medium: { type: 'subscription', name: 'Vitrio Medium', price: 600, credits: 170, dailyPrice: 100, dailyCredits: 28, periods:{week:{price:600,credits:170,days:6}} },
  pro: { type: 'subscription', name: 'Vitrio Pro', price: 1000, credits: 300, dailyPrice: 150, dailyCredits: 42, periods:{week:{price:1000,credits:300,days:7},month:{price:3490,credits:1320,days:30},year:{price:34990,credits:18000,days:365}} },
  'stars-5': { type: 'pack', name: '5 звёзд', price: 49, credits: 5 },
  'stars-30': { type: 'pack', name: '30 звёзд', price: 199, credits: 30 },
  'stars-100': { type: 'pack', name: '100 звёзд', price: 499, credits: 100 },
};
const VITRIO_MARKETPLACE_CARDS = [
  { file: 'sneakers.webp', title: 'Беговые кроссовки', scene: 'Спортивный каталог' },
  { file: 'serum.webp', title: 'Сыворотка для лица', scene: 'Косметика' },
  { file: 'headphones.webp', title: 'Беспроводные наушники', scene: 'Электроника' },
  { file: 'coffee-maker.webp', title: 'Капсульная кофеварка', scene: 'Техника для дома' },
  { file: 'handbag.webp', title: 'Женская сумка', scene: 'Аксессуары' },
  { file: 'building-set.webp', title: 'Деревянный конструктор', scene: 'Детские товары' },
  { file: 'throw-blanket.webp', title: 'Фактурный плед', scene: 'Дом и интерьер' },
  { file: 'outdoor-jacket.webp', title: 'Куртка для активного отдыха', scene: 'Одежда' },
  { file: 'desk-lamp.webp', title: 'Настольная лампа', scene: 'Освещение' },
  { file: 'portable-blender.webp', title: 'Портативный блендер', scene: 'Бытовая техника' },
];
function marketplaceCardMarkup(card) {
  return `<figure class="v-market-card"><img src="${ASSET}/marketplace-showcase/${card.file}" alt="Товарная инфографика Vitrio: ${card.title}, категория «${card.scene}»" width="1024" height="1280" loading="lazy"><figcaption>${card.title}. ${card.scene}. Готовый визуал 4:5 для маркетплейса.</figcaption></figure>`;
}
function marketplaceMarqueeMarkup() {
  const cards = VITRIO_MARKETPLACE_CARDS.map(marketplaceCardMarkup).join('');
  return `<div class="v-market-marquee" role="region" aria-label="Примеры товарных карточек Vitrio"><div class="v-market-marquee-track"><div class="v-market-card-set">${cards}</div><div class="v-market-card-set" aria-hidden="true">${cards}</div></div></div>`;
}
function heroFloatingCardsMarkup() {
  const files = ['serum.webp', 'headphones.webp', 'sneakers.webp', 'handbag.webp', 'desk-lamp.webp', 'coffee-maker.webp'];
  return `<div class="v-hero-floating-cards" aria-hidden="true">${files.map((file, index) => `<figure class="v-hero-floating-card v-hero-floating-card--${index + 1}"><img src="${ASSET}/marketplace-showcase/${file}" alt="" width="1024" height="1280" decoding="async"></figure>`).join('')}</div>`;
}
const VITRIO_REVIEWS = [
  { name: 'Марина Волкова', role: 'бренд товаров для дома', icon: 'image', quote: 'Карточки выглядят собраннее и дороже. Теперь проверяем новые идеи без отдельной съёмки для каждого запуска.' },
  { name: 'Артём Гринёв', role: 'продавец на Ozon', icon: 'grid', quote: 'За один вечер подготовил несколько подач товара. Особенно удобно сравнивать готовые версии внутри одного проекта.' },
  { name: 'Диана Карпова', role: 'косметический бренд', icon: 'sparkle', quote: 'Vitrio сохраняет форму упаковки и мелкие детали. Для косметики это важнее любого эффектного фона.' },
  { name: 'Илья Романов', role: 'руководитель контента', icon: 'folder', quote: 'Команда больше не собирает каждый баннер вручную. Готовые варианты быстрее уходят в рекламу.' },
  { name: 'Алёна Титова', role: 'менеджер маркетплейсов', icon: 'imagePlus', quote: 'Меняю свет и окружение, не теряя узнаваемость товара. Каталог выглядит единообразно на всех площадках.' },
  { name: 'Руслан Белов', role: 'магазин электроники', icon: 'settings', quote: 'Для гаджетов результат получился чистым и реалистичным. Сам товар всегда остаётся главным.' },
  { name: 'Наталья Соколова', role: 'бренд детских товаров', icon: 'gift', quote: 'Раньше согласование занимало несколько дней. Сейчас показываю команде три варианта и сразу выбираем направление.' },
  { name: 'Павел Орехов', role: 'производитель аксессуаров', icon: 'image', quote: 'Из одного исходника получаю карточки и вертикальные креативы в едином визуальном стиле.' },
  { name: 'Ксения Воронцова', role: 'категорийный менеджер', icon: 'grid', quote: 'Разобралась без опыта в дизайне. Задала сцену, выбрала формат и получила готовые варианты.' },
  { name: 'Михаил Чернов', role: 'продавец на Wildberries', icon: 'sparkle', quote: 'Использую Vitrio для тестов обложек. Проверяю несколько концепций до вложений в большую съёмку.' },
];
function reviewCardMarkup(review) {
  return `<article class="v-review-card"><header><span class="v-review-avatar" aria-hidden="true">${icon(review.icon || 'image')}</span><div><strong>${review.name}</strong><span>${review.role}</span></div><span class="v-review-rating" aria-label="Оценка 5 из 5">${icon('star','v-icon--tiny')} 5,0</span></header><blockquote>«${review.quote}»</blockquote></article>`;
}
function reviewMarqueeMarkup() {
  const rowMarkup = (reviews, speed) => {
    const cards = reviews.map(reviewCardMarkup).join('');
    return `<div class="v-review-row v-review-row--${speed}"><div class="v-review-track"><div class="v-review-set">${cards}</div><div class="v-review-set" aria-hidden="true">${cards}</div></div></div>`;
  };
  return `<div class="v-review-marquee" role="region" aria-label="Отзывы пользователей Vitrio">${rowMarkup(VITRIO_REVIEWS.slice(0, 5), 'fast')}${rowMarkup(VITRIO_REVIEWS.slice(5), 'slow')}</div>`;
}
function landingBenefitsMarkup() {
  return `<div class="v-benefits" role="region" aria-label="Площадки и возможности Vitrio" hidden><div class="v-marketplaces"><div class="v-marketplaces-copy"><small>ГОТОВО К ПУБЛИКАЦИИ</small><p>Карточки и рекламные сцены для маркетплейсов</p></div><div class="v-market-logo-row" data-marketplace-logos><img src="${ASSET}/marketplaces/wildberries.webp" alt="Wildberries"><img src="${ASSET}/marketplaces/ozon.webp" alt="Ozon"><img src="${ASSET}/marketplaces/yandex-market.webp" alt="Яндекс Маркет"></div></div><div class="v-benefit-list"><div><span class="v-benefit-value">1-4</span><span>ракурса товара</span></div><div><span class="v-benefit-value">5</span><span>звёзд за вариант</span></div><div><span class="v-benefit-value">∞</span><span>версий в проекте</span></div></div></div>`;
}
function billingPeriodCode(){const period=new URLSearchParams(location.search).get('period');return ['week','month','year'].includes(period)?period:'week';}
function billingPeriodDays(period,planCode='pro',subscription=null){const saved=Number(subscription?.periodDays);if([5,6,7,30,365].includes(saved))return saved;if(period==='week'&&planCode==='start')return 5;if(period==='week'&&planCode==='medium')return 6;return ({week:7,month:30,year:365})[period]||7;}
function billingPeriodLabel(period,planCode='pro',subscription=null){return `${billingPeriodDays(period,planCode,subscription)} дней`;}
function subscriptionCheckoutPlanCode(subscription){const next=subscription?.nextBillingPlanCode||subscription?.pendingPlanCode;return VITRIO_BILLING_PRODUCTS[next]?.type==='subscription'?next:subscription?.planCode;}
function subscriptionCheckoutPeriod(subscription){return ({daily:'day',weekly:'week',monthly:'month',yearly:'year'})[subscription?.nextBillingCadence||subscription?.billingCadence]||'week';}
function subscriptionMatchesBillingSelection(subscription,planCode,period){return subscriptionCheckoutPlanCode(subscription)===planCode&&subscriptionCheckoutPeriod(subscription)===period;}
function initialRecurringConsentCopy(planCode,period='week') { const plan=VITRIO_BILLING_PRODUCTS[planCode]||VITRIO_BILLING_PRODUCTS.start;const terms=plan.periods?.[period]||plan.periods.week;const periodDays=billingPeriodDays(period,planCode);if(period!=='week')return `Согласен на автосписание ${terms.price.toLocaleString('ru-RU')} ₽ каждые ${periodDays} дней до отмены.`;const dailyPrice=planCode==='start'&&periodDays===5?60:plan.dailyPrice;return `Согласен на автосписание: 1 ₽ за первые 24 часа, далее ${plan.price.toLocaleString('ru-RU')} ₽ каждые ${periodDays} дней до отмены. Возможны дневные списания ${dailyPrice.toLocaleString('ru-RU')} ₽.`; }
function resumeRecurringConsentCopy(subscription) { const planCode=subscriptionCheckoutPlanCode(subscription)||'start';const plan=VITRIO_BILLING_PRODUCTS[planCode]||VITRIO_BILLING_PRODUCTS.start;const period=subscriptionCheckoutPeriod(subscription);const terms=plan.periods?.[period]||plan.periods.week;const periodDays=Number(subscription?.nextBillingPeriodDays)||billingPeriodDays(period,planCode);const dailyPrice=Number(subscription?.nextBillingDailyPrice??(planCode===subscription?.planCode?subscription?.dailyPrice:null)??plan.dailyPrice);const amount=Number(subscription?.nextBillingAmount)||(period==='day'?dailyPrice:terms.price);if(period==='day'||periodDays===1)return `Согласен на автосписание ${amount.toLocaleString('ru-RU')} ₽ каждый день.`;if(period!=='week')return `Согласен на автосписание ${amount.toLocaleString('ru-RU')} ₽ каждые ${periodDays} дней.`;return `Согласен на автосписание ${amount.toLocaleString('ru-RU')} ₽ каждые ${periodDays} дней. При неуспешной оплате — ${dailyPrice.toLocaleString('ru-RU')} ₽ в день.`; }
function scheduledPlanConsentCopy(planCode,period='week'){return resumeRecurringConsentCopy({planCode,billingCadence:({month:'monthly',year:'yearly'})[period]||'weekly'});}
const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
// Kept only to migrate an already-open legacy session. Fresh sessions live in
// an HttpOnly host-only cookie and are intentionally unreadable to JavaScript.
const token = () => localStorage.getItem(TOKEN_KEY) || '';
const currentPath = () => location.pathname;
const icon = (name, cls = '') => {
  const paths = { arrow:'M5 12h14M13 6l6 6-6 6', play:'M8 5l11 7-11 7z', menu:'M4 7h16M4 12h16M4 17h16', more:'M12 5.5h.01M12 12h.01M12 18.5h.01', close:'M6 6l12 12M18 6L6 18', plus:'M12 5v14M5 12h14', download:'M12 3v12m0 0l-4-4m4 4l4-4M5 21h14', heart:'M20.8 8.5c0 5.3-8.8 10.5-8.8 10.5S3.2 13.8 3.2 8.5A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.8 1.5z', expand:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5', settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0-12v2m0 13v2M20.5 12h-2M5.5 12h-2', grid:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', folder:'M3 7h6l2 2h10v10H3z', image:'M4 5h16v14H4zM7 15l3-3 3 3 2-2 3 3M8 9h.01', check:'m5 12 4 4L19 6', repeat:'m17 3 4 4-4 4M3 11V9a2 2 0 0 1 2-2h16M7 21l-4-4 4-4M21 13v2a2 2 0 0 1-2 2H3', message:'M5 5h14v10H8l-3 3zM8 9h8M8 12h5', logout:'M10 17l5-5-5-5M15 12H3m9-8h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-6', star:'m12 3 2.78 5.64 6.22.9-4.5 4.38 1.06 6.18L12 17.26l-5.56 2.93 1.06-6.18L3 9.54l6.22-.9L12 3z', sparkle:'m12 3-1.5 5.2L5 10l5.5 1.8L12 17l1.5-5.2L19 10l-5.5-1.8L12 3zM19 15l-.7 2.3L16 18l2.3.7L19 21l.7-2.3L22 18l-2.3-.7L19 15z', chevron:'m9 18 6-6-6-6', trophy:'M8 21h8M12 17v4M7 4h10l1 7a6 6 0 0 1-12 0L7 4ZM5 7H3v2a5 5 0 0 0 4 4M19 7h2v2a5 5 0 0 0-4 4', clock:'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', userPlus:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6', creditCard:'M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4M2 10h20M7 15h.01M11 15h2', imagePlus:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9M16 5h6M19 2v6M3 16l5-5 4 4 3-3 6 6', circleCheck:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', gift:'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 2.5-2.5C10 6 12 7 12 7Zm0 0h4.5A2.5 2.5 0 1 0 14 4.5C14 6 12 7 12 7Z', calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2', dice:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01', ticket:'M2 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3M13 5v2M13 17v2M13 11v2', search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4', target:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', layers:'m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5', text:'M5 7V4h14v3M12 4v16M9 20h6', crop:'M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2', palette:'M12 21a9 9 0 1 1 9-9c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.4 3.4A1.6 1.6 0 0 1 12 21zM7.5 11h.01M10.5 7.5h.01M15 8h.01', pen:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', copies:'M8 8h12v12H8zM4 16V4h12', shirt:'M8 3 4 5 2 10l4 1v10h12V11l4-1-2-5-4-2a4 4 0 0 1-8 0z', user:'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10', smile:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01', slash:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM5 5l14 14', layout:'M3 4h18v16H3zM3 9h18M9 9v11', video:'M3 5h13v14H3zM16 10l5-3v10l-5-3', box:'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8', tag:'M3 12V3h9l9 9-9 9zM7.5 7.5h.01', bag:'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2', briefcase:'M3 7h18v13H3zM8 7V4h8v3M3 12h18', square:'M5 5h14v14H5z', placeCenter:'M4 4h16v16H4zM9 9h6v6H9z', placeFull:'M4 4h16v16H4zM7 7h10v10H7z', placeDetail:'M4 4h16v16H4zM14 6h4v4h-4z' };
  return `<svg class="v-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.image}"/></svg>`;
};
function studioGptMark() {
  return `<img class="v-studio-gpt-mark" src="${ASSET}/ai-chat/checkout-knot.webp" width="140" height="144" alt="" aria-hidden="true">`;
}
async function refreshSubscriptionOfferEligibility() {
  try {
    const [subscriptionData, checkoutContext] = await Promise.all([
      request('/vitrio/billing/subscription'),
      request('/vitrio/billing/checkout-context?plan=start&period=week'),
    ]);
    state.subscriptionOfferEligible = subscriptionData.subscription?.periodActive !== true && checkoutContext.trialEligible === true;
  } catch {
    state.subscriptionOfferEligible = false;
  }
  return state.subscriptionOfferEligible;
}
function dismissDialog(node,done){
  if(!node||'closing' in node.dataset)return;
  node.dataset.closing='';node.setAttribute('inert','');node.classList.add('is-closing');
  const finish=()=>{if(node.isConnected){if(node.open)node.close?.();node.remove();}done?.();};
  if(!studioRefreshEnabled()||matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,220);
}
function closeSubscriptionDialog(dialog) {
  if (!dialog) return;
  dismissDialog(dialog, () => {
    if (!document.querySelector('dialog[open][data-studio-subscription-dialog]:not([data-closing])')) document.body.classList.remove('v-subscription-dialog-open');
    dialog.returnFocus?.focus?.();
  });
}
function openSubscriptionPlanDialog(returnFocus = document.activeElement) {
  const previous = document.querySelector('[data-studio-subscription-dialog]');
  previous?.close();
  previous?.remove();
  const eligible = state.subscriptionOfferEligible;
  const dialog = document.createElement('dialog');
  dialog.className = 'v-studio-plan-dialog';
  dialog.dataset.studioSubscriptionDialog = '';
  dialog.setAttribute('aria-labelledby', 'studio-plan-title');
  dialog.returnFocus = returnFocus;
  const action = (plan) => eligible ? `<strong>Начать за 1 ₽</strong><small>24 часа</small>` : `<strong>Выбрать ${plan}</strong>`;
  dialog.innerHTML = `<section class="v-studio-plan-sheet" aria-labelledby="studio-plan-title"><button class="v-studio-subscription-close" type="button" data-close-subscription aria-label="Закрыть выбор тарифа">${icon('close')}</button><div class="v-studio-plan-heading"><picture class="v-studio-plan-mark"><img src="${ASSET}/studio-subscription/plan-stars-96.webp" srcset="${ASSET}/studio-subscription/plan-stars-192.webp 2x" width="96" height="96" alt="" aria-hidden="true"></picture><div><h2 id="studio-plan-title">Выберите свой Vitrio</h2></div></div><div class="v-studio-plan-options"><button class="v-studio-plan-card" type="button" data-subscription-plan="start"><span class="v-studio-plan-card-head"><b>Vitrio Start</b><small>Спокойный старт для карточек и визуалов</small></span><span class="v-studio-plan-benefits"><span>80 звёзд</span><span>Все режимы Studio</span><span>Для точечных запусков</span></span><span class="v-studio-plan-action"><span class="v-studio-plan-price">${action('Start')}</span>${icon('arrow')}</span></button><button class="v-studio-plan-card v-studio-plan-card--pro" type="button" data-subscription-plan="pro"><span class="v-studio-plan-badge">Выгодно</span><span class="v-studio-plan-card-head"><b>Vitrio Pro</b><small>Запас для каталога и нескольких серий</small></span><span class="v-studio-plan-benefits"><span>300 звёзд</span><span>Все режимы Studio</span><span>Больше итераций без пополнения</span></span><span class="v-studio-plan-action"><span class="v-studio-plan-price">${action('Pro')}</span>${icon('arrow')}</span></button><button class="v-studio-plan-card" type="button" data-subscription-plan="medium"><span class="v-studio-plan-card-head"><b>Vitrio Medium</b><small>Баланс для регулярной работы и серий</small></span><span class="v-studio-plan-benefits"><span>170 звёзд</span><span>Все режимы Studio</span><span>История проектов и скачивание</span></span><span class="v-studio-plan-action"><span class="v-studio-plan-price">${action('Medium')}</span>${icon('arrow')}</span></button></div></section>`;
  document.body.append(dialog);
  document.body.classList.add('v-subscription-dialog-open');
  dialog.querySelector('[data-close-subscription]').addEventListener('click',()=>closeSubscriptionDialog(dialog));
  dialog.querySelectorAll('[data-subscription-plan]').forEach(button=>button.addEventListener('click',()=>{
    const destination=studioUrl(`/billing?plan=${button.dataset.subscriptionPlan}&period=week`);
    closeSubscriptionDialog(dialog);
    go(destination);
  }));
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeSubscriptionDialog(dialog);});
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeSubscriptionDialog(dialog);});
  const motion = new AbortController();
  const syncMotion = () => dialog.classList.toggle('is-page-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncMotion, { signal: motion.signal });
  dialog.addEventListener('close', () => motion.abort(), { once: true });
  syncMotion();
  dialog.showModal();
  dialog.querySelector('[data-subscription-plan]')?.focus();
}
function openStudioSubscriptionPromo() {
  if (!state.subscriptionOfferEligible || state.subscriptionPromoShown || new URLSearchParams(location.search).get('settings') === 'subscription') return;
  state.subscriptionPromoShown = true;
  const dialog = document.createElement('dialog');
  dialog.className = 'v-studio-promo-dialog';
  dialog.dataset.studioSubscriptionDialog = '';
  dialog.returnFocus = document.activeElement;
  dialog.setAttribute('aria-labelledby', 'studio-promo-title');
  dialog.innerHTML = `<section class="v-studio-promo-sheet">
    <picture class="v-studio-promo-art">
      <source media="(max-width: 760px)" type="image/avif" srcset="${ASSET}/studio-subscription/welcome-mobile-20261012.avif">
      <source media="(max-width: 760px)" type="image/webp" srcset="${ASSET}/studio-subscription/welcome-mobile-20261012.webp">
      <source type="image/avif" srcset="${ASSET}/studio-subscription/welcome-desktop-20261012.avif">
      <img src="${ASSET}/studio-subscription/welcome-desktop-20261012.webp" width="1440" height="810" alt="Примеры карточек: наушники, парфюм, кроссовки и мультиварка" fetchpriority="high">
    </picture>
    <div class="v-studio-promo-copy">
      ${logo()}
      <div class="v-studio-promo-badge">${icon('sparkle')}<span>AI-студия товарных фото</span></div>
      <h2 id="studio-promo-title">Начни<br>генерировать<br>прямо сейчас —<br>всего за 1&nbsp;₽</h2>
      <p class="v-studio-promo-description">Загрузите фото товара и получите готовую карточку, Stories или предметный визуал.</p>
      <div class="v-studio-promo-actions">
        <button class="v-button v-button--accent" type="button" data-promo-choose>Начать за 1&nbsp;₽ ${icon('arrow')}</button>
        <button type="button" data-close-subscription>Не сейчас</button>
      </div>
      <ul class="v-studio-promo-benefits" aria-label="Возможности студии">
        <li>${icon('sparkle')}<span>Быстро</span></li>
        <li>${icon('circleCheck')}<span>Качественно</span></li>
        <li>${icon('grid')}<span>Для любых товаров</span></li>
      </ul>
    </div>
  </section><button class="v-studio-subscription-close" type="button" data-close-subscription aria-label="Закрыть предложение">${icon('close')}</button>`;
  document.body.append(dialog);
  document.body.classList.add('v-subscription-dialog-open');
  dialog.querySelectorAll('[data-close-subscription]').forEach(button=>button.addEventListener('click',()=>closeSubscriptionDialog(dialog)));
  dialog.querySelector('[data-promo-choose]').addEventListener('click',()=>{const returnFocus=dialog.returnFocus;closeSubscriptionDialog(dialog);openSubscriptionPlanDialog(returnFocus);});
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeSubscriptionDialog(dialog);});
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeSubscriptionDialog(dialog);});
  dialog.showModal();
  dialog.querySelector('[data-promo-choose]')?.focus();
}
function studioNavigationMark(name) { return `<img class="v-studio-navigation-mark" src="${ASSET}/studio-refresh/navigation/${name}-96.webp" srcset="${ASSET}/studio-refresh/navigation/${name}-192.webp 2x" width="96" height="96" alt="" aria-hidden="true">`; }
const VITRIO_LANDING_HOSTS = new Set(['vitrio.space', 'www.vitrio.space']);
const VITRIO_STUDIO_ORIGIN = 'https://studio.vitrio.space';
function vitrioReferralCode() { return String(new URLSearchParams(location.search).get('ref') || '').trim().toUpperCase(); }
function vitrioSubId() { const value = String(new URLSearchParams(location.search).get('sub1') || '').trim(); return /^\d{5,20}$/.test(value) ? value : ''; }
function vitrioSubIdSignature() { const value = String(new URLSearchParams(location.search).get('sub1_sig') || '').trim(); return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : ''; }
function vitrioReferralOffer() { const offer = new URLSearchParams(location.search).get('referral_offer'); return ['auto','start','medium','pro','hybrid'].includes(offer) ? offer : ''; }
const vitrioAttributionKeys=['ref','sub1','sub1_sig','referral_offer','utm_source','utm_medium','utm_campaign','utm_content','utm_term','source','click_id','campaign','landing','promo'];
function vitrioCampaign(){const campaign=new URLSearchParams(location.search).get('campaign');return ['vitrio-week-light','vitrio-week-dark'].includes(campaign)?campaign:'';}
function vitrioPromoCode(){return String(new URLSearchParams(location.search).get('promo')||'').trim().toUpperCase();}
function preserveVitrioAttribution(target){const source=new URLSearchParams(location.search);vitrioAttributionKeys.forEach((key)=>{if(source.get(key)&&!target.searchParams.has(key))target.searchParams.set(key,source.get(key));});return target;}
function studioUrl(path = '/studio') { const target=preserveVitrioAttribution(new URL(path.startsWith('/') ? path : `/${path}`, location.origin)); const next=new URLSearchParams(location.search).get('next') || ''; if (['/login','/register'].includes(target.pathname) && /^\/ai-chat(?:\?|$)/.test(next) || ['/login','/register','/recover','/set-password'].includes(target.pathname) && /^\/taro(?:\?|$)/.test(next)) target.searchParams.set('next',next); const refCode = vitrioReferralCode(); const referralOffer = vitrioReferralOffer(); if (refCode && !target.searchParams.has('ref')) target.searchParams.set('ref', refCode); if (referralOffer && !target.searchParams.has('referral_offer')) target.searchParams.set('referral_offer', referralOffer); const value = `${target.pathname}${target.search}`; return /^\/taro(?:\?|$)/.test(next) && ['/login','/register','/recover','/set-password'].includes(target.pathname) ? value : new Set([...VITRIO_LANDING_HOSTS, 'studio.vitrio.space']).has(location.hostname) ? `${VITRIO_STUDIO_ORIGIN}${value}` : `/vitrio${value}`; }
function landingUrl() { return new Set([...VITRIO_LANDING_HOSTS, 'studio.vitrio.space']).has(location.hostname) ? 'https://vitrio.space/' : '/vitrio'; }
function tariffsUrl(period = 'week') { return `${landingUrl().replace(/\/?$/, '/')}tariffs?period=${encodeURIComponent(period)}`; }
function resumePaymentRecoveryUrl(cause) {
  const fallback = new URL('/vitrio/billing', location.origin);
  fallback.searchParams.set('plan', ['start', 'medium', 'pro'].includes(cause?.details?.planCode) ? cause.details.planCode : billingPlanCode());
  fallback.searchParams.set('period', billingPeriodCode());
  let target = fallback;
  try {
    const candidate = new URL(cause?.details?.checkoutUrl, location.origin);
    if (candidate.origin === location.origin && !candidate.username && !candidate.password && ['/billing', '/vitrio/billing'].includes(candidate.pathname)) target = candidate;
  } catch {}
  target.searchParams.set('new_payment_method', '1');
  return `${target.pathname}${target.search}`;
}
function resumePaymentRecoveryMarkup(mode = 'account', cause) {
  const content = `<span class="${mode === 'billing' ? 'v-contest-status-mark v-contest-status-mark--muted' : ''}">${icon('creditCard')}</span><p class="${mode === 'billing' ? 'v-billing-kicker' : ''}">НУЖНО ПОДТВЕРЖДЕНИЕ</p><h${mode === 'billing' ? '1' : '3'}>Заново подтвердите способ оплаты</h${mode === 'billing' ? '1' : '3'}><p class="${mode === 'billing' ? 'v-billing-copy' : ''}">Сохранённый способ оплаты удалён. Для нового оформления выберите способ оплаты и отдельно подтвердите условия. Доступ до конца оплаченного периода сохранится.</p><a class="v-button v-button--accent" href="${esc(resumePaymentRecoveryUrl(cause))}">Выбрать способ оплаты</a>`;
  return mode === 'billing'
    ? `<section class="v-billing-card v-billing-card--contest v-billing-status" data-resume-payment-recovery>${logo()}${content}</section>`
    : `<section class="v-account-settings-paused v-account-settings-recovery" data-resume-payment-recovery role="status">${content}</section>`;
}
function showResumePaymentRecovery(cause, form, mode = 'account') {
  if (cause?.code !== 'PAYMENT_METHOD_REQUIRED') return false;
  if (mode === 'billing') {
    app.innerHTML = `<main class="v-billing">${resumePaymentRecoveryMarkup('billing', cause)}</main>`;
    bindCommon();
    return true;
  }
  const template = document.createElement('template');
  template.innerHTML = resumePaymentRecoveryMarkup('account', cause);
  form.closest('.v-account-settings-paused')?.replaceWith(template.content.firstElementChild);
  return true;
}
function go(url) { const destination = new URL(url, location.href); if (destination.origin !== location.origin || ['/ai-chat', '/taro'].includes(destination.pathname)) { location.assign(destination.href); return; } history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`); render(); }
async function request(url, options = {}) {
  const { legacyAuth = true, headers: requestHeaders = {}, ...fetchOptions } = options;
  let response;
  try { response = await fetch(`/api${url}`, { ...fetchOptions, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(legacyAuth && token() ? { Authorization: `Bearer ${token()}` } : {}), ...requestHeaders } }); }
  catch { const error=new Error('Не удалось связаться с сервером. Проверяем, сохранился ли рендер.');error.code='NETWORK_ERROR';throw error; }
  let raw;
  try { raw=await response.text(); } catch { const error=new Error('Не удалось связаться с сервером. Проверяем, сохранился ли рендер.');error.code='NETWORK_ERROR';throw error; }
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* An upstream server can return an HTML error page. */ }
  if (!response.ok) { const error = new Error(data.error || (response.status === 413 ? 'Фотографии слишком тяжёлые для отправки. Выберите до четырёх файлов, каждый до 6 МБ.' : 'Не удалось выполнить запрос.')); error.status = response.status; error.code = typeof data.code === 'string' ? data.code : response.status === 503 ? 'UPSTREAM_UNAVAILABLE' : ''; error.details = data; throw error; }
  return data;
}
function logo() { return `<a class="v-logo" href="${landingUrl()}" data-go aria-label="Vitrio, главная"><img src="${ASSET}/logo-vitrio.webp" alt="Vitrio"></a>`; }
function notice(text) { const node = document.createElement('div'); node.className = 'v-toast'; node.textContent = text; document.body.append(node); setTimeout(() => node.remove(), 3500); }

// Cookie choices are deliberately first-party and scoped to the Vitrio origin.
// Only necessary session/security storage is enabled by default. Optional
// analytics is opt-in and is loaded only on the public Vitrio landing.
const VITRIO_COOKIE_CONSENT_KEY = 'vitrio_cookie_consent';
const VITRIO_COOKIE_CONSENT_VERSION = 3;
const VITRIO_TOP_MAIL_COUNTER_ID = '3789737';
const VITRIO_YANDEX_METRIKA_ID = 111952780;
let vitrioCookieConsentDecision;
let vitrioAnalyticsStopping = false;
function isVitrioMainLanding() {
  return VITRIO_LANDING_HOSTS.has(location.hostname) && location.pathname === '/';
}
function loadVitrioTopMailCounter() {
  if (!isVitrioMainLanding() || !readVitrioCookieConsent()?.optional) return;
  if (document.documentElement.dataset.vitrioTopMailLoaded === 'true') return;
  document.documentElement.dataset.vitrioTopMailLoaded = 'true';
  const queue = window._tmr || (window._tmr = []);
  queue.push({ id: VITRIO_TOP_MAIL_COUNTER_ID, type: 'pageView', start: Date.now() });
  const script = document.createElement('script');
  script.async = true;
  script.dataset.vitrioAnalytics = 'top-mail';
  script.id = 'tmr-code';
  script.src = 'https://top-fwz1.mail.ru/js/code.js';
  document.head.append(script);
}
function loadVitrioYandexMetrika() {
  if (!isVitrioMainLanding() || !readVitrioCookieConsent()?.optional) return;
  if (document.documentElement.dataset.vitrioYandexMetrikaLoaded === 'true') return;
  document.documentElement.dataset.vitrioYandexMetrikaLoaded = 'true';
  window.ym = window.ym || function yandexMetrikaQueue(...args) {
    (window.ym.a = window.ym.a || []).push(args);
  };
  window.ym.l = 1 * new Date();
  window.ym(VITRIO_YANDEX_METRIKA_ID, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
  const script = document.createElement('script');
  script.async = true;
  script.dataset.vitrioAnalytics = 'yandex';
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${VITRIO_YANDEX_METRIKA_ID}`;
  document.head.append(script);
}
function loadVitrioOptionalAnalytics() {
  if (vitrioAnalyticsStopping) return;
  loadVitrioTopMailCounter();
  loadVitrioYandexMetrika();
}
function readVitrioCookieConsent() {
  if (vitrioCookieConsentDecision) return vitrioCookieConsentDecision;
  const choices = [];
  try { choices.push(localStorage.getItem(VITRIO_COOKIE_CONSENT_KEY)); } catch {}
  try { choices.push(window.sessionStorage.getItem(VITRIO_COOKIE_CONSENT_KEY)); } catch {}
  try { choices.push(document.cookie.split(/;\s*/).find((part) => part.startsWith(`${VITRIO_COOKIE_CONSENT_KEY}=`))?.slice(VITRIO_COOKIE_CONSENT_KEY.length + 1)); } catch {}
  return choices.flatMap((raw) => {
    try {
      const value = JSON.parse(decodeURIComponent(raw));
      return value?.version === VITRIO_COOKIE_CONSENT_VERSION && typeof value?.optional === 'boolean' && Number.isFinite(Date.parse(value.decidedAt)) ? [value] : [];
    } catch { return []; }
  }).sort((a, b) => Date.parse(b.decidedAt) - Date.parse(a.decidedAt) || Number(a.optional) - Number(b.optional))[0] || null;
}
function clearVitrioAnalyticsStorage() {
  const analyticsKey = /^(?:_ym(?:_|\d+_)|tmr_(?:lvid(?:TS)?|detect|reqNum)$)/;
  for (const storageName of ['localStorage', 'sessionStorage']) {
    try {
      const storage = window[storageName];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      keys.filter((key) => analyticsKey.test(key)).forEach((key) => storage.removeItem(key));
    } catch {}
  }
  let names = [];
  try { names = document.cookie.split(/;\s*/).map((part) => part.split('=')[0]).filter((name) => analyticsKey.test(name)); } catch {}
  const domains = ['', ...location.hostname.split('.').map((_, index, parts) => parts.slice(index).join('.')).filter((domain) => domain.includes('.'))];
  const paths = ['/', ...location.pathname.split('/').filter(Boolean).map((_, index, parts) => `/${parts.slice(0, index + 1).join('/')}`)];
  for (const name of names) for (const domain of domains) for (const path of paths) {
    try { document.cookie = `${name}=; Max-Age=0; Path=${path}${domain ? `; Domain=${domain}` : ''}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; } catch {}
  }
}
function stopVitrioOptionalAnalytics() {
  const loaded = document.documentElement.dataset.vitrioTopMailLoaded === 'true' || document.documentElement.dataset.vitrioYandexMetrikaLoaded === 'true';
  if (loaded && !vitrioAnalyticsStopping) {
    vitrioAnalyticsStopping = true;
    // A pending init must never run after withdrawal; destruct stops a live Metrika/Webvisor instance.
    if (Array.isArray(window.ym?.a)) window.ym.a.length = 0;
    try { window.ym?.(VITRIO_YANDEX_METRIKA_ID, 'destruct'); } catch {}
    if (Array.isArray(window.ym?.a)) window.ym.a.length = 0;
    if (Array.isArray(window._tmr)) window._tmr.length = 0;
    window.ym = () => {};
    window._tmr = { push() {}, pageView() {}, reachGoal() {} };
    document.querySelectorAll('script[data-vitrio-analytics]').forEach((script) => script.remove());
    clearVitrioAnalyticsStorage();
    // Top.Mail.Ru has no documented unload API. End this page's SDK timers/listeners immediately.
    window.stop();
    location.reload();
    return;
  }
  clearVitrioAnalyticsStorage();
}
function saveVitrioCookieConsent(optional) {
  const decidedAt = new Date(Math.max(Date.now(), (Date.parse(readVitrioCookieConsent()?.decidedAt) || 0) + 1)).toISOString();
  const value = { version: VITRIO_COOKIE_CONSENT_VERSION, necessary: true, optional: Boolean(optional), decidedAt };
  vitrioCookieConsentDecision = value;
  const encoded = encodeURIComponent(JSON.stringify(value));
  try { localStorage.setItem(VITRIO_COOKIE_CONSENT_KEY, JSON.stringify(value)); } catch {}
  try { window.sessionStorage.setItem(VITRIO_COOKIE_CONSENT_KEY, JSON.stringify(value)); } catch {}
  try { document.cookie = `${VITRIO_COOKIE_CONSENT_KEY}=${encoded}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; } catch {}
  window.dispatchEvent(new CustomEvent('vitrio-cookie-consent', { detail: value }));
  if (value.optional) loadVitrioOptionalAnalytics();
  else stopVitrioOptionalAnalytics();
  const banner = document.querySelector('[data-cookie-banner]');
  if (banner) { banner.hidden = true; banner.setAttribute('aria-hidden', 'true'); }
}
function showVitrioCookieBanner(showOptions = false) {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;
  banner.hidden = false;
  banner.setAttribute('aria-hidden', 'false');
  const options = banner.querySelector('[data-cookie-options]');
  if (options) options.hidden = !showOptions;
  banner.querySelector('[data-cookie-settings]')?.setAttribute('aria-expanded', String(showOptions));
  const optional = banner.querySelector('[data-cookie-optional]');
  if (optional) optional.checked = Boolean(readVitrioCookieConsent()?.optional);
  if (showOptions) banner.querySelector('[data-cookie-optional]')?.focus();
}
function ensureVitrioCookieBanner() {
  let banner = document.querySelector('[data-cookie-banner]');
  if (!banner) {
    banner = document.createElement('aside');
    banner.className = 'v-cookie-banner';
    banner.setAttribute('data-cookie-banner', '');
    banner.setAttribute('aria-labelledby', 'vitrio-cookie-title');
    banner.setAttribute('aria-describedby', 'vitrio-cookie-copy');
    banner.hidden = true;
    banner.innerHTML = `<div class="v-cookie-banner-head"><img src="${ASSET}/cookie-consent-3d.webp" width="56" height="56" alt="" aria-hidden="true"><div class="v-cookie-banner-copy"><h2 id="vitrio-cookie-title">Cookies</h2><p id="vitrio-cookie-copy">Необходимые — для входа и безопасности. Аналитика — только с вашего согласия. <a href="/vitrio/privacy" target="_blank" rel="noopener">Подробнее</a></p></div></div><div class="v-cookie-controls"><div class="v-cookie-actions"><button class="v-button v-button--accent" type="button" data-cookie-accept>Принять все</button><button class="v-button v-button--soft" type="button" data-cookie-reject>Только необходимые</button><button class="v-cookie-settings" type="button" data-cookie-settings aria-expanded="false">Настроить</button></div><div class="v-cookie-options" data-cookie-options hidden><label><input type="checkbox" data-cookie-optional> <span><b>Аналитика</b><small>Яндекс.Метрика и Top.Mail.Ru (VK)</small></span></label><button class="v-button v-button--dark" type="button" data-cookie-save>Сохранить выбор</button></div></div>`;
    document.body.append(banner);
    banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => saveVitrioCookieConsent(true));
    banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => saveVitrioCookieConsent(false));
    banner.querySelector('[data-cookie-settings]')?.addEventListener('click', (event) => { event.currentTarget.setAttribute('aria-expanded', 'true'); showVitrioCookieBanner(true); });
    banner.querySelector('[data-cookie-save]')?.addEventListener('click', () => saveVitrioCookieConsent(Boolean(banner.querySelector('[data-cookie-optional]')?.checked)));
  }
  if (!readVitrioCookieConsent()) showVitrioCookieBanner(false);
  if (readVitrioCookieConsent()?.optional) loadVitrioOptionalAnalytics();
  else stopVitrioOptionalAnalytics();
  if (!document.documentElement.dataset.vitrioCookieSettingsBound) {
    document.documentElement.dataset.vitrioCookieSettingsBound = 'true';
    const syncConsent = () => {
      vitrioCookieConsentDecision = undefined;
      if (!readVitrioCookieConsent()?.optional) stopVitrioOptionalAnalytics();
    };
    window.addEventListener('storage', (event) => { if (event.key === VITRIO_COOKIE_CONSENT_KEY || event.key === null) syncConsent(); });
    window.addEventListener('pageshow', (event) => { if (event.persisted) syncConsent(); });
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest?.('[data-open-cookie-settings]');
      if (trigger) { event.preventDefault(); showVitrioCookieBanner(true); }
    });
  }
}
function header() {
  const signed = state.user;
  return `<div class="v-header-wrap"><header class="v-header"><span>${logo()}</span><nav class="v-header-nav" aria-label="Навигация"><a href="#capabilities" data-anchor>Возможности</a><a href="#how" data-anchor>Как работает</a><a href="#examples" data-anchor>Примеры</a><a href="#pricing" data-anchor>Тарифы</a></nav><div class="v-header-actions">${signed ? `<a class="v-button v-button--small v-button--accent v-studio-link" href="${studioUrl('/studio')}" data-go>Студия ${icon('arrow','v-icon--tiny')}</a>` : `<a class="v-button v-button--small v-button--soft v-header-login" href="${studioUrl('/login')}" data-go>Войти</a><a class="v-button v-button--accent v-button--small" href="${studioUrl('/register')}" data-go><span class="v-header-cta">Попробовать за 1 ₽</span></a>`}</div></header></div>`;
}
function bindCommon() {
  bindStudioRefresh();
  if (studioRefreshEnabled()) document.querySelectorAll('.v-sidebar [data-open-studio-gpt], .v-app-menu [data-open-studio-gpt]').forEach(button => button.addEventListener('click', () => void openStudioGpt(button)));
  document.querySelectorAll('[data-go]').forEach((node) => node.addEventListener('click', (event) => { event.preventDefault(); closeAppMenu(); go(node.getAttribute('href') || node.dataset.go); }));
  document.querySelectorAll('[data-anchor]').forEach((node) => node.addEventListener('click', (event) => { event.preventDefault(); document.querySelector(node.getAttribute('href'))?.scrollIntoView({ behavior:'smooth' }); }));
  document.querySelector('[data-open-app-menu]')?.addEventListener('click', openAppMenu);
  document.querySelector('[data-close-app-menu]')?.addEventListener('click', closeAppMenu);
  document.querySelectorAll('[data-open-account-settings]').forEach((button) => button.addEventListener('click', () => openAccountSettings(button.dataset.accountTabTarget || 'profile')));
  document.querySelectorAll('[data-open-subscription-plans]').forEach((button) => button.addEventListener('click', () => { closeAppMenu(); openSubscriptionPlanDialog(button); }));
  document.querySelectorAll('[data-create]').forEach((node) => node.addEventListener('click', () => { closeAppMenu(); openCreate(node.dataset.create); }));
  document.querySelectorAll('[data-logout]').forEach((node) => node.addEventListener('click', async () => { try { await request('/vitrio/auth/logout', { method:'POST' }); } catch {} localStorage.removeItem(TOKEN_KEY); state.user = null; go('/vitrio'); }));
  document.querySelector('[data-app-menu]')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeAppMenu(); });
}
function fitStudioRefreshCanvas() {
  if (!studioRefreshEnabled()) return;
  const canvas = document.querySelector('[data-canvas]');
  if (!canvas) return;
  state.canvasZoom = 1; state.canvasPan = {x:0,y:0}; updateArtboardTransform();
  const layers = [...canvas.querySelectorAll('[data-canvas-layer]')].map(node => node.getBoundingClientRect());
  if (!layers.length) return;
  const rect = canvas.getBoundingClientRect();
  const left = Math.min(...layers.map(r=>r.left)), right = Math.max(...layers.map(r=>r.right));
  const top = Math.min(...layers.map(r=>r.top)), bottom = Math.max(...layers.map(r=>r.bottom));
  const zoom = Math.max(.35,Math.min(2.4,(rect.width-90)/(right-left),(rect.height-120)/(bottom-top)));
  state.canvasZoom = zoom;
  state.canvasPan = {x:(rect.left+rect.width/2-(left+right)/2)*zoom,y:(rect.top+rect.height/2-20-(top+bottom)/2)*zoom};
  updateArtboardTransform();
}
function openAppMenu() { const menu = document.querySelector('[data-app-menu]'); if (!menu) return; clearTimeout(menu.closeTimer); menu.classList.remove('is-closing'); menu.hidden = false; document.querySelector('[data-open-app-menu]')?.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; menu.querySelector('[data-close-app-menu]')?.focus(); }
function closeAppMenu() { const menu = document.querySelector('[data-app-menu]'); if (menu && !menu.hidden && studioRefreshEnabled() && !matchMedia('(prefers-reduced-motion: reduce)').matches) { menu.classList.add('is-closing'); clearTimeout(menu.closeTimer); menu.closeTimer = setTimeout(() => { menu.hidden = true; menu.classList.remove('is-closing'); }, 220); } else if (menu) menu.hidden = true; document.querySelector('[data-open-app-menu]')?.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
function renderComparison(selector, value = 48) {
  const root = document.querySelector(selector); if (!root) return;
  const set = (next) => { root.style.setProperty('--compare', `${next}%`); root.querySelector('input').setAttribute('aria-valuenow', String(next)); };
  const input = root.querySelector('input'); input.value = value; set(value); input.addEventListener('input', () => set(input.value));
}
function image(path, alt, extra = '') { return `<img src="${path}" alt="${alt}" width="800" height="1000" ${extra} onerror="this.style.opacity='.25'">`; }
function landing() {
  const featureCards = [
    ['Товар остаётся узнаваемым','Vitrio учитывает форму, упаковку, цвет, фактуру и ключевые детали товара.','<div class="v-bento-mini">'+image(`${ASSET}/hero/product-source.webp`,'Исходник')+image(`${ASSET}/hero/product-result.webp`,'Готовая сцена')+'</div>'],
    ['Проекты хранят всю историю','Исходники, настройки и результаты остаются собраны в одном месте.','<div class="v-bento-mini v-bento-versions">'+image(`${ASSET}/showcase/product-catalog.webp`,'Версия каталога')+image(`${ASSET}/showcase/product-nature.webp`,'Версия в окружении')+image(`${ASSET}/showcase/product-studio.webp`,'Студийная версия')+'</div>'],
    ['Форматы под площадку','Один товар для карточки, баннера и вертикального контента.','<div class="v-bento-mini v-bento-formats"><b>1:1</b><b>4:5</b><b>16:9</b><b>9:16</b></div>'],
    ['Автоматическая генерация','Vitrio сам подбирает оптимальные параметры для сцены — без выбора модели.','<div class="v-bento-mini"><button class="v-button v-button--small v-button--soft">5 звёзд за вариант</button></div>'],
    ['Чистый результат','Изображение без случайных цен, характеристик и рекламных надписей.','<div class="v-bento-mini">'+image(`${ASSET}/showcase/product-catalog.webp`,'Чистая товарная сцена')+'</div>'],
    ['Свободное пожелание','Опишите материал, поверхность, свет и композицию своими словами.','<div class="v-bento-mini"><div class="v-mini-field">Мокрые листья, капли росы, матовый камень.</div></div>']
  ];
  app.innerHTML = `<div class="v-landing">${header()}<main>
    <section class="v-hero">${heroFloatingCardsMarkup()}<div class="v-container v-hero-grid"><div class="v-hero-copy"><h1><span class="v-hero-title-copy">Создавайте карточки<br>товаров для<br>маркетплейсов с ИИ</span><span class="v-hero-title-light v-hero-title-light--pointer" aria-hidden="true">Создавайте карточки<br>товаров для<br>маркетплейсов с ИИ</span><span class="v-hero-title-light v-hero-title-light--shimmer" aria-hidden="true">Создавайте карточки<br>товаров для<br>маркетплейсов с ИИ</span></h1><p>Загрузите фото товара — Vitrio подготовит визуал, инфографику, заголовок и три подтверждённых качества для Wildberries, Ozon и Яндекс Маркета.</p><div class="v-actions"><button class="v-button v-button--accent" data-billing="start">Попробовать 24 часа за 1 ₽ ${icon('arrow')}</button><a class="v-button v-button--soft" href="#how" data-anchor>${icon('play')} Смотреть, как это работает</a></div></div></div>${landingBenefitsMarkup()}</section>
    <section class="v-section v-marketplace-showcase" id="examples"><div class="v-container"><header class="v-section-head"><h2>Карточки, которые хочется открыть</h2></header></div>${marketplaceMarqueeMarkup()}</section>
    <section class="v-section v-testimonials" id="features"><div class="v-container v-testimonials-head"><header class="v-section-head"><h2>Отзывы клиентов</h2></header></div>${reviewMarqueeMarkup()}</section>
    <section class="v-section v-section--tint" hidden><div class="v-container v-studio-promo"><div><h2>Всё управление в одной студии.</h2><p>Загружайте исходники, управляйте сценой и сохраняйте все варианты внутри одного проекта.</p><a class="v-button v-button--dark" href="${studioUrl(state.user ? '/studio' : '/register')}" data-go>Открыть студию ${icon('arrow')}</a></div><figure class="v-studio-preview"><img src="${ASSET}/showcase/studio-workspace.jpg" alt="Рабочий экран студии Vitrio с холстом, исходниками и настройками" loading="lazy"></figure></div></section>
    <section class="v-section" id="how"><div class="v-container"><header class="v-section-head v-section-head--center"><h2>Как работать в Vitrio</h2><p>Короткий туториал — от загрузки фото до готового визуала.</p></header><div class="v-tutorial" data-tutorial><button class="v-tutorial-cover" type="button" data-play-tutorial aria-label="Воспроизвести пошаговый обзор Vitrio"><img src="${ASSET}/tutorial/tutorial-cover-04.webp" alt="Как создать карточку товара за 1 минуту — пошаговый обзор Vitrio" width="1536" height="864" loading="lazy"><span class="v-tutorial-play" aria-hidden="true">${icon('play')}</span></button></div></div></section>
    <section class="v-section v-marketplace-seo" id="capabilities"><div class="v-container"><div class="v-marketplace-seo-intro"><h2>Нейросеть для карточек товаров по фото</h2><p>Vitrio — онлайн-генератор для продавцов и брендов. Он превращает обычные фотографии в готовую подачу товара без ручной вёрстки каждой карточки с нуля.</p></div><div class="v-marketplace-seo-points"><article><h3>Для Wildberries, Ozon и Яндекс Маркета</h3><p>Выбирайте квадратный, вертикальный или горизонтальный формат и готовьте визуалы для маркетплейса, интернет-магазина и рекламы в одном проекте.</p></article><article><h3>Изображения, инфографика и текст</h3><p>Нейросеть анализирует видимые свойства товара. Для карточки она может предложить заголовок и ровно три качества либо использовать ваш текст.</p></article><article><h3>Товар остаётся узнаваемым</h3><p>Исходные фото задают форму, упаковку, цвет и фактуру. Все версии сохраняются в проекте, чтобы сравнить подачу и выбрать подходящую.</p></article></div></div></section>
    <section class="v-section"><div class="v-container"><header class="v-section-head"><h2>Не просто генерация. Рабочее пространство для товара.</h2></header><div class="v-bento">${featureCards.map(([title,copy,visual])=>`<article class="v-bento-item"><h3>${title}</h3><p>${copy}</p>${visual}</article>`).join('')}</div></div></section>
    <section class="v-section" id="pricing"><div class="v-container"><header class="v-section-head"><h2>Выберите понятный старт</h2></header><div class="v-pricing" data-pricing-cards></div></div></section>
    <section class="v-section v-marketplace-faq" id="faq"><div class="v-container"><header class="v-section-head"><h2>Вопросы о создании карточек товаров</h2></header><div class="v-marketplace-faq-list"><details><summary>Можно ли создать карточку товара по обычному фото?</summary><p>Да. Загрузите от одного до четырёх фотографий товара: Vitrio проанализирует видимые детали и подготовит новый товарный визуал.</p></details><details><summary>Подходит ли Vitrio для Wildberries и Ozon?</summary><p>Да. В студии доступны квадратные, вертикальные и горизонтальные форматы для Wildberries, Ozon, Яндекс Маркета и интернет-магазинов. Перед публикацией проверьте актуальные требования своей площадки.</p></details><details><summary>Может ли нейросеть добавить инфографику и текст?</summary><p>Да. В режиме карточки маркетплейса можно поручить ИИ заголовок и три качества, которые подтверждаются фотографиями товара, либо заполнить их вручную.</p></details><details><summary>Как Vitrio сохраняет внешний вид товара?</summary><p>Нейросеть опирается на загруженные ракурсы и учитывает форму, упаковку, цвет, фактуру и видимые детали. Готовый вариант всё равно следует проверить перед публикацией.</p></details><details><summary>Можно ли изменить результат после генерации?</summary><p>Да. В проекте сохраняются исходники, настройки и варианты. Измените подачу, формат, палитру или пожелание и создайте новую версию.</p></details></div></div></section>
    <section class="v-container v-final-section"><div class="v-final-cta"><img src="${ASSET}/cta/product-stage.webp" alt="Премиальная предметная сцена Vitrio" width="1800" height="1013" loading="lazy"><div class="v-final-copy"><h2>Ваша следующая карточка уже почти готова.</h2><p>Загрузите фотографии товара, выберите подачу и получите первый коммерческий визуал в Vitrio.</p><button class="v-button v-button--accent" data-billing="start">Попробовать 24 часа за 1 ₽</button></div></div></section>
  </main>${footer()}</div>`;
  bindCommon(); bindLandingExtras();
}
function footer() { return `<footer class="v-footer"><div class="v-container v-footer-grid"><div>${logo()}<p>AI-студия профессиональных товарных изображений для маркетплейсов, интернет-магазинов и рекламы.</p><address class="v-footer-requisites"><strong>ИП Глухов Никита Сергеевич</strong><span>ИНН 610207809834 · ОГРНИП 326619600187043</span><span>Стадионная ул., 5, микрорайон Рабочий Городок, Ростов-на-Дону</span><a href="mailto:support@vitrio.space">support@vitrio.space</a></address><small>© ${new Date().getFullYear()} Vitrio</small></div><div><h3>Vitrio</h3><a href="#capabilities" data-anchor>Возможности</a><a href="#how" data-anchor>Как работает</a><a href="#examples" data-anchor>Примеры</a><a href="#pricing" data-anchor>Тарифы</a><a href="#faq" data-anchor>Вопросы</a></div><div><h3>Документы и поддержка</h3><a href="${studioUrl('/login')}" data-go>Войти</a><a href="mailto:support@vitrio.space">Поддержка</a><a href="/vitrio/offer">Публичная оферта и возвраты</a><a href="/vitrio/agreement">Пользовательское соглашение</a><a href="/vitrio/privacy">Политика данных</a><a href="/vitrio/subscription-terms">Условия подписки</a><a href="/vitrio/contest-rules">Правила конкурса</a><a href="/vitrio/contacts">Контакты</a><button type="button" class="v-footer-cookie-settings" data-open-cookie-settings>Настройки cookies</button></div></div></footer>`; }
function bindGallery() {
  const assets = { catalog:[['product-catalog.webp','Чистый каталог','4:5'],['product-studio.webp','Студийный минимализм','4:5'],['product-nature.webp','Природный контекст','4:5'],['product-result.webp','Stories / Reels','9:16']], nature:[['product-nature.webp','Природный контекст','4:5'],['product-result.webp','Рекламная сцена','4:5'],['product-studio.webp','Спокойный контраст','4:5'],['product-catalog.webp','Stories / Reels','9:16']], expressive:[['product-result.webp','Выразительная композиция','4:5'],['product-nature.webp','Контрастный свет','4:5'],['product-studio.webp','Архитектурная сцена','4:5'],['product-catalog.webp','Stories / Reels','9:16']], stories:[['product-result.webp','Вертикальная сцена','9:16'],['product-nature.webp','Природный контекст','4:5'],['product-catalog.webp','Каталог','4:5'],['product-studio.webp','Студия','4:5']] };
  const renderGallery = (key) => { document.querySelector('[data-gallery]').innerHTML = assets[key].map(([file,title,format]) => `<figure class="v-gallery-card">${image(`${ASSET}/showcase/${file.includes('result')?'../hero/'+file:file}`,title,'loading="lazy"')}<figcaption><span>${title}</span><b class="v-format">${format}</b></figcaption></figure>`).join(''); };
  renderGallery('catalog'); document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('active',item===button)); renderGallery(button.dataset.tab); }));
}
function bindLandingExtras(){renderPricingOptions();bindBillingButtons();renderPricingLegal();bindTutorialPreview();renderStepVisuals();bindLandingMarquees();bindHeroTitleSpotlight();const headerNode=document.querySelector('.v-header');window.addEventListener('scroll',()=>headerNode?.classList.toggle('is-scrolled',scrollY>18),{passive:true});bindScrollReveal();}
function bindTutorialPreview(){
  const tutorial=document.querySelector('[data-tutorial]');
  const trigger=tutorial?.querySelector('[data-play-tutorial]');
  if(!tutorial||!trigger)return;
  trigger.addEventListener('click',()=>{
    const frame=document.createElement('iframe');
    frame.src='https://kinescope.io/embed/ptXt8i3foDfA9RFzfxUPYB?autoplay=1';
    frame.title='Туториал по работе в Vitrio';
    frame.allow='autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock';
    frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.allowFullscreen=true;
    tutorial.classList.add('is-playing');
    tutorial.replaceChildren(frame);
  },{once:true});
}
function bindHeroTitleSpotlight(){
  const title=document.querySelector('.v-hero h1');
  if(!title||!matchMedia('(hover: hover) and (pointer: fine)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let frame=0;
  let x=0;
  let y=0;
  const paint=()=>{title.style.setProperty('--hero-pointer-x',`${x}px`);title.style.setProperty('--hero-pointer-y',`${y}px`);frame=0;};
  const move=(event)=>{const rect=title.getBoundingClientRect();x=event.clientX-rect.left;y=event.clientY-rect.top;title.classList.add('is-pointer-lit');if(!frame)frame=requestAnimationFrame(paint);};
  const leave=()=>{title.classList.remove('is-pointer-lit');if(frame){cancelAnimationFrame(frame);frame=0;}};
  title.addEventListener('pointermove',move,{passive:true});
  title.addEventListener('pointerleave',leave);
  window.addEventListener('pagehide',leave,{once:true});
}
function bindDraggableMarquee(viewport, track, set, { direction = 1, duration = 0, speed = 42, hoverSpeed = 8, label = '' } = {}) {
  if (!viewport || !track || !set || viewport.dataset.marqueeBound) return;
  viewport.dataset.marqueeBound = 'true';
  viewport.tabIndex = 0;
  if (label) viewport.setAttribute('aria-label', `${label}. Зажмите и двигайте влево или вправо. Также можно использовать стрелки клавиатуры.`);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let offset = 0;
  let currentSpeed = reducedMotion ? 0 : speed;
  let targetSpeed = currentSpeed;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startOffset = 0;
  let moved = false;
  let resumeAfterDrag = false;
  let lastFrame = performance.now();
  let frame = 0;
  const loopWidth = () => set.getBoundingClientRect().width + (Number.parseFloat(getComputedStyle(track).gap) || 0);
  const normalSpeed = () => reducedMotion ? 0 : (duration > 0 ? loopWidth() / duration : speed);
  const normalize = (value) => {
    const width = loopWidth();
    return width > 0 ? ((value % width) + width) % width : value;
  };
  const paint = () => {
    offset = normalize(offset);
    track.style.transform = `translate3d(${-offset}px,0,0)`;
  };
  const finish = (event) => {
    if (event.pointerId !== pointerId) return;
    if (moved) {
      resumeAfterDrag = true;
      targetSpeed = normalSpeed();
    } else targetSpeed = event.pointerType === 'mouse' ? (reducedMotion ? 0 : hoverSpeed) : normalSpeed();
    viewport.classList.remove('is-dragging');
    viewport.releasePointerCapture?.(pointerId);
    pointerId = null;
  };
  viewport.addEventListener('dragstart', (event) => event.preventDefault());
  viewport.addEventListener('pointerdown', (event) => {
    if ((event.pointerType !== 'touch' && event.button !== 0) || pointerId !== null) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startOffset = offset;
    moved = false;
    targetSpeed = 0;
    currentSpeed = 0;
    viewport.setPointerCapture?.(pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      finish(event);
      return;
    }
    if (!moved && Math.abs(dx) < 4) return;
    moved = true;
    viewport.classList.add('is-dragging');
    offset = startOffset - dx;
    paint();
    event.preventDefault();
  });
  viewport.addEventListener('pointerup', finish);
  viewport.addEventListener('pointercancel', finish);
  viewport.addEventListener('pointerenter', () => {
    if (!pointerId && !resumeAfterDrag) targetSpeed = reducedMotion ? 0 : hoverSpeed;
  });
  viewport.addEventListener('pointerleave', () => {
    resumeAfterDrag = false;
    if (!pointerId) targetSpeed = normalSpeed();
  });
  viewport.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    offset += event.key === 'ArrowLeft' ? -72 : 72;
    paint();
    event.preventDefault();
  });
  const tick = (now) => {
    const elapsed = Math.min(64, now - lastFrame);
    lastFrame = now;
    if (pointerId === null) {
      currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, elapsed / 280);
      offset += direction * currentSpeed * elapsed / 1000;
      paint();
    }
    frame = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); });
  frame = requestAnimationFrame(tick);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
}
function bindLandingMarquees() {
  const market = document.querySelector('.v-market-marquee');
  bindDraggableMarquee(market, market?.querySelector('.v-market-marquee-track'), market?.querySelector('.v-market-card-set'), { speed: 42, hoverSpeed: 8, label: 'Примеры товарных карточек Vitrio' });
  document.querySelectorAll('.v-review-row').forEach((row, index) => {
    const slow = row.classList.contains('v-review-row--slow');
    bindDraggableMarquee(row, row.querySelector('.v-review-track'), row.querySelector('.v-review-set'), { direction: slow ? -1 : 1, duration: slow ? 56 : 38, hoverSpeed: 0, label: `Отзывы клиентов, строка ${index + 1}` });
  });
}
const VITRIO_LANDING_PERIODS={week:{label:'Неделя',hint:'Начните за 1 ₽',start:{price:'300 ₽',interval:'/ 5 дней',stars:80,frequency:'каждые 5 дней'},medium:{price:'600 ₽',interval:'/ 6 дней',stars:170,frequency:'каждые 6 дней'},pro:{price:'1 000 ₽',interval:'/ 7 дней',stars:300,frequency:'каждые 7 дней'}},month:{label:'Месяц',hint:'Выгоднее до 12%',start:{price:'1 090 ₽',interval:'/ месяц',stars:360,frequency:'каждый месяц'},pro:{price:'3 490 ₽',interval:'/ месяц',stars:1320,frequency:'каждый месяц'}},year:{label:'Год',hint:'Максимум выгоды',start:{price:'10 990 ₽',interval:'/ год',stars:4800,frequency:'каждый год'},pro:{price:'34 990 ₽',interval:'/ год',stars:18000,frequency:'каждый год'}}};
function pricingSubscriptionCard(code, period) {
  const plan = VITRIO_LANDING_PERIODS[period][code];
  if (!plan) return `<article class="v-plan"><div class="v-plan-head"><h3>Vitrio Medium</h3><span>Доступен на 6 дней</span></div><p class="v-plan-copy">Для Medium доступен шестидневный период.</p><div class="v-plan-actions"><button class="v-button v-button--soft" data-billing="medium" data-billing-period="week">Выбрать Medium на 6 дней</button></div></article>`;
  const weekly = period === 'week';
  const product = VITRIO_BILLING_PRODUCTS[code];
  const copy = code === 'pro' ? 'Для продавцов, которым нужны сложные коммерческие сцены и больше контроля.' : code === 'medium' ? 'Сбалансированный объём для регулярных задач и нескольких итераций.' : 'Для первых карточек, каталогов и регулярных быстрых итераций.';
  const features = code === 'pro' ? ['Всё из Vitrio Start', 'Сложные коммерческие композиции', 'Максимальная детализация', 'Расширенные настройки сцены'] : ['Проекты для товаров', 'До четырёх ракурсов', 'Основные форматы и история', 'Скачивание готовых визуалов'];
  const button = weekly ? (code === 'pro' ? 'Попробовать Pro за 1 ₽' : 'Попробовать 24 часа за 1 ₽') : 'Выбрать тариф';
  const renewalDays = billingPeriodDays(period,code);
  const dailyPrice = code === 'start' && renewalDays === 5 ? 60 : product.dailyPrice;
  const note = weekly
    ? `<small class="v-plan-note">Возможны дневные списания ${dailyPrice.toLocaleString('ru-RU')} ₽.</small>`
    : `<small class="v-plan-note">${plan.stars.toLocaleString('ru-RU')} звёзд начисляются ${plan.frequency}. Автопродление можно отключить в любой момент.</small>`;
  const price = weekly ? `<div class="v-trial-price"><strong>1 ₽</strong><span>первые 24 часа</span></div><p class="v-plan-renewal">Далее ${plan.price} каждые ${renewalDays} дней</p>` : `<p class="v-price">${plan.price} <span>${plan.interval}</span></p>`;
  return `<article class="v-plan ${code === 'pro' ? 'v-plan--pro' : ''}"><div class="v-plan-head"><h3>${product.name}</h3><span>${code === 'pro' ? 'Больше контроля' : 'Быстрый старт'}</span></div>${price}<p class="v-plan-copy">${copy}</p><dl class="v-plan-limits"><div><dt>Звёзд</dt><dd>${plan.stars.toLocaleString('ru-RU')}</dd></div><div><dt>Генераций</dt><dd>до ${Math.floor(plan.stars/5).toLocaleString('ru-RU')}</dd></div></dl><ul>${features.map((item) => `<li>${icon('check','v-icon--tiny')}<span>${item}</span></li>`).join('')}</ul><div class="v-plan-actions"><button class="v-button ${code === 'pro' ? 'v-button--accent' : 'v-button--soft'}" data-billing="${code}" data-billing-period="${period}">${button}</button>${note}</div></article>`;
}
function pricingPackCard(code,{title,copy,recommended=false}){const pack=VITRIO_BILLING_PRODUCTS[code];return `<article class="v-settings-pack ${recommended?'v-settings-pack--recommended':''}"><div><h3>${title}</h3><p>${copy}</p><span>${pack.credits} звёзд · ${pack.price.toLocaleString('ru-RU')} ₽</span></div><button class="v-button v-button--accent v-button--small" type="button" data-buy-stars="${code}">Выбрать</button></article>`;}
function bindBillingButtons(root=document){root.querySelectorAll('[data-billing]').forEach((button)=>{if(button.dataset.billingBound)return;button.dataset.billingBound='true';button.addEventListener('click',()=>{const plan=VITRIO_BILLING_PRODUCTS[button.dataset.billing]?button.dataset.billing:'start';const period=['week','month','year'].includes(button.dataset.billingPeriod)?button.dataset.billingPeriod:'week';location.assign(studioUrl(`${state.user?'/billing':'/register'}?plan=${plan}&period=${period}`));});});}
function renderPricingOptions(){const section=document.querySelector('#pricing');const grid=section?.querySelector('.v-pricing');if(!section||!grid)return;const head=section.querySelector('.v-section-head');head.querySelector('h2').textContent='Выберите подходящий тариф';head.querySelector('p')?.remove();grid.className='v-pricing v-pricing--periods';grid.innerHTML=`<div class="v-pricing-periods" role="tablist" aria-label="Выбор периода подписки">${['month','week','year'].map((period)=>`<button type="button" role="tab" aria-selected="${period==='week'}" aria-controls="pricing-plans" id="pricing-period-${period}" data-pricing-period="${period}"><span>${VITRIO_LANDING_PERIODS[period].label}</span><small>${VITRIO_LANDING_PERIODS[period].hint}</small></button>`).join('')}</div><section class="v-pricing-panel" id="pricing-plans" role="tabpanel" aria-labelledby="pricing-period-week" data-pricing-panel></section>`;const panel=grid.querySelector('[data-pricing-panel]');let currentPeriod='week';let timer=0;const showPeriod=(period,{immediate=false}={})=>{if(!VITRIO_LANDING_PERIODS[period]||(!immediate&&period===currentPeriod))return;grid.querySelectorAll('[data-pricing-period]').forEach((button)=>button.setAttribute('aria-selected',String(button.dataset.pricingPeriod===period)));panel.setAttribute('aria-labelledby',`pricing-period-${period}`);const update=()=>{panel.innerHTML=`<div class="v-pricing-grid v-pricing-grid--subscriptions">${pricingSubscriptionCard('start',period)}${pricingSubscriptionCard('pro',period)}${pricingSubscriptionCard('medium',period)}</div>`;bindBillingButtons(panel);currentPeriod=period;};clearTimeout(timer);if(immediate||matchMedia('(prefers-reduced-motion: reduce)').matches){panel.classList.remove('is-changing');update();return;}panel.classList.add('is-changing');timer=setTimeout(()=>{update();requestAnimationFrame(()=>panel.classList.remove('is-changing'));},130);};showPeriod('week',{immediate:true});grid.querySelectorAll('[data-pricing-period]').forEach((button)=>button.addEventListener('click',()=>showPeriod(button.dataset.pricingPeriod)));}
function renderPricingLegal(){const pricing=document.querySelector('.v-pricing');if(pricing&&!document.querySelector('.v-pricing-legal'))pricing.insertAdjacentHTML('afterend','<p class="v-pricing-legal">Нажатие кнопки только открывает оформление. Перед оплатой в студии потребуется отдельно принять <a href="/vitrio/offer">публичную оферту с порядком возврата</a>, <a href="/vitrio/agreement">пользовательское соглашение</a>, <a href="/vitrio/privacy">политику обработки данных</a> и <a href="/vitrio/subscription-terms">условия подписки</a>.</p>');}
function renderHeadphoneGallery(){ const gallery=document.querySelector('[data-gallery]'); if(!gallery)return; const resultFrames=[['catalog.webp','Каталожная подача','AI 01'],['workspace.webp','Интерьерная сцена','AI 02'],['neon.webp','Рекламный визуал','AI 03']]; gallery.classList.add('v-transform-gallery'); gallery.innerHTML=`<figure class="v-transform-card v-transform-source"><div class="v-transform-image"><img src="${ASSET}/headphones/source.webp" alt="Исходное фото наушников на нейтральном фоне" loading="lazy"></div></figure><div class="v-transform-flow" role="img" aria-label="Vitrio AI создаёт три варианта подачи из одного исходного изображения"><svg class="v-transform-wires" viewBox="0 0 260 400" preserveAspectRatio="none" aria-hidden="true"><path class="v-wire v-wire--in" d="M0 200H73C104 200 104 148 130 148"></path><path class="v-wire v-wire--out" d="M130 148C159 148 159 74 260 74"></path><path class="v-wire v-wire--out" d="M130 148H260"></path><path class="v-wire v-wire--out" d="M130 148C159 148 159 326 260 326"></path></svg><div class="v-transform-core" aria-hidden="true">${icon('sparkle','v-transform-core-icon')}</div><div class="v-transform-core-label"><b>Vitrio AI</b><span>создаёт варианты</span></div></div><section class="v-transform-results" aria-label="Три готовых варианта изображения">${resultFrames.map(([file,description,badge])=>`<figure class="v-transform-card v-transform-result"><div class="v-transform-image"><img src="${ASSET}/headphones/${file}" alt="Наушники: ${description.toLowerCase()}" loading="lazy"><span class="v-transform-chip v-transform-chip--image">${badge}</span></div></figure>`).join('')}</section>`; document.querySelector('.v-tabs')?.remove(); document.querySelector('#features .v-showcase-head')?.classList.add('v-showcase-head--center'); }
function renderStepVisuals(){ document.querySelectorAll('.v-step-visual').forEach((node,index)=>{ const src=`${ASSET}/workflow/step-${index+1}-${['upload','settings','results'][index]}.webp`; node.classList.add('v-step-visual--asset'); node.innerHTML=`<img src="${src}" alt="${['Загрузка фотографий товара','Настройка сцены','Готовые варианты товара'][index]}" loading="lazy">`; }); }
function bindScrollReveal(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const items=document.querySelectorAll('.v-landing main > .v-section, .v-landing main > .v-container');items.forEach((item,index)=>{if(index<1)return;item.classList.add('v-reveal');});const observer=new IntersectionObserver((entries)=>entries.forEach((entry)=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');observer.unobserve(entry.target);}),{rootMargin:'0px 0px -10% 0px',threshold:.08});items.forEach((item)=>{if(item.classList.contains('v-reveal'))observer.observe(item);});}
let vitrioCaptchaWidget = null;
function clearVitrioCaptcha(){if(vitrioCaptchaWidget!==null&&window.turnstile?.remove){try{window.turnstile.remove(vitrioCaptchaWidget);}catch{}vitrioCaptchaWidget=null;}}
function resetVitrioCaptcha(){if(vitrioCaptchaWidget!==null&&window.turnstile?.reset){try{window.turnstile.reset(vitrioCaptchaWidget);}catch{}}}
let vitrioTurnstileLoader;
function loadVitrioTurnstile(){
  if(window.turnstile?.render)return Promise.resolve();
  if(vitrioTurnstileLoader)return vitrioTurnstileLoader;
  vitrioTurnstileLoader=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.defer=true;
    script.onload=()=>window.turnstile?.render?resolve():reject(new Error('Turnstile недоступен.'));
    script.onerror=()=>reject(new Error('Не удалось загрузить проверку. Проверьте подключение к интернету.'));
    document.head.append(script);
  }).catch((error)=>{vitrioTurnstileLoader=undefined;throw error;});
  return vitrioTurnstileLoader;
}
function mountVitrioCaptcha(onToken,onError){
  const container=document.querySelector('[data-vitrio-captcha]');
  if(!container)return;
  loadVitrioTurnstile().then(()=>{
    if(!container.isConnected)return;
    try{vitrioCaptchaWidget=window.turnstile.render(container,{sitekey:TURNSTILE_SITE_KEY,language:'ru',callback:(token)=>onToken(token||''),'expired-callback':()=>onToken(''),'error-callback':()=>onError('Не удалось загрузить проверку. Обновите страницу и попробуйте снова.')});}
    catch{onError('Не удалось загрузить проверку. Обновите страницу и попробуйте снова.');}
  }).catch((error)=>onError(error.message));
}
function postAuthPath(referralOffer=''){
  const query=new URLSearchParams(location.search);
  const requestedNext=query.get('next') || '';
  if (/^\/(?:ai-chat|taro)(?:\?|$)/.test(requestedNext)) { const target=preserveVitrioAttribution(new URL(requestedNext,location.origin)); return `${target.pathname}${target.search}${target.hash}`; }
  if(query.get('landing')==='vitrio-robux-inline'&&vitrioReferralCode()){
    const path=query.get('robux_return');
    const safePath=path==='/robux-contest'||/^\/[a-z0-9-]{3,40}$/.test(path||'')&&path!=='/robux'?path:'/robux-contest';
    const target=preserveVitrioAttribution(new URL(safePath,'https://vitrio.space'));
    return target.href;
  }
  if(vitrioReferralCode()){
    const target=preserveVitrioAttribution(new URL('/vitrio/billing',location.origin));
    target.searchParams.set('checkout','partner');
    target.searchParams.set('ref',vitrioReferralCode());
    target.searchParams.set('period',billingPeriodCode());
    if(query.has('plan'))target.searchParams.set('plan',billingPlanCode());
    // No browser-side hybrid assignment: billing resolves the saved account referral.
    return `${target.pathname}${target.search}`;
  }
  if(location.hostname==='studio.vitrio.space'&&query.get('creator')==='drop')return '/creator/drop?creator=1';const campaign=vitrioCampaign();const promo=vitrioPromoCode();if(campaign){const target=preserveVitrioAttribution(new URL('/vitrio/billing',location.origin));target.searchParams.set('plan','pro');target.searchParams.set('period','week');target.searchParams.set('campaign',campaign);target.searchParams.set('landing',campaign);if(promo)target.searchParams.set('promo',promo);return `${target.pathname}${target.search}`;}
  referralOffer=['auto','start','medium','pro','hybrid'].includes(referralOffer)?referralOffer:vitrioReferralOffer();
  if(referralOffer==='auto')return '/vitrio/billing?plan=pro&period=week&referral_offer=auto';
  if(['medium','pro'].includes(referralOffer))return `/vitrio/billing?plan=${referralOffer}&period=week&referral_offer=${referralOffer}`;
  if(referralOffer==='hybrid')return '/vitrio/billing?period=week&referral_offer=hybrid';
  const plan=query.get('plan');if(VITRIO_BILLING_PRODUCTS[plan])return `/vitrio/billing?plan=${plan}&period=${billingPeriodCode()}`;return '/vitrio/studio';
}
async function vitrioRegistration(prefill=''){
  const query=new URLSearchParams(location.search);
  if(!prefill)prefill=(query.get('email') || '').slice(0,254);
  const gptEntry=/^\/(?:ai-chat|taro)(?:\?|$)/.test(query.get('next') || '');
  let captchaRequired=true;
  if(vitrioReferralCode()){
    try{
      const context=await request(`/vitrio/referral-checkout?ref=${encodeURIComponent(vitrioReferralCode())}`,{legacyAuth:false});
      captchaRequired=context.captchaRequired!==false;
      if(context.eligible && !gptEntry)return partnerRegistration(context);
    }catch{/* Ordinary registration stays available when referral lookup fails. */}
  }
  clearVitrioCaptcha();
  // Passwords are never generated or emailed. The mailbox receives a
  // single-use fragment token and the user chooses their own password.
  app.innerHTML=`<main class="v-auth"><form class="v-auth-card" id="registration-form">${logo()}<h1>Быстрая регистрация</h1><p>Укажите почту — мы отправим одноразовую ссылку, по которой вы сами зададите пароль.</p><label class="v-field"><span>Email</span><input id="email" type="email" autocomplete="email" value="${esc(prefill)}" required></label><div class="v-auth-consents"><label><input type="checkbox" name="agreement" required><span>Принимаю <a href="/vitrio/agreement" target="_blank" rel="noopener">пользовательское соглашение</a>.</span></label><label><input type="checkbox" name="privacy" required><span>Даю <a href="/vitrio/data-consent" target="_blank" rel="noopener">согласие на обработку персональных данных</a>.</span></label></div>${captchaRequired?'<div class="v-auth-captcha"><div data-vitrio-captcha></div></div>':''}<p class="v-form-error" hidden></p><button class="v-button v-button--accent" type="submit">Получить ссылку</button><p class="v-form-legal">Создавая аккаунт, вы подтверждаете, что прочитали документы. Согласия не используются для рассылок.</p><p class="v-auth-switch">Уже есть аккаунт? <a href="${studioUrl('/login')}" data-go>Войти</a></p></form></main>`;
  bindCommon();
  const form=document.querySelector('#registration-form');const error=form.querySelector('.v-form-error');let captchaToken='';
  let shownLegalDocuments=null;
  const legalDocumentsReady=loadVitrioLegalDocuments().then(documents=>{shownLegalDocuments=documents;});
  void legalDocumentsReady.catch(()=>{});
  const showError=(message)=>{error.textContent=message;error.hidden=!message;};
  if(captchaRequired)mountVitrioCaptcha((token)=>{captchaToken=token;},showError);
  form.addEventListener('submit',async(event)=>{event.preventDefault();const button=form.querySelector('button');showError('');button.disabled=true;try{const legalAccepted={agreement:form.elements.agreement.checked,privacy:form.elements.privacy.checked,dataConsent:form.elements.privacy.checked};if(!legalAccepted.agreement||!legalAccepted.privacy)throw new Error('Подтвердите пользовательское соглашение и обработку персональных данных.');if(captchaRequired&&!captchaToken)throw new Error('Подтвердите, что вы не робот.');if(!shownLegalDocuments){try{await legalDocumentsReady;}catch{shownLegalDocuments=await loadVitrioLegalDocuments();form.elements.privacy.checked=false;throw new Error('Документы загружены. Ознакомьтесь с согласием и подтвердите его ещё раз.');}}const email=form.querySelector('#email').value.trim();const data=await request('/vitrio/auth/register',{method:'POST',body:JSON.stringify({email,captchaToken,legalAccepted,legalDocuments:shownLegalDocuments,refCode:vitrioReferralCode(),sub1:vitrioSubId(),sub1Sig:vitrioSubIdSignature(),campaign:vitrioCampaign(),promoCode:vitrioPromoCode()})});localStorage.removeItem(TOKEN_KEY);state.user=data.user;go(postAuthPath(data.referralOffer));}catch(cause){captchaToken='';resetVitrioCaptcha();showError(cause.message);button.disabled=false;}});
}
async function partnerRegistration(referralContext){
  clearVitrioCaptcha();
  const {mountPartnerRegistration}=await import('/assets/vitrio-partner-checkout.js?v=20261012-checkout-consent-1');
  return mountPartnerRegistration({app,logo,loginUrl:studioUrl('/login'),
    register:fields=>request('/vitrio/auth/register',{method:'POST',body:JSON.stringify({...fields,refCode:vitrioReferralCode(),sub1:vitrioSubId(),sub1Sig:vitrioSubIdSignature(),campaign:vitrioCampaign(),promoCode:vitrioPromoCode()})}),
    onRegistered:async data=>{
      localStorage.removeItem(TOKEN_KEY);state.user=data.user;clearVitrioCaptcha();
      const target=preserveVitrioAttribution(new URL('/vitrio/billing',location.origin));
      const selected=new URLSearchParams(location.search).get('plan');
      const assigned=['start','medium','pro'].includes(data.referralOffer)?data.referralOffer:referralContext.subscriptionOffer==='auto'?'pro':'start';
      const plan=billingPeriodCode()==='week'?assigned:VITRIO_BILLING_PRODUCTS[selected]?selected:assigned;
      target.searchParams.set('plan',plan);target.searchParams.set('period',billingPeriodCode());target.searchParams.set('checkout','partner');
      if(data.referralOffer)target.searchParams.set('referral_offer',data.referralOffer);
      history.pushState({},'',`${target.pathname}${target.search}`);
      const show=async()=>{await billing();app.querySelector('#bp-plan')?.focus({preventScroll:true});};
      try{
        if(document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches)await document.startViewTransition(show).updateCallbackDone;
        else await show();
      }catch{location.assign(`${target.pathname}${target.search}`);}
    }
  });
}
function vitrioCredentialsSent(email,{reset=false}={}){
  clearVitrioCaptcha();
  const message=reset?`Если аккаунт с адресом <b>${esc(email)}</b> существует, одноразовая ссылка для смены пароля уже отправлена на почту.`:`Мы отправили одноразовую ссылку для задания пароля на <b>${esc(email)}</b>.`;
  app.innerHTML=`<main class="v-auth"><section class="v-auth-card v-auth-card--sent">${logo()}<span class="v-auth-status">${icon('check','v-icon--tiny')} Проверьте почту</span><h1>${reset?'Запрос принят.':'Данные для входа уже в пути.'}</h1><p>${message}</p><div class="v-auth-notice"><b>Обязательно проверьте «Спам»</b><span>Почтовые сервисы иногда отправляют туда автоматические письма.</span></div><a class="v-button v-button--accent" href="${studioUrl('/login')}" data-go>Перейти ко входу</a><p class="v-auth-switch">Не нашли письмо? Проверьте папки «Спам» и «Промоакции».</p></section></main>`;
  bindCommon();
}
function vitrioSetPassword(){
  const setupToken=readPasswordResetToken('vitrio');
  app.innerHTML=`<main class="v-auth"><form class="v-auth-card" id="set-password-form">${logo()}<h1>Задайте пароль.</h1><p>Ссылка одноразовая. После сохранения вы войдёте в Vitrio автоматически.</p><label class="v-field"><span>Новый пароль</span><input id="password" type="password" autocomplete="new-password" minlength="8" maxlength="256" required></label><label class="v-field"><span>Повторите пароль</span><input id="password-confirm" type="password" autocomplete="new-password" minlength="8" maxlength="256" required></label><p class="v-form-error" role="alert" hidden></p><button class="v-button v-button--accent" type="submit">Сохранить и войти</button><p class="v-auth-switch"><a href="${studioUrl('/recover')}" data-go>Запросить новую ссылку</a></p><p class="v-auth-switch"><a href="${studioUrl('/login')}" data-go>Вернуться ко входу</a></p></form></main>`;
  const form=document.querySelector('#set-password-form');const error=form.querySelector('.v-form-error');
  bindCommon();
  if(!setupToken){error.hidden=false;error.textContent='В ссылке нет одноразового кода. Запросите новую ссылку.';form.querySelector('button').disabled=true;return;}
  form.addEventListener('submit',async(event)=>{event.preventDefault();const button=form.querySelector('button');error.hidden=true;button.disabled=true;try{const password=form.querySelector('#password').value;const passwordConfirm=form.querySelector('#password-confirm').value;if(password!==passwordConfirm)throw new Error('Пароли не совпадают.');const data=await request('/vitrio/auth/set-password',{method:'POST',legacyAuth:false,body:JSON.stringify({token:setupToken,password,passwordConfirm})});clearPasswordResetToken('vitrio');localStorage.removeItem(TOKEN_KEY);state.user=data.user;go('/vitrio/projects');}catch(cause){error.hidden=false;error.textContent=cause.code==='NETWORK_ERROR'?'Не удалось связаться с сервером. Проверьте соединение и повторите.':cause.message;button.disabled=false;}});
}
function vitrioPasswordRecovery(prefill=''){
  clearVitrioCaptcha();
  app.innerHTML=`<main class="v-auth"><form class="v-auth-card" id="password-recovery-form">${logo()}<h1>Забыли пароль?</h1><p>Укажите email, который использовали при регистрации. Мы отправим одноразовую ссылку для смены пароля.</p><label class="v-field"><span>Email</span><input id="email" type="email" autocomplete="email" value="${esc(prefill)}" required></label><div class="v-auth-notice"><b>Проверьте папку «Спам»</b><span>Письма со ссылкой для смены пароля иногда попадают туда.</span></div><p class="v-form-error" hidden></p><button class="v-button v-button--accent" type="submit">Отправить ссылку</button><p class="v-form-legal">Email обрабатывается только для восстановления доступа в соответствии с <a href="/vitrio/privacy" target="_blank" rel="noopener">политикой обработки данных</a>.</p><p class="v-auth-switch"><a href="${studioUrl('/login')}" data-go>Вернуться ко входу</a></p></form></main>`;
  bindCommon();
  const form=document.querySelector('#password-recovery-form');const error=form.querySelector('.v-form-error');
  const showError=(message)=>{error.textContent=message;error.hidden=!message;};
  form.addEventListener('submit',async(event)=>{event.preventDefault();const button=form.querySelector('button');showError('');button.disabled=true;try{const email=form.querySelector('#email').value.trim();await request('/vitrio/auth/recover',{method:'POST',body:JSON.stringify({email})});vitrioCredentialsSent(email,{reset:true});}catch(cause){showError(cause.message);button.disabled=false;}});
}
const VITRIO_TELEGRAM_LOGIN_URL='https://oauth.telegram.org/js/telegram-login.js?5';
function openVitrioTelegramLogin(options,callback){
  const login=window.Telegram?.Login;
  if(!login?.auth)throw new Error('Telegram Login SDK unavailable');
  const nativeOpen=window.open;
  window.open=function(url,target,features){
    let nextUrl=url;
    try{
      const parsed=new URL(String(url),location.href);
      if(parsed.origin==='https://oauth.telegram.org'&&parsed.pathname==='/auth'){
        // Telegram's current popup endpoint requires the embedding origin,
        // while telegram-login.js?5 currently omits it in its popup branch.
        parsed.searchParams.set('origin',location.origin);
        nextUrl=parsed.toString();
      }
    }catch{}
    return nativeOpen.call(window,nextUrl,target,features);
  };
  try{return login.auth(options,callback);}finally{window.open=nativeOpen;}
}
function telegramAuthUnavailable(root,message='Вход через Telegram сейчас недоступен. Используйте email и пароль.'){
  if(!root?.isConnected)return;
  root.classList.remove('is-loading','is-ready','is-authenticating');
  root.classList.add('is-unavailable');
  root.setAttribute('aria-busy','false');
  const status=root.querySelector('[data-telegram-status]');
  if(status){status.hidden=false;status.textContent=message;status.setAttribute('role','status');}
  const button=root.querySelector('[data-telegram-login]');
  if(button){button.disabled=true;button.querySelector('[data-telegram-label]').textContent='Войти через Telegram';}
}
async function mountVitrioTelegramLogin(){
  const root=document.querySelector('[data-vitrio-telegram-auth]');
  if(!root)return;
  const button=root.querySelector('[data-telegram-login]');
  const status=root.querySelector('[data-telegram-status]');
  const showStatus=(message,{error=false}={})=>{if(!status||!root.isConnected)return;status.hidden=!message;status.textContent=message;status.setAttribute('role',error?'alert':'status');};
  const setReady=()=>{if(!root.isConnected)return;root.classList.remove('is-loading','is-authenticating','is-unavailable');root.classList.add('is-ready');root.setAttribute('aria-busy','false');button.disabled=false;button.querySelector('[data-telegram-label]').textContent='Войти через Telegram';};
  root.classList.add('is-loading');root.setAttribute('aria-busy','true');
  try{
    let config=await request('/vitrio/auth/telegram/config',{legacyAuth:false});
    const validConfig=(value)=>value?.enabled===true&&/^\d{6,20}$/.test(String(value.clientId||''))&&/^[A-Za-z0-9_-]{24,128}$/.test(String(value.challenge||''))&&/^[A-Za-z0-9_-]{24,128}$/.test(String(value.nonce||''));
    if(!validConfig(config)){telegramAuthUnavailable(root);return;}
    let configLoadedAt=Date.now();
    const refreshConfig=async()=>{
      try{const next=await request('/vitrio/auth/telegram/config',{legacyAuth:false});if(!validConfig(next))throw new Error('invalid config');config=next;configLoadedAt=Date.now();return true;}
      catch{telegramAuthUnavailable(root);return false;}
    };
    let loginTimeout=0;
    const finishLogin=async(result)=>{
      clearTimeout(loginTimeout);loginTimeout=0;
      if(!root.isConnected)return;
      if(!result||result.error||!result.id_token){if(!await refreshConfig())return;setReady();showStatus(result?.error==='popup_closed'?'Вход отменён. Можно попробовать ещё раз.':'Telegram не подтвердил вход. Попробуйте ещё раз.',{error:result?.error!=='popup_closed'});return;}
      root.classList.remove('is-ready','is-unavailable');root.classList.add('is-authenticating');root.setAttribute('aria-busy','true');button.disabled=true;button.querySelector('[data-telegram-label]').textContent='Проверяем аккаунт…';showStatus('Проверяем вход через Telegram…');
      try{
        const data=await request('/vitrio/auth/telegram',{method:'POST',legacyAuth:false,body:JSON.stringify({idToken:result.id_token,challenge:config.challenge})});
        localStorage.removeItem(TOKEN_KEY);state.user=data.user;go(postAuthPath(data.referralOffer));
      }catch(cause){
        if(!await refreshConfig())return;
        setReady();
        const message=cause?.code==='TELEGRAM_ACCOUNT_NOT_LINKED'?'Сначала откройте Vitrio из Telegram-бота, чтобы связать аккаунт.':cause.message||'Не удалось войти через Telegram. Повторите позже.';
        showStatus(message,{error:true});
      }
    };
    const bindLogin=()=>{
      if(!window.Telegram?.Login?.auth){telegramAuthUnavailable(root);return;}
      setReady();showStatus('');
      button.addEventListener('click',async()=>{
        if(!window.Telegram?.Login?.auth){telegramAuthUnavailable(root);return;}
        if(Date.now()-configLoadedAt>240000&&!await refreshConfig())return;
        root.classList.add('is-authenticating');root.setAttribute('aria-busy','true');button.disabled=true;button.querySelector('[data-telegram-label]').textContent='Открываем Telegram…';showStatus('Завершите вход в официальном окне Telegram.');
        try{
          openVitrioTelegramLogin({client_id:String(config.clientId),scope:['profile'],lang:'ru',nonce:config.nonce},finishLogin);
          loginTimeout=setTimeout(async()=>{if(!root.isConnected||!root.classList.contains('is-authenticating'))return;window.Telegram?.Login?.close?.();if(!await refreshConfig())return;setReady();showStatus('Не получили ответ от Telegram. Разрешите всплывающее окно и повторите вход.',{error:true});},60000);
        }catch{setReady();showStatus('Не удалось открыть Telegram. Повторите ещё раз.',{error:true});}
      });
    };
    if(window.Telegram?.Login?.auth){bindLogin();return;}
    let script=document.querySelector('script[data-vitrio-telegram-sdk]');
    if(!script){script=document.createElement('script');script.async=true;script.src=VITRIO_TELEGRAM_LOGIN_URL;script.dataset.vitrioTelegramSdk='true';document.head.append(script);}
    script.addEventListener('load',bindLogin,{once:true});
    script.addEventListener('error',()=>telegramAuthUnavailable(root),{once:true});
  }catch{telegramAuthUnavailable(root);}
}
function auth(mode){
  if(mode!=='login')return vitrioRegistration();
  clearVitrioCaptcha();
  app.innerHTML=`<main class="v-auth"><section class="v-auth-card">${logo()}<h1>С возвращением.</h1><p>Войдите, чтобы продолжить работу с проектами.</p><section class="v-telegram-auth" data-vitrio-telegram-auth aria-label="Вход через Telegram" aria-busy="true"><button class="v-telegram-auth-button" type="button" data-telegram-login disabled><span class="v-telegram-auth-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21.7 3.3 18.6 19c-.23 1.1-.84 1.37-1.7.85l-4.72-3.48-2.28 2.2c-.25.25-.46.46-.95.46l.34-4.81 8.75-7.91c.38-.34-.08-.53-.59-.19L6.63 12.94l-4.66-1.46c-1.01-.32-1.03-1.01.21-1.5L20.4 2.96c.84-.31 1.58.2 1.3.34Z"/></svg></span><span data-telegram-label>Подключаем Telegram…</span></button><p class="v-telegram-auth-hint">Быстрый вход через официальный сервис Telegram.</p><p class="v-telegram-auth-status" data-telegram-status aria-live="polite" hidden></p></section><div class="v-auth-divider"><span>или войдите по email</span></div><form class="v-auth-email" id="auth-form"><label class="v-field"><span>Email</span><input id="email" type="email" autocomplete="email" required></label><label class="v-field"><span>Пароль</span><input id="password" type="password" autocomplete="current-password" minlength="8" required></label><p class="v-auth-forgot"><a href="${studioUrl('/recover')}" data-go>Забыли пароль?</a></p><p class="v-form-error" hidden></p><button class="v-button v-button--accent" type="submit">Войти в Vitrio</button><p class="v-form-legal">Данные входа обрабатываются для доступа к аккаунту по <a href="/vitrio/privacy" target="_blank" rel="noopener">политике обработки данных</a>.</p></form><p class="v-auth-switch">Впервые в Vitrio? <a href="${studioUrl('/register')}" data-go>Создать аккаунт</a></p></section></main>`;
  bindCommon();void mountVitrioTelegramLogin();document.querySelector('#auth-form').addEventListener('submit',async(event)=>{event.preventDefault();const error=event.currentTarget.querySelector('.v-form-error');const button=event.currentTarget.querySelector('button');error.hidden=true;button.disabled=true;try{const data=await request('/vitrio/auth/login',{method:'POST',body:JSON.stringify({email:document.querySelector('#email').value.trim(),password:document.querySelector('#password').value})});localStorage.removeItem(TOKEN_KEY);state.user=data.user;go(postAuthPath());}catch(cause){error.textContent=cause.message;error.hidden=false;button.disabled=false;}});
}
function studioPathIs(path){return currentPath()===`/vitrio${path}`||(location.hostname==='studio.vitrio.space'&&currentPath()===path);}
function appHeader(title='Проекты'){if(studioRefreshEnabled())return studioRefreshHeader(title,{logo,icon,esc,state});return `<header class="v-app-header">${logo()}<span class="v-app-crumb">Проекты / <b>${esc(title)}</b></span><div class="v-app-header-actions"><span class="v-save-status sr-visually-hidden" data-save-status>Все изменения сохранены</span><span class="v-credit">${icon('image','v-icon--tiny')}<b>${state.user?.credits??0}</b> рендера</span><span class="v-profile"><span class="v-avatar">${esc(state.user?.name||'V').slice(0,1)}</span><b data-account-name>${esc(state.user?.name||'')}</b></span><button class="v-app-menu-button" type="button" data-open-app-menu aria-label="Открыть навигацию" aria-expanded="false" aria-controls="v-app-menu">${icon('menu')}</button></div></header>`;}
function subscriptionCta(className=''){return state.subscriptionOfferEligible?`<button class="v-subscription-cta v-subscription-entry ${className}" type="button" data-open-subscription-plans aria-label="Выбрать Vitrio Start, Medium или Pro с первыми 24 часами за 1 рубль">${icon('sparkle','v-icon--tiny')}<span><small>ПЕРВЫЕ 24 ЧАСА</small><b>Подписка за 1 ₽</b></span>${icon('arrow','v-icon--tiny')}</button>`:'';}
function sideBar(){if(studioRefreshEnabled())return studioRefreshSidebar({icon,esc,state,studioPathIs,logo,studioGptMark,subscriptionCta});const credits=state.user?.credits??0;const name=esc(state.user?.name||'Пользователь');const settingsIcon=`<img src="${ASSET}/icons/account-settings.png" alt="" aria-hidden="true">`;return `<aside class="v-sidebar"><button class="v-button v-button--accent v-sidebar-new" data-create>${icon('plus')} Новый проект</button><p class="v-sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</p><a class="v-side-link ${studioPathIs('/projects')?'active':''}" href="/vitrio/projects" data-go>${icon('grid','v-icon--tiny')}Проекты</a><a class="v-side-link ${studioPathIs('/studio')?'active':''}" href="/vitrio/studio" data-go>${icon('image','v-icon--tiny')}Мои товары</a><a class="v-side-link ${studioPathIs('/support')?'active':''}" href="/vitrio/support" data-go>${icon('message','v-icon--tiny')}Поддержка</a><a class="v-side-link v-side-link--contest ${studioPathIs('/contest')?'active':''}" href="/vitrio/contest" data-go>${icon('trophy','v-icon--tiny')}Конкурс</a><p class="v-sidebar-label">ПОСЛЕДНИЕ ПРОЕКТЫ</p><div class="v-project-list">${state.projects.slice(0,6).map(p=>`<a class="v-project-item ${state.project?.id===p.id?'active':''}" href="/vitrio/studio?id=${encodeURIComponent(p.id)}" data-go>${p.resultImage||p.sourceImage?`<img src="${esc(p.resultImage||p.sourceImage)}" alt="">`:'<span class="v-avatar">+</span>'}<span>${esc(p.title)}</span></a>`).join('')||'<span class="v-project-item">Пока нет проектов</span>'}</div><section class="v-sidebar-account" aria-label="Аккаунт">${subscriptionCta()}<div class="v-sidebar-balance"><span>Баланс</span><span class="v-sidebar-balance-value"><img src="${ASSET}/icons/account-stars.png" alt="" aria-hidden="true"><b>${credits}</b><small>звёзд</small></span></div><div class="v-sidebar-profile" aria-label="Профиль: ${name}"><span class="v-sidebar-profile-icon"><img src="${ASSET}/icons/account-profile.png" alt="" aria-hidden="true"></span><b data-account-name>${name}</b><button class="v-sidebar-settings" type="button" data-open-account-settings aria-label="Настройки профиля">${settingsIcon}</button></div><button class="v-side-logout" data-logout><img src="${ASSET}/icons/account-logout.png" alt="" aria-hidden="true">Выйти</button></section></aside>`;}
function appMenu(){const credits=state.user?.credits??0;const name=esc(state.user?.name||'Пользователь');const settingsIcon=`<img src="${ASSET}/icons/account-settings.png" alt="" aria-hidden="true">`;const navNames={grid:'projects',image:'editor',message:'support',trophy:'contest'};const link=(href,label,iconName)=>`<a class="v-app-menu-link ${studioPathIs(href.replace(/^\/vitrio/,''))?'active':''}" href="${href}" data-go>${studioRefreshEnabled()?studioNavigationMark(navNames[iconName]):icon(iconName,'v-icon--tiny')}<span>${label}</span></a>`;return `<div class="v-app-menu" id="v-app-menu" hidden data-app-menu><aside class="v-app-menu-panel" role="dialog" aria-modal="true" aria-label="Рабочее пространство" tabindex="-1"><header class="v-app-menu-head"><div><span>Рабочее пространство</span><b>${name}</b></div><div class="v-app-menu-head-actions"><button class="v-icon-button v-app-menu-settings" type="button" data-open-account-settings aria-label="Настройки профиля">${settingsIcon}</button><button class="v-icon-button" type="button" data-close-app-menu aria-label="Закрыть навигацию">${icon('close')}</button></div></header><button class="v-button v-button--accent v-app-menu-new" type="button" data-create>${icon('plus','v-icon--tiny')}Новый проект</button><nav class="v-app-menu-nav" aria-label="Разделы Vitrio">${link('/vitrio/projects','Проекты','grid')}${link('/vitrio/studio',studioRefreshEnabled()?'Редактор':'Мои товары','image')}${studioRefreshEnabled()?'<button class="v-app-menu-link" type="button" data-open-studio-gpt>'+studioGptMark()+'<span data-studio-gpt-label>Vitrio GPT</span></button><p data-studio-gpt-status role="status" hidden></p>':''}${link('/vitrio/support','Поддержка','message')}${link('/vitrio/contest','Конкурс','trophy')}</nav>${subscriptionCta('v-app-menu-subscription')}<footer class="v-app-menu-account"><span>${studioRefreshEnabled()?studioCurrencyMark(''): `<img src="${ASSET}/icons/account-stars.png" alt="" aria-hidden="true">`}<b>${credits}</b> звёзд</span><button type="button" data-logout>${icon('logout','v-icon--tiny')}Выйти</button></footer></aside></div>`;}
function shell(title, content, mode=''){return `<div class="v-app ${mode?`v-app--${mode}`:''}">${appHeader(title)}<div class="v-app-shell">${sideBar()}${content}</div>${appMenu()}</div>`;}
function accountSubscriptionMarkup(subscription) {
  if (!subscription) return `<section class="v-account-settings-empty"><span>${icon('repeat')}</span><h3>Подписка не активна</h3><p>Выберите тариф, чтобы открыть студию и участвовать в конкурсе.</p><button class="v-button v-button--accent" type="button" data-account-billing>Выбрать тариф</button></section>`;
  const planCode = subscriptionCheckoutPlanCode(subscription);
  const period=({monthly:'month',yearly:'year'})[subscription?.nextBillingCadence||subscription?.billingCadence]||'week';
  const paidPeriod=({monthly:'month',yearly:'year'})[subscription?.billingCadence]||'week';
  const periodText=subscription.periodDays===1?'день':billingPeriodLabel(paidPeriod,subscription.planCode,subscription);
  const renewal = workspaceDate(subscription.renewsAt);
  const accessUntil = workspaceDate(subscription.paidThroughAt);
  const identity = 'Подписка Vitrio';
  const accessCopy = subscription.periodActive === true ? `Доступ сохранится до ${accessUntil}` : 'Оплаченный период завершён';
  const canCancel = subscription.canCancel ?? ['active', 'past_due'].includes(subscription.status);
  if (!subscription.autoRenewal) return `<section class="v-account-settings-paused"><span>${icon('repeat')}</span>${identity ? `<p>${identity}</p>` : ''}<h3>Автопродление отключено</h3><p>${accessCopy}, для следующего периода продление не запланировано.</p>${subscription.supportsResume !== false && subscription.status === 'active' && subscription.periodActive === true ? `<form data-account-resume><label class="v-billing-check"><input type="checkbox" name="renewalConsent" required><span>${resumeRecurringConsentCopy(subscription)} <a href="/vitrio/subscription-terms" target="_blank" rel="noopener">Условия подписки</a> и <a href="/vitrio/contest-rules" target="_blank" rel="noopener">правила конкурса</a>.</span></label><p class="v-form-error" hidden></p><button class="v-button v-button--accent" type="submit">Включить автопродление</button></form>` : ''}</section>`;
  const planOption = (code) => { const item = VITRIO_BILLING_PRODUCTS[code];const terms=item.periods[period];if(!terms)return '';return `<label class="v-account-plan-option"><input type="radio" name="planCode" value="${code}" ${planCode===code?'checked':''}><span><b>${item.name}</b><small>${terms.price.toLocaleString('ru-RU')} ₽ / ${billingPeriodLabel(period,code)} · ${terms.credits.toLocaleString('ru-RU')} звёзд</small></span></label>`; };
  return `<section class="v-account-subscription"><div class="v-account-subscription-head"><div><span>${identity || (subscription.periodActive === true ? 'Текущий тариф' : 'Тариф подписки')}</span><h3>${esc(subscription.displayPlanName || subscription.planName)}</h3></div><b class="v-account-subscription-status">${subscription.dailyFallbackPending?'Проверяем резервное списание':'Автопродление включено'}</b></div>${subscription.periodActive === true ? '' : `<p class="v-account-settings-note">${accessCopy}.</p>`}<dl class="v-account-subscription-data"><div><dt>Звёзды на период</dt><dd>${subscription.credits}</dd></div><div><dt>Следующее продление</dt><dd>${renewal}</dd></div><div><dt>Стоимость</dt><dd>${Number(subscription.price).toLocaleString('ru-RU')} ₽ / ${periodText}</dd></div></dl>${subscription.supportsPlanChange !== false ? `<form class="v-account-plan-form" data-account-plan data-billing-period="${period}"><div><h3>Тариф на следующий период</h3><p>Изменение не создаст списание сейчас. Новый тариф начнёт действовать в дату продления.</p></div><div class="v-account-plan-options">${planOption('start')}${planOption('medium')}${planOption('pro')}</div>${subscription.pendingPlanCode||planCode!==subscription.planCode?`<p class="v-account-settings-note">Выбран ${esc(subscription.nextBillingPlanName||subscription.pendingPlanName)}. Он будет применён ${renewal}</p>`:''}<label class="v-billing-check"><input type="checkbox" name="planConsent"><span data-plan-consent-copy>${scheduledPlanConsentCopy(planCode,period)}</span></label><p class="v-form-error" hidden></p><button class="v-button v-button--soft" type="submit">Сохранить тариф</button></form>` : ''}${canCancel ? `<details class="v-account-cancel"><summary>Отключить автопродление ${icon('chevron','v-icon--tiny')}</summary><form data-account-cancel><p>Новые списания не будут созданы. ${accessCopy}.</p><label class="v-billing-check"><input type="checkbox" name="confirmed" required><span>Понимаю, что отключаю автоматическое продление подписки.</span></label><label class="v-billing-check"><input type="checkbox" name="understandsAccess" required><span>Понимаю, что отключение не продлевает оплаченный доступ.</span></label><p class="v-form-error" hidden></p><button class="v-button v-button--soft" type="submit">Подтвердить отключение</button></form></details>` : ''}</section>`;
}
function accountSettingsMarkupLegacy(account, subscription, activeTab) {
  const profileActive = activeTab === 'profile';
  return `<section class="v-account-dialog v-account-dialog--${profileActive?'profile':'subscription'}" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title"><aside class="v-account-dialog-tabs"><div><span class="v-account-dialog-kicker">АККАУНТ</span><h2 id="account-dialog-title">Настройки</h2></div><div role="tablist" aria-label="Разделы настроек"><button type="button" role="tab" aria-selected="${profileActive}" data-account-tab="profile">${icon('settings','v-icon--tiny')}Профиль</button><button type="button" role="tab" aria-selected="${!profileActive}" data-account-tab="subscription">${icon('repeat','v-icon--tiny')}Подписка</button></div></aside><div class="v-account-dialog-content"><header><div><span>${profileActive?'Профиль':'Подписка'}</span><h2>${profileActive?'Данные аккаунта':'Управление подпиской'}</h2></div><button class="v-icon-button" type="button" data-close-account-settings aria-label="Закрыть настройки">${icon('close')}</button></header>${profileActive?`<div class="v-account-profile-pane"><section class="v-account-summary"><span class="v-avatar">${esc(account.user.name||'V').slice(0,1)}</span><div><b>${esc(account.user.name)}</b><small>${esc(account.user.email)}</small></div></section><dl class="v-account-metrics"><div><dt>Генераций</dt><dd>${account.generations}</dd></div><div><dt>Звёзд на балансе</dt><dd>${account.user.credits}</dd></div></dl><form class="v-account-form" data-account-profile><label class="v-field"><span>Имя</span><input name="name" value="${esc(account.user.name)}" minlength="2" maxlength="48" required></label><p class="v-form-error" hidden></p><button class="v-button v-button--soft" type="submit">Сохранить имя</button></form><section class="v-account-password"><div><h3>Изменить пароль</h3><p>Для смены подтвердите текущий пароль.</p></div><form class="v-account-form" data-account-password><label class="v-field"><span>Текущий пароль</span><input type="password" name="currentPassword" autocomplete="current-password" required></label><label class="v-field"><span>Новый пароль</span><input type="password" name="password" autocomplete="new-password" minlength="8" required></label><label class="v-field"><span>Повторите новый пароль</span><input type="password" name="passwordConfirm" autocomplete="new-password" minlength="8" required></label><p class="v-form-error" hidden></p><button class="v-button v-button--soft" type="submit">Обновить пароль</button></form></section></div>`:`<div class="v-account-subscription-pane">${accountSubscriptionMarkup(subscription)}</div>`}</div></section>`;
}
function accountPasswordMarkup() {
  return `<section class="v-account-password v-account-security-card"><div><h3>Изменить пароль</h3><p>Для смены подтвердите текущий пароль.</p></div><form class="v-account-form" data-account-password><label class="v-field"><span>Текущий пароль</span><input type="password" name="currentPassword" autocomplete="current-password" required></label><label class="v-field"><span>Новый пароль</span><input type="password" name="password" autocomplete="new-password" minlength="8" required></label><label class="v-field"><span>Повторите новый пароль</span><input type="password" name="passwordConfirm" autocomplete="new-password" minlength="8" required></label><p class="v-form-error" hidden></p><button class="v-button v-button--soft" type="submit">Обновить пароль</button></form></section>`;
}

function accountStarPacksMarkup() {
  const pack = (code, title, copy, recommended = false) => {
    const item = VITRIO_BILLING_PRODUCTS[code];
    return `<article class="v-account-pack${recommended ? ' v-account-pack--recommended' : ''}"><span class="v-account-pack-stars"><img src="${ASSET}/studio-subscription/plan-stars-96.webp" alt="" aria-hidden="true"><b>${item.credits}</b></span><div><h3>${title}</h3><p>${copy}</p></div><div class="v-account-pack-action"><button class="v-button v-button--accent v-button--small" type="button" data-buy-stars="${code}" aria-label="Купить ${item.credits} звёзд за ${item.price.toLocaleString('ru-RU')} ₽">${item.price.toLocaleString('ru-RU')} ₽</button></div></article>`;
  };
  return `<div class="v-account-packs-pane"><div class="v-account-packs-intro"><h3>Разовые пакеты звёзд</h3><p>Пополняйте баланс в нужный момент — без подписки и автоматических списаний.</p></div><div class="v-account-pack-list">${pack('stars-5', 'На пробу', 'Для одного визуала или первого теста.')}${pack('stars-30', 'Запас на проект', 'Для товарной серии и нескольких итераций.', true)}${pack('stars-100', 'Активная работа', 'Для нескольких проектов и стабильного запаса.')}</div><p class="v-account-packs-note">Звёзды зачислятся после успешной оплаты и не меняют ваш тариф.</p></div>`;
}

function accountSettingsMarkup(account, subscription, activeTab) {
  const tab = ['profile', 'subscription', 'security', 'packs'].includes(activeTab) ? activeTab : 'profile';
  const meta = {
    profile: { label: 'Профиль', title: 'Данные аккаунта' },
    subscription: { label: 'Подписка', title: 'Управление подпиской' },
    security: { label: 'Безопасность', title: 'Безопасность аккаунта' },
    packs: { label: 'Пакеты звёзд', title: 'Пополнить баланс' },
  }[tab];
  const profilePane = `<div class="v-account-profile-pane"><section class="v-account-summary"><span class="v-avatar">${esc(account.user.name || 'V').slice(0, 1)}</span><div><b>${esc(account.user.name)}</b><small>${esc(account.user.email)}</small></div></section><dl class="v-account-metrics"><div><dt>${icon('image', 'v-icon--tiny')}Генераций</dt><dd>${account.generations}</dd></div><div><dt><img src="${ASSET}/studio-subscription/plan-stars-96.webp" alt="" aria-hidden="true">Звёзд на балансе</dt><dd>${account.user.credits}</dd><button class="v-account-metric-action" type="button" data-account-tab="packs">Пополнить</button></div></dl><form class="v-account-form v-account-name-form" data-account-profile><label class="v-field"><span>Имя в студии</span><input name="name" value="${esc(account.user.name)}" minlength="2" maxlength="48" required></label><button class="v-button v-button--soft" type="submit">Сохранить</button><p class="v-form-error" hidden></p></form></div>`;
  const pane = tab === 'profile'
    ? profilePane
    : tab === 'security'
      ? `<div class="v-account-security-pane">${accountPasswordMarkup()}</div>`
      : tab === 'packs'
        ? accountStarPacksMarkup()
        : `<div class="v-account-subscription-pane">${accountSubscriptionMarkup(subscription)}</div>`;
  const tabButton = (code, label, glyph) => `<button type="button" role="tab" aria-selected="${tab === code}" data-account-tab="${code}">${glyph === 'lock' ? '<svg class="v-icon v-icon--tiny" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10h12v10H6zm2 0V7a4 4 0 0 1 8 0v3m-4 4v2"/></svg>' : icon(glyph, 'v-icon--tiny')}${label}</button>`;
  return `<section class="v-account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title"><aside class="v-account-dialog-tabs"><div><h2 id="account-dialog-title">Настройки</h2></div><div role="tablist" aria-label="Разделы настроек">${tabButton('profile', 'Профиль', 'settings')}${tabButton('subscription', 'Подписка', 'repeat')}${tabButton('security', 'Безопасность', 'lock')}${tabButton('packs', 'Пакеты звёзд', 'sparkle')}</div></aside><div class="v-account-dialog-content"><header><div><span>${meta.label}</span><h2>${meta.title}</h2></div><button class="v-icon-button" type="button" data-close-account-settings aria-label="Закрыть настройки">${icon('close')}</button></header>${pane}</div></section>`;
}

function syncAccountName(name) {
  document.querySelectorAll('[data-account-name]').forEach((node) => { node.textContent = name; });
  document.querySelectorAll('.v-profile .v-avatar').forEach((node) => { node.textContent = name.slice(0, 1); });
}
async function renderAccountSettings(dialog, activeTab = 'profile') {
  const revision = Number(dialog.dataset.accountRevision || 0) + 1;
  dialog.dataset.accountRevision = String(revision);
  const [accountData, subscriptionData] = await Promise.all([request('/vitrio/account'), request('/vitrio/billing/subscription')]);
  if (!dialog.isConnected || dialog.dataset.accountRevision !== String(revision)) return;
  const subscription = subscriptionData.subscription;
  state.user = accountData.account.user;
  dialog.innerHTML = accountSettingsMarkup(accountData.account, subscription, activeTab);
  const setSubscriptionBusy = busy => {
    dialog.dataset.subscriptionBusy = String(busy);
    dialog.querySelectorAll('[data-account-tab]').forEach(control => { control.disabled = busy; });
  };
  const close = () => closeStudioAccountSettings(dialog);
  dialog.querySelector('[data-close-account-settings]')?.addEventListener('click', close);
  dialog.querySelectorAll('[data-account-tab]').forEach((button) => button.addEventListener('click', async () => {
    if (dialog.dataset.loading === 'true' || dialog.dataset.subscriptionBusy === 'true' || button.getAttribute('aria-selected') === 'true') return;
    dialog.dataset.loading = 'true'; dialog.setAttribute('aria-busy','true');
    dialog.querySelectorAll('[data-account-tab]').forEach(tab=>{tab.disabled=true;});
    try { await renderAccountSettings(dialog, button.dataset.accountTab); dialog.querySelector(`[data-account-tab="${button.dataset.accountTab}"]`)?.focus(); }
    catch (cause) {
      let error=dialog.querySelector('[data-account-load-error]');
      if(!error){error=document.createElement('p');error.className='v-form-error';error.dataset.accountLoadError='';error.setAttribute('role','alert');dialog.querySelector('.v-account-dialog-content > header')?.after(error);}
      error.textContent=cause.message || 'Не удалось открыть раздел. Попробуйте ещё раз.';
    } finally { dialog.dataset.loading='false';dialog.removeAttribute('aria-busy');dialog.querySelectorAll('[data-account-tab]').forEach(tab=>{tab.disabled=false;}); }
  }));
  dialog.querySelector('[data-account-plan]')?.addEventListener('change', (event) => { if (event.target.name === 'planCode') { const copy=event.currentTarget.querySelector('[data-plan-consent-copy]'); if(copy)copy.textContent=scheduledPlanConsentCopy(event.target.value,event.currentTarget.dataset.billingPeriod||'week'); } });
  dialog.querySelector('[data-account-profile]')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const error = form.querySelector('.v-form-error'); const button = form.querySelector('button'); button.disabled = true; error.hidden = true; try { const data = await request('/vitrio/account', { method:'PATCH', body:JSON.stringify({ name:form.elements.name.value.trim() }) }); state.user = data.account.user; syncAccountName(state.user.name); notice('Имя сохранено.'); await renderAccountSettings(dialog, 'profile'); } catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; } });
  dialog.querySelector('[data-account-password]')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const error = form.querySelector('.v-form-error'); const button = form.querySelector('button'); button.disabled = true; error.hidden = true; try { await request('/vitrio/account/password', { method:'POST', body:JSON.stringify({ currentPassword:form.elements.currentPassword.value, password:form.elements.password.value, passwordConfirm:form.elements.passwordConfirm.value }) }); form.reset(); notice('Пароль обновлён. Остальные сеансы завершены.'); button.disabled = false; } catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; } });
  dialog.querySelector('[data-account-plan]')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const error = form.querySelector('.v-form-error'); const button = form.querySelector('button'); button.disabled = true; error.hidden = true; try { await request('/vitrio/billing/change-plan', { method:'POST', body:JSON.stringify({ planCode:form.elements.planCode.value, planConsent:form.elements.planConsent.checked, dailyFallbackConsent:form.elements.planConsent.checked }) }); notice('Тариф сохранён для следующего периода.'); await renderAccountSettings(dialog, 'subscription'); } catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; } });
  dialog.querySelector('[data-account-cancel]')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const error = form.querySelector('.v-form-error'); const button = form.querySelector('button'); if (button.disabled || !subscription?.id) return; button.disabled = true; setSubscriptionBusy(true); error.hidden = true; try { await request('/vitrio/billing/cancel-auto-renewal', { method:'POST', body:JSON.stringify({ confirmed:form.elements.confirmed.checked, understandsAccess:form.elements.understandsAccess.checked }) }); notice('Автопродление отключено.'); await renderAccountSettings(dialog, 'subscription'); } catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; } finally { setSubscriptionBusy(false); } });
  dialog.querySelector('[data-account-resume]')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const error = form.querySelector('.v-form-error'); const button = form.querySelector('button'); button.disabled = true; error.hidden = true; try { await request('/vitrio/billing/resume-auto-renewal', { method:'POST', body:JSON.stringify({ renewalConsent:form.elements.renewalConsent.checked, dailyFallbackConsent:form.elements.renewalConsent.checked }) }); notice('Автопродление включено.'); await renderAccountSettings(dialog, 'subscription'); } catch (cause) { if (showResumePaymentRecovery(cause, form)) return; error.textContent = cause.message; error.hidden = false; button.disabled = false; } });
  dialog.querySelectorAll('[data-buy-stars]').forEach((button) => button.addEventListener('click', () => { location.assign(studioUrl(`/billing?plan=${button.dataset.buyStars}`)); }));
  dialog.querySelector('[data-account-billing]')?.addEventListener('click', (event) => { event.preventDefault(); const returnFocus=dialog.studioReturnFocus; close(); openSubscriptionPlanDialog(returnFocus); });
}
function closeStudioAccountSettings(dialog) {
  if (studioRefreshEnabled()) {
    document.querySelector('.v-app')?.removeAttribute('inert');
    document.body.style.overflow='';
    const trigger=dialog.studioReturnFocus?.getClientRects().length ? dialog.studioReturnFocus : document.querySelector('[data-open-app-menu]');
    trigger?.focus();
  }
  dismissDialog(dialog);
}
async function openAccountSettings(activeTab = 'profile') {
  closeAppMenu();
  document.querySelector('.v-account-settings-backdrop')?.remove();
  const dialog = document.createElement('div');
  dialog.className = 'v-dialog-backdrop v-account-settings-backdrop';
  dialog.studioReturnFocus=document.activeElement;
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeStudioAccountSettings(dialog); });
  if(studioRefreshEnabled()){
    document.querySelector('.v-app')?.setAttribute('inert','');document.body.style.overflow='hidden';
    dialog.innerHTML=`<section class="v-account-dialog v-account-loading" role="dialog" aria-modal="true" aria-label="Настройки"><h2>Настройки</h2><p role="status">Загружаем данные…</p><button class="v-icon-button" type="button" data-loading-close aria-label="Закрыть настройки">${icon('close')}</button></section>`;
    dialog.querySelector('[data-loading-close]').addEventListener('click',()=>closeStudioAccountSettings(dialog));
    dialog.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeStudioAccountSettings(dialog);return;}
      if(event.key==='Tab'){
        const controls=[...dialog.querySelectorAll('button,input,a[href],summary')].filter(node=>!node.disabled&&node.getClientRects().length);
        const first=controls[0],last=controls.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
  }
  document.body.append(dialog);
  dialog.classList.add('is-entering');setTimeout(()=>dialog.classList.remove('is-entering'),700);
  dialog.querySelector('[data-loading-close]')?.focus();
  try { await renderAccountSettings(dialog, activeTab); dialog.querySelector('[data-close-account-settings]')?.focus(); }
  catch (cause) { closeStudioAccountSettings(dialog); notice(cause.message); }
}
function projectVersionCount(value){const n=Math.max(0,Number(value)||0);if(!n)return 'Пока без версий';const tail=n%10,teen=n%100;return `${n} ${tail===1&&teen!==11?'версия':tail>=2&&tail<=4&&(teen<12||teen>14)?'версии':'версий'}`;}
function projectCardMarkup(project) {
  const id = esc(project.id);
  const title = esc(project.title);
  return `<article class="v-project-card-wrap"><a class="v-project-card" href="/vitrio/studio?id=${encodeURIComponent(project.id)}" data-go>${project.resultImage||project.sourceImage?`<img src="${esc(project.resultImage||project.sourceImage)}" alt="${title}" loading="lazy" decoding="async">`:`<div class="v-project-card-image">${studioRefreshEnabled()?studioTypeArt(project.projectType):''}</div>`}<span><b>${title}</b><small>${projectVersionCount(project.renders)} · ${projectTypeName(project.projectType)}</small></span></a><button class="v-project-card-action" type="button" data-project-menu-button="${id}" aria-label="Действия с проектом «${title}»" aria-haspopup="menu" aria-expanded="false" aria-controls="project-menu-${id}">${icon('more')}</button><div class="v-project-card-menu" id="project-menu-${id}" role="menu" hidden><button type="button" role="menuitem" data-project-rename="${id}">Переименовать</button><button type="button" role="menuitem" data-project-duplicate="${id}">Дублировать проект</button><button type="button" role="menuitem" data-project-delete="${id}">Удалить проект</button></div></article>`;
}
function closeProjectMenus(except = null) {
  document.querySelectorAll('.v-project-card-wrap.is-menu-open').forEach((card) => {
    if (card === except) return;
    card.classList.remove('is-menu-open');
    card.querySelector('[data-project-menu-button]')?.setAttribute('aria-expanded', 'false');
    card.querySelector('[role="menu"]')?.setAttribute('hidden', '');
  });
}
function openProjectRename(project) {
  closeProjectMenus();
  const dialog = document.createElement('div');
  dialog.className = 'v-dialog-backdrop';
  dialog.innerHTML = `<form class="v-dialog v-project-action-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-project-title"><header class="v-dialog-titlebar"><div><h2 id="rename-project-title">Переименовать проект</h2><p>Новое название будет видно только в вашем рабочем пространстве.</p></div><button class="v-icon-button" type="button" data-close aria-label="Закрыть окно">${icon('close')}</button></header><label class="v-field"><span>Название проекта</span><input name="title" value="${esc(project.title)}" minlength="2" maxlength="90" required autofocus></label><p class="v-form-error" hidden></p><footer class="v-dialog-actions"><button class="v-button v-button--soft" type="button" data-close>Отмена</button><button class="v-button v-button--accent" type="submit">Сохранить</button></footer></form>`;
  document.body.append(dialog);
  const close = () => dismissDialog(dialog);
  dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  const form = dialog.querySelector('form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const error = form.querySelector('.v-form-error');
    button.disabled = true; error.hidden = true;
    try {
      const data = await request(`/vitrio/projects/${encodeURIComponent(project.id)}`, { method:'PATCH', body:JSON.stringify({ title:form.elements.title.value.trim() }) });
      if (state.project?.id === project.id) state.project = preserveProjectVideos(data.project);
      close(); await projects(); notice('Название проекта сохранено.');
    } catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; }
  });
  form.elements.title.focus(); form.elements.title.select();
}
function openProjectDelete(project) {
  closeProjectMenus();
  const dialog = document.createElement('div');
  dialog.className = 'v-dialog-backdrop';
  dialog.innerHTML = `<form class="v-dialog v-project-action-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-project-title"><header class="v-dialog-titlebar"><div><h2 id="delete-project-title">Удалить проект?</h2><p>«${esc(project.title)}», его исходники и версии исчезнут из студии. Восстановить проект будет нельзя.</p></div><button class="v-icon-button" type="button" data-close aria-label="Закрыть окно">${icon('close')}</button></header><p class="v-form-error" hidden></p><footer class="v-dialog-actions"><button class="v-button v-button--soft" type="button" data-close>Отмена</button><button class="v-button v-button--danger" type="submit">Удалить проект</button></footer></form>`;
  document.body.append(dialog);
  const close = () => dismissDialog(dialog);
  dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  const form = dialog.querySelector('form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const error = form.querySelector('.v-form-error');
    button.disabled = true; error.hidden = true;
    try {
      await request(`/vitrio/projects/${encodeURIComponent(project.id)}`, { method:'DELETE' });
      if (state.project?.id === project.id) state.project = null;
      close(); await projects(); notice('Проект удалён.');
    } catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; }
  });
  dialog.querySelector('[type="submit"]')?.focus();
}
let projectMenuDocumentBound = false;
function bindProjectMenus() {
  document.querySelectorAll('[data-project-menu-button]').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('.v-project-card-wrap');
    const menu = card?.querySelector('[role="menu"]');
    if (!card || !menu) return;
    const open = !card.classList.contains('is-menu-open');
    closeProjectMenus(card);
    card.classList.toggle('is-menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  }));
  document.querySelectorAll('[data-project-rename]').forEach((button) => button.addEventListener('click', () => { const project = state.projects.find((item) => item.id === button.dataset.projectRename); if (project) openProjectRename(project); }));
  document.querySelectorAll('[data-project-duplicate]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    try { await request(`/vitrio/projects/${encodeURIComponent(button.dataset.projectDuplicate)}/duplicate`, { method:'POST' }); closeProjectMenus(); await projects(); notice('Копия проекта создана.'); }
    catch (cause) { button.disabled = false; notice(cause.message); }
  }));
  document.querySelectorAll('[data-project-delete]').forEach((button) => button.addEventListener('click', () => { const project = state.projects.find((item) => item.id === button.dataset.projectDelete); if (project) openProjectDelete(project); }));
  if (!projectMenuDocumentBound) { document.addEventListener('click', (event) => { if (!event.target.closest('.v-project-card-wrap')) closeProjectMenus(); }); projectMenuDocumentBound = true; }
}
async function projects(){try{const [projectsData]=await Promise.all([request('/vitrio/projects'),refreshSubscriptionOfferEligibility()]);state.projects=projectsData.projects;state.thumbnailTemplates=projectsData.meta?.thumbnailTemplates||[];state.cardTemplates=projectsData.meta?.cardTemplates||[];}catch(cause){if(cause.status===401)return go('/vitrio/login');throw cause;}if(studioRefreshEnabled()){app.innerHTML=shell('Проекты',studioRefreshProjects({state,icon,projectCardMarkup}));bindCommon();bindProjectMenus();if(new URLSearchParams(location.search).get('settings')==='subscription')void openAccountSettings('subscription');return;}app.innerHTML=shell('Проекты',`<main class="v-workspace"><header class="v-workspace-head"><div><h1>Проекты</h1><p>Карточки товаров, мерч и новые идеи в одном рабочем пространстве.</p></div><button class="v-button v-button--accent" data-create>${icon('plus')} Создать проект</button></header><section class="v-project-grid"><button class="v-project-create" data-create><span><i>+</i><b>Новый проект</b></span></button>${state.projects.map(projectCardMarkup).join('')}</section></main>`);bindCommon();bindProjectMenus();if(new URLSearchParams(location.search).get('settings')==='subscription')void openAccountSettings('subscription');}
function workspaceDate(value, withTime = false) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day:'numeric', month:'long', year:'numeric', ...(withTime ? { hour:'2-digit', minute:'2-digit' } : {}) }).format(new Date(value));
}
function supportStatus(status) { return ({ open:'Открыто', in_progress:'В работе', operator_needed:'Нужен ответ', waiting_user:'Ждём пользователя', closed:'Закрыто' })[status] || 'Открыто'; }
function supportTone(status) { return ({ open:'open', in_progress:'progress', operator_needed:'operator', waiting_user:'waiting', closed:'closed' })[status] || 'open'; }
async function loadWorkspaceProjects() { if (!state.projects.length) {const data=await request('/vitrio/projects');state.projects=data.projects;state.thumbnailTemplates=data.meta?.thumbnailTemplates||[];state.cardTemplates=data.meta?.cardTemplates||[];} }

function contestMonthEndAt(reference = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Moscow', year:'numeric', month:'2-digit' }).formatToParts(reference);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  const year = Number(value('year')); const month = Number(value('month'));
  const end = Date.UTC(year, month, 0, 17);
  return new Date(reference.getTime() >= end ? Date.UTC(year, month + 1, 0, 17) : end).toISOString();
}
function contestEndLabel(endAt) { return new Intl.DateTimeFormat('ru-RU', { timeZone:'Europe/Moscow', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' }).format(new Date(endAt)) + ' МСК'; }
function contestSteps(account, subscription, eligibility = {}) {
  return [
    { id:'account', title:'Создать аккаунт', description:'Готово', completed:eligibility.accountCompleted === true, icon:'userPlus' },
    { id:'subscription', title:'Оформить подписку за 1 ₽', description:'Активируйте тариф, чтобы продолжить.', completed:eligibility.subscriptionPaid === true, icon:'creditCard', action:{ href:'/vitrio/billing?plan=start', label:'Перейти' } },
    { id:'generation', title:'Сгенерировать 1 изображение в студии', description:'Создайте первый визуал в студии.', completed:eligibility.generationCompleted === true, icon:'imagePlus', action:{ href:'/vitrio/studio', label:'Перейти' } },
  ].map((step) => ({ ...step, description:step.completed ? 'Готово' : step.description }));
}
function contestStepMarkup(step) {
  const action = !step.completed && step.action ? `<a href="${step.action.href}" data-go>${step.action.label}</a>` : '';
  return `<li class="v-contest-step ${step.completed ? 'is-complete' : ''}"><span class="v-contest-step-check">${icon(step.completed ? 'check' : 'close', 'v-icon--tiny')}</span><span class="v-contest-step-symbol">${icon(step.icon)}</span><span class="v-contest-step-copy"><b>${step.title}</b><small>${step.description}</small></span>${action}</li>`;
}
function contestProgress(steps) {
  const complete = steps.every((step) => step.completed);
  const panel = complete
    ? `<section class="v-contest-result is-complete"><span>${icon('circleCheck')}</span><div><h3>Вы участвуете!</h3><p>Все условия выполнены. Желаем удачи в розыгрыше.</p></div></section>`
    : `<section class="v-contest-result"><span>${icon('trophy')}</span><div><h3>Остался ещё шаг</h3><p>Завершите условия выше, чтобы получить билет участника.</p></div></section>`;
  return `<section class="v-contest-card v-contest-progress"><h2>Ваш прогресс</h2><ol>${steps.map(contestStepMarkup).join('')}</ol>${panel}</section>`;
}
function contestHero() {
  return `<section class="v-contest-hero" aria-labelledby="contest-hero-title"><div class="v-contest-hero-copy"><h2 id="contest-hero-title">5 000 ₽ за один<br>товарный визуал</h2></div><img class="v-contest-hero-art" src="${ASSET}/contest-trophy-products.webp" srcset="${ASSET}/contest-trophy-products-mobile.webp 900w, ${ASSET}/contest-trophy-products.webp 2172w" sizes="(max-width: 420px) calc((100vw - 32px) * 1.15), (max-width: 768px) calc((100vw - 32px) * 1.58), 828px" width="2172" height="724" alt="Лаймовый кубок и товары для предметной съёмки"></section>`;
}
function contestInfoCard(endAt) {
  const details = [['gift','5 призов по 1 000 ₽'], ['calendar',`Итоги — ${contestEndLabel(endAt)}`], ['dice','Победителей выберем случайно']];
  return `<section class="v-contest-card v-contest-info"><h2>О конкурсе</h2><ul>${details.map(([glyph, label]) => `<li><span>${icon(glyph)}</span><p>${label}</p></li>`).join('')}</ul><a class="v-contest-rules" href="/vitrio/contest-rules" target="_blank" rel="noopener">Правила конкурса ${icon('chevron','v-icon--tiny')}</a></section>`;
}
function contestTicketCard(user, complete, contest = {}) {
  const previous = (contest.previousEntries ?? []).filter((entry) => Number.isFinite(Date.parse(entry.endsAt))).map((entry) => `<div><p><b>${esc(entry.ticketNumber)}</b><small>Ранее принятое участие · ${esc(contestEndLabel(entry.endsAt))}</small></p></div>`).join('');
  return `<section class="v-contest-card v-contest-ticket"><h2>Ваш билет</h2><div><span class="v-contest-ticket-icon"><img src="${ASSET}/contest-ticket-icon.png" alt=""></span><p>${complete ? `<b>${esc(contest.ticketNumber)}</b><small>Участие подтверждено</small>` : '<small>Появится после выполнения условий</small>'}</p></div>${previous}</section>`;
}
async function contestPage() {
  app.innerHTML = shell('Конкурс', `<main class="v-workspace v-contest-workspace" aria-busy="true"><header class="v-workspace-head"><div><h1>Конкурс</h1><p>Выполните три шага — и участвуйте в розыгрыше 5 000 ₽.</p></div></header><div class="v-contest-loading" role="status">Загружаем ваш прогресс…</div></main>`);
  bindCommon();
  try {
    const [accountData, subscriptionData] = await Promise.all([request('/vitrio/account'), request('/vitrio/billing/subscription'), loadWorkspaceProjects()]);
    state.user = accountData.account.user;
    state.contestEndsAt = accountData.contest?.endsAt ?? contestMonthEndAt();
    const steps = contestSteps(accountData.account, subscriptionData.subscription, accountData.contest?.eligibility);
    const completed = Boolean(accountData.contest?.ticketNumber);
    app.innerHTML = shell('Конкурс', `<main class="v-workspace v-contest-workspace"><header class="v-workspace-head"><div><h1>Конкурс</h1><p>Выполните три шага — и участвуйте в розыгрыше 5 000 ₽.</p></div></header>${contestHero()}<div class="v-contest-grid">${contestProgress(steps)}<aside class="v-contest-aside">${contestInfoCard(state.contestEndsAt)}${contestTicketCard(accountData.account.user, completed, accountData.contest)}</aside></div></main>`);
    bindCommon();
  } catch (cause) { if (cause.status === 401) return go('/vitrio/login'); app.querySelector('.v-contest-loading').textContent = cause.message; app.querySelector('.v-contest-workspace')?.setAttribute('aria-busy', 'false'); }
}

async function subscriptionPage() {
  let subscription;
  try { [subscription] = await Promise.all([request('/vitrio/billing/subscription').then((data) => data.subscription), loadWorkspaceProjects()]); }
  catch (cause) { if (cause.status === 401) return go('/vitrio/login'); throw cause; }
  const active = subscription?.status === 'active' && subscription.periodActive === true;
  const accessUntil = subscription?.paidThroughAt ? workspaceDate(subscription.paidThroughAt) : '—';
  const renewal = subscription?.autoRenewal && subscription.renewsAt ? workspaceDate(subscription.renewsAt) : accessUntil;
  const activePeriodLabel = subscription?.periodDays === 1 ? 'день' : billingPeriodLabel('week', subscription?.planCode, subscription);
  app.innerHTML = shell('Моя подписка', `<main class="v-workspace v-account-workspace"><header class="v-workspace-head v-account-head"><div><h1>Моя подписка</h1><p>Управляйте продлением без потери доступа к уже оплаченному периоду.</p></div></header><section class="v-account-grid"><article class="v-account-card v-account-card--main"><div class="v-account-card-head"><span class="v-account-icon">${icon('repeat')}</span><div><p>ТЕКУЩИЙ ТАРИФ</p><h2>${active ? esc(subscription.displayPlanName || subscription.planName) : 'Подписка не активна'}</h2></div><span class="v-status v-status--${active && subscription.autoRenewal ? 'active' : 'muted'}">${active && subscription.autoRenewal ? (subscription.dailyFallbackPending?'Проверяем резервное списание':'Автопродление включено') : active ? 'Автопродление отключено' : 'Нет активной подписки'}</span></div>${active ? `<div class="v-account-stats"><div><span>Звёзды за период</span><b>${subscription.credits}</b></div><div><span>Стоимость</span><b>${Number(subscription.price).toLocaleString('ru-RU')} ₽ / ${activePeriodLabel}</b></div><div><span>${subscription.autoRenewal ? 'Следующее продление' : 'Доступ сохранится до'}</span><b>${renewal}</b></div></div><p class="v-account-note">После каждого оплаченного периода баланс обновляется до лимита выбранного тарифа. Неиспользованные звёзды не суммируются.</p>${subscription.autoRenewal ? `<details class="v-cancel-details"><summary>Отменить автопродление ${icon('chevron','v-icon--tiny')}</summary><form data-cancel-subscription><p>Доступ к студии и уже начисленным звёздам сохранится до ${accessUntil}. Повторных списаний после этой даты не будет.</p><label class="v-billing-check"><input name="confirmed" type="checkbox" required><span>Я понимаю, что отменяю автоматическое продление подписки.</span></label><label class="v-billing-check"><input name="understandsAccess" type="checkbox" required><span>Я понимаю, что доступ сохранится только до конца текущего оплаченного периода.</span></label><p class="v-form-error" hidden></p><button class="v-button v-button--soft" type="submit">Подтвердить отмену</button></form></details>` : '<p class="v-account-success">Автопродление отключено. Новый платёж не будет создан.</p>'}` : `<p class="v-account-note">Выберите тариф, чтобы открыть студию и получить звёзды на генерации.</p><a class="v-button v-button--accent" href="${landingUrl()}#pricing" data-go>Выбрать тариф</a>`}</article><aside class="v-account-card v-account-card--help"><span class="v-account-icon">${icon('message')}</span><h2>Нужна помощь?</h2><p>По вопросам оплаты, подписки и возврата создайте обращение. Вся переписка и статус останутся в одном месте.</p><a class="v-button v-button--soft" href="/vitrio/support" data-go>Открыть поддержку</a><a class="v-text-link" href="/vitrio/offer#refund">Порядок возврата в оферте</a></aside></section></main>`);
  bindCommon();
  if (!active) mountSubscriptionWidget();
  document.querySelector('[data-cancel-subscription]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const error = form.querySelector('.v-form-error'); const button = form.querySelector('button'); button.disabled = true; error.hidden = true;
    try { await request('/vitrio/billing/cancel-auto-renewal', { method:'POST', body:JSON.stringify({ confirmed:form.elements.confirmed.checked, understandsAccess:form.elements.understandsAccess.checked }) }); notice('Автопродление отключено. Доступ сохранён до конца периода.'); subscriptionPage(); }
    catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; }
  });
}

function mountSubscriptionWidget() {
  const card = document.querySelector('.v-account-card--main');
  const action = card?.querySelector('a.v-button--accent');
  if (!card || !action) return;
  card.classList.add('v-account-card--empty');
  document.querySelector('.v-account-grid')?.classList.add('v-account-grid--empty');
  action.outerHTML = `<button class="v-button v-button--accent" type="button" data-open-plan-widget>Выбрать тариф ${icon('arrow','v-icon--tiny')}</button>`;
  card.querySelector('.v-account-note')?.insertAdjacentHTML('afterend', `<div class="v-subscription-benefits"><span><b>24 часа</b><small>первый период за 1 ₽</small></span><span><b>80–300</b><small>звёзд за оплаченный период</small></span><span><b>В любой момент</b><small>отмена автопродления</small></span></div>`);
  document.querySelector('.v-app')?.insertAdjacentHTML('beforeend', `<dialog class="v-plan-dialog" data-plan-dialog aria-labelledby="plan-dialog-title"><form class="v-plan-dialog-card" data-plan-checkout><button class="v-plan-dialog-close" type="button" data-close-plan-dialog aria-label="Закрыть">${icon('close')}</button><p class="v-plan-dialog-kicker">ПОДПИСКА VITRIO</p><h2 id="plan-dialog-title">Выберите рабочий ритм</h2><p class="v-plan-dialog-copy">Первые 24 часа стоят 1 ₽. Затем списывается стоимость выбранного периода. При неуспешной оплате может применяться дневное списание и понижение тарифа по условиям подписки.</p><div class="v-plan-options" role="radiogroup" aria-label="Тариф Vitrio"><label class="v-plan-option"><input type="radio" name="planCode" value="start" checked><span><i>Vitrio Start</i><b>300 ₽ <small>/ 5 дней</small></b><em>60 ₽ в день при неуспешной оплате</em><strong>Для первых карточек и регулярных итераций</strong></span></label><label class="v-plan-option"><input type="radio" name="planCode" value="medium"><span><i>Vitrio Medium</i><b>600 ₽ <small>/ 6 дней</small></b><em>100 ₽ в день при неуспешной оплате</em><strong>Для регулярной работы и серий</strong></span></label><label class="v-plan-option"><input type="radio" name="planCode" value="pro"><span><i>Vitrio Pro</i><b>1 000 ₽ <small>/ 7 дней</small></b><em>150 ₽ в день при неуспешной оплате</em><strong>Для сложных сцен и большого потока товаров</strong></span></label></div><div class="v-plan-consents"><label class="v-billing-check"><input type="checkbox" name="offer" required><span>Принимаю <a href="/vitrio/offer" target="_blank">публичную оферту</a> и <a href="/vitrio/subscription-terms" target="_blank">условия подписки</a>.</span></label><label class="v-billing-check"><input type="checkbox" name="recurring" required><span data-plan-recurring-copy>${initialRecurringConsentCopy('start')}</span></label></div><p class="v-form-error" data-plan-error hidden></p><button class="v-button v-button--accent v-plan-checkout" type="submit">Перейти к оплате 1 ₽ ${icon('arrow','v-icon--tiny')}</button><p class="v-plan-dialog-legal">Способ оплаты выбирается в защищённой форме CloudPayments. Банковские реквизиты Vitrio не получает и не хранит.</p></form></dialog>`);
  const dialog = document.querySelector('[data-plan-dialog]');
  const planForm = dialog?.querySelector('[data-plan-checkout]');
  planForm?.setAttribute('novalidate','');
  if(planForm&&state.user?.receiptEmailRequired){const receipt=document.createElement('label');receipt.className='v-field v-receipt-email';receipt.innerHTML='<span>Email для кассового чека</span><input name="receiptEmail" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="name@example.com" required>';planForm.querySelector('.v-plan-options')?.before(receipt);}
  const planOfferCopy=planForm?.querySelector('[name="offer"]')?.nextElementSibling;
  if(planOfferCopy)planOfferCopy.innerHTML='Принимаю <a href="/vitrio/offer" target="_blank" rel="noopener">публичную оферту</a>, <a href="/vitrio/subscription-terms" target="_blank" rel="noopener">условия подписки</a> и <a href="/vitrio/contest-rules" target="_blank" rel="noopener">правила конкурса</a>.';
  document.querySelector('[data-open-plan-widget]')?.addEventListener('click', () => dialog.showModal());
  dialog?.querySelector('[data-close-plan-dialog]')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  planForm?.addEventListener('change',(event)=>{if(event.target.name==='planCode'){const copy=planForm.querySelector('[data-plan-recurring-copy]');if(copy)copy.textContent=initialRecurringConsentCopy(event.target.value);}});
  const startPlanCheckout=async()=>{if(!planForm)return;const error=planForm.querySelector('[data-plan-error]');const button=planForm.querySelector('[type="submit"]');if(button.disabled)return;button.disabled=true;error.hidden=true;try{if(planForm.elements.receiptEmail&&!planForm.elements.receiptEmail.validity.valid){planForm.elements.receiptEmail.reportValidity();planForm.elements.receiptEmail.focus();button.disabled=false;return;}const consent=planForm.elements.recurring.checked;const receiptEmail=String(planForm.elements.receiptEmail?.value||'').trim();await checkoutVitrioPayment({planCode:planForm.elements.planCode.value,...(receiptEmail?{receiptEmail}:{}),legalAccepted:{offer:planForm.elements.offer.checked,contest:planForm.elements.offer.checked,subscription:true,recurring:consent,dailyFallback:consent}},'',()=>{if(receiptEmail)state.user={...state.user,receiptEmailRequired:false};});}catch(cause){error.textContent=cause.message;error.hidden=false;button.disabled=false;}};
  planForm?.addEventListener('submit',(event)=>{event.preventDefault();const requiredConsents=[planForm.elements.offer,planForm.elements.recurring];if(requiredConsents.some((input)=>!input.checked)){dialog.close();return openBillingConsentDialog({isPack:false,onAccept:()=>{requiredConsents.forEach((input)=>{input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));});startPlanCheckout();}});}startPlanCheckout();});
}

let supportViewCleanup = null, supportPageRevision = 0;
function stopSupportView() { supportPageRevision += 1; supportViewCleanup?.(); supportViewCleanup = null; }
async function supportPage() {
  const revision = ++supportPageRevision;
  supportViewCleanup?.(); supportViewCleanup = null;
  try {
    await loadWorkspaceProjects();
    const initial = await request('/vitrio/support/tickets');
    const requestedId = new URLSearchParams(location.search).get('ticket');
    const ticketId = initial.tickets.some((ticket) => ticket.id === requestedId) ? requestedId : initial.tickets[0]?.id;
    if (ticketId) initial.selected = (await request(`/vitrio/support/tickets/${encodeURIComponent(ticketId)}`)).ticket;
    if (revision !== supportPageRevision) return;
    supportViewCleanup = mountSupportWorkspace({ app, shell, request, bindCommon, icon, esc, workspaceDate, supportTone, dismissDialog, userId: state.user.id, initial });
  } catch (cause) { if (revision !== supportPageRevision) return; if (cause.status === 401) return go('/vitrio/login'); throw cause; }
}

const VITRIO_CARD_COST=5;
function generationCostPerItem(){return VITRIO_CARD_COST;}
function selectedOutputCount(){return Math.max(1,Math.min(4,Number(document.querySelector('[name="outputCount"]:checked')?.value||state.project?.settings?.outputCount||1)||1));}
function studioCurrencyMark(alt='') { return `<img class="v-studio-currency-mark" src="/assets/vitrio/studio-subscription/plan-stars-96.webp" width="96" height="96" alt="${alt}">`; }
function outputCostMarkup(){return `<span class="v-generation-cost" aria-label="Стоимость генерации"><b data-generation-cost>${selectedOutputCount()*generationCostPerItem()}</b>${studioRefreshEnabled()?studioCurrencyMark('звёзд'):`<img src="${ASSET}/icons/account-stars.png" alt="звёзд">`}</span>`;}
function updateOutputCost(){const count=selectedOutputCount();const perItem=generationCostPerItem();const cost=count*perItem;document.querySelectorAll('[data-generation-cost]').forEach((node)=>node.textContent=String(cost));document.querySelectorAll('[data-output-cost]').forEach((node)=>node.textContent=String(Number(node.dataset.outputCount||1)*perItem));}
function renderOutputControls(){const form=document.querySelector('#studio-form');if(!form||form.querySelector('[data-output-controls]'))return;const count=selectedOutputCount();const perItem=generationCostPerItem();const section=document.createElement('section');section.className='v-settings-group v-output-controls';section.dataset.outputControls='';section.innerHTML=`<div class="v-output-head">${studioRefreshEnabled()?groupTitle('copies','Варианты'):'<h3>Вариантов на выходе</h3>'}</div><div class="v-output-options" role="radiogroup" aria-label="Количество вариантов">${[1,2,3,4].map((value)=>`<label><input type="radio" name="outputCount" value="${value}" ${value===count?'checked':''}><span><b>${value}</b><small><i data-output-cost data-output-count="${value}">${value*perItem}</i> ${studioRefreshEnabled()?studioCurrencyMark('звёзд'):`<img src="${ASSET}/icons/account-stars.png" alt="звёзд">`}</small></span></label>`).join('')}</div></section>`;form.querySelector('.v-settings-scroll')?.append(section);document.querySelectorAll('.v-generate,.v-studio-generate-button').forEach((button)=>{if(!button.querySelector('.v-generation-cost'))button.insertAdjacentHTML('beforeend',outputCostMarkup());});section.querySelectorAll('[name="outputCount"]').forEach((input)=>input.addEventListener('change',()=>{updateOutputCost();scheduleSave();}));updateOutputCost();}
function projectType(project=state.project){const type=project?.projectType;return ['merch','website','thumbnail','logo'].includes(type)?type:'product';}
function projectTypeName(value){return ({product:'Карточки товаров',merch:'Мерч',website:'Дизайн сайта',thumbnail:'Превью для видео',logo:'Логотип (архив)'})[value]||'Карточки товаров';}
function projectCategory(){return document.querySelector('#category')?.value||state.project?.category||'other';}
function getSettings(){const lines=(document.querySelector('#card-lines')?.value||'').split(/\r?\n/).map((line)=>line.trim()).filter(Boolean).slice(0,document.querySelector('[name="card-template"]:checked')?.value&&document.querySelector('[name="card-template"]:checked')?.value!=='none'?4:3);const type=projectType();const selectedContent=type==='product'?document.querySelector('[name="content"]:checked')?.value||'card':'photo';const paletteMode=document.querySelector('[name="paletteMode"]:checked')?.value||'auto';return {content:selectedContent,cardTemplateId:type==='product'?(document.querySelector('[name="card-template"]:checked')?.value||state.project?.settings?.cardTemplateId||'none'):'none',style:document.querySelector('[name="style"]:checked')?.value||state.project?.settings?.style||'clean',background:document.querySelector('[name="background"]:checked')?.value||'creative',backgroundMode:document.querySelector('[name="backgroundMode"]:checked')?.value||state.project?.settings?.backgroundMode||'proven',paletteMode,paletteColor:document.querySelector('#studio-card-color')?.value||state.project?.settings?.paletteColor||'#cfff22',marketplace:document.querySelector('#marketplace')?.value||'universal',aspectRatio:type==='merch'&&document.querySelector('#merch-front-back')?.checked?'16:9':document.querySelector('[name="ratio"]:checked')?.value||(type==='logo'?'1:1':'16:9'),light:document.querySelector('#light')?.value||state.project?.settings?.light||'мягкий дневной свет',accent:studioAccentValue(),customPalette:readStudioPalette(),brief:document.querySelector('#brief')?.value||'',outputCount:selectedOutputCount(),cardCopyAuto:selectedContent==='card'&&document.querySelector('#card-copy-auto')?.checked!==false,cardCopy:{headline:(document.querySelector('#card-headline')?.value||'').trim(),lines},merch:{frontAndBack:document.querySelector('#merch-front-back')?.checked===true,item:(document.querySelector('#merch-item')?.value||'').trim(),idea:(document.querySelector('#merch-idea')?.value||'').trim(),style:document.querySelector('[name="merch-style"]:checked')?.value||state.project?.settings?.merch?.style||'minimal',placement:document.querySelector('[name="merch-placement"]:checked')?.value||'center',base:document.querySelector('[name="merch-base"]:checked')?.value||state.project?.settings?.merch?.base||'adaptive'},website:{brand:(document.querySelector('#website-brand')?.value||'').trim(),business:(document.querySelector('#website-business')?.value||'').trim(),offer:(document.querySelector('#website-offer')?.value||'').trim(),audience:(document.querySelector('#website-audience')?.value||'').trim(),goal:document.querySelector('[name="website-goal"]:checked')?.value||'landing',style:document.querySelector('[name="website-style"]:checked')?.value||'editorial',tone:document.querySelector('[name="website-tone"]:checked')?.value||'premium',focus:document.querySelector('[name="website-focus"]:checked')?.value||'conversion'},thumbnail:{templateId:document.querySelector('[name="thumbnail-template"]:checked')?.value||state.project?.settings?.thumbnail?.templateId||'boldHeadline',topic:(document.querySelector('#thumbnail-topic')?.value||'').trim(),description:(document.querySelector('#thumbnail-description')?.value||'').trim(),headline:(document.querySelector('#thumbnail-headline')?.value||'').trim(),character:document.querySelector('[name="thumbnail-character"]:checked')?.value||'none'},logo:{brand:(document.querySelector('#logo-brand')?.value||'').trim(),industry:(document.querySelector('#logo-industry')?.value||'').trim(),idea:(document.querySelector('#logo-idea')?.value||'').trim(),type:document.querySelector('[name="logo-type"]:checked')?.value||'combination',style:document.querySelector('[name="logo-style"]:checked')?.value||'minimal',application:document.querySelector('[name="logo-application"]:checked')?.value||'universal',base:document.querySelector('[name="logo-base"]:checked')?.value||'adaptive'},canvasVersion:3,canvasLayoutRevision:state.canvasLayoutRevision||0,canvasItems:(state.canvasItems||[]).map(({id,src,label,ratio,x,y,width,height,cropX,cropY})=>({id,src,label,ratio,x,y,width,...(Number.isFinite(height)?{height}:{}),cropX,cropY,fit:'cover'}))};}
const renderVitrioResultsBase=renderVitrioResults;
function renderMobileSettingsButton(){if(document.querySelector('.v-mobile-settings'))return;const control=document.createElement('div');control.className='v-mobile-settings';control.innerHTML=`<button class="v-button v-button--accent" type="button">${icon('settings','v-icon--tiny')} ${({merch:'Настройки мерча',website:'Настройки сайта',thumbnail:'Настройки превью',logo:'Настройки логотипа'})[projectType()]||'Настройки генерации'}</button>`;control.querySelector('button').addEventListener('click',openSettings);document.querySelector('.v-app--studio')?.append(control);}
renderVitrioResults=function(){renderVitrioResultsBase();renderOutputControls();renderMobileSettingsButton();};
function openCreate(initialType='product'){const el=document.createElement('div');el.className='v-dialog-backdrop';el.innerHTML=`<form class="v-dialog v-dialog--project" aria-modal="true" role="dialog" aria-labelledby="new-project-title"><header class="v-project-dialog-head"><div><h2 id="new-project-title">Новый проект</h2><p>Выберите, что хотите создать в Vitrio.</p></div><button class="v-icon-button" type="button" data-close aria-label="Закрыть окно">${icon('close')}</button></header><fieldset class="v-project-type-fieldset"><legend>Направление</legend><div class="v-project-type-grid"><label class="v-project-type-card"><input type="radio" name="project-type" value="product" checked><span class="v-project-type-icon">${icon('grid')}</span><span class="v-project-type-copy"><b>Карточки товаров</b><small>Сцены, инфографика и визуалы для каталога.</small></span></label><label class="v-project-type-card"><input type="radio" name="project-type" value="merch"><span class="v-project-type-icon">${icon('sparkle')}</span><span class="v-project-type-copy"><b>Мерч</b><small>Мокапы и идеи дизайна для физических товаров.</small></span></label><label class="v-project-type-card"><input type="radio" name="project-type" value="website"><span class="v-project-type-icon">${icon('folder')}</span><span class="v-project-type-copy"><b>Дизайн сайта</b><small>Первый экран и цельный визуальный язык сайта.</small></span></label><label class="v-project-type-card"><input type="radio" name="project-type" value="thumbnail"><span class="v-project-type-icon">${icon('image')}</span><span class="v-project-type-copy"><b>Превью для видео</b><small>Выразительная обложка для YouTube и других видеоплатформ.</small></span></label></div></fieldset><label class="v-field"><span data-new-title-label>Название товара</span><input id="new-title" maxlength="160" placeholder="Например, Зелёный флакон" required autofocus></label><p class="v-form-error" hidden></p><footer class="v-dialog-actions"><button class="v-button v-button--soft" type="button" data-close>Отмена</button><button class="v-button v-button--accent" type="submit">Продолжить</button></footer></form>`;document.body.append(el);const close=()=>dismissDialog(el);el.querySelectorAll('[data-close]').forEach((button)=>button.addEventListener('click',close));el.addEventListener('click',e=>{if(e.target===el)close();});const titleInput=el.querySelector('#new-title');const titleLabel=el.querySelector('[data-new-title-label]');const syncType=()=>{const type=el.querySelector('[name="project-type"]:checked')?.value||'product';const labels={product:['Название товара','Например, Зелёный флакон'],merch:['Название проекта','Например, Мерч для кофейни'],website:['Название проекта','Например, Сайт для студии'],thumbnail:['Название проекта','Например, Превью для нового видео']}[type];titleLabel.textContent=labels[0];titleInput.placeholder=labels[1];};el.querySelectorAll('[name="project-type"]').forEach((input)=>input.addEventListener('change',syncType));el.querySelector('form').addEventListener('submit',async(e)=>{e.preventDefault();try{const type=el.querySelector('[name="project-type"]:checked')?.value||'product';const submit=el.querySelector('[type=\"submit\"]');if(submit.disabled)return;submit.disabled=true;const data=await request('/vitrio/projects',{method:'POST',body:JSON.stringify({title:titleInput.value,category:'other',projectType:type})});close();go(`/vitrio/studio?id=${data.project.id}`);}catch(c){el.querySelector('[type=\"submit\"]').disabled=false;const error=el.querySelector('.v-form-error');error.textContent=c.message;error.hidden=false;}});if(studioRefreshEnabled()){el.querySelectorAll('.v-project-type-card').forEach(card=>{const input=card.querySelector('input');card.querySelector('.v-project-type-icon').innerHTML=studioTypeArt(input.value);input.checked=input.value===initialType;});if(!el.querySelector('[name=\"project-type\"]:checked'))el.querySelector('[value=\"product\"]').checked=true;syncType();const restore=document.activeElement;const onKey=e=>{if(e.key==='Escape'){e.preventDefault();close();restore?.focus();}if(e.key==='Tab'){const controls=[...el.querySelectorAll('button,input')].filter(n=>!n.disabled&&n.getClientRects().length);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};el.addEventListener('keydown',onKey);}titleInput.focus();}
const VITRIO_SOURCE_MAX_BYTES=6*1024*1024;
const VITRIO_SOURCE_INPUT_MAX_BYTES=32*1024*1024;
const VITRIO_SOURCE_MAX_DIMENSION=6000;
const VITRIO_SOURCE_MAX_PIXELS=24_000_000;
const readDataUrl=(file)=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Не удалось прочитать изображение.'));reader.readAsDataURL(file);});
const canvasBlob=(canvas,type,quality)=>new Promise((resolve)=>canvas.toBlob(resolve,type,quality));
async function readFile(file){
  const dataUrl=await readDataUrl(file);
  const source=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Не удалось прочитать изображение.'));image.src=dataUrl;});
  const width=Number(source.naturalWidth||source.width||0),height=Number(source.naturalHeight||source.height||0);
  if(!width||!height)throw new Error('Не удалось определить размер изображения.');
  const scale=Math.min(1,VITRIO_SOURCE_MAX_DIMENSION/Math.max(width,height),Math.sqrt(VITRIO_SOURCE_MAX_PIXELS/(width*height)));
  const targetWidth=Math.max(1,Math.round(width*scale)),targetHeight=Math.max(1,Math.round(height*scale));
  const canvas=document.createElement('canvas');canvas.width=targetWidth;canvas.height=targetHeight;
  const context=canvas.getContext('2d');if(!context)throw new Error('Не удалось подготовить изображение.');
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,0,0,targetWidth,targetHeight);
  let blob=await canvasBlob(canvas,file.type==='image/png'?'image/png':file.type==='image/webp'?'image/webp':'image/jpeg',.92);
  if(!blob||blob.size>VITRIO_SOURCE_MAX_BYTES)blob=await canvasBlob(canvas,'image/webp',.9);
  if(!blob||blob.size>VITRIO_SOURCE_MAX_BYTES)throw new Error('Не удалось уменьшить изображение до допустимого размера. Выберите файл до 6 МБ.');
  return readDataUrl(blob);
}
function sourceLimit(type=projectType()){return type==='merch'?7:4;}
function sourceMarkup(sources, activeSource=0, type=projectType()){const isReference=type!=='product';const noun=isReference?'референс':'исходник';const nounTitle=isReference?'Референс':'Исходник';const limit=sourceLimit(type);const slots=Array.from({length:limit},(_,i)=>{const src=sources[i];return src?`<div class="v-source-item"><button class="v-source-thumb ${i===activeSource?'active':''}" type="button" data-source="${i}" aria-label="${nounTitle} ${i+1}"><img src="${esc(src)}" alt="${nounTitle} ${i+1}"></button><button class="v-source-remove" type="button" data-remove-source="${i}" aria-label="Удалить ${noun} ${i+1}" title="Удалить ${noun}">${icon('close','v-icon--tiny')}</button></div>`:`<button class="v-source-thumb v-source-slot" type="button" data-source-picker aria-label="Добавить ${noun} ${i+1}"><img class="v-source-gallery" src="/assets/vitrio/studio-refresh/navigation/projects-96.webp" width="38" height="38" alt=""><small>Добавить</small></button>`;}).join('');return slots+(sources.length<limit?`<input id="vitrio-source-files" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-files>`:'');}
function resultMarkup(results,activeResult){const canvasSources=new Set((state.canvasItems||[]).map((item)=>item?.src).filter(Boolean));return results.length?results.map((item,index)=>({item,index})).reverse().map(({item,index})=>{const onCanvas=canvasSources.has(item?.image);const action=onCanvas?'Показать на холсте':'Добавить на холст';return `<article class="v-result-item ${index===activeResult?'active':''}"><button class="v-result-thumb" type="button" data-result="${index}" aria-label="Открыть версию ${index+1}"><img src="${esc(item.image)}" alt="Версия ${index+1}"><small>Версия ${index+1}</small></button><button class="v-result-add ${onCanvas?'is-on-canvas':''}" type="button" data-add-result="${index}" aria-label="${action}: версия ${index+1}" title="${action}">${icon(onCanvas?'check':'plus','v-icon--tiny')}</button></article>`;}).join(''):'<p class="v-result-empty">После генерации здесь появятся версии.</p>';}
const VITRIO_VIDEO_DURATION = 6;
const VITRIO_VIDEO_RESOLUTION = '768p';
const VITRIO_VIDEO_COST = 50;
const removedStudioVideos = new Set();
const deletingStudioVideos = new Set();
function studioVideoKey(projectId,videoId){return `${projectId}:${videoId}`;}
function projectVideos(project=state.project){return Array.isArray(project?.videos)?project.videos.filter(video=>video?.id&&!video.erasedAt&&!removedStudioVideos.has(studioVideoKey(project.id,video.id))):[];}
function preserveProjectVideos(nextProject,previousProject=state.project){
  if(!nextProject||!previousProject||String(nextProject.id)!==String(previousProject.id))return nextProject;
  const previousVideos=projectVideos(previousProject),nextVideos=projectVideos(nextProject);
  // Server lists own persisted records. Only local unacknowledged requests
  // need merging; retaining absent server records revives deletions.
  const preserved=Array.isArray(nextProject.videos)?previousVideos.filter(video=>String(video.id).startsWith('local:')&&!nextVideos.some(next=>String(next.resultId)===String(video.resultId)&&!['failed','cancelled','canceled'].includes(videoState(next)))):previousVideos;
  const merged=new Map(preserved.map(video=>[String(video.id),video]));for(const video of nextVideos)merged.set(String(video.id),video);
  return {...nextProject,videos:[...merged.values()]};
}
function syncStudioVideoUser(payload){if(!payload?.user)return;state.user=payload.user;document.querySelectorAll('.v-credit b,[data-credit-count],[data-credit-balance]').forEach(el=>el.replaceChildren(document.createTextNode(String(state.user?.credits??''))));}
function videoSourceResult(video){return projectResults().find(result=>String(result?.id||'')===String(video?.resultId||''))||null;}
function videoState(video){return String(video?.status||'queued').toLowerCase();}
function videoIsComplete(video){return ['completed','succeeded','ready'].includes(videoState(video));}
function videoIsProcessing(video){return ['queued','processing','provider_processing','pending','in_progress'].includes(videoState(video));}
function videoPercent(video){const raw=Number(video?.progress??video?.percent??0);return Math.max(0,Math.min(100,Math.round(raw<=1?raw*100:raw)));}
function videoMediaUrl(video,download=false){if(!state.project?.id||!video?.id)return '';return `/api/vitrio/projects/${encodeURIComponent(state.project.id)}/videos/${encodeURIComponent(video.id)}/media${download?'?download=mp4':''}`;}
async function deleteStudioVideo(videoId,button){
  const projectId=state.project?.id;
  const video=projectVideos().find(item=>String(item.id)===String(videoId));
  const key=studioVideoKey(projectId,videoId);
  if(!projectId||!video||deletingStudioVideos.has(key)||String(videoId).startsWith('local:')||!videoIsComplete(video)&&!['failed','cancelled','canceled'].includes(videoState(video)))return;
  deletingStudioVideos.add(key);button.disabled=true;button.setAttribute('aria-busy','true');
  try{
    await request(`/vitrio/projects/${encodeURIComponent(projectId)}/videos/${encodeURIComponent(videoId)}`,{method:'DELETE'});
    removedStudioVideos.add(key);
    if(String(state.project?.id)!==String(projectId))return;
    state.project.videos=projectVideos();renderVitrioCatalog();
    document.querySelector('[data-studio-catalog] [data-catalog-result], [data-studio-catalog] [data-video-delete]:not([disabled]), [data-studio-view="catalog"]')?.focus();
    notice('Видео удалено.');
  }catch(cause){notice(cause.message);}
  finally{deletingStudioVideos.delete(key);button.disabled=false;button.removeAttribute('aria-busy');}
}
function videoWaveMarkup(){return '<svg class="v-video-wave" viewBox="0 0 300 300" width="300" height="300" aria-hidden="true"><path d="M300,300V2.5c0,0-0.6-0.1-1.1-0.1c0,0-25.5-2.3-40.5-2.4c-15,0-40.6,2.4-40.6,2.4c-12.3,1.1-30.3,1.8-31.9,1.9c-2-0.1-19.7-0.8-32-1.9c0,0-25.8-2.3-40.8-2.4c-15,0-40.8,2.4-40.8,2.4c-12.3,1.1-30.4,1.8-32,1.9c-2-0.1-20-0.8-32.2-1.9c0,0-3.1-0.3-8.1-0.7V300H300z"></path></svg>';}
function catalogVideoMarkup(video,index){
  const source=videoSourceResult(video);
  const status=videoState(video);
  const complete=videoIsComplete(video);
  const failed=['failed','cancelled','canceled'].includes(status);
  const uncertain=status==='uncertain';
  const pending=!complete&&!failed;
  const activePending=pending&&!uncertain;
  const percent=videoPercent(video);
  const created=video.createdAt?workspaceDate(video.createdAt,true):'Только что';
  const sourceImage=source?.image||video.sourceImage||'';
  let media;
  if(complete&&videoMediaUrl(video)){
    // Do not make every completed video issue a metadata request while the
    // catalog is being assembled. The browser fetches the MP4 when the user
    // presses play, while the poster still gives an immediate preview.
    media=`<video class="v-studio-video-player" controls playsinline preload="none" poster="${esc(sourceImage)}" src="${esc(videoMediaUrl(video))}" aria-label="Оживлённая карточка товара"></video>`;
  }else{
    const label=failed?'Не удалось':uncertain?'Статус уточняется':`${percent}%`;
    const fill=activePending?`<div class="v-video-fill" aria-hidden="true">${videoWaveMarkup()}</div>`:'';
    media=`<div class="v-studio-video-pending" ${failed?'data-video-error="true"':''} aria-busy="${activePending}"><img src="${esc(sourceImage)}" alt="Исходная карточка для анимации" loading="lazy">${activePending?'<div class="v-video-water" aria-hidden="true"></div>':''}${fill}<strong>${label}</strong></div>`;
  }
  const copy=complete?'Видео готово':failed?(video.error||'Не удалось оживить карточку'):status==='uncertain'?'Статус уточняется':status==='queued'?'Видео в очереди':'Оживляем карточку';
  const action=complete?`<button type="button" data-video-download="${esc(video.id)}">${icon('download','v-icon--tiny')}<span>Скачать</span></button>`:failed&&projectType()==='product'?`<button type="button" class="is-retry" data-video-retry="${esc(video.resultId||'')}">Повторить</button>`:'';
  const removable=(complete||failed)&&!String(video.id).startsWith('local:');
  const remove=`<button type="button" class="v-studio-video-remove" data-video-delete="${esc(video.id)}" aria-label="Удалить видео" title="${removable?'Удалить видео':'Дождитесь завершения видео и проверки списания'}" ${removable?'':'disabled'}>${artboardIcon('trash')}</button>`;
  return `<article class="v-studio-catalog-card v-studio-video-card ${activePending?'is-pending':''}${failed?' is-failed':''}" data-video-id="${esc(video.id)}" data-catalog-ratio="${esc(source?.aspectRatio||video.aspectRatio||'4:5')}"><div class="v-studio-catalog-preview v-studio-video-preview">${media}${remove}</div><div class="v-studio-catalog-info"><div><b>Оживлённая карточка</b><small>${esc(copy)} · ${esc(created)}</small></div><div class="v-studio-catalog-actions">${action}</div></div></article>`;
}
function studioLegacyResultId(result){const seed=[result?.image,result?.createdAt,result?.model,result?.aspectRatio].map(value=>String(value??'')).join('\u0000');let hash=2166136261;for(let index=0;index<seed.length;index+=1)hash=Math.imul(hash^seed.charCodeAt(index),16777619);return `legacy-${(hash>>>0).toString(36)}`;}
function normalizeStudioResults(results){return (Array.isArray(results)?results:[]).map(result=>({...result,id:String(result?.id??'').trim()||studioLegacyResultId(result)}));}
function catalogGenerationMarkup(){const preview=state.generationPreview;if(!preview)return '';const ready=Math.max(0,Number(preview.completed)||0,projectResults().length-preview.before);const finished=Math.min(preview.total,ready+(Number(preview.failed)||0));const remaining=Math.max(0,preview.total-finished);return Array.from({length:remaining},(_,index)=>{const variantIndex=finished+index+1;const title=vitrioGenerationAttemptLabel(preview.attempts,variantIndex,'title')||(preview.stage==='analyzing'?'Анализируем товар':'Создаём визуал');return `<article class="v-studio-catalog-card v-studio-generation-card" data-generation-card-variant="${variantIndex}" data-catalog-ratio="${esc(preview.ratio)}" ${index===0?'role="status" aria-live="polite"':''} aria-label="Создаётся визуал ${variantIndex} из ${preview.total}"><div class="v-studio-catalog-preview v-studio-video-preview"><div class="v-studio-video-pending v-studio-generation-pending" aria-hidden="true"><div class="v-video-fill">${videoWaveMarkup()}</div><strong data-generation-card-title>${title}</strong></div></div><div class="v-studio-catalog-info"><div><b>Новая версия</b><small><span data-generation-card-stage>${esc(vitrioGenerationAttemptLabel(preview.attempts,variantIndex,'compact')||title)}</span> · <span data-generation-card-progress>Подготовка</span></small></div></div></article>`;}).join('');}
function catalogResultMarkup(results=projectResults()){results=normalizeStudioResults(results);const allowedRatios=new Set(['1:1','3:4','4:5','9:16','16:9']);const videos=projectVideos();if(!results.length&&!videos.length&&!state.generationPreview)return '<div class="v-studio-catalog-empty">После первой генерации здесь появятся все версии — новые всегда будут сверху.</div>';const imageCards=results.map((item,index)=>{const ratio=allowedRatios.has(item?.aspectRatio)?item.aspectRatio:'4:5';const created=item.createdAt?workspaceDate(item.createdAt,true):'Дата не сохранена';return `<article class="v-studio-catalog-card" data-catalog-ratio="${ratio}"><button class="v-studio-catalog-preview" type="button" data-catalog-result="${index}" aria-label="Открыть версию ${index+1} на весь экран"><img src="${esc(item.image)}" alt="Версия ${index+1}" loading="lazy" decoding="async"></button><div class="v-studio-catalog-info"><div><b>Версия ${index+1}</b><small>${esc(created)}${item.aspectRatio?` · ${esc(item.aspectRatio)}`:''}</small></div><div class="v-studio-catalog-actions v-catalog-image-actions">${projectType()==='product'?`<button type="button" class="v-catalog-animate" data-catalog-animate="${esc(item.id)}">Оживить</button>`:''}<button type="button" data-catalog-download="${index}">${icon('download','v-icon--tiny')}<span>Скачать</span></button></div></div></article>`;});const pending=typeof catalogGenerationMarkup==='function'?catalogGenerationMarkup():'';
  const entries=[...results.map((item,index)=>({createdAt:item.createdAt,index,image:true,markup:imageCards[index]})),...videos.map((video,index)=>({createdAt:video.createdAt,index,image:false,markup:catalogVideoMarkup(video,index)}))];
  const timestamp=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
  entries.sort((a,b)=>timestamp(b.createdAt)-timestamp(a.createdAt)||Number(b.image)-Number(a.image)||b.index-a.index);
  const latestImage=results.length?entries.find(entry=>entry.image&&entry.index===results.length-1):null;
  return pending+(latestImage?latestImage.markup:'')+entries.filter(entry=>entry!==latestImage).map(entry=>entry.markup).join('');}
function closeCatalogImageViewer(dialog,trigger){dismissDialog(dialog);trigger?.focus?.();}
function openCatalogImageViewer(index,trigger){const result=projectResults()[index];if(!result?.image)return false;const dialog=document.createElement('div');dialog.className='v-dialog-backdrop v-catalog-image-backdrop';dialog.innerHTML=`<section class="v-dialog v-catalog-image-dialog" role="dialog" aria-modal="true" aria-labelledby="catalog-image-title"><header class="v-dialog-titlebar"><h2 id="catalog-image-title">Версия ${index+1}</h2><button class="v-icon-button" type="button" data-close aria-label="Закрыть изображение">${icon('close')}</button></header><div class="v-catalog-image-stage"><img src="${esc(result.image)}" alt="Версия ${index+1}"></div></section>`;document.body.append(dialog);const app=document.querySelector('.v-app--studio');app?.setAttribute('inert','');const close=()=>{app?.removeAttribute('inert');closeCatalogImageViewer(dialog,trigger);};dialog.querySelector('[data-close]').addEventListener('click',close);dialog.addEventListener('click',(event)=>{if(event.target===dialog)close();});dialog.addEventListener('keydown',(event)=>{if(event.key==='Escape'){event.preventDefault();close();}});dialog.querySelector('[data-close]')?.focus();return true;}
function setStudioView(view,{focus=false}={}){state.studioView=view==='catalog'?'catalog':'canvas';const canvas=document.querySelector('[data-canvas]');const catalog=document.querySelector('[data-studio-catalog]');if(!canvas||!catalog)return;canvas.hidden=state.studioView!=='canvas';catalog.hidden=state.studioView!=='catalog';document.querySelectorAll('[data-studio-view]').forEach((button)=>{const active=button.dataset.studioView===state.studioView;button.setAttribute('aria-pressed',String(active));if(focus&&active)button.focus();});try{localStorage.setItem('vitrio-studio-view',state.studioView);}catch{}if(state.studioView==='catalog')renderVitrioCatalog();else requestAnimationFrame(fitStudioRefreshCanvas);}
function bindStudioCatalogCard(card){
  if(!card)return;
  card.querySelectorAll('[data-catalog-result]').forEach((button)=>button.addEventListener('click',()=>openCatalogImageViewer(Number(button.dataset.catalogResult),button)));
  card.querySelectorAll('[data-catalog-download]').forEach((button)=>button.addEventListener('click',()=>downloadResult(Number(button.dataset.catalogDownload))));
  card.querySelectorAll('[data-catalog-animate]').forEach((button)=>button.addEventListener('click',()=>{const result=projectResults().find(item=>String(item.id)===String(button.dataset.catalogAnimate));openStudioAnimateDialog(result,button);}));
  card.querySelectorAll('[data-video-download]').forEach((button)=>button.addEventListener('click',()=>downloadStudioVideo(button.dataset.videoDownload,button)));
  card.querySelectorAll('[data-video-delete]').forEach((button)=>button.addEventListener('click',()=>deleteStudioVideo(button.dataset.videoDelete,button)));
  card.querySelectorAll('[data-video-retry]').forEach((button)=>button.addEventListener('click',()=>{const result=projectResults().find(item=>String(item.id)===String(button.dataset.videoRetry));openStudioAnimateDialog(result,button);}));
}
function updateStudioVideo(video,projectId=state.project?.id){
  if(!video?.id||!state.project?.id||String(state.project.id)!==String(projectId)||removedStudioVideos.has(studioVideoKey(projectId,video.id)))return;
  const videos=projectVideos().filter(item=>String(item.id)!==String(video.id));
  state.project.videos=[...videos,video];
  syncStudioVideoUser(video);
  const current=document.querySelector(`[data-video-id="${CSS.escape(String(video.id))}"]`);
  if(!current){if(state.studioView==='catalog')renderVitrioCatalog();return;}
  const template=document.createElement('template');
  template.innerHTML=catalogVideoMarkup(video,0);
  const next=template.content.firstElementChild;
  if(next){current.replaceWith(next);bindStudioCatalogCard(next);}
}
function openStudioAnimateDialog(result,trigger){
  if(projectType()!=='product'||!result?.id||state.videoBusy.has(String(result.id)))return;
  const existing=projectVideos().find(video=>String(video.resultId)===String(result.id)&&!['failed','cancelled','canceled'].includes(videoState(video)));
  if(existing){notice('Для этой версии анимация уже создаётся или готова.');return;}
  state.videoTarget={result,trigger};
  const el=document.createElement('div');
  el.className='v-dialog-backdrop v-video-confirm-backdrop';
  el.innerHTML=`<section class="v-dialog v-video-confirm" role="dialog" aria-modal="true" aria-labelledby="v-video-confirm-title"><header class="v-dialog-titlebar"><h2 id="v-video-confirm-title">Оживить карточку?</h2><button class="v-icon-button" type="button" data-close aria-label="Закрыть">${icon('close')}</button></header><p>Создадим видео из версии товара длительностью ${VITRIO_VIDEO_DURATION} секунд в разрешении ${VITRIO_VIDEO_RESOLUTION}.</p><dl><div><dt>Стоимость</dt><dd>${VITRIO_VIDEO_COST} звёзд</dd></div><div><dt>Формат</dt><dd>${VITRIO_VIDEO_DURATION} сек · ${VITRIO_VIDEO_RESOLUTION}</dd></div></dl><div class="v-dialog-actions"><button class="v-button v-button--soft" type="button" data-close>Отмена</button><button class="v-button v-button--accent" type="button" data-confirm>Оживить за ${VITRIO_VIDEO_COST} звёзд</button></div></section>`;
  document.body.append(el);
  const app=document.querySelector('.v-app--studio');
  app?.setAttribute('inert','');
  let closingPromise=null;
  const close=(restore=true)=>{
    if(closingPromise)return closingPromise;
    state.videoTarget=null;
    el.classList.remove('is-open');el.classList.add('is-closing');
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
    closingPromise=new Promise(resolve=>{const remove=()=>{el.remove();app?.removeAttribute('inert');if(restore)trigger?.focus?.();resolve();};if(reduced)remove();else setTimeout(remove,220);});
    return closingPromise;
  };
  el.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{void close();}));
  el.addEventListener('click',event=>{if(event.target===el)void close();});
  el.querySelector('[data-confirm]').addEventListener('click',()=>{void close(false).then(()=>startStudioVideo(result,trigger));});
  el.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key==='Tab'){
      const controls=[...el.querySelectorAll('button:not([disabled])')];
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  (globalThis.requestAnimationFrame||((callback)=>setTimeout(callback,0)))(()=>el.classList.add('is-open'));
  el.querySelector('[data-confirm]').focus();
}
function studioVideoTransientError(cause){const status=Number(cause?.status||0);return cause?.code==='VIDEO_PENDING'||cause?.code==='NETWORK_ERROR'||!status||status===408||status===409||status===425||status===429||status>=500;}
function studioVideoRequest(projectId,resultId,key){return request(`/vitrio/projects/${encodeURIComponent(projectId)}/videos`,{method:'POST',body:JSON.stringify({resultId,idempotencyKey:key,duration:VITRIO_VIDEO_DURATION,resolution:VITRIO_VIDEO_RESOLUTION})});}
async function reconcileStudioVideo(projectId,result,key,localId,delay=1800){
  // A POST that returned 409 may have raced with the first request. Reconcile
  // once through the read-only project list; never submit the paid POST again.
  await new Promise(resolve=>setTimeout(resolve,delay));
  if(String(state.project?.id)!==String(projectId)||!projectVideos().some(video=>String(video.id)===String(localId)))return;
  try{
    const payload=await request(`/vitrio/projects/${encodeURIComponent(projectId)}/videos`);
    const videos=Array.isArray(payload?.videos)?payload.videos:[];
    const video=videos.find(item=>String(item?.idempotencyKey||'')===String(key)||String(item?.resultId||'')===String(result.id));
    if(String(state.project?.id)!==String(projectId))return;
    state.project.videos=projectVideos().filter(item=>String(item.id)!==String(localId));
    if(video?.id){syncStudioVideoUser(payload);updateStudioVideo({...video,resultId:video.resultId||result.id,sourceImage:video.sourceImage||result.image},projectId);void watchStudioVideo(video.id);}
    else{renderVitrioCatalog();notice('Запрос не принят: дождитесь завершения предыдущих видео и попробуйте ещё раз.');}
  }catch(cause){
    const local=projectVideos().find(video=>String(video.id)===String(localId));
    if(!local)return;
    updateStudioVideo({...local,status:'uncertain',error:'Не удалось подтвердить запрос. Повторный запуск не выполняем.'});
    if(cause.status!==401&&cause.status!==403)notice('Не удалось подтвердить статус видео. Обновите каталог позже.');
  }
}
async function downloadStudioVideo(videoId,button){
  if(!videoId||button?.disabled||!state.project?.id)return;
  const label=button?.textContent||'';
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Скачиваем MP4…';}
  try{
    const directUrl=videoMediaUrl({id:videoId},true);
    // Cookie-authenticated sessions can stream directly from the server. This
    // avoids buffering a potentially 80 MB MP4 in the tab before download.
    if(!token()){
      const link=document.createElement('a');
      link.href=directUrl;
      link.download=`vitrio-animation-${String(videoId).slice(0,12)}.mp4`;
      link.rel='noopener';
      document.body.append(link);link.click();link.remove();
      notice('Скачивание видео началось.');
    }else{
      // Legacy localStorage-token sessions still need an Authorization header.
      const response=await fetch(directUrl,{credentials:'same-origin',cache:'no-store',headers:{Authorization:`Bearer ${token()}`} });
      if(!response.ok)throw new Error('Не удалось скачать видео.');
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`vitrio-animation-${String(videoId).slice(0,12)}.mp4`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }
  }catch(cause){notice(cause.message)}
  finally{if(button){button.disabled=false;button.removeAttribute('aria-busy');button.textContent=label;}}
}
async function pollStudioVideo(videoId){const projectId=state.project?.id;if(!projectId)return;const deadline=Date.now()+15*60*1000;while(Date.now()<deadline){if(state.project?.id!==projectId)return;let payload;try{payload=await request(`/vitrio/projects/${encodeURIComponent(projectId)}/videos/${encodeURIComponent(videoId)}`);}catch(cause){if([401,403].includes(cause.status))throw cause;await new Promise(resolve=>setTimeout(resolve,4000));continue;}const video=payload.video||payload;if(video?.id){syncStudioVideoUser(payload);updateStudioVideo(video,projectId);}const status=videoState(video);if(videoIsComplete(video))return;if(status==='uncertain'){const uncertain=new Error(video.error||'Статус видео уточняется. Повторно запускать анимацию не нужно.');uncertain.code='VIDEO_UNCERTAIN';throw uncertain;}if(['failed','cancelled','canceled'].includes(status)){const failure=new Error(video.error||'Не удалось оживить карточку. Звёзды не списаны.');failure.code='VIDEO_FAILED';throw failure;}await new Promise(resolve=>setTimeout(resolve,document.hidden?4000:1800));}const pending=new Error('Видео ещё создаётся. Откройте каталог позже — повторно списывать звёзды не нужно.');pending.code='VIDEO_PENDING';throw pending;}
async function watchStudioVideo(videoId){if(!videoId||String(videoId).startsWith('local:')||state.watchedVideos.has(String(videoId)))return;state.watchedVideos.add(String(videoId));const projectId=state.project?.id;try{await pollStudioVideo(videoId);}catch(cause){if(String(state.project?.id)!==String(projectId))return;const current=projectVideos().find(video=>String(video.id)===String(videoId));if(current){if(cause.code==='VIDEO_FAILED')updateStudioVideo({...current,status:'failed',error:cause.message},projectId);else updateStudioVideo({...current,status:videoIsProcessing(current)?'processing':current.status,error:cause.message},projectId);}if(cause.code==='VIDEO_PENDING'){setTimeout(()=>{if(String(state.project?.id)===String(projectId))void watchStudioVideo(videoId);},8000);}else if(cause.status!==401&&cause.status!==403)notice(cause.message);}finally{state.watchedVideos.delete(String(videoId));}}
async function startStudioVideo(result,trigger){if(!state.project?.id||!result?.id||state.videoBusy.has(String(result.id)))return;state.videoBusy.add(String(result.id));const key=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;const projectId=state.project.id;state.project.videos=projectVideos().filter(video=>!(String(video.resultId)===String(result.id)&&['failed','cancelled','canceled'].includes(videoState(video))));const localId=`local:${key}`;const localVideo={id:localId,resultId:result.id,sourceImage:result.image,status:'queued',progress:0,duration:VITRIO_VIDEO_DURATION,resolution:VITRIO_VIDEO_RESOLUTION,idempotencyKey:key,createdAt:new Date().toISOString()};updateStudioVideo(localVideo);try{const payload=await studioVideoRequest(projectId,result.id,key);const video=payload.video||payload;if(String(state.project?.id)!==String(projectId))return;if(!video?.id){const pending=new Error('Запрос принят, но статус видео ещё не готов.');pending.code='VIDEO_PENDING';throw pending;}state.project.videos=projectVideos().filter(item=>String(item.id)!==localId);syncStudioVideoUser(payload);updateStudioVideo({...video,resultId:video.resultId||result.id,sourceImage:video.sourceImage||result.image},projectId);void watchStudioVideo(video.id);}catch(cause){if(String(state.project?.id)!==String(projectId))return;if(studioVideoTransientError(cause)){updateStudioVideo({...localVideo,status:'processing',error:'Проверяем запрос…'});notice('Запрос отправлен. Проверяем статус видео…');void reconcileStudioVideo(projectId,result,key,localId);}else{state.project.videos=projectVideos().filter(item=>String(item.id)!==localId);renderVitrioCatalog();notice(cause.message);}}finally{state.videoBusy.delete(String(result.id));trigger?.focus?.();}}
function resumeStudioVideos(){for(const video of projectVideos()){if(String(video.id).startsWith('local:'))continue;if(videoIsProcessing(video))void watchStudioVideo(video.id);}}
function renderVitrioCatalog(){const catalog=document.querySelector('[data-studio-catalog-grid]');if(!catalog||state.studioView!=='catalog')return;catalog.innerHTML=catalogResultMarkup();catalog.querySelectorAll('.v-studio-catalog-card').forEach(bindStudioCatalogCard);}
function installStudioView(){const head=document.querySelector('.v-canvas-head');const canvas=document.querySelector('[data-canvas]');if(!head||!canvas||document.querySelector('[data-studio-view-switch]'))return;try{state.studioView=localStorage.getItem('vitrio-studio-view')==='catalog'?'catalog':'canvas';}catch{state.studioView='canvas';}const switcher=document.createElement('div');switcher.className='v-studio-view-switch';switcher.dataset.studioViewSwitch='';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Вид проекта');switcher.innerHTML=`<button type="button" data-studio-view="canvas">${icon('image','v-icon--tiny')}<span>Холст</span></button><button type="button" data-studio-view="catalog">${icon('grid','v-icon--tiny')}<span>Каталог</span></button>`;head.querySelector('.v-canvas-actions')?.before(switcher);const catalog=document.createElement('section');catalog.className='v-studio-catalog';catalog.dataset.studioCatalog='';catalog.setAttribute('aria-label','Каталог сгенерированных изображений');catalog.innerHTML='<div class="v-studio-catalog-grid" data-studio-catalog-grid></div>';canvas.after(catalog);switcher.querySelectorAll('[data-studio-view]').forEach((button)=>button.addEventListener('click',()=>setStudioView(button.dataset.studioView)));resumeStudioVideos();setStudioView(state.studioView);}
function studioMarkup(project){const storedSettings=project?.settings||{};const type=projectType(project);const defaultAspect=type==='logo'?'1:1':type==='thumbnail'?'16:9':type==='website'?'9:16':'4:5';const s={content:'card',style:'clean',background:'creative',marketplace:'universal',aspectRatio:defaultAspect,light:'мягкий дневной свет',accent:'adaptive',brief:'',...storedSettings};if(type==='website')s.aspectRatio='9:16';if(type==='merch'&&s.merch?.frontAndBack===true)s.aspectRatio='16:9';if(s.accent==='graphite and lime')s.accent='adaptive';const sources=project?.sourceImages?.length?project.sourceImages:(project?.sourceImage?[project.sourceImage]:[]);state.sources=sources;state.activeSource=0;const results=projectResults(project);state.activeResult=Math.max(0,results.length-1);const activeImage=results[state.activeResult]?.image||'';const projectLabel=({product:'Новый товар',merch:'Новый мерч-проект',website:'Новый сайт-концепт',thumbnail:'Новое превью для видео',logo:'Логотип (архив)'})[type];const canvasCopy=({product:'Добавьте фотографии товара, настройте сцену и запустите генерацию.',merch:'Добавьте референсы, настройте идею и запустите генерацию мокапа.',website:'Заполните профиль сайта и создайте первый визуальный концепт. Референсы — по желанию.',thumbnail:'Укажите тему видео, выберите шаблон и создайте превью. Референсы — по желанию.',logo:'Опишите характер бренда и создайте первый логотип. Референсы — по желанию.'})[type];return shell(project?.title||projectLabel,`<div class="v-studio-layout"><main class="v-studio-main"><header class="v-canvas-head"><div class="v-project-heading"><h1>${esc(project?.title||projectLabel)}</h1><span class="v-save-status sr-visually-hidden" data-save-status role="status">Все изменения сохранены</span></div><div class="v-canvas-actions"><button class="v-button v-studio-gpt-button" type="button" data-open-studio-gpt aria-label="Открыть Vitrio GPT">${studioGptMark()}<span data-studio-gpt-label>Vitrio GPT</span></button><button class="v-icon-button v-studio-settings-button" type="button" data-open-settings aria-label="Открыть настройки генерации">${icon('settings')}<span>Настройки генерации</span></button><button class="v-icon-button" type="button" data-compare aria-label="Сравнить исходник и результат" ${activeImage&&sources.length?'':'disabled'}>${icon('image')}</button><button class="v-icon-button" type="button" data-download aria-label="Скачать результат" ${activeImage?'':'disabled'}>${icon('download')}</button><button class="v-icon-button" type="button" data-fullscreen aria-label="Полный экран">${icon('expand')}</button><button class="v-button v-button--accent v-studio-generate-button" type="submit" form="studio-form">${icon('sparkle','v-icon--tiny')}<span>Сгенерировать</span></button></div><p class="v-studio-gpt-status" data-studio-gpt-status role="status" aria-live="polite" hidden></p></header><section class="v-canvas" data-canvas>${activeImage?`<figure class="v-canvas-result"><img src="${esc(activeImage)}" alt="Готовый визуал" data-canvas-image></figure>`:`<div class="v-canvas-empty"><strong>${({merch:'Создайте первый мерч-мокап',website:'Создайте первый дизайн сайта',thumbnail:'Создайте превью для видео',logo:'Создайте первый логотип'})[type]||'Создайте первый визуал'}</strong><span>${canvasCopy}</span></div>`}<div class="v-loading" hidden data-loading role="status" aria-live="polite"><div class="v-generation-progress"><strong><span data-generation-percent>0</span>%</strong><div class="v-generation-track" role="progressbar" aria-label="Прогресс генерации" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-generation-bar></i></div><span data-generation-stage>Подготавливаем проект…</span><small data-generation-eta>Оцениваем время ожидания</small></div></div></section><section class="v-asset-tray" aria-label="Материалы и версии проекта"><div class="v-asset-group v-asset-sources"><div class="v-asset-heading"><b>${type==='product'?'Исходники':'Референсы'}</b><span data-source-count>${sources.length}/${sourceLimit(type)}${type==='product'?'':' · необязательно'}</span></div><div class="v-source-row" data-sources>${sourceMarkup(sources,state.activeSource,type)}</div></div><div class="v-asset-divider"></div><div class="v-asset-group v-asset-results"><div class="v-asset-heading"><b>Версии</b><span>${results.length}</span></div><div class="v-result-row" data-results>${resultMarkup(results,state.activeResult)}</div></div></section></main><aside class="v-settings" data-settings><section class="v-settings-pane" data-settings-pane="generation" ${state.settingsTab==='generation'?'':'hidden'}>${settingsMarkup(s,project)}</section><section class="v-settings-pane v-settings-packs-pane" data-settings-pane="packs" ${state.settingsTab==='packs'?'':'hidden'}>${studioPacksMarkup()}</section></aside><div class="v-drawer-backdrop" data-settings-backdrop></div></div>`,'studio');}
async function openStudioGpt(button) {
  if (!button || button.disabled) return;
  const label = button.querySelector('[data-studio-gpt-label]'); const status = button.closest('.v-sidebar, .v-app-menu, .v-canvas-head')?.querySelector('[data-studio-gpt-status]') || document.querySelector('[data-studio-gpt-status]');
  button.disabled = true; button.setAttribute('aria-busy', 'true'); button.classList.remove('is-failed'); label.textContent = 'Открываем…';
  status.hidden = false; status.textContent = 'Открываем Vitrio GPT…';
  try {
    await request('/vitrio/ai-chat/session', { method:'POST', body:JSON.stringify({}) });
    button.classList.add('is-ready');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(resolve => setTimeout(resolve, 140));
    location.assign('/ai-chat');
  } catch (cause) {
    label.textContent = 'Vitrio GPT'; status.textContent = cause.message || 'Не удалось открыть Vitrio GPT. Попробуйте ещё раз.';
    button.disabled = false; button.removeAttribute('aria-busy'); button.classList.add('is-failed'); button.focus();
  }
}
function settingsFooter(){return `<p class="v-form-error" hidden data-studio-error></p></div><footer class="v-generate-footer"><div><span>Стоимость <b>за вариант</b></span><span>Осталось <b data-credit-count>${state.user?.credits??0}</b>${studioRefreshEnabled()?studioCurrencyMark('звёзд'):''}</span></div><button class="v-button v-button--accent v-generate" type="submit"><span>Сгенерировать</span></button><small>Результат сохранится в проекте</small></footer></form>`;}
function generationTypeChoice(value,title,copy,selected){const file={photo:'product-photo',card:'marketplace-card',story:'story'}[value];return `<label class="sr-generation-type"><input type="radio" name="content" value="${value}" ${selected===value?'checked':''}><span class="sr-generation-type-content"><img class="sr-generation-type-art" src="/assets/vitrio/studio-refresh/generation-types/${file}-256.webp" srcset="/assets/vitrio/studio-refresh/generation-types/${file}-256.webp 256w, /assets/vitrio/studio-refresh/generation-types/${file}-384.webp 384w" sizes="58px" width="384" height="384" alt="" decoding="async"><span class="sr-generation-type-copy"><b>${title}</b><small>${copy}</small></span></span></label>`;}
function studioSettingsTabs(active){return `<nav class="v-studio-settings-tabs" role="tablist" aria-label="Разделы настроек"><button type="button" role="tab" aria-selected="${active==='generation'}" aria-controls="studio-form" data-settings-tab="generation">Генерация</button><button type="button" role="tab" aria-selected="${active==='packs'}" aria-controls="studio-settings-packs" data-settings-tab="packs">Пакеты звёзд</button></nav>`;}
function studioPacksMarkup(){const packs=[pricingPackCard('stars-5',{title:'На пробу',copy:'Небольшой запас для одного визуала или первого теста.'}),pricingPackCard('stars-30',{title:'Запас на проект',copy:'Для товарной серии и нескольких итераций.',recommended:true}),pricingPackCard('stars-100',{title:'Активная работа',copy:'Для нескольких проектов и запаса на будущее.'})].join('');return `<header class="v-settings-head"><h2>Пакеты звёзд</h2><button class="v-icon-button" type="button" data-close-settings aria-label="Закрыть настройки">${icon('close')}</button></header>${studioSettingsTabs('packs')}<div class="v-settings-packs-scroll" id="studio-settings-packs" role="tabpanel" aria-labelledby=""><section class="v-settings-group"><p class="v-settings-packs-intro">Разовая покупка для пополнения баланса. Без подписки и автоматических списаний.</p><div class="v-settings-pack-list">${packs}</div></section></div>`;}
function addStudioSettingsTabs(markup){return markup.replace('</header>',`${studioSettingsTabs('generation')}</header>`);}
function merchSettingsMarkup(s,project,radio){const merch=s.merch||{};const placement=merch.placement||'center';return `${settingsHead('Мерч','shirt')}<form id="studio-form"><div class="v-settings-scroll"><section class="v-settings-group"><label class="v-field">${groupTitle('shirt','Изделие','','span')}<input id="merch-item" value="${esc(merch.item||'')}" maxlength="90" placeholder="Например, чёрная футболка" required></label></section><section class="v-settings-group"><label class="v-field">${groupTitle('pen','Идея принта','','span')}<textarea id="merch-idea" maxlength="400" placeholder="Настроение, символы, композиция и желаемый результат." required>${esc(merch.idea||'')}</textarea><small data-merch-count>${String(merch.idea||'').length}/400</small></label></section><section class="v-settings-group">${groupTitle('target','Размещение')}<div class="v-segments v-segments--tiles" role="radiogroup" aria-label="Размещение дизайна">${optionTile('merch-placement','center','По центру',placement,'placeCenter')}${optionTile('merch-placement','full','На всю поверхность',placement,'placeFull')}${optionTile('merch-placement','detail','Небольшая деталь',placement,'placeDetail')}</div></section><section class="v-settings-group">${groupTitle('crop','Формат')}<label class="v-card-copy-auto"><input id="merch-front-back" type="checkbox" ${merch.frontAndBack===true?'checked':''} aria-describedby="merch-front-back-note"><span><b>Спереди и сзади</b><small id="merch-front-back-note">Обе стороны на одном фото · 16:9 · без доплаты</small></span></label><div class="v-ratios" role="radiogroup" aria-label="Формат">${['1:1','4:5','3:4','16:9','9:16'].map(v=>radio('ratio',v,v,s.aspectRatio)).join('')}</div></section><section class="v-settings-group">${groupTitle('palette','Палитра принта')}${merchPaletteMarkup(s)}</section><section class="v-settings-group"><label class="v-field">${groupTitle('folder','Название проекта','','span')}<input id="title" value="${esc(project?.title||'')}" placeholder="Например, мерч для кофейни" required></label></section>${settingsFooter()}`;}
function settingsMarkup(s,project){const radio=(name,value,label,selected)=>`<label><input type="radio" name="${name}" value="${value}" ${selected===value?'checked':''}><span>${label}</span></label>`;const type=projectType(project);if(type==='merch')return merchSettingsMarkup(s,project,radio);if(type==='website')return websiteSettingsMarkup(s,project,radio);if(type==='logo')return logoSettingsMarkup(s,project,radio);if(type==='thumbnail')return thumbnailSettingsMarkup(s,project,radio);const content=['photo','card','story'].includes(s.content)?s.content:'card';const card=s.cardCopy||{};const cardLines=Array.isArray(card.lines)?card.lines.join('\n'):'';const cardCopyAuto=s.cardCopyAuto!==false;return `${settingsHead('Карточки товаров','box')}<form id="studio-form"><div class="v-settings-scroll"><section class="v-settings-group">${groupTitle('layers','Что создаём')}<div class="sr-generation-types">${generationTypeChoice('photo','Предметное фото','Чистый кадр товара без текста.',content)}${generationTypeChoice('card','Карточка маркетплейса','Товар, текст и выбранная композиция.',content)}${generationTypeChoice('story','Stories','Вертикальный креатив для соцсетей.',content)}</div></section><section class="v-settings-group"><label class="v-field">${groupTitle('tag','Название товара','','span')}<input id="title" value="${esc(project?.title||'')}" placeholder="Например, кофемолка Bloom" required></label></section><section class="v-settings-group v-card-copy" data-card-copy ${content==='card'?'':'hidden'}>${groupTitle('text','Текст на карточке')}<label class="v-card-copy-auto"><input id="card-copy-auto" type="checkbox" ${cardCopyAuto?'checked':''} aria-describedby="card-copy-auto-note"><span><b>Подобрать автоматически</b><small id="card-copy-auto-note">Заголовок и три качества — по фото товара.</small></span></label><div data-card-copy-manual class="${cardCopyAuto?'is-disabled':''}"><label class="v-field"><span>Заголовок</span><input id="card-headline" maxlength="60" value="${esc(card.headline||project?.title||'')}" placeholder="Например, AirPods Pro 2" ${cardCopyAuto?'disabled':'required'}></label><label class="v-field"><span data-card-lines-label>Три качества</span><textarea id="card-lines" maxlength="170" rows="3" placeholder="Каждое качество — с новой строки" ${cardCopyAuto?'disabled':'required'}>${esc(cardLines)}</textarea><small data-card-lines-note>Ровно три короткие строки, без изменения смысла.</small></label></div></section>${cardTemplateSettingsMarkup(s,content)}<section class="v-settings-group">${groupTitle('crop','Формат')}<div class="v-ratios" role="radiogroup" aria-label="Формат">${['1:1','4:5','3:4','16:9','9:16'].map(v=>radio('ratio',v,v,s.aspectRatio)).join('')}</div></section><section class="v-settings-group">${groupTitle('palette','Палитра')}<div class="v-card-palette" role="radiogroup" aria-label="Цветовая палитра"><label class="v-card-palette-auto"><input type="radio" name="paletteMode" value="auto" ${s.paletteMode!=='custom'?'checked':''}><span>${icon('sparkle','v-icon--tiny')}<b>Авто</b><small data-card-palette-hint>По товару</small></span></label><div class="v-card-palette-custom"><label><input type="radio" name="paletteMode" value="custom" ${s.paletteMode==='custom'?'checked':''}><span><i data-card-color-swatch style="background:${/^#[0-9a-f]{6}$/i.test(s.paletteColor||'')?s.paletteColor:'#cfff22'}"></i><b>Свой цвет</b><small>Акцент</small></span></label><input id="studio-card-color" type="color" value="${/^#[0-9a-f]{6}$/i.test(s.paletteColor||'')?s.paletteColor:'#cfff22'}" aria-label="Выбрать свой цвет"></div></div></section><section class="v-settings-group"><label class="v-field">${groupTitle('pen','Пожелание','необязательно','span')}<textarea id="brief" maxlength="400" placeholder="Например: на светлом мраморе, мягкий утренний свет.">${esc(s.brief)}</textarea><small data-count>${s.brief.length}/400</small></label></section>${settingsFooter()}`;}
function cardTemplateSettingsMarkup(s,content='card'){
  const templates=(Array.isArray(state.cardTemplates)?state.cardTemplates:[]).filter(template=>template&&/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(template.id)&&typeof template.title==='string').slice(0,24);
  const selected=templates.some(template=>template.id===s.cardTemplateId)?s.cardTemplateId:'none';
  const choices=[{id:'none',title:'Без шаблона'},...templates];
  const tile=template=>{
    const plain=template.id==='none';
    const preview=plain?`<span class="v-card-template-plain">${icon('sparkle')}<small>Своя идея</small></span>`:`<img src="${ASSET}/card-templates/${template.id}-240.webp" srcset="${ASSET}/card-templates/${template.id}-240.webp 240w, ${ASSET}/card-templates/${template.id}-480.webp 480w" sizes="(max-width: 600px) calc((100vw - 64px) / 3), 112px" width="240" height="320" alt="" loading="lazy" decoding="async">`;
    return `<label class="v-card-template"><input type="radio" name="card-template" value="${template.id}" ${selected===template.id?'checked':''} aria-label="${esc(template.title)}"><span class="v-card-template-preview">${preview}</span><span class="v-card-template-title">${esc(template.title)}</span></label>`;
  };
  const more=choices.length>6?`<details class="v-card-template-more" ${choices.findIndex(template=>template.id===selected)>=6?'open':''}><summary><span class="v-card-template-show">Показать больше</span><span class="v-card-template-hide">Свернуть</span>${icon('chevron')}</summary><div class="v-card-template-grid">${choices.slice(6).map(tile).join('')}</div></details>`:'';
  return `<section class="v-settings-group" data-card-templates ${content==='card'?'':'hidden'}>${groupTitle('grid','Шаблон')}<p class="v-setting-note">${templates.length?'Выберите подачу — товар и текст будут вашими.':'Без шаблона карточка создаётся по вашему пожеланию.'}</p><div role="radiogroup" aria-label="Шаблон карточки товара"><div class="v-card-template-grid">${choices.slice(0,6).map(tile).join('')}</div>${more}</div></section>`;
}
function thumbnailSettingsMarkup(s,project,radio){
  const thumbnail=s.thumbnail||{};
  const templates=state.thumbnailTemplates.filter((template)=>/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(template.id)&&typeof template.title==='string').slice(0,6);
  const selected=templates.some((template)=>template.id===thumbnail.templateId)?thumbnail.templateId:templates[0]?.id;
  return `${settingsHead('Превью для видео','video')}<form id="studio-form" class="v-thumbnail-settings"><div class="v-settings-scroll"><section class="v-settings-group">${groupTitle('grid','Шаблон')}<div class="v-thumbnail-templates" role="radiogroup" aria-label="Шаблон превью">${templates.map((template)=>`<label class="v-thumbnail-template"><input type="radio" name="thumbnail-template" value="${esc(template.id)}" ${selected===template.id?'checked':''}><img src="/assets/vitrio/thumbnail-templates/${esc(template.id)}-320.webp" srcset="/assets/vitrio/thumbnail-templates/${esc(template.id)}-320.webp 320w, /assets/vitrio/thumbnail-templates/${esc(template.id)}-640.webp 640w" sizes="144px" width="320" height="180" alt="" decoding="async"><span>${esc(template.title)}</span></label>`).join('')}</div>${templates.length?'<p class="v-setting-note">Композиция берётся из шаблона, тема, текст и персонаж — ваши.</p>':'<p class="v-form-error" role="status">Шаблоны превью недоступны. Обновите страницу и попробуйте ещё раз.</p>'}</section><section class="v-settings-group">${groupTitle('video','Видео')}<label class="v-field"><span>Тема видео</span><input id="thumbnail-topic" maxlength="180" minlength="2" value="${esc(thumbnail.topic||'')}" placeholder="Например, обзор беспроводных наушников" required></label><label class="v-field"><span>Описание · необязательно</span><textarea id="thumbnail-description" maxlength="400" rows="3" placeholder="Сюжет, предмет, настроение и детали.">${esc(thumbnail.description||'')}</textarea></label><label class="v-field"><span>Текст на превью · необязательно</span><input id="thumbnail-headline" maxlength="60" value="${esc(thumbnail.headline||'')}" placeholder="Например, СНИМАЙ ЛУЧШЕ" aria-describedby="thumbnail-headline-note"><small id="thumbnail-headline-note">Напишем дословно. Пустое поле — превью без текста.</small></label></section><section class="v-settings-group">${groupTitle('user','Персонаж')}<div class="v-segments v-segments--tiles v-thumbnail-characters" role="radiogroup" aria-label="Персонаж на превью">${optionTile('thumbnail-character','none','Без персонажа',thumbnail.character||'none','slash')}${optionTile('thumbnail-character','cartoon','Мультяшный',thumbnail.character||'none','smile')}${optionTile('thumbnail-character','realistic','Реалистичный',thumbnail.character||'none','user')}</div></section><section class="v-settings-group">${groupTitle('crop','Формат')}<div class="v-ratios" role="radiogroup" aria-label="Формат превью">${['16:9','1:1','9:16'].map(value=>radio('ratio',value,value,s.aspectRatio||'16:9')).join('')}</div><p class="v-setting-note">16:9 — обложка YouTube, квадрат и вертикаль — для других площадок.</p></section><section class="v-settings-group"><label class="v-field">${groupTitle('folder','Название проекта','','span')}<input id="title" maxlength="160" value="${esc(project?.title||'')}" placeholder="Название для библиотеки" required></label></section>${settingsFooter()}`;
}
function settingsHead(title,glyph){return `<header class="v-settings-head"><h2>${icon(glyph,'v-settings-head-icon')}<span>${title}</span></h2><button class="v-icon-button" type="button" data-close-settings aria-label="Закрыть настройки">${icon('close')}</button></header>`;}
function groupTitle(glyph,title,meta='',tag='h3'){return `<${tag} class="v-group-title">${icon(glyph,'v-icon--tiny')}<span>${title}</span>${meta?`<small>${meta}</small>`:''}</${tag}>`;}
function optionTile(name,value,label,selected,glyph){return `<label class="v-option"><input type="radio" name="${name}" value="${value}" ${selected===value?'checked':''}><span>${icon(glyph)}<b>${label}</b></span></label>`;}
function syncThumbnailControls(){if(projectType()!=='thumbnail')return;const available=state.thumbnailTemplates.some((template)=>/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(template.id)&&typeof template.title==='string');document.querySelectorAll('.v-generate,.v-studio-generate-button').forEach((button)=>button.disabled=!available);}
function syncCardCopyVisibility(){const isCard=document.querySelector('[name="content"]:checked')?.value==='card';for(const selector of ['[data-card-copy]','[data-card-templates]']){const section=document.querySelector(selector);if(section)section.hidden=!isCard;}syncCardTemplatePalette();}
function syncCardTemplatePalette(){syncCardTemplateCopy();const hint=document.querySelector('[data-card-palette-hint]');if(hint)hint.textContent=document.querySelector('[name="content"]:checked')?.value==='card'&&document.querySelector('[name="card-template"]:checked')?.value!=='none'?'По шаблону':'По товару';}
function syncCardTemplateCopy(){
  const selected=document.querySelector('[name="card-template"]:checked')?.value||'none';
  const templated=Array.isArray(state.cardTemplates)&&state.cardTemplates.some(template=>template?.id===selected);
  const note=document.querySelector('#card-copy-auto-note');if(note)note.textContent=templated?'Подписи и детали — по композиции шаблона.':'Заголовок и три качества — по фото товара.';
  const label=document.querySelector('[data-card-lines-label]');if(label)label.textContent=templated?'Подписи · необязательно':'Три качества';
  const manualNote=document.querySelector('[data-card-lines-note]');if(manualNote)manualNote.textContent=templated?'До четырёх коротких строк. Разместим их в блоках выбранного шаблона.':'Ровно три короткие строки, без изменения смысла.';
  const lines=document.querySelector('#card-lines');if(lines){lines.maxLength=templated?223:170;lines.required=document.querySelector('#card-copy-auto')?.checked===false&&!templated;}
}
function syncCardCopyMode(){const automatic=document.querySelector('#card-copy-auto')?.checked!==false;document.querySelector('[data-card-copy-manual]')?.classList.toggle('is-disabled',automatic);document.querySelectorAll('#card-headline,#card-lines').forEach((field)=>{field.disabled=automatic;field.required=!automatic;});syncCardTemplateCopy();}
function syncVitrioResultActions(){
  const results=projectResults();
  const download=document.querySelector('[data-download]');
  const compare=document.querySelector('[data-compare]');
  if(download)download.disabled=!results.some(result=>result?.image);
  if(compare)compare.disabled=!(results[state.activeResult]?.image&&state.sources.length);
}
function readStudioPalette(){return [...document.querySelectorAll('[data-palette-color]')].map(input=>input.value).filter(value=>/^#[0-9a-f]{6}$/i.test(value)).slice(0,3);}
function studioAccentValue(){const selected=document.querySelector('[name="accent"]:checked')?.value||'adaptive';return selected==='custom'?readStudioPalette().join(', '):selected;}
function merchPaletteMarkup(s){
  const saved=String(s.accent||'').match(/#[0-9a-f]{6}/gi);
  const custom=Boolean(saved?.length);
  const colors=(custom?saved:s.customPalette)||['#171717','#e8dfce','#adbdcc'];
  const choices=[['charcoal and chartreuse','#3b5b28','Графит и лайм'],['neutral warm','#ddd0b4','Тёплая'],['cool blue','#a9d8ff','Голубая'],['natural green','#527342','Зелёная'],['lilac contrast','#b9a8ff','Сиреневая']];
  return `<div class="v-palette-row"><label class="v-palette-chip"><input type="radio" name="accent" value="adaptive" ${s.accent==='adaptive'?'checked':''}><span>${icon('sparkle','v-icon--tiny')}<b>Авто</b></span></label><div class="v-swatches" role="radiogroup" aria-label="Готовые палитры">${choices.map(([value,color,label])=>`<label title="${label}"><input type="radio" name="accent" value="${value}" aria-label="${label}" ${s.accent===value?'checked':''}><span style="background:${color}"></span></label>`).join('')}</div></div><label class="v-palette-chip v-palette-chip--wide"><input type="radio" name="accent" value="custom" ${custom?'checked':''}><span>${icon('palette','v-icon--tiny')}<b>Свои цвета</b><small>до трёх</small></span></label><div class="v-custom-palette" data-custom-palette><div class="v-custom-palette-colors">${[0,1,2].map(i=>{const value=/^#[0-9a-f]{6}$/i.test(colors[i]||'')?colors[i]:['#171717','#e8dfce','#adbdcc'][i];return `<label><span class="sr-visually-hidden">Цвет палитры ${i+1}</span><input type="color" data-palette-color value="${value}" aria-label="Цвет палитры ${i+1}"><output>${value.toUpperCase()}</output></label>`;}).join('')}</div></div>`;
}
function bindStudioPalette(){
  document.querySelectorAll('[name="card-template"]').forEach(input=>input.addEventListener('change',syncCardTemplatePalette));
  const cardColor=document.querySelector('#studio-card-color');
  cardColor?.addEventListener('input',()=>{const custom=document.querySelector('[name="paletteMode"][value="custom"]');if(custom)custom.checked=true;const swatch=document.querySelector('[data-card-color-swatch]');if(swatch)swatch.style.background=cardColor.value;scheduleSave();});
  document.querySelectorAll('[data-palette-color]').forEach(input=>input.addEventListener('input',()=>{
    const custom=document.querySelector('[name="accent"][value="custom"]');
    if(custom)custom.checked=true;
    input.nextElementSibling.textContent=input.value.toUpperCase();
    scheduleSave();
  }));
}
function syncMerchViews(){
  const checkbox=document.querySelector('#merch-front-back');
  if(!checkbox)return;
  const ratios=[...document.querySelectorAll('[name="ratio"]')];
  if(checkbox.checked){
    checkbox.dataset.previousRatio ||= ratios.find(input=>input.checked)?.value||'4:5';
    ratios.forEach(input=>{input.checked=input.value==='16:9';input.disabled=input.value!=='16:9';input.closest('label').hidden=input.disabled;});
  }else{
    ratios.forEach(input=>{input.disabled=false;input.closest('label').hidden=false;if(checkbox.dataset.previousRatio)input.checked=input.value===checkbox.dataset.previousRatio;});
    delete checkbox.dataset.previousRatio;
  }
}
async function studio(){
  const viewRevision=vitrioGenerationViewRevision;
  const id=new URLSearchParams(location.search).get('id');
  let project=null;
  const offerCheck=refreshSubscriptionOfferEligibility();
  const projectRequest=id?request(`/vitrio/projects/${encodeURIComponent(id)}`):Promise.resolve({project:null});
  const projectsRequest=state.projects.length?Promise.resolve({projects:state.projects}):request('/vitrio/projects');
  const [projectResult,projectsResult]=await Promise.allSettled([projectRequest,projectsRequest]);
  if(projectResult.status==='rejected'){
    const cause=projectResult.reason;
    if(cause?.status===401)return go('/vitrio/login');
    if(id)notice(cause?.message||'Не удалось открыть проект.');
  }else project=projectResult.value?.project||null;
  if(projectsResult.status==='fulfilled'&&!state.projects.length){state.projects=projectsResult.value?.projects||[];state.thumbnailTemplates=projectsResult.value?.meta?.thumbnailTemplates||[];state.cardTemplates=projectsResult.value?.meta?.cardTemplates||[];}
  await offerCheck;
  if(viewRevision!==vitrioGenerationViewRevision||!isVitrioRoute('/studio')||new URLSearchParams(location.search).get('id')!==id)return;
  state.project=project;state.generationPreview=null;
  app.innerHTML=studioMarkup(project);bindCommon();setupVitrioArtboard();installStudioView();bindStudio();
  if(studioRefreshEnabled()){const actions=document.querySelector('.v-canvas-actions');const fit=document.createElement('button');fit.className='v-icon-button sr-fit-canvas';fit.type='button';fit.setAttribute('aria-label','Показать весь холст');fit.title='Показать весь холст';fit.innerHTML=icon('grid');fit.addEventListener('click',fitStudioRefreshCanvas);actions.prepend(fit);requestAnimationFrame(fitStudioRefreshCanvas);}requestAnimationFrame(openStudioSubscriptionPromo);
  void resumeVitrioGeneration(project?.id,viewRevision);
}
function projectResults(project=state.project){const results=project?.results?.length?project.results:(project?.resultImage?[{id:'latest',image:project.resultImage,model:project.lastModel}]:[]);return normalizeStudioResults(results);}
function artboardIcon(name){const paths={zoomIn:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 4v6m-3-3h6m8 8-5-5',zoomOut:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm-3 7h6m8 8-5-5',scale:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',crop:'M7 3v4a2 2 0 0 0 2 2h4m4-2V3m0 14v4m-4-2h-4a2 2 0 0 1-2-2v-4',trash:'M4 7h16m-10 4v5m4-5v5M9 7l1-3h4l1 3m-9 0 1 14h10l1-14',plus:'M12 5v14M5 12h14'};return `<svg class="v-icon v-icon--tiny" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.plus}"/></svg>`;}
function artboardNumber(value,fallback,min,max){const number=Number(value);return Number.isFinite(number)?Math.max(min,Math.min(max,number)):fallback;}
function artboardCoordinate(value,fallback){const number=Number(value);return Number.isFinite(number)?number:fallback;}
function artboardAspectRatio(){const value=document.querySelector('[name="ratio"]:checked')?.value||state.project?.settings?.aspectRatio||'4:5';const match=String(value).match(/^(\d+):(\d+)$/);return match?`${match[1]} / ${match[2]}`:'4 / 5';}
function normalizeCanvasItem(item,index){const normalized={id:String(item?.id||`canvas-${Date.now()}-${index}`),src:String(item?.src||''),label:String(item?.label||`Версия ${index+1}`),ratio:String(item?.ratio||artboardAspectRatio()),x:artboardCoordinate(item?.x,50),y:artboardCoordinate(item?.y,50),width:artboardNumber(item?.width,30,8,100),cropX:artboardNumber(item?.cropX,50,0,100),cropY:artboardNumber(item?.cropY,50,0,100),fit:'cover'};const height=Number(item?.height);if(Number.isFinite(height))normalized.height=artboardNumber(height,30,8,100);return normalized;}
function canvasLayoutStorageKey(projectId=state.project?.id){return projectId?`vitrio-canvas-layout:${projectId}`:'';}
function readCanvasLayoutFallback(projectId=state.project?.id){const key=canvasLayoutStorageKey(projectId);if(!key)return null;try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&Array.isArray(value.canvasItems)&&Number.isFinite(Number(value.revision))?{revision:Math.max(0,Math.floor(Number(value.revision))),canvasItems:value.canvasItems}:null;}catch{return null;}}
function writeCanvasLayoutFallback(snapshot){const key=canvasLayoutStorageKey(snapshot?.projectId);if(!key||!snapshot)return;try{localStorage.setItem(key,JSON.stringify({revision:snapshot.revision,canvasItems:snapshot.canvasItems}));}catch{}}
function clearCanvasLayoutFallback(snapshot){const key=canvasLayoutStorageKey(snapshot?.projectId);if(!key)return;try{const fallback=readCanvasLayoutFallback(snapshot.projectId);if(!fallback||fallback.revision<=snapshot.revision)localStorage.removeItem(key);}catch{}}
function canvasLayoutSnapshot(){if(!state.project?.id)return null;return {projectId:state.project.id,revision:Math.max(0,Math.floor(Number(state.canvasLayoutRevision)||0)),canvasVersion:3,canvasItems:(state.canvasItems||[]).map(({id,src,label,ratio,x,y,width,height,cropX,cropY,fit})=>({id,src,label,ratio,x,y,width,...(Number.isFinite(height)?{height}:{}),cropX,cropY,fit}))};}
let canvasLayoutSaveTimer,canvasLayoutSaveChain=Promise.resolve(),pendingCanvasLayoutSave=null;
function queueCanvasLayoutSave(snapshot){if(!snapshot)return Promise.resolve(null);const queued=canvasLayoutSaveChain.then(async()=>{const isCurrentProject=()=>state.project?.id===snapshot.projectId;const status=document.querySelector('[data-save-status]');try{if(isCurrentProject())status&&(status.textContent='Сохраняем холст…');const data=await request(`/vitrio/projects/${encodeURIComponent(snapshot.projectId)}/canvas`,{method:'PATCH',body:JSON.stringify({canvasVersion:snapshot.canvasVersion,canvasLayoutRevision:snapshot.revision,canvasItems:snapshot.canvasItems})});if(isCurrentProject()&&snapshot.revision===state.canvasLayoutRevision){if(data.layoutSaved){state.project={...state.project,settings:{...(state.project?.settings||{}),...(data.project?.settings||{})}};clearCanvasLayoutFallback(snapshot);status&&(status.textContent='Все изменения сохранены');}else if(Number(data.project?.settings?.canvasLayoutRevision||0)>snapshot.revision){state.project=preserveProjectVideos(data.project);state.canvasLayoutRevision=Number(data.project.settings.canvasLayoutRevision)||0;state.canvasItems=(data.project.settings.canvasItems||[]).map(normalizeCanvasItem).filter((item)=>item.src);renderVitrioArtboard();status&&(status.textContent='Холст обновлён в другой вкладке');}}return data;}catch(cause){if(isCurrentProject()&&snapshot.revision===state.canvasLayoutRevision){status&&(status.textContent='Не удалось сохранить холст');notice('Не удалось сохранить раскладку холста. Попробуйте ещё раз — позиции пока сохранены в этом браузере.');}return null;}});canvasLayoutSaveChain=queued.catch(()=>null);return queued;}
function scheduleCanvasLayoutSave({delay=0}={}){const snapshot=canvasLayoutSnapshot();if(!snapshot)return;pendingCanvasLayoutSave=snapshot;writeCanvasLayoutFallback(snapshot);clearTimeout(canvasLayoutSaveTimer);canvasLayoutSaveTimer=setTimeout(()=>{const next=pendingCanvasLayoutSave;pendingCanvasLayoutSave=null;if(next)void queueCanvasLayoutSave(next);},delay);}
function markCanvasLayoutChanged(){state.canvasLayoutRevision=Math.max(0,Math.floor(Number(state.canvasLayoutRevision)||0))+1;scheduleCanvasLayoutSave({delay:0});}
function flushCanvasLayoutOnPageHide(){clearTimeout(canvasLayoutSaveTimer);const snapshot=pendingCanvasLayoutSave||canvasLayoutSnapshot();pendingCanvasLayoutSave=null;if(!snapshot)return;writeCanvasLayoutFallback(snapshot);const headers={'Content-Type':'application/json'};const legacyToken=token();if(legacyToken)headers.Authorization=`Bearer ${legacyToken}`;void fetch(`/api/vitrio/projects/${encodeURIComponent(snapshot.projectId)}/canvas`,{method:'PATCH',credentials:'same-origin',headers,keepalive:true,body:JSON.stringify({canvasVersion:snapshot.canvasVersion,canvasLayoutRevision:snapshot.revision,canvasItems:snapshot.canvasItems})}).catch(()=>{});}
function updateArtboardTransform(){const stage=document.querySelector('[data-artboard-stage]');if(!stage)return;const zoom=artboardNumber(state.canvasZoom,1,.35,2.4);if(studioRefreshEnabled())stage.style.setProperty('--sr-canvas-zoom',String(zoom));const pan=state.canvasPan||{x:0,y:0};stage.style.transform=`translate(-50%,-50%) translate(${pan.x||0}px,${pan.y||0}px) scale(${zoom})`;document.querySelector('[data-canvas-zoom]')?.replaceChildren(document.createTextNode(`${Math.round(zoom*100)}%`));}
function renderVitrioArtboard(){const stage=document.querySelector('[data-artboard-stage]');if(!stage)return;const aspectRatio=artboardAspectRatio();stage.style.aspectRatio=aspectRatio;stage.style.setProperty('--v-artboard-ratio',aspectRatio);const items=(state.canvasItems||[]).filter((item)=>item.src);stage.innerHTML=items.length?items.map((raw,index)=>{const item=normalizeCanvasItem(raw,index);const selected=item.id===state.selectedCanvasItem;return `<figure class="v-canvas-layer ${selected?'is-selected':''}" data-canvas-layer="${esc(item.id)}" tabindex="0" style="left:${item.x}%;top:${item.y}%;width:${item.width}%;aspect-ratio:${item.ratio};"><img src="${esc(item.src)}" alt="${esc(item.label)}" style="object-position:${item.cropX}% ${item.cropY}%;object-fit:cover"><figcaption>${esc(item.label)}</figcaption>${selected?['ne','se','sw','nw'].map(direction=>`<button class="v-canvas-handle v-canvas-handle--${direction}" type="button" data-canvas-handle="${direction}" data-canvas-resize="${esc(item.id)}" aria-label="Изменить размер: ${({ne:'верхний правый угол',se:'нижний правый угол',sw:'нижний левый угол',nw:'верхний левый угол'})[direction]}"></button>`).join(''):''}<button class="v-canvas-layer-delete" type="button" data-canvas-delete="${esc(item.id)}" aria-label="Удалить ${esc(item.label)}" title="Удалить">${artboardIcon('trash')}</button></figure>`;}).join(''):`<div class="v-artboard-empty"><span>${artboardIcon('plus')}</span><strong>Пустой холст</strong><p>${({website:'Заполните профиль в настройках и запустите первый концепт сайта.',thumbnail:'Укажите тему видео в настройках и создайте первое превью.',logo:'Опишите бренд в настройках и запустите первый знак.'})[projectType()]||'Добавьте любую версию из панели ниже.'}</p></div>`;stage.querySelectorAll('[data-canvas-layer]').forEach((layer)=>{const id=layer.dataset.canvasLayer;layer.addEventListener('pointerdown',(event)=>startArtboardGesture(event,id,'move'));layer.addEventListener('keydown',(event)=>{const item=(state.canvasItems||[]).find(entry=>entry.id===id);if(!item)return;if(event.key==='Delete'||event.key==='Backspace'){removeCanvasItem(id);event.preventDefault();return;}const delta=event.shiftKey?2:1;const arrows={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};if(!arrows[event.key])return;const [dx,dy]=arrows[event.key];item.x=artboardCoordinate(item.x+dx,item.x);item.y=artboardCoordinate(item.y+dy,item.y);renderVitrioArtboard();requestAnimationFrame(()=>stage.querySelector(`[data-canvas-layer="${CSS.escape(id)}"]`)?.focus());markCanvasLayoutChanged();event.preventDefault();});});stage.querySelectorAll('[data-canvas-resize]').forEach((button)=>{button.addEventListener('pointerdown',(event)=>startArtboardGesture(event,button.dataset.canvasResize,'resize',button.dataset.canvasHandle));button.addEventListener('keydown',(event)=>{const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!arrows[event.key])return;const item=(state.canvasItems||[]).find(entry=>entry.id===button.dataset.canvasResize);const layer=button.closest('[data-canvas-layer]');const stageRect=stage.getBoundingClientRect(),layerRect=layer?.getBoundingClientRect();if(!item||!layerRect)return;const [dx,dy]=arrows[event.key];const frame={x:(layerRect.left-stageRect.left)/stageRect.width*100,y:(layerRect.top-stageRect.top)/stageRect.height*100,width:layerRect.width/stageRect.width*100,height:layerRect.height/stageRect.height*100};Object.assign(item,resizeCanvasFrame(frame,button.dataset.canvasHandle,dx,dy));renderVitrioArtboard();markCanvasLayoutChanged();event.preventDefault();});});stage.querySelectorAll('[data-canvas-delete]').forEach((button)=>{button.addEventListener('pointerdown',(event)=>event.stopPropagation());button.addEventListener('click',()=>removeCanvasItem(button.dataset.canvasDelete));});updateArtboardTransform();}
function setCanvasCropMode(active,id=state.selectedCanvasItem){if(id)state.selectedCanvasItem=id;state.canvasCropping=Boolean(active);renderVitrioArtboard();}
function removeCanvasItem(id){state.canvasItems=(state.canvasItems||[]).filter((item)=>item.id!==id);if(state.selectedCanvasItem===id)state.selectedCanvasItem=state.canvasItems.at(-1)?.id||null;renderVitrioArtboard();renderVitrioResults();markCanvasLayoutChanged();}
function revealCanvasItem(id){state.selectedCanvasItem=id;state.canvasCropping=false;renderVitrioArtboard();requestAnimationFrame(()=>document.querySelector(`[data-canvas-layer="${id}"]`)?.focus({preventScroll:true}));}
function addCanvasItemFromResult(index){const result=projectResults()[index];if(!result?.image){notice('Эта версия больше недоступна. Обновите проект и попробуйте ещё раз.');return false;}const existing=(state.canvasItems||[]).find((item)=>item?.src===result.image);if(existing){revealCanvasItem(existing.id);notice(`Версия ${index+1} уже на холсте.`);return true;}const count=(state.canvasItems||[]).length;if(count>=24){notice('На одном холсте можно разместить до 24 версий.');return false;}const offset=((count%4)-1.5)*5;const item=normalizeCanvasItem({id:`canvas-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,src:result.image,label:`Версия ${index+1}`,ratio:artboardAspectRatio(),x:50+offset,y:50+offset,width:count?26:30},count);state.canvasItems=[...(state.canvasItems||[]),item];revealCanvasItem(item.id);renderVitrioResults();markCanvasLayoutChanged();notice(`Версия ${index+1} добавлена на холст.`);return true;}
function placeGeneratedResultsOnCanvas(previousResults){const previousKeys=Array.isArray(previousResults)?new Set(previousResults.map((result)=>result?.id||result?.image).filter(Boolean)):null;const fromIndex=previousKeys?0:Math.max(0,Number(previousResults)||0);const fresh=projectResults().map((result,index)=>({result,index})).filter(({result,index})=>result?.image&&index>=fromIndex&&(!previousKeys||!previousKeys.has(result.id||result.image))&&!state.canvasItems?.some((item)=>item.src===result.image));if(!fresh.length)return;const count=fresh.length;const width=[28,22,17,14][count-1]||14;const gap=count>1?4:0;const total=count*width+(count-1)*gap;const startX=50-total/2;const startY=[12,20,26,30][count-1]||30;const added=fresh.map(({result,index},position)=>normalizeCanvasItem({id:`canvas-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,src:result.image,label:`Версия ${index+1}`,ratio:artboardAspectRatio(),x:startX+position*(width+gap),y:startY,width},position));state.canvasItems=[...(state.canvasItems||[]),...added];state.selectedCanvasItem=added.at(-1)?.id||state.selectedCanvasItem;state.canvasCropping=false;renderVitrioArtboard();markCanvasLayoutChanged();}
function beginArtboardTouch(event){if(event.pointerType!=='touch')return false;const pointers=state.artboardPointers??=new Map();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size!==2)return false;const [first,second]=[...pointers.values()];state.artboardGesture={type:'pinch',distance:Math.hypot(second.x-first.x,second.y-first.y),zoom:state.canvasZoom||1,changed:false};return true;}
function updateArtboardTouch(event){const pointers=state.artboardPointers;if(event.pointerType!=='touch'||!pointers?.has(event.pointerId))return false;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const gesture=state.artboardGesture;if(pointers.size!==2||gesture?.type!=='pinch')return false;const [first,second]=[...pointers.values()];const distance=Math.hypot(second.x-first.x,second.y-first.y);if(!gesture.distance)return true;state.canvasZoom=artboardNumber(gesture.zoom*(distance/gesture.distance),gesture.zoom,.35,2.4);updateArtboardTransform();return true;}
function endArtboardTouch(event){const pointers=state.artboardPointers;if(event.pointerType!=='touch'||!pointers?.has(event.pointerId))return false;pointers.delete(event.pointerId);const gesture=state.artboardGesture;if(gesture?.type!=='pinch')return false;if(pointers.size===1){const point=[...pointers.values()][0];state.artboardGesture={type:'pan',startX:point.x,startY:point.y,pan:{...(state.canvasPan||{x:0,y:0})},changed:false};}else state.artboardGesture=null;return true;}
function startArtboardGesture(event,id,type,direction='se'){if(event.pointerType!=='touch'&&event.button!==0)return;const canvas=document.querySelector('[data-canvas]');const stage=document.querySelector('[data-artboard-stage]');const layer=stage?.querySelector(`[data-canvas-layer="${CSS.escape(id)}"]`);const item=(state.canvasItems||[]).find((entry)=>entry.id===id);if(!canvas||!stage||!layer||!item)return;if(beginArtboardTouch(event)){event.preventDefault();event.stopPropagation();canvas.setPointerCapture?.(event.pointerId);return;}event.preventDefault();event.stopPropagation();const stageRect=stage.getBoundingClientRect(),layerRect=layer.getBoundingClientRect();state.selectedCanvasItem=id;state.canvasCropping=false;state.artboardGesture={type,id,direction,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,item:{...item},frame:{x:item.x,y:item.y,width:item.width,height:layerRect.height/stageRect.height*100},stageRect,changed:false};canvas.setPointerCapture?.(event.pointerId);if(!layer.classList.contains('is-selected'))renderVitrioArtboard();}
function bindVitrioArtboard(){
  const canvas=document.querySelector('[data-canvas]');if(!canvas)return;
  canvas.addEventListener('wheel',(event)=>{
    event.preventDefault();
    const zoom=artboardNumber(state.canvasZoom,1,.35,2.4);
    const nextZoom=artboardNumber(zoom+(event.deltaY>0?-.1:.1),zoom,.35,2.4);
    if(nextZoom===zoom)return;
    const rect=canvas.getBoundingClientRect();
    const pan={x:Number(state.canvasPan?.x)||0,y:Number(state.canvasPan?.y)||0};
    const cursor={x:event.clientX-rect.left-rect.width/2,y:event.clientY-rect.top-rect.height/2};
    const shift=1-nextZoom/zoom;
    state.canvasPan={x:pan.x+(cursor.x-pan.x)*shift,y:pan.y+(cursor.y-pan.y)*shift};
    state.canvasZoom=nextZoom;
    updateArtboardTransform();
  },{passive:false});
  canvas.addEventListener('pointerdown',(event)=>{if(event.pointerType!=='touch'&&event.button!==0)return;if(beginArtboardTouch(event)){event.preventDefault();canvas.setPointerCapture?.(event.pointerId);return;}if(event.target.closest('[data-canvas-layer]'))return;state.selectedCanvasItem=null;state.canvasCropping=false;state.artboardGesture={type:'pan',startX:event.clientX,startY:event.clientY,pan:{...(state.canvasPan||{x:0,y:0})},changed:false};canvas.setPointerCapture?.(event.pointerId);renderVitrioArtboard();});
canvas.addEventListener('pointermove',(event)=>{if(updateArtboardTouch(event)){event.preventDefault();return;}const gesture=state.artboardGesture;if(!gesture||gesture.type==='pinch'||gesture.pointerId!==undefined&&gesture.pointerId!==event.pointerId)return;const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;if(gesture.type==='pan'){state.canvasPan={x:gesture.pan.x+dx,y:gesture.pan.y+dy};updateArtboardTransform();return;}const item=(state.canvasItems||[]).find((entry)=>entry.id===gesture.id);if(!item)return;gesture.changed=true;if(gesture.type==='move'){item.x=artboardCoordinate(gesture.item.x+(dx/gesture.stageRect.width)*100,gesture.item.x);item.y=artboardCoordinate(gesture.item.y+(dy/gesture.stageRect.height)*100,gesture.item.y);}else{Object.assign(item,resizeCanvasFrame(gesture.frame,gesture.direction,(dx/gesture.stageRect.width)*100,(dy/gesture.stageRect.height)*100));}const layer=canvas.querySelector(`[data-canvas-layer="${CSS.escape(gesture.id)}"]`);if(!layer)return;layer.style.left=`${item.x}%`;layer.style.top=`${item.y}%`;if(gesture.type!=='move'){layer.style.width=`${item.width}%`;layer.style.height=`${item.height}%`;layer.style.aspectRatio='auto';}});
  canvas.addEventListener('keydown',(event)=>{const gesture=state.artboardGesture;if(event.key!=='Escape'||!gesture?.item)return;const item=(state.canvasItems||[]).find(entry=>entry.id===gesture.id);if(item)Object.assign(item,gesture.item);state.artboardGesture=null;renderVitrioArtboard();event.preventDefault();event.stopPropagation();});
  const finish=(event)=>{const gesture=state.artboardGesture;if(endArtboardTouch(event))return;if(gesture?.pointerId!==undefined&&gesture.pointerId!==event.pointerId)return;if(gesture?.changed)markCanvasLayoutChanged();state.artboardGesture=null;};canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
}
function setupVitrioArtboard(){const canvas=document.querySelector('[data-canvas]');if(!canvas)return;const projectKey=state.project?.id||'new-project';if(state.canvasProjectKey!==projectKey){const saved=state.project?.settings?.canvasItems;const canvasVersion=Number(state.project?.settings?.canvasVersion??1);const savedRevision=Math.max(0,Math.floor(Number(state.project?.settings?.canvasLayoutRevision)||0));const fallback=readCanvasLayoutFallback(projectKey);const useFallback=Boolean(fallback&&fallback.revision>savedRevision);const savedItems=useFallback?fallback.canvasItems:saved;state.canvasItems=Array.isArray(savedItems)?savedItems.map((item,index)=>normalizeCanvasItem(canvasVersion<2?{...item,width:Math.min(40,Number(item.width||30)*.45)}:item,index)).filter((item)=>item.src):[];if(!Array.isArray(savedItems)){const active=projectResults()[state.activeResult];if(active?.image)state.canvasItems=[normalizeCanvasItem({src:active.image,label:`Версия ${state.activeResult+1}`,ratio:artboardAspectRatio(),width:30},0)];}state.canvasLayoutRevision=useFallback?fallback.revision:savedRevision;state.canvasProjectKey=projectKey;state.selectedCanvasItem=state.canvasItems.at(-1)?.id||null;state.canvasZoom=1;state.canvasPan={x:0,y:0};state.canvasCropping=false;state.artboardPointers=new Map();if(useFallback)scheduleCanvasLayoutSave({delay:0});}const loader=canvas.querySelector('[data-loading]');canvas.className='v-canvas v-artboard';canvas.innerHTML=`<div class="v-artboard-viewport"><div class="v-artboard-stage" data-artboard-stage></div><p class="v-artboard-hint">Потяните за угол — изменить размер · колесо или щипок — масштаб холста</p></div>`;if(loader)canvas.append(loader);document.querySelectorAll('[name="ratio"]').forEach((input)=>input.addEventListener('change',()=>renderVitrioArtboard()));bindVitrioArtboard();renderVitrioArtboard();}
function selectVitrioResult(index){const result=projectResults()[index];if(!result?.image)return;state.activeResult=index;document.querySelectorAll('[data-result]').forEach((item)=>{const active=Number(item.dataset.result)===index;item.setAttribute('aria-pressed',String(active));item.closest('.v-result-item')?.classList.toggle('active',active);});document.querySelectorAll('[data-catalog-result]').forEach((item)=>item.closest('.v-studio-catalog-card')?.classList.toggle('active',Number(item.dataset.catalogResult)===index));document.querySelectorAll('[data-source]').forEach((item)=>{item.classList.remove('active');item.setAttribute('aria-pressed','false');});syncVitrioResultActions();}
function selectVitrioSource(index){const source=state.sources[index];if(!source)return;state.activeSource=index;document.querySelectorAll('[data-source]').forEach((item)=>{const active=Number(item.dataset.source)===index;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});document.querySelectorAll('.v-result-item').forEach((item)=>item.classList.remove('active'));syncVitrioResultActions();}
function bindResultDragScroll(row,label='Версии проекта. Зажмите левую кнопку мыши и потяните для прокрутки.'){
  if(!row||row.dataset.dragScroll)return;
  row.dataset.dragScroll='true';
  let pointerId=null,startX=0,startScroll=0,moved=false,suppressUntil=0;
  requestAnimationFrame(()=>row.classList.toggle('is-scrollable',row.scrollWidth-row.clientWidth>2));
  row.addEventListener('pointerdown',(event)=>{
    if(event.pointerType==='touch'||event.button!==0||row.scrollWidth<=row.clientWidth)return;
    pointerId=event.pointerId;startX=event.clientX;startScroll=row.scrollLeft;moved=false;
  });
  row.addEventListener('pointermove',(event)=>{
    if(event.pointerId!==pointerId)return;
    const distance=event.clientX-startX;
    if(!moved&&Math.abs(distance)<4)return;
    // Capture only a real drag: capturing pointerdown retargets clicks away from child controls.
    if(!moved)row.setPointerCapture?.(pointerId);
    moved=true;row.classList.add('is-dragging');row.scrollLeft=startScroll-distance;event.preventDefault();
  });
  const finish=(event)=>{
    if(event.pointerId!==pointerId)return;
    if(moved){suppressUntil=performance.now()+120;row.releasePointerCapture?.(pointerId);}
    row.classList.remove('is-dragging');pointerId=null;
  };
  row.addEventListener('pointerup',finish);row.addEventListener('pointercancel',finish);
  row.addEventListener('pointerleave',(event)=>{if(!moved)finish(event);});
  row.addEventListener('click',(event)=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopPropagation();}},true);
  row.setAttribute('aria-label',label);
}
function renderVitrioResults(){syncVitrioResultActions();const row=document.querySelector('[data-results]');if(!row)return;const results=projectResults();row.innerHTML=resultMarkup(results,state.activeResult);row.scrollLeft=0;row.closest('.v-asset-group')?.querySelector('.v-asset-heading span')?.replaceChildren(document.createTextNode(String(results.length)));row.querySelectorAll('[data-result]').forEach((button)=>{button.setAttribute('aria-pressed',String(Number(button.dataset.result)===state.activeResult));button.addEventListener('click',()=>selectVitrioResult(Number(button.dataset.result)));});row.querySelectorAll('[data-add-result]').forEach((button)=>{button.addEventListener('pointerdown',(event)=>event.stopPropagation());button.addEventListener('click',(event)=>{event.preventDefault();event.stopPropagation();addCanvasItemFromResult(Number(button.dataset.addResult));});});bindResultDragScroll(row);if(typeof renderVitrioCatalog==='function')renderVitrioCatalog();}
function bindStudio(){const form=document.querySelector('#studio-form');const settingsScroll=document.querySelector('.v-settings-scroll');let settingsScrollTop=0,hasScrollSnapshot=false;const restoreSettingsScroll=()=>requestAnimationFrame(()=>{if(settingsScroll)settingsScroll.scrollTop=settingsScrollTop;requestAnimationFrame(()=>{hasScrollSnapshot=false;});});const preserveSettingsScroll=(handler)=>{if(!hasScrollSnapshot)settingsScrollTop=settingsScroll?.scrollTop||0;handler();restoreSettingsScroll();};document.querySelector('.v-canvas-actions [data-open-studio-gpt]')?.addEventListener('click',event=>void openStudioGpt(event.currentTarget));document.querySelectorAll('.v-segments label,.v-ratios label,.v-swatches label,.v-scenario,.v-palette-chip').forEach((label)=>label.addEventListener('pointerdown',()=>{settingsScrollTop=settingsScroll?.scrollTop||0;hasScrollSnapshot=true;requestAnimationFrame(restoreSettingsScroll);}));const sourceRender=()=>{const row=document.querySelector('[data-sources]');row.innerHTML=sourceMarkup(state.sources,state.activeSource,projectType());document.querySelector('[data-source-count]')?.replaceChildren(document.createTextNode(`${state.sources.length}/${sourceLimit(projectType())}${projectType()==='product'?'':' · необязательно'}`));row.querySelectorAll('[data-source]').forEach((button)=>{button.setAttribute('aria-pressed',String(Number(button.dataset.source)===state.activeSource));button.addEventListener('click',()=>selectVitrioSource(Number(button.dataset.source)));});row.querySelectorAll('[data-source-picker]').forEach((button)=>button.addEventListener('click',()=>row.querySelector('[data-files]')?.click()));row.querySelectorAll('[data-remove-source]').forEach((button)=>button.addEventListener('click',()=>{const index=Number(button.dataset.removeSource);if(!Number.isInteger(index)||index<0||index>=state.sources.length)return;state.sources.splice(index,1);if(index<state.activeSource)state.activeSource-=1;state.activeSource=Math.max(0,Math.min(state.activeSource,state.sources.length-1));sourceRender();document.querySelector('[data-compare]')?.toggleAttribute('disabled',!(state.sources.length&&projectResults()[state.activeResult]?.image));scheduleSave();}));row.querySelector('[data-files]')?.addEventListener('change',addFiles);bindResultDragScroll(row,'Исходники проекта. Зажмите левую кнопку мыши и потяните для прокрутки.');};
  const addFiles=async(event)=>{const files=Array.from(event.target.files||[]);if(!files.length)return;const type=projectType(),limit=sourceLimit(type);if(files.length+state.sources.length>limit)return showStudioError(type==='merch'?'В одном мерч-проекте можно использовать до семи референсов.':'В одном проекте можно использовать до четырёх фотографий.');if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>VITRIO_SOURCE_INPUT_MAX_BYTES))return showStudioError('Выберите JPG, PNG или WebP до 32 МБ на файл. Перед отправкой изображение будет оптимизировано.');try{state.sources.push(...await Promise.all(files.map(readFile)));state.activeSource=state.sources.length-1;sourceRender();scheduleSave();}catch(c){showStudioError(c.message);}};sourceRender();
  renderVitrioResults();
  syncThumbnailControls();bindStudioPalette();syncCardCopyVisibility();syncCardCopyMode();syncMerchViews();document.querySelector('#merch-front-back')?.addEventListener('change',()=>{syncMerchViews();renderVitrioArtboard();});document.querySelectorAll('[name="content"]').forEach(input=>input.addEventListener('change',()=>preserveSettingsScroll(()=>{syncCardCopyVisibility();syncCardCopyMode();})));document.querySelector('#card-copy-auto')?.addEventListener('change',()=>{syncCardCopyMode();scheduleSave();});document.querySelector('[data-open-settings]')?.addEventListener('click',openSettings);document.querySelectorAll('[data-close-settings]').forEach(button=>button.addEventListener('click',closeSettings));document.querySelector('[data-settings-backdrop]')?.addEventListener('click',closeSettings);document.querySelector('#brief')?.addEventListener('input',(e)=>{document.querySelector('[data-count]').textContent=`${e.target.value.length}/400`;scheduleSave();});document.querySelector('#merch-idea')?.addEventListener('input',(e)=>{document.querySelector('[data-merch-count]').textContent=`${e.target.value.length}/400`;scheduleSave();});document.querySelectorAll('#title,#card-headline,#card-lines,#merch-item,#thumbnail-topic,#thumbnail-description,#thumbnail-headline').forEach((input)=>input.addEventListener('input',scheduleSave));form.querySelectorAll('input,select').forEach(e=>e.addEventListener('change',()=>preserveSettingsScroll(scheduleSave)));document.querySelector('[data-download]')?.addEventListener('click',openDownloadDialog);document.querySelector('[data-fullscreen]')?.addEventListener('click',()=>document.querySelector('[data-canvas]')?.requestFullscreen?.());document.querySelector('[data-compare]')?.addEventListener('click',()=>{const result=state.project?.results?.[state.activeResult]?.image;const source=state.sources[state.activeSource];if(!result||!source)return notice('Для сравнения нужен исходник и результат.');openCompare(source,result);});
  form.addEventListener('submit',generate);
}
function setStudioSettingsTab(tab){if(!['generation','packs'].includes(tab))return;state.settingsTab=tab;document.querySelectorAll('[data-settings-pane]').forEach((pane)=>pane.hidden=pane.dataset.settingsPane!==tab);document.querySelectorAll('[data-settings-tab]').forEach((button)=>button.setAttribute('aria-selected',String(button.dataset.settingsTab===tab)));}
let studioSettingsTrigger=null;function openSettings(event){const settings=document.querySelector('[data-settings]');studioSettingsTrigger=event?.currentTarget||document.activeElement;settings?.classList.add('open');if(studioRefreshEnabled()){document.querySelector('[data-open-settings]')?.setAttribute('aria-expanded','true');document.querySelector('.v-studio-main')?.setAttribute('inert','');document.querySelector('.v-app-header')?.setAttribute('inert','');}settings?.setAttribute('role','dialog');settings?.setAttribute('aria-modal','true');settings?.setAttribute('aria-label','Настройки генерации');document.querySelector('[data-settings-backdrop]')?.classList.add('open');document.body.style.overflow='hidden';settings?.querySelector('[data-settings-pane]:not([hidden]) [data-close-settings]')?.focus();}function closeSettings(){const settings=document.querySelector('[data-settings]');const wasOpen=settings?.classList.contains('open');settings?.classList.remove('open');if(studioRefreshEnabled()){document.querySelector('[data-open-settings]')?.setAttribute('aria-expanded','false');document.querySelector('.v-studio-main')?.removeAttribute('inert');document.querySelector('.v-app-header')?.removeAttribute('inert');}settings?.removeAttribute('role');settings?.removeAttribute('aria-modal');settings?.removeAttribute('aria-label');document.querySelector('[data-settings-backdrop]')?.classList.remove('open');document.body.style.overflow='';if(wasOpen)studioSettingsTrigger?.focus();studioSettingsTrigger=null;}
let saveTimer,saveChain=Promise.resolve(),pendingProjectSave=null;function captureProjectSave(){if(!state.project)return null;return {revision:++state.saveRevision,projectId:state.project.id,title:document.querySelector('#title')?.value||state.project.title,category:projectCategory(),projectType:projectType(),sourceImages:[...state.sources],settings:getSettings()};}function queueProjectSave(snapshot,{throwOnError=false}={}){if(!snapshot)return Promise.resolve(null);const queued=saveChain.then(async()=>{const status=document.querySelector('[data-save-status]');const isCurrentProject=()=>state.project?.id===snapshot.projectId;try{state.saving=true;if(isCurrentProject())status&&(status.textContent='Сохранение…');const data=await request(`/vitrio/projects/${snapshot.projectId}`,{method:'PATCH',body:JSON.stringify({title:snapshot.title,category:snapshot.category,projectType:snapshot.projectType,sourceImages:snapshot.sourceImages,settings:snapshot.settings})});if(isCurrentProject()&&snapshot.revision===state.saveRevision){state.project=preserveProjectVideos(data.project);state.sources=Array.isArray(data.project?.sourceImages)?data.project.sourceImages:[];state.activeSource=Math.max(0,Math.min(state.activeSource,state.sources.length-1));status&&(status.textContent='Все изменения сохранены');}return data.project;}catch(cause){if(isCurrentProject()&&snapshot.revision===state.saveRevision)status&&(status.textContent='Ошибка сохранения');if(throwOnError)throw cause;return null;}finally{state.saving=false;}});saveChain=queued.catch(()=>null);return queued;}function scheduleSave({delay=650}={}){const snapshot=captureProjectSave();if(!snapshot)return;pendingProjectSave=snapshot;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const next=pendingProjectSave;pendingProjectSave=null;if(next)void queueProjectSave(next);},delay);}function saveProject({throwOnError=false}={}){clearTimeout(saveTimer);const snapshot=pendingProjectSave||captureProjectSave();pendingProjectSave=null;return queueProjectSave(snapshot,{throwOnError});}
function showStudioError(message){const node=document.querySelector('[data-studio-error]');if(node){node.textContent=message;node.hidden=!message;}}
function vitrioGenerationAttemptLabel(attempts,variantIndex=null,kind='stage'){
  const active=(Array.isArray(attempts)?attempts:[]).filter(item=>item?.phase==='generating'&&Number.isInteger(item.attempt)&&item.attempt>=1&&item.attempt<=4&&(variantIndex===null||item.variantIndex===variantIndex)).sort((a,b)=>(Number(a.variantIndex)||0)-(Number(b.variantIndex)||0))[0];
  if(!active||active.attempt===1)return '';
  if(kind==='compact')return `Попытка ${active.attempt} из 4`;
  if(kind==='title')return active.attempt===4?'Резервная генерация':'Повторяем генерацию';
  return active.attempt===4?'Резервная генерация · попытка 4 из 4':`Повторяем генерацию · попытка ${active.attempt} из 4`;
}
 function generationProgressController(outputCount){
   const root=document.querySelector('[data-loading]');
   const percentNode=root?.querySelector('[data-generation-percent]');
   const bar=root?.querySelector('[data-generation-bar]');
   const track=root?.querySelector('[role="progressbar"]');
   const stage=root?.querySelector('[data-generation-stage]');
   const eta=root?.querySelector('[data-generation-eta]');
   const canvas=document.querySelector('[data-canvas]');
   const total=Math.max(1,outputCount);
   const expectedSeconds=85*total+15;
   const startedAt=Date.now();
   let value=4;
   let completed=0;
   let timer;
   let recovering=false;
   let attempts=[],attemptLabel='',phase='generating',disposed=false;
   const progressLabel=()=>`Готово ${completed} из ${total}`;
   const paint=(next,label)=>{if(disposed)return;value=Math.max(value,Math.min(100,Math.round(next)));const displayedLabel=attemptLabel?`${progressLabel()} · ${attemptLabel}`:phase==='analyzing'?`Анализируем товар · ${progressLabel()}`:label||progressLabel();if(percentNode)percentNode.textContent=String(value);if(bar)bar.style.transform=`scaleX(${value/100})`;track?.setAttribute('aria-valuenow',String(value));track?.setAttribute('aria-valuetext',`${displayedLabel}, ${value}%`);if(stage)stage.textContent=displayedLabel;document.querySelectorAll('[data-generation-card-progress]').forEach(node=>node.textContent=`${value}%`);document.querySelectorAll('[data-generation-card-stage]').forEach(node=>{const index=Number(node.closest('[data-generation-card-variant]')?.dataset.generationCardVariant);const retry=vitrioGenerationAttemptLabel(attempts,index);node.textContent=retry?vitrioGenerationAttemptLabel(attempts,index,'compact'):phase==='analyzing'?`Анализируем товар · ${progressLabel()}`:label||progressLabel();});document.querySelectorAll('[data-generation-card-title]').forEach(node=>{const index=Number(node.closest('[data-generation-card-variant]')?.dataset.generationCardVariant);node.textContent=vitrioGenerationAttemptLabel(attempts,index,'title')||(phase==='analyzing'?'Анализируем товар':'Создаём визуал');});const elapsed=(Date.now()-startedAt)/1000;const left=Math.max(1,Math.ceil(expectedSeconds-elapsed));if(eta)eta.textContent=value>=100?'Генерация завершена':attemptLabel?'Продолжаем тот же запрос — готовые версии сохраняются.':recovering?'Проверяем готовые варианты на сервере…':`Осталось примерно ${left} сек`;};
   const update=(nextCompleted)=>{completed=Math.max(completed,Math.min(total,Math.floor(Number(nextCompleted)||0)));const factualProgress=completed?Math.min(94,12+(completed/total)*80):value;paint(factualProgress,progressLabel());};
   root.hidden=studioRefreshEnabled();if(!studioRefreshEnabled())canvas?.setAttribute('aria-busy','true');paint(4,progressLabel());
   timer=setInterval(()=>{const elapsed=(Date.now()-startedAt)/1000;paint(Math.min(92,12+80*(1-Math.exp(-elapsed/Math.max(22,expectedSeconds*.5)))),progressLabel());},500);
   const controller={generating(){recovering=false;paint(Math.max(12,value),progressLabel());},recovering(){recovering=true;paint(Math.max(16,value),progressLabel());},attempts(items,stage='generating'){attempts=Array.isArray(items)?items:[];attemptLabel=vitrioGenerationAttemptLabel(attempts);phase=stage==='analyzing'?'analyzing':'generating';paint(value,progressLabel());},update,finalizing(){clearInterval(timer);attempts=[];attemptLabel='';phase='generating';paint(96,progressLabel());},complete(done=total){completed=Math.max(completed,Math.min(total,Number(done)||total));clearInterval(timer);attempts=[];attemptLabel='';phase='generating';paint(100,progressLabel());},hold(label='Связь прервалась — продолжаем проверять результат…'){clearInterval(timer);recovering=true;attempts=[];attemptLabel='';phase='generating';paint(Math.max(16,value),label);},stop(){disposed=true;clearInterval(timer);canvas?.removeAttribute('aria-busy');if(root)root.hidden=true;if(activeVitrioGenerationProgress===controller)activeVitrioGenerationProgress=null;}};
   activeVitrioGenerationProgress=controller;return controller;
 }
const GENERATION_RECOVERY_INTERVAL_MS=2500;
const GENERATION_RECOVERY_IDLE_GRACE_MS=7500;
const GENERATION_RECOVERY_NETWORK_GRACE_MS=15000;
// Each output may need four ten-minute provider attempts plus analysis/normalization.
const GENERATION_RECOVERY_PER_OUTPUT_MS=45*60*1000;
const GENERATION_RECOVERY_MAX_MS=4*GENERATION_RECOVERY_PER_OUTPUT_MS;
const VITRIO_GENERATION_REQUEST_KEY_PREFIX='vitrio-generation:';
const waitForGenerationRecovery=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
function vitrioGenerationRequestKey(projectId){const storageKey=`${VITRIO_GENERATION_REQUEST_KEY_PREFIX}${projectId}`;try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved?.key&&Date.now()-Number(saved.savedAt)>=0&&Date.now()-Number(saved.savedAt)<GENERATION_RECOVERY_MAX_MS)return saved.key;const key=crypto.randomUUID();sessionStorage.setItem(storageKey,JSON.stringify({key,savedAt:Date.now()}));return key;}catch{return crypto.randomUUID();}}
function clearVitrioGenerationRequestKey(projectId){try{sessionStorage.removeItem(`${VITRIO_GENERATION_REQUEST_KEY_PREFIX}${projectId}`);}catch{}}
 function syncVitrioGenerationSnapshot(response,{resultCountBefore,progress,outputCount}){
   const nextProject=response?.project;
   if(!nextProject)return 0;
   const previousResults=projectResults();
   const previousCount=previousResults.length;
   const nextResults=projectResults(nextProject);
   const readyCount=Math.max(0,projectResults(nextProject).length-resultCountBefore);
   const completed=Math.max(readyCount,Number(response.completed)||0,Number(response.generated)||0);
   const previousCompleted=Number(state.generationPreview?.completed)||0;
   const previousFailed=Number(state.generationPreview?.failed)||0;
   if(response.user){state.user=response.user;document.querySelectorAll('.v-credit b,[data-credit-count],[data-credit-balance]').forEach(el=>el.replaceChildren(document.createTextNode(String(state.user?.credits??''))));}
   if(state.generationPreview){state.generationPreview.completed=Math.max(previousCompleted,Math.min(outputCount,completed));state.generationPreview.failed=Math.max(previousFailed,Math.min(outputCount-completed,Math.max(0,Math.floor(Number(response.failed)||0))));state.generationPreview.attempts=response.status==='processing'?response.attempts||[]:[];state.generationPreview.stage=response.stage||'generating';}
   progress?.attempts?.(response.status==='processing'?response.attempts||[]:[],response.stage);
   progress?.update(Math.min(outputCount,completed));
   const previousTail=previousResults.at(-1);
   const nextTail=nextResults.at(-1);
    const previousTailKey=previousTail?.id||previousTail?.image;
    if(nextResults.length<previousCount||previousTailKey&&!nextResults.some((result)=>(result?.id||result?.image)===previousTailKey)||nextResults.length===previousCount&&(nextTail?.id||nextTail?.image)===previousTailKey){if((Number(state.generationPreview?.completed)||0)!==previousCompleted||(Number(state.generationPreview?.failed)||0)!==previousFailed)renderVitrioCatalog();return completed;}
   state.project=preserveProjectVideos(nextProject);
   state.activeResult=projectResults().length-1;
   placeGeneratedResultsOnCanvas(previousResults);
   document.querySelectorAll('.v-credit b,[data-credit-count],[data-credit-balance]').forEach(el=>el.replaceChildren(document.createTextNode(String(state.user?.credits??''))));
   renderVitrioResults();
   selectVitrioResult(state.activeResult);
   return completed;
 }
 async function recoverVitrioGeneration({projectId,resultCountBefore,progress,outputCount,requestKey='',onSnapshot=syncVitrioGenerationSnapshot,shouldStop=()=>false,waitWhileIdle=false}){
   const startedAt=Date.now();
   let networkFailureAt=0;
   progress?.recovering();
   while(!shouldStop()&&Date.now()-startedAt<Math.min(GENERATION_RECOVERY_MAX_MS,45*60*1000*Math.max(1,outputCount))){
     try{
        const recovery=await request(`/vitrio/projects/${encodeURIComponent(projectId)}/generation-status`);
        if(shouldStop())return null;
       const sameRequest=!requestKey||recovery.idempotencyKey===requestKey;
       if(sameRequest)onSnapshot(recovery,{resultCountBefore,progress,outputCount});
       // `completed` in a status response is batch-local, but an older
       // generation can still be present on the project while the new POST
       // is being persisted. Never let that stale count win the race and
       // hide the loader before this request has produced a new result.
       const freshResultCount=Math.max(0,projectResults(recovery.project).length-resultCountBefore);
       const hasFreshResult=freshResultCount>0;
       networkFailureAt=0;
       if(sameRequest&&recovery.status==='failed')throw Object.assign(new Error(recovery.error||'Генерация не завершилась. Попробуйте ещё раз.'),{code:'VITRIO_GENERATION_FAILED',terminal:true});
       if(requestKey&&!sameRequest&&Date.now()-startedAt>=GENERATION_RECOVERY_IDLE_GRACE_MS){
         return null;
       }else if(recovery.status==='processing'){
         progress?.recovering();
       }else if(sameRequest&&recovery.status==='completed'&&(hasFreshResult||Number(recovery.completed)>0)){
         return recovery;
       }else if(!waitWhileIdle&&Date.now()-startedAt>=GENERATION_RECOVERY_IDLE_GRACE_MS){
         return null;
       }
    }catch(error){
      if(error.code!=='NETWORK_ERROR'&&error.status!==429&&!(error.status>=500))throw error;
      networkFailureAt||=Date.now();
      if(Date.now()-networkFailureAt>=GENERATION_RECOVERY_NETWORK_GRACE_MS)throw error;
    }
    await waitForGenerationRecovery(GENERATION_RECOVERY_INTERVAL_MS);
  }
  return null;
}
 async function applyVitrioGenerationResult(response,{type,resultCountBefore,progress,outputCount}){
   progress.finalizing();
   const previousResults=projectResults();
   if(response.user)state.user=response.user;
   state.project=preserveProjectVideos(response.project);
   state.generationPreview=null;
   const resolvedCopy=response.project?.settings?.cardCopy;
   if(resolvedCopy){const headline=document.querySelector('#card-headline');const lines=document.querySelector('#card-lines');if(headline)headline.value=resolvedCopy.headline||'';if(lines)lines.value=Array.isArray(resolvedCopy.lines)?resolvedCopy.lines.join('\n'):'';}
   state.activeResult=projectResults().length-1;
   placeGeneratedResultsOnCanvas(previousResults);
   document.querySelectorAll('.v-credit b,[data-credit-count],[data-credit-balance]').forEach(el=>el.replaceChildren(document.createTextNode(String(state.user?.credits??''))));
  renderVitrioResults();
  selectVitrioResult(state.activeResult);
   progress.complete(Math.max(projectResults().length-resultCountBefore,Number(response.completed)||0,Number(response.generated)||0));
   if(response.warning)notice(response.warning);
}
async function resumeVitrioGeneration(projectId,viewRevision=vitrioGenerationViewRevision){
  if(!projectId||state.generationActive)return;
  const shouldStop=()=>viewRevision!==vitrioGenerationViewRevision||String(state.project?.id)!==String(projectId)||!isVitrioRoute('/studio');
  if(shouldStop())return;
  state.generationActive=true;
  const hadPending=state.generationPreview?.requestKey;
  const buttons=[...document.querySelectorAll('.v-generate,.v-studio-generate-button')];
  const setButtons=(disabled,label)=>buttons.forEach(control=>{control.disabled=disabled;const text=control.querySelector(':scope > span');if(text)text.textContent=label;});
  setButtons(true,'Проверяем генерацию…');
  let progress,preserveGenerationProgress=false;
  try{
    let snapshot=await request(`/vitrio/projects/${encodeURIComponent(projectId)}/generation-status`);
    if(shouldStop())return;
    if(snapshot.status!=='processing'&&!(hadPending&&snapshot.idempotencyKey===hadPending&&snapshot.status==='completed')){
      if(hadPending&&snapshot.idempotencyKey===hadPending&&snapshot.status==='failed')throw Object.assign(new Error(snapshot.error||'Генерация не завершилась. Попробуйте ещё раз.'),{terminal:true});
      if(hadPending){clearVitrioGenerationRequestKey(projectId);state.generationPreview=null;renderVitrioCatalog();}
      return;
    }
    const requestKey=snapshot.idempotencyKey;
    if(!requestKey)throw new Error('Не удалось подтвердить запрос генерации. Обновите страницу, чтобы проверить результат.');
    const outputCount=Math.max(1,Math.min(4,Math.floor(Number(snapshot.total)||1)));
    const resultCountBefore=Number.isInteger(snapshot.resultCountBefore)&&snapshot.resultCountBefore>=0?snapshot.resultCountBefore:Math.max(0,projectResults(snapshot.project||state.project).length-(Number(snapshot.completed)||0));
    try{sessionStorage.setItem(`${VITRIO_GENERATION_REQUEST_KEY_PREFIX}${projectId}`,JSON.stringify({key:requestKey,savedAt:Date.now()}));}catch{}
    state.generationPreview={before:resultCountBefore,total:outputCount,completed:Math.max(0,Math.min(outputCount,Math.floor(Number(snapshot.completed)||0))),failed:Math.max(0,Math.floor(Number(snapshot.failed)||0)),ratio:state.project?.settings?.aspectRatio||'4:5',requestKey,attempts:snapshot.attempts||[],stage:snapshot.stage||'generating'};
    progress=generationProgressController(outputCount);
    setButtons(true,'Создаём визуал…');
    renderVitrioCatalog();
    syncVitrioGenerationSnapshot(snapshot,{resultCountBefore,progress,outputCount});
    if(snapshot.status==='processing')snapshot=await recoverVitrioGeneration({projectId,resultCountBefore,progress,outputCount,requestKey,shouldStop,waitWhileIdle:true});
    if(shouldStop())return;
    if(!snapshot){preserveGenerationProgress=true;progress.hold();showStudioError('Не удалось подтвердить результат. Нажмите «Проверить результат», чтобы продолжить проверку того же запроса.');return;}
    await applyVitrioGenerationResult(snapshot,{type:projectType(),resultCountBefore,progress,outputCount});
    clearVitrioGenerationRequestKey(projectId);
  }catch(error){
    if(shouldStop())return;
    if(error.terminal){clearVitrioGenerationRequestKey(projectId);state.generationPreview=null;renderVitrioCatalog();}
    else if(state.generationPreview){preserveGenerationProgress=true;(progress||activeVitrioGenerationProgress)?.hold();}
    showStudioError(error.message);
  }finally{
    if(!shouldStop()){
      state.generationActive=false;
      if(!preserveGenerationProgress)progress?.stop();
      setButtons(false,state.generationPreview?.requestKey?'Проверить результат':'Сгенерировать');
    }else progress?.stop();
  }
}
 async function generate(event){
   event.preventDefault();
   if(state.generationActive)return;
   if(state.generationPreview?.requestKey)return resumeVitrioGeneration(state.project?.id);
   const viewRevision=vitrioGenerationViewRevision;
   state.generationActive=true;
   const type=projectType();
   if((type==='product'||type==='merch')&&!state.sources.length){state.generationActive=false;return showStudioError(type==='merch'?'Сначала добавьте хотя бы один референс для мерча.':'Сначала добавьте от одного до четырёх фото товара.');}
   let project=state.project;
   const buttons=[...document.querySelectorAll('.v-generate,.v-studio-generate-button')];
   const button=document.querySelector('.v-generate')||buttons[0];
   const setButtons=(disabled,label)=>buttons.forEach((control)=>{control.disabled=disabled;const text=control.querySelector(':scope > span');if(text&&label)text.textContent=label;});
  const outputCount=selectedOutputCount();
  let progress;
  let projectId='';
  let resultCountBefore=0;
   let generationRequested=false;
   let generationMonitorStopped=false;
   const viewChanged=()=>viewRevision!==vitrioGenerationViewRevision||Boolean(projectId&&String(state.project?.id)!==String(projectId))||!isVitrioRoute('/studio');
   const shouldStop=()=>generationMonitorStopped||viewChanged();
   // An interrupted browser request does not mean that the paid provider
   // request stopped. Keep both the visual state and the stable request key
   // until the server confirms a final result.
   let preserveGenerationProgress=false;
  try{
    if(!project){
      const made=await request('/vitrio/projects',{method:'POST',body:JSON.stringify({title:document.querySelector('#title').value,category:projectCategory(),projectType:type})});
      if(viewChanged())return;
      project=made.project;
      state.project=project;
      history.replaceState({},'',`/vitrio/studio?id=${project.id}`);
    }
     showStudioError('');
     setButtons(true,'Создаём визуал…');
     progress=generationProgressController(outputCount);
     clearTimeout(saveTimer);
     pendingProjectSave=null;
     state.saveRevision+=1;
     progress.generating();
    const settings=getSettings();
    if(type==='thumbnail'&&(settings.thumbnail.topic.length<2||!state.thumbnailTemplates.some((template)=>template.id===settings.thumbnail.templateId)))throw new Error(settings.thumbnail.topic.length<2?'Укажите тему видео — минимум два символа.':'Шаблоны превью недоступны. Обновите страницу и попробуйте ещё раз.');
    const manualLineCount=(document.querySelector('#card-lines')?.value||'').split(/\r?\n/).map((line)=>line.trim()).filter(Boolean).length;
    if(type==='product'&&settings.content==='card'&&!settings.cardCopyAuto&&(settings.cardCopy.headline.length<1||(settings.cardTemplateId==='none'?manualLineCount!==3:manualLineCount>4)))throw new Error(settings.cardTemplateId==='none'?'Укажите заголовок и ровно три коротких качества — каждое с новой строки.':'Укажите заголовок и не больше четырёх коротких подписей — каждая с новой строки.');
    resultCountBefore=projectResults().length;
    state.generationPreview={before:resultCountBefore,total:outputCount,ratio:settings.aspectRatio||'4:5'};
    renderVitrioCatalog();
    if(studioRefreshEnabled())setStudioView('catalog');
     projectId=project.id;
     const requestKey=vitrioGenerationRequestKey(project.id);
     state.generationPreview.requestKey=requestKey;
     generationRequested=true;
      const generationRequest=request('/vitrio/generate',{method:'POST',body:JSON.stringify({projectId:project.id,projectType:type,imageDataUrls:state.sources,title:document.querySelector('#title').value,category:projectCategory(),...settings,scene:settings.content,settings,idempotencyKey:requestKey})});
     void generationRequest.catch(()=>{});
     // Status polling is advisory while the authoritative POST is alive.
     // A proxy error on this GET must never win the race against paid work.
     const monitorRequest=recoverVitrioGeneration({projectId,resultCountBefore,progress,outputCount,requestKey,shouldStop,waitWhileIdle:true}).catch(()=>null).then((recovery)=>recovery||new Promise(()=>{}));
      let response=await Promise.race([generationRequest,monitorRequest]);
      if(viewChanged())return;
      if(response?.recovered&&response.status==='processing')response=await recoverVitrioGeneration({projectId,resultCountBefore,progress,outputCount,requestKey,shouldStop,waitWhileIdle:true});
      if(viewChanged())return;
      if(!response)throw Object.assign(new Error('Генерация ещё выполняется. Оставьте студию открытой — результат появится автоматически.'),{code:'NETWORK_ERROR'});
     generationMonitorStopped=true;
      await applyVitrioGenerationResult(response,{type,resultCountBefore,progress,outputCount});
      clearVitrioGenerationRequestKey(project.id);
  }catch(cause){
     if(viewChanged())return;
     // Stop the race monitor before starting the single authoritative
     // recovery loop below; otherwise both loops can apply the same snapshot.
     generationMonitorStopped=true;
     const shouldRecover=Boolean(projectId)&&generationRequested&&(cause.code==='NETWORK_ERROR'||cause.status===429||cause.status>=500);
    if(shouldRecover){
      try{
         const recovery=await recoverVitrioGeneration({projectId,resultCountBefore,progress,outputCount,requestKey:vitrioGenerationRequestKey(projectId),shouldStop:viewChanged,waitWhileIdle:true});
          if(viewChanged())return;
          if(recovery){
            await applyVitrioGenerationResult(recovery,{type,resultCountBefore,progress,outputCount});
            clearVitrioGenerationRequestKey(projectId);
            return;
          }
          preserveGenerationProgress=true;
          progress?.hold();
          showStudioError('Не удалось подтвердить результат генерации. Повторная проверка использует тот же запрос и не запускает его заново.');
          return;
      }catch(recoveryError){
        if(viewChanged())return;
        if(recoveryError.terminal){clearVitrioGenerationRequestKey(projectId);state.generationPreview=null;renderVitrioCatalog();showStudioError(recoveryError.message);notice(recoveryError.message);return;}
        preserveGenerationProgress=true;
        progress?.hold();
        showStudioError(recoveryError.message);
        return;
      }
    }
     clearVitrioGenerationRequestKey(projectId);
     state.generationPreview=null;
     renderVitrioCatalog();
     showStudioError(cause.message);
     if(studioRefreshEnabled())notice(cause.message);
   }finally{
     generationMonitorStopped=true;
     if(!viewChanged()){
       state.generationActive=false;
       if(!preserveGenerationProgress)progress?.stop();
       if(!state.generationPreview&&document.querySelector('[data-studio-catalog-grid]'))renderVitrioCatalog();
       setButtons(false,state.generationPreview?.requestKey?'Проверить результат':'Сгенерировать');
     }else progress?.stop();
   }
}
function downloadResult(index){const result=projectResults()[index];if(!result?.image)return false;const a=document.createElement('a');a.href=result.image;a.download=`vitrio-visual-${index+1}.png`;a.target='_blank';a.rel='noopener';document.body.append(a);a.click();a.remove();return true;}
function openDownloadDialog(){const entries=projectResults().map((result,index)=>({result,index})).filter(({result})=>result?.image);if(!entries.length)return notice('Сначала создайте хотя бы один вариант.');const el=document.createElement('div');el.className='v-dialog-backdrop v-download-backdrop';el.innerHTML=`<section class="v-dialog v-download-dialog" role="dialog" aria-modal="true" aria-labelledby="download-title"><header class="v-dialog-titlebar"><h2 id="download-title">Скачать варианты</h2><button class="v-icon-button" type="button" data-close aria-label="Закрыть окно скачивания">${icon('close')}</button></header><div class="v-download-list">${entries.map(({result,index})=>`<article class="v-download-item"><img src="${esc(result.image)}" alt="Версия ${index+1}"><b>Версия ${index+1}</b><button class="v-button v-button--soft v-button--small" type="button" data-download-result="${index}">${icon('download','v-icon--tiny')}Скачать</button></article>`).join('')}</div><footer class="v-dialog-actions v-download-actions"><button class="v-button v-button--accent" type="button" data-download-all>${icon('download','v-icon--tiny')}Скачать всё · ${entries.length}</button><button class="v-button v-button--soft" type="button" data-close>Отмена</button></footer></section>`;document.body.append(el);const close=()=>dismissDialog(el);el.querySelectorAll('[data-close]').forEach((button)=>button.addEventListener('click',close));el.addEventListener('click',(event)=>{if(event.target===el)close();});el.querySelectorAll('[data-download-result]').forEach((button)=>button.addEventListener('click',()=>{const index=Number(button.dataset.downloadResult);if(downloadResult(index)){close();notice(`Версия ${index+1} скачивается.`);}}));el.querySelector('[data-download-all]')?.addEventListener('click',()=>{entries.forEach(({index},position)=>setTimeout(()=>downloadResult(index),position*140));close();notice(`Скачиваем все ${entries.length} варианта.`);});el.querySelector('[data-close]')?.focus();}
function openCompare(source,result){const el=document.createElement('div');el.className='v-dialog-backdrop';el.innerHTML=`<div class="v-dialog v-compare-dialog"><div class="v-canvas-head"><h2>Сравнение</h2><button class="v-icon-button" data-close aria-label="Закрыть сравнение">${icon('close')}</button></div><div class="v-comparison v-modal-comparison" data-modal-compare style="--compare:48%"><img src="${esc(source)}" alt="Исходник"><div class="v-comparison-after"><img src="${esc(result)}" alt="Результат"></div><span class="v-modal-compare-label v-modal-compare-label--source">Исходник</span><span class="v-modal-compare-label v-modal-compare-label--result">Результат</span><div class="v-comparison-divider"><span class="v-comparison-handle"></span></div><input class="v-comparison-range" type="range" min="0" max="100" value="48" aria-label="Проведите, чтобы сравнить исходник и результат"></div><p class="v-modal-compare-hint">Потяните разделитель, чтобы сравнить изображения</p></div>`;document.body.append(el);renderComparison('[data-modal-compare]');const close=()=>dismissDialog(el);el.querySelector('[data-close]').addEventListener('click',close);el.addEventListener('click',e=>{if(e.target===el)close();});}
function openBillingConsentDialog({isPack,onAccept}){const dialog=document.createElement('div');dialog.className='v-dialog-backdrop';dialog.innerHTML=`<section class="v-dialog v-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="billing-consent-title" aria-describedby="billing-consent-copy"><header class="v-dialog-titlebar"><div><h2 id="billing-consent-title">Согласитесь с правилами</h2></div><button class="v-icon-button" type="button" data-close aria-label="Закрыть окно">${icon('close')}</button></header><p id="billing-consent-copy">Чтобы перейти к защищённой оплате, подтвердите условия оформления.</p><ul>${isPack?'<li>Публичную оферту и пользовательское соглашение</li>':'<li>Публичную оферту, условия подписки и правила конкурса</li><li>Согласие на регулярные списания</li>'}</ul><button class="v-button v-button--accent" type="button" data-accept-consents>Согласиться и продолжить</button></section>`;document.body.append(dialog);const close=()=>dismissDialog(dialog);dialog.querySelector('[data-close]').addEventListener('click',close);dialog.addEventListener('click',(event)=>{if(event.target===dialog)close();});const accept=dialog.querySelector('[data-accept-consents]');accept.addEventListener('click',()=>{accept.disabled=true;close();onAccept();});accept.focus();}
function billingPlanCode(){const code=new URLSearchParams(location.search).get('plan');return VITRIO_BILLING_PRODUCTS[code]?code:'start';}
function billingPlanCard(planCode,{period='week'}={}){const product=VITRIO_BILLING_PRODUCTS[planCode];if(product.type==='pack')return `<div class="v-billing-plan v-billing-plan--pack"><span>Выбранный пакет</span><h2>${product.name}</h2><div><b>${product.price.toLocaleString('ru-RU')} ₽</b><small>разовый платёж</small></div><p>${product.credits} звёзд будут добавлены на баланс после оплаты.</p></div>`;const terms=product.periods[period]||product.periods.week;if(period!=='week')return `<div class="v-billing-plan"><span>Выбранный тариф</span><h2>${product.name}</h2><div><b>${terms.price.toLocaleString('ru-RU')} ₽</b><small>за ${billingPeriodLabel(period,planCode)}</small></div><p>${terms.credits.toLocaleString('ru-RU')} звёзд начисляются после оплаты. Затем ${terms.price.toLocaleString('ru-RU')} ₽ списываются каждые ${billingPeriodLabel(period,planCode)} до отмены.</p></div>`;const periodDays=billingPeriodDays(period,planCode);const dailyPrice=planCode==='start'&&periodDays===5?60:product.dailyPrice;return `<div class="v-billing-plan"><span>Выбранный тариф</span><h2>${product.name}</h2><div><b>1 ₽</b><small>первые 24 часа</small></div><p>Через 24 часа списывается ${product.price.toLocaleString('ru-RU')} ₽ за ${periodDays} дней. Возможны дневные списания ${dailyPrice.toLocaleString('ru-RU')} ₽.</p></div>`;}
function loadCloudPaymentsWidget(){
  return loadCloudPaymentsRuntime();
}
async function openCloudPaymentsCheckout(payment,widgetConfig,preparation){
  const config=widgetConfig&&typeof widgetConfig==='object'?widgetConfig:null;
  if(!config?.publicTerminalId||!config?.externalId||!Number.isFinite(Number(config.amount))||Number(config.amount)<=0)throw new Error('Платёжная форма пока не готова. Попробуйте ещё раз через пару секунд.');
  if(await (await import('/assets/vitrio-tpay.js?v=20261013-payment-unified-1')).tryDirectTpay(config,{request:(url,options)=>request(url.replace(/^\/api/,''),options),beforeOpen:({open})=>preparation.ready(open)}))return;
  const cp=await loadCloudPaymentsWidget();
  if(!await preparation.ready({cardFormPending:true}))return;
  preparation.watchCardForm();
  const returnUrl=String(config.successRedirectUrl||config.failRedirectUrl||`/vitrio/billing/return?payment_id=${encodeURIComponent(payment.id)}`);
  let redirected=false;
  const redirect=()=>{if(redirected)return;redirected=true;location.assign(returnUrl);};
  const widget=new cp.CloudPayments();
  const emailBehavior=['Required','Optional','Hidden'].includes(config.emailBehavior)?config.emailBehavior:'Required';
  const result=await widget.start({ retryPayment: false,publicTerminalId:config.publicTerminalId,description:config.description,amount:Number(config.amount),currency:config.currency||'RUB',culture:config.culture||'ru-RU',paymentSchema:config.paymentSchema||'Single',externalId:config.externalId,userInfo:config.userInfo,...(config.receiptEmail||config.userInfo?.email?{receiptEmail:config.receiptEmail||config.userInfo.email}:{}),emailBehavior,tokenize:Boolean(config.tokenize),restrictedPaymentMethods:Array.isArray(config.restrictedPaymentMethods)?config.restrictedPaymentMethods:config.sbpSupport===false?['Sbp']:[],metadata:config.metadata,...(config.receipt?{receipt:config.receipt}:{}),successRedirectUrl:returnUrl,failRedirectUrl:String(config.failRedirectUrl||returnUrl)});
  preparation.stop();
  if(['success','appointment','wait'].includes(String(result?.status||'').toLowerCase()))redirect();
  if(result?.type==='error'||['fail','reject'].includes(String(result?.status||'').toLowerCase()))redirect();
  if(result?.type==='cancel'||String(result?.status||'').toLowerCase()==='cancel')throw new Error('Оплата отменена. Вы можете открыть форму ещё раз.');
  if(!redirected)throw new Error(result?.message||'CloudPayments не подтвердил оплату. Попробуйте ещё раз.');
}
async function openVitrioCardCheckout(data,preparation){
  const card=data?.cardCheckout,payment=data?.payment,widget=data?.cloudPaymentsWidget;
  if(!card?.publicId||!card?.chargeUrl||!payment?.id)return false;
  const chargeUrl=new URL(String(card.chargeUrl),location.origin);
  if(chargeUrl.origin!==location.origin||!chargeUrl.pathname.startsWith('/api/vitrio/'))throw new Error('Некорректный адрес оплаты картой. Обновите страницу.');
  const {createVitrioCardSheet}=await import('/assets/vitrio-card-sheet.js?v=20261011-bot-ui-consent-1');
  const title=VITRIO_BILLING_PRODUCTS[payment.planCode]?.name||'Vitrio';
  const amount=Number(payment.amount??widget?.amount);
  const returnUrl=String(widget?.successRedirectUrl||widget?.failRedirectUrl||`/vitrio/billing/return?payment_id=${encodeURIComponent(payment.id)}`);
  const sheet=createVitrioCardSheet({publicId:card.publicId,onCheckStatus:()=>location.assign(returnUrl),onCryptogram:async({invoiceId,cryptogram})=>{
    const result=await request(`${chargeUrl.pathname.replace(/^\/api/,'')}${chargeUrl.search}`,{method:'POST',body:JSON.stringify({invoiceId,cryptogram})});
    cryptogram=null;
    if(result?.status==='3ds_required'){
      const challengeUrl=new URL(String(result.challengeUrl||''),location.origin);
      if(challengeUrl.origin!==location.origin||challengeUrl.pathname!=='/api/vitrio/billing/card-3ds-challenge'||!result.challengeToken)throw new Error('Не удалось безопасно открыть подтверждение банка.');
      await sheet.confirmBank(result);
      location.assign(returnUrl);
      return;
    }
    if(result?.status!=='completed')throw new Error('Статус оплаты не подтверждён.');
    const paymentStatus=String(result.payment?.status||'').toLowerCase();
    if(['canceled','cancelled','failed'].includes(paymentStatus))throw new Error('Банк отклонил платёж. Проверьте данные карты или попробуйте другую.');
    if(!['succeeded','pending','creating'].includes(paymentStatus))throw new Error('Статус оплаты не подтверждён.');
    location.assign(returnUrl);
  }});
  if(!await preparation.ready({cardFormPending:true}))return true;
  const result=await sheet.open({invoiceId:payment.id,title,amountLabel:`${Number.isFinite(amount)?amount.toLocaleString('ru-RU'):1} ₽`,onBeforeShow:()=>preparation.stop()});
  if(result?.status==='cancel')throw new Error('Оплата отменена. Вы можете открыть форму ещё раз.');
  return true;
}
async function openVitrioPayment(data,selectedMethod='',preparation){
  if(selectedMethod&&data?.cloudPaymentsWidget){
    const method={card:'Card',sbp:'Sbp',tpay:'TinkoffPay'}[selectedMethod];
    const config=data.cloudPaymentsWidget;
    const restricted=Array.isArray(config.restrictedPaymentMethods)?config.restrictedPaymentMethods:config.sbpSupport===false?['Sbp']:[];
    if(!method||restricted.includes(method))throw new Error('Этот способ оплаты недоступен. Выберите другой.');
    data={...data,cloudPaymentsWidget:{...config,restrictedPaymentMethods:[...new Set([...restricted,...['Card','Sbp','TinkoffPay'].filter(value=>value!==method)])]}};
  }
  if(selectedMethod==='card'&&await openVitrioCardCheckout(data,preparation))return true;
  if(['sbp','tpay'].includes(selectedMethod)){
    const prepared=preparedBankHandoff(data,selectedMethod);
    if(prepared.url){const bank=(await import('/assets/vitrio-tpay.js?v=20261013-payment-unified-1'));await preparation.ready(()=>selectedMethod==='sbp'?bank.openSbpBankUrl(prepared.url,prepared.qrDataUrl,bank.openExternalBankUrl):bank.openExternalBankUrl(prepared.url));return true;}
    throw new Error('Не удалось загрузить страницу банка. Проверьте соединение и статус текущей оплаты перед повторной попыткой.');
  }
  if(data?.paymentFlow?.type==='sbp_subscription'){
    const createLinkUrl=String(data.paymentFlow.createLinkUrl||'');
    if(!createLinkUrl.startsWith('/api/vitrio/billing/payments/'))throw new Error('Не удалось подготовить привязку счёта СБП. Попробуйте ещё раз.');
    const response=await fetch(createLinkUrl,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({webview:false,externalBrowser:true})}).catch(()=>null);
    const result=response?await response.json().catch(()=>({})):{};
    if(!response?.ok)throw new Error(result.error||'Не удалось открыть приложение банка. Попробуйте ещё раз.');
    let redirect;try{redirect=new URL(String(result.redirectUrl||''));}catch{throw new Error('Платёжный сервис не вернул ссылку СБП. Попробуйте ещё раз.');}
    if(redirect.protocol!=='https:'||redirect.username||redirect.password||redirect.port)throw new Error('Платёжный сервис не вернул ссылку СБП. Попробуйте ещё раз.');
    const bank=(await import('/assets/vitrio-tpay.js?v=20261013-payment-unified-1'));await preparation.ready(()=>bank.openSbpBankUrl(redirect.href,result.qrDataUrl,bank.openExternalBankUrl));
    return true;
  }
  return openCloudPaymentsCheckout(data?.payment,data?.cloudPaymentsWidget,preparation);
}
let vitrioPaymentPreparing=false;
async function checkoutVitrioPayment(body,method='',validate,existingPayload=null){
  if(vitrioPaymentPreparing)return false;
  vitrioPaymentPreparing=true;
  const preparation=createPaymentPreparation({method});
  let data;
  try{
    data=existingPayload||await request('/vitrio/billing/checkout',{method:'POST',body:JSON.stringify(body)});
    validate?.(data);
    return await openVitrioPayment(data,method,preparation);
  }catch(error){
    const id=String(data?.payment?.id||'');
    const recovery=preparation.fail(error,{onCheckStatus:/^[A-Za-z0-9_-]{1,128}$/.test(id)?()=>location.assign('/billing/return?payment_id='+encodeURIComponent(id)):null,
      ...(error.paymentSdkNotStarted&&data?{onRetry:()=>{recovery.close();return checkoutVitrioPayment(body,method,validate,data);}}:{})});
    throw error;
  }finally{preparation.stop();vitrioPaymentPreparing=false;}
}
async function billing(){
  const planCode=billingPlanCode();
  const billingPeriod=billingPeriodCode();
  const product=VITRIO_BILLING_PRODUCTS[planCode];
  const robuxCampaign=new URLSearchParams(location.search).get('landing')==='vitrio-robux';
  const robuxCampaignValue=new URLSearchParams(location.search).get('campaign');
  let campaignBanner=robuxBanner;
  if(robuxCampaign&&robuxCampaignValue){
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(robuxCampaignValue)){
      app.innerHTML='<main class="v-billing"><section class="v-billing-card v-billing-status"><h1>Кампания недоступна</h1><p>Запросите у партнёра актуальную ссылку на лендинг.</p></section></main>';return;
    }
    try{
      const {campaign}=await request(`/vitrio/robux-campaigns/${encodeURIComponent(robuxCampaignValue)}`,{legacyAuth:false});
      if(campaign?.document?.schemaVersion!==1)throw new Error('Campaign unavailable');
      campaignBanner=robuxCheckoutBanner(campaign,robuxCampaignValue);
    }catch{
      app.innerHTML='<main class="v-billing"><section class="v-billing-card v-billing-status"><h1>Кампания недоступна</h1><p>Запросите у партнёра актуальную ссылку на лендинг.</p></section></main>';return;
    }
  }
  const paymentLogo=robuxCampaign?()=>`<a class="robux-logo" href="${studioUrl('/robux')}" aria-label="Vitrio — к регистрации"><img src="/assets/vitrio/ai-chat/logo-dark-208.webp" width="208" height="62" alt="Vitrio"></a>`:logo;
  const weekCampaign=vitrioCampaign();
  const weekPromo=vitrioPromoCode();
  const checkoutQuery=new URLSearchParams({plan:planCode,period:billingPeriod,campaign:weekCampaign,promoCode:weekPromo,refCode:vitrioReferralCode()});
  let subscription,checkoutContext;
  try{[subscription,checkoutContext]=await Promise.all([
    request('/vitrio/billing/subscription').then(data=>data.subscription),
    request(`/vitrio/billing/checkout-context?${checkoutQuery}`).then(context=>{
      prewarmCloudPaymentsRuntime(context?.paymentMethods?.includes('card')===true);
      if(context?.paymentMethods?.includes('card'))void import('/assets/vitrio-card-sheet.js?v=20261011-bot-ui-consent-1').then(module=>module.preloadVitrioCardSheet()).catch(()=>{});
      if(context?.paymentMethods?.some(method=>['sbp','tpay'].includes(method)))void import('/assets/vitrio-tpay.js?v=20261013-payment-unified-1').catch(()=>{});
      return context;
    }),
  ]);}
  catch(cause){if(cause.status===401)return go('/vitrio/login');throw cause;}
  const matchesExistingSubscription=subscriptionMatchesBillingSelection(subscription,planCode,billingPeriod);
  const newPaymentMethod=new URLSearchParams(location.search).get('new_payment_method')==='1';
  if(subscription?.periodActive===true&&product.type==='subscription'&&(subscription.autoRenewal||matchesExistingSubscription&&!newPaymentMethod)){
    if(subscription.autoRenewal){
      app.innerHTML=`<main class="v-billing"><section class="v-billing-card v-billing-card--contest v-billing-status">${logo()}<span class="v-contest-status-mark">${icon('check')}</span><p class="v-billing-kicker">УЧАСТИЕ ПОДТВЕРЖДЕНО</p><h1>Вы уже участвуете в конкурсе</h1><p class="v-billing-copy">Подписка активна. Ожидайте итоги ежемесячного розыгрыша в Telegram-канале Vitrio.</p><a class="v-button v-button--accent" href="https://t.me/VitrioAI" target="_blank" rel="noopener">Перейти в Telegram-канал</a></section></main>`;
      bindCommon();
      return;
    }
    const existingPlan=VITRIO_BILLING_PRODUCTS[subscriptionCheckoutPlanCode(subscription)]||product;
    const existingPeriod=subscriptionCheckoutPeriod(subscription);
    const accessUntil=subscription.paidThroughAt?workspaceDate(subscription.paidThroughAt).replace(/\.$/,''):'конца оплаченного периода';
    app.innerHTML=`<main class="v-billing"><form class="v-billing-card v-billing-card--contest" id="resume-auto-renewal-form" novalidate>${logo()}<span class="v-contest-status-mark v-contest-status-mark--muted">${icon('repeat')}</span><p class="v-billing-kicker">ПРОДЛЕНИЕ ОТКЛЮЧЕНО</p><h1>${esc(existingPlan.name)} уже оформлен</h1><p class="v-billing-copy">Подписка на ${billingPeriodLabel(existingPeriod)} действует до ${accessUntil}. Возобновите автопродление этого же тарифа без повторного оформления.</p><label class="v-billing-check"><input type="checkbox" name="renewalConsent" required><span>${resumeRecurringConsentCopy(subscription)} <a href="/vitrio/subscription-terms" target="_blank" rel="noopener">Условия подписки</a>.</span></label><p class="v-form-error" hidden></p><button class="v-button v-button--accent" type="submit">Возобновить подписку</button></form></main>`;
    bindCommon();
    document.querySelector('#resume-auto-renewal-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget;const button=form.querySelector('button');const error=form.querySelector('.v-form-error');if(!form.elements.renewalConsent.checked){error.textContent='Подтвердите условия подписки, чтобы включить автопродление.';error.hidden=false;return;}button.disabled=true;error.hidden=true;try{await request('/vitrio/billing/resume-auto-renewal',{method:'POST',body:JSON.stringify({renewalConsent:true,dailyFallbackConsent:true})});app.innerHTML=`<main class="v-billing"><section class="v-billing-card v-billing-card--contest v-billing-status">${logo()}<span class="v-contest-status-mark">${icon('check')}</span><p class="v-billing-kicker">ПОДПИСКА ВОЗОБНОВЛЕНА</p><h1>Автопродление снова включено</h1><p class="v-billing-copy">Следующий период продолжится по условиям ${esc(existingPlan.name)}. Управлять подпиской можно в личном кабинете.</p><a class="v-button v-button--accent" href="${studioUrl('/studio')}">Перейти в студию</a></section></main>`;bindCommon();}catch(cause){if(showResumePaymentRecovery(cause,form,'billing'))return;error.textContent=cause.message;error.hidden=false;button.disabled=false;}});
    return;
  }
  if(product.type==='subscription'&&new URLSearchParams(location.search).get('checkout')==='partner'){
    const context=checkoutContext;
    const entry=vitrioReferralCode()?await request(`/vitrio/referral-checkout?ref=${encodeURIComponent(vitrioReferralCode())}`,{legacyAuth:false}):null;
    const assigned=context.referral?.subscriptionOffer||entry?.subscriptionOffer;
    if(billingPeriod==='week'&&context.trialEligible&&['start','medium','pro'].includes(assigned)&&assigned!==planCode){
      const target=new URL(location.href);target.searchParams.set('plan',assigned);history.replaceState({},'',target.pathname+target.search);return billing();
    }
    // An explicit direct link may reuse the new payment view for an existing account,
    // without re-registering it, changing attribution, or granting a trial.
    if(context.eligible&&context.trialEligible||entry?.eligible){
      const {mountPartnerPayment}=await import('/assets/vitrio-partner-checkout.js?v=20261012-checkout-consent-1');
      if(robuxCampaign)document.body.className='robux-body robux-body--checkout';
      return mountPartnerPayment({app,logo:paymentLogo,icon,esc,product,planCode,period:billingPeriod,trialEligible:context.trialEligible,amount:context.amount,paymentMethodAmounts:context.paymentMethodAmounts,paymentMethods:context.paymentMethods,receiptEmailRequired:state.user?.receiptEmailRequired,dataConsentRequired:newPaymentMethod||context.dataConsentRequired===true,...(robuxCampaign?{bannerHtml:campaignBanner,benefitItems:[['gift','Участие в розыгрыше'],['image','Товарные карточки и рекламные визуалы'],['folder','Сохранение проектов'],['download','Скачивание готовых изображений']]}:{}),
        checkout:async({method,receiptEmail,legalAccepted,legalDocuments})=>{
          await checkoutVitrioPayment({planCode,paymentMethod:method,...(receiptEmail?{receiptEmail}:{}),legalAccepted,legalDocuments,context:{billingPeriod,campaign:billingPeriod==='week'?weekCampaign:null,promoCode:billingPeriod==='week'?weekPromo:null,refCode:vitrioReferralCode()}},method,data=>{
            if(Number(data?.payment?.amount)!==Number(context.paymentMethodAmounts?.[method]??context.amount))throw new Error('Условия оплаты изменились. Обновите страницу и проверьте сумму.');
            if(receiptEmail)state.user={...state.user,receiptEmailRequired:false};
          });
          return {handoff:true};
        },onUnauthorized:()=>go(studioUrl('/login'))});
    }
  }
  {
    const {mountPartnerPayment}=await import('/assets/vitrio-partner-checkout.js?v=20261012-checkout-consent-1');
    if(robuxCampaign)document.body.className='robux-body robux-body--checkout';
    return mountPartnerPayment({app,logo:paymentLogo,icon,esc,product,planCode,period:billingPeriod,trialEligible:checkoutContext.trialEligible,amount:checkoutContext.amount,paymentMethodAmounts:checkoutContext.paymentMethodAmounts,paymentMethods:checkoutContext.paymentMethods,receiptEmailRequired:state.user?.receiptEmailRequired,dataConsentRequired:newPaymentMethod||checkoutContext.dataConsentRequired===true,...(robuxCampaign?{bannerHtml:campaignBanner,benefitItems:[['gift','Участие в розыгрыше'],['image','Товарные карточки и рекламные визуалы'],['folder','Сохранение проектов'],['download','Скачивание готовых изображений']]}:{}),
      checkout:async({method,receiptEmail,legalAccepted,legalDocuments})=>{
        await checkoutVitrioPayment({planCode,paymentMethod:method,...(receiptEmail?{receiptEmail}:{}),legalAccepted,legalDocuments,context:{billingPeriod,campaign:billingPeriod==='week'?weekCampaign:null,promoCode:billingPeriod==='week'?weekPromo:null,refCode:vitrioReferralCode()}},method,data=>{
          if(Number(data?.payment?.amount)!==Number(checkoutContext.paymentMethodAmounts?.[method]??checkoutContext.amount))throw new Error('Условия оплаты изменились. Обновите страницу и проверьте сумму.');
          if(receiptEmail)state.user={...state.user,receiptEmailRequired:false};
        });
        return {handoff:true};
      },onUnauthorized:()=>go(studioUrl('/login'))});
  }
  const isPack=product.type==='pack';
  const isHybrid=false; // Hybrid is assigned once by the server, never an upsell consent.
  let selectedPlanCode=isHybrid&&planCode==='pro'?'pro':planCode;
  const subscriptionAgreement='<label class="v-billing-check"><input type="checkbox" name="offer" required><span>Принимаю <a href="/vitrio/offer" target="_blank" rel="noopener">публичную оферту</a>, <a href="/vitrio/subscription-terms" target="_blank" rel="noopener">условия подписки</a> и <a href="/vitrio/contest-rules" target="_blank" rel="noopener">правила конкурса</a></span></label>';
  const hybridUpgrade=isHybrid?`<label class="v-billing-check"><input type="checkbox" name="proUpgrade" ${selectedPlanCode==='pro'?'checked':''}><span>Подключить Vitrio Pro: после первых 24 часов за 1 ₽ будет списано 1 000 ₽, далее 1 000 ₽ каждые 7 дней вместо 300 ₽. При неуспешной оплате — 150 ₽ в день. Вы получите 300 звёзд вместо 80.</span></label>`:'';
  const recurringConsent=`<label class="v-billing-check"><input type="checkbox" name="recurring" required><span data-billing-recurring-copy>${initialRecurringConsentCopy(selectedPlanCode,billingPeriod)}</span></label>`;
  const receiptEmailField=state.user?.receiptEmailRequired?'<label class="v-field v-receipt-email"><span>Email для кассового чека</span><input name="receiptEmail" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="name@example.com" required></label>':'';
  const agreement=isPack
    ?'<label class="v-billing-check"><input type="checkbox" name="offer" required><span>Принимаю <a href="/vitrio/offer" target="_blank" rel="noopener">публичную оферту</a> и <a href="/vitrio/agreement" target="_blank" rel="noopener">пользовательское соглашение</a></span></label>'
    :`${subscriptionAgreement}${hybridUpgrade}${recurringConsent}`;
  const checkoutText=()=>isPack?`Оплатить ${product.price.toLocaleString('ru-RU')} ₽`:billingPeriod==='week'?'Перейти к оплате 1 ₽':`Перейти к оплате ${(VITRIO_BILLING_PRODUCTS[selectedPlanCode].periods[billingPeriod]?.price||0).toLocaleString('ru-RU')} ₽`;
  const legal=isPack?'Разовая покупка: карта не сохраняется, автоматических списаний не будет.':'Способ оплаты выбирается в защищённой форме CloudPayments. Vitrio не получает и не хранит банковские реквизиты; автопродление включается только после подтверждения провайдера.';
  app.innerHTML=`<main class="v-billing"><form class="v-billing-card" id="billing-form" novalidate>${logo()}<p class="v-billing-kicker">${isPack?'ПОКУПКА ЗВЁЗД':'ОФОРМЛЕНИЕ ПОДПИСКИ'}</p><h1>${isPack?'Пополните запас звёзд.':'Начните со студии.'}</h1>${receiptEmailField}<div data-billing-plan>${billingPlanCard(selectedPlanCode,{period:billingPeriod})}</div>${agreement}<p class="v-form-error" hidden></p><button class="v-button v-button--accent" type="submit">${checkoutText(selectedPlanCode)}</button><p class="v-billing-legal">${legal}</p></form></main>`;
  const form=document.querySelector('#billing-form');
  const error=form.querySelector('.v-form-error');
  const syncHybridPlan=()=>{
    const selectedProduct=VITRIO_BILLING_PRODUCTS[selectedPlanCode];
    form.querySelector('[data-billing-plan]').innerHTML=billingPlanCard(selectedPlanCode,{period:billingPeriod});
    form.querySelector('[data-billing-recurring-copy]').textContent=initialRecurringConsentCopy(selectedPlanCode,billingPeriod);
    form.querySelector('[type="submit"]').textContent=checkoutText(selectedPlanCode);
  };
  form.elements.proUpgrade?.addEventListener('change',(event)=>{selectedPlanCode=event.currentTarget.checked?'pro':'start';syncHybridPlan();});
  const requiredConsents=()=>[form.elements.offer,form.elements.recurring].filter(Boolean);
  const hasRequiredConsents=()=>requiredConsents().every((input)=>input.checked);
  const startCheckout=async()=>{
    const button=form.querySelector('button');
    if(button.disabled)return;
    button.disabled=true;
    error.hidden=true;
    try{
      const recurringAccepted=isPack?false:form.elements.recurring.checked;
      if(form.elements.receiptEmail&&!form.elements.receiptEmail.validity.valid){form.elements.receiptEmail.reportValidity();form.elements.receiptEmail.focus();button.disabled=false;return;}
      const receiptEmail=String(form.elements.receiptEmail?.value||'').trim();
      await checkoutVitrioPayment({planCode:selectedPlanCode,...(receiptEmail?{receiptEmail}:{}),legalAccepted:{offer:form.elements.offer.checked,contest:isPack?false:form.elements.offer.checked,subscription:!isPack,recurring:recurringAccepted,dailyFallback:billingPeriod==='week'&&recurringAccepted},context:{billingPeriod,campaign:billingPeriod==='week'?weekCampaign:null,promoCode:billingPeriod==='week'?weekPromo:null,refCode:vitrioReferralCode()}},'',()=>{if(receiptEmail)state.user={...state.user,receiptEmailRequired:false};});
    }catch(cause){error.textContent=cause.message;error.hidden=false;button.disabled=false;}
  };
  form.addEventListener('submit',(event)=>{
    event.preventDefault();
    if(!hasRequiredConsents())return openBillingConsentDialog({isPack,onAccept:()=>{requiredConsents().forEach((input)=>{input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));});startCheckout();}});
    startCheckout();
  });
}
const robuxBanner=`<picture class="robux-checkout-banner"><source media="(max-width:520px)" srcset="/assets/vitrio/robux-preview/checkout-mobile.avif"><img src="/assets/vitrio/robux-preview/checkout-desktop.avif" width="960" height="360" alt="Персонаж Roblox в красном игровом городе" fetchpriority="high"></picture>`;
 function robuxCheckoutBanner(campaign,id){
   const image=campaign.document.images?.payment||{};
   const candidate=campaign.assets?.[image.assetId];
   const url=typeof candidate==='string'&&candidate.startsWith(`/api/vitrio/robux-campaigns/${id}/assets/`)?candidate:'';
   const phoneId=Object.hasOwn(image,'phoneAssetId')?image.phoneAssetId:image.assetId;
   const phoneCandidate=campaign.assets?.[phoneId];
   const phoneUrl=typeof phoneCandidate==='string'&&phoneCandidate.startsWith(`/api/vitrio/robux-campaigns/${id}/assets/`)?phoneCandidate:'';
   const bounded=(value,fallback,min,max)=>Number.isFinite(Number(value))&&value!==null?Math.min(max,Math.max(min,Number(value))):fallback;
   const placement=device=>{const current=image[device]&&typeof image[device]==='object'?image[device]:image.desktop&&typeof image.desktop==='object'?image.desktop:image;return {x:bounded(current.x,50,0,100),y:bounded(current.y,50,0,100),scale:bounded(current.scale,1,.5,2.5)};};
   const desktop=placement('desktop'),phone=placement('phone');
   const transform=({x,y,scale})=>`translate(${50-x}%,${50-y}%) scale(${scale})`;
   return `<picture class="robux-checkout-banner"><source media="(max-width:520px)" srcset="${esc(phoneUrl||'/assets/vitrio/robux-preview/checkout-mobile.avif')}"><img src="${esc(url||'/assets/vitrio/robux-preview/checkout-desktop.avif')}" width="960" height="360" alt="" data-responsive-poster style="object-position:50% 50%;--robux-desktop-transform:${transform(desktop)};--robux-phone-transform:${transform(phone)}" fetchpriority="high"></picture>`;
 }
function billingReturn() {
  const paymentId = new URLSearchParams(location.search).get('payment_id');
  if (!paymentId) return billing();
  app.innerHTML = `<main class="v-billing"><section class="v-billing-card v-billing-status">${logo()}<p class="v-billing-kicker">ПРОВЕРКА ПЛАТЕЖА</p><h1>Проверяем оплату…</h1><p>Не закрывайте страницу: обычно это занимает несколько секунд.</p></section></main>`;
  let attempts = 0;
  const refresh = async () => {
    try {
      const data = await request(`/vitrio/billing/payments/${encodeURIComponent(paymentId)}`);
      const payment = data.payment;
      if (payment.status === 'succeeded') {
        state.user = (await request('/vitrio/me')).user;
        const subscriptionPayment = payment.productType !== 'pack';
        const title = subscriptionPayment ? 'Спасибо за оплату.' : 'Платёж подтверждён.';
        const copy = subscriptionPayment
          ? payment.sbpBindingStatus==='linked'
            ? 'Оплата подтверждена, счёт СБП привязан для автоматического продления. Завершите хотя бы одну генерацию до конца месяца, чтобы получить билет в ежемесячный конкурс на 5 000 ₽.'
            : data.subscription?.autoRenewal
              ? 'Оплата подтверждена, выбранный способ сохранён для автоматического продления. Завершите хотя бы одну генерацию до конца месяца, чтобы получить билет в ежемесячный конкурс на 5 000 ₽.'
              : payment.paymentMethodType==='Sbp'
                ? 'Оплата подтверждена, но банк не завершил привязку счёта СБП. Доступ активирован без автопродления; для повторной привязки обратитесь в поддержку.'
                : 'Оплата подтверждена. Доступ активирован без автопродления; чтобы включить его, подтвердите карту или привяжите счёт СБП.'
          : `На баланс добавлено ${payment.credits} звёзд. Это разовая покупка без автоматических списаний.`;
        app.innerHTML = `<main class="v-billing"><section class="v-billing-card v-billing-status">${logo()}<h1>${title}</h1><p>${copy}</p></section></main>`;
        return;
      }
      if (payment.status === 'canceled') {
        app.innerHTML = `<main class="v-billing"><section class="v-billing-card v-billing-status">${logo()}<p class="v-billing-kicker">ОПЛАТА НЕ ЗАВЕРШЕНА</p><h1>Платёж отменён.</h1><p>Ничего не списано. Можно выбрать тариф и попробовать ещё раз.</p><a class="v-button v-button--soft" href="/vitrio/billing?plan=${esc(payment.planCode)}" data-go>Вернуться к тарифу</a></section></main>`;
        bindCommon();
        return;
      }
      if (attempts++ < 15) return setTimeout(refresh, 2000);
      document.querySelector('.v-billing-status p').textContent = 'Платёж всё ещё обрабатывается. Обновите страницу через минуту: статус сохранён.';
    } catch (cause) {
      document.querySelector('.v-billing-status p').textContent = cause.message;
    }
  };
  refresh();
}
const vitrioDomain=new Set(['vitrio.space','www.vitrio.space','studio.vitrio.space']).has(location.hostname);
const isVitrioRoute=(path)=>currentPath()===`/vitrio${path}`||(vitrioDomain&&currentPath()===path);
function trackVitrioReferral(){return Boolean(vitrioReferralCode());}
async function render(){stopSupportView();stopVitrioGenerationView();clearInterval(state.contestTimer);state.contestTimer=0;try{const legacyToken=token();if(!state.user||legacyToken){const session=await request('/vitrio/me');state.user=session.user;if(legacyToken){try{const cookieSession=await request('/vitrio/me',{legacyAuth:false});if(cookieSession.user?.id===session.user?.id)localStorage.removeItem(TOKEN_KEY);}catch{/* Keep a verified legacy token until the browser accepts its HttpOnly cookie. */}}}}catch{state.user=null;}if(isVitrioRoute('/set-password'))return vitrioSetPassword();if(isVitrioRoute('/recover'))return state.user?go('/vitrio/projects'):vitrioPasswordRecovery();if(isVitrioRoute('/login')||isVitrioRoute('/register'))return state.user?go(postAuthPath()):auth(isVitrioRoute('/login')?'login':'register');if(isVitrioRoute('/billing/return'))return state.user?billingReturn():go('/vitrio/login');if(isVitrioRoute('/billing'))return state.user?billing():go('/vitrio/login');if(isVitrioRoute('/subscription'))return state.user?go('/vitrio/projects?settings=subscription'):go('/vitrio/login');if(isVitrioRoute('/support'))return state.user?supportPage():go('/vitrio/login');if(isVitrioRoute('/contest'))return state.user?contestPage():go('/vitrio/login');if(isVitrioRoute('/projects'))return state.user?projects():go('/vitrio/login');if(isVitrioRoute('/studio'))return state.user?studio():go('/vitrio/login');void trackVitrioReferral();landing();}
function vitrioAccentSettings(s){return `<div class="v-palette-row"><label class="v-palette-chip"><input type="radio" name="accent" value="adaptive" ${s.accent==='adaptive'?'checked':''}><span>${icon('sparkle','v-icon--tiny')}<b>Авто</b></span></label><div class="v-swatches" role="radiogroup" aria-label="Готовые палитры">${[['charcoal and chartreuse','#3b5b28','Графит и лайм'],['neutral warm','#ddd0b4','Тёплая'],['cool blue','#a9d8ff','Голубая'],['natural green','#527342','Зелёная'],['lilac contrast','#b9a8ff','Сиреневая']].map(([v,c,label])=>`<label title="${label}"><input type="radio" name="accent" value="${v}" aria-label="${label}" ${s.accent===v?'checked':''}><span style="background:${c}"></span></label>`).join('')}</div></div>`;}
function websiteSettingsMarkup(s,project,radio){
  const site=s.website||{};
  const goal=site.goal||'landing';
  return `${settingsHead('Дизайн сайта','layout')}<form id="studio-form"><div class="v-settings-scroll"><section class="v-settings-group">${groupTitle('tag','О бренде')}<label class="v-field"><span>Название на сайте</span><input id="website-brand" value="${esc(site.brand||'')}" maxlength="90" placeholder="Например, Sfera Coffee" required></label><label class="v-field"><span>Чем занимается бренд</span><input id="website-business" value="${esc(site.business||'')}" maxlength="140" placeholder="Например, авторская кофейня" required></label><label class="v-field"><span>Что предлагает сайт</span><textarea id="website-offer" maxlength="400" placeholder="Продукт, главное действие и важные детали для посетителя." required>${esc(site.offer||'')}</textarea></label><label class="v-field"><span>Для кого · необязательно</span><input id="website-audience" value="${esc(site.audience||'')}" maxlength="140" placeholder="Например, горожане 25–40 лет"></label></section><section class="v-settings-group">${groupTitle('layout','Тип сайта')}<div class="v-segments v-segments--tiles v-segments--quad" role="radiogroup" aria-label="Тип сайта">${optionTile('website-goal','landing','Лендинг',goal,'layout')}${optionTile('website-goal','shop','Магазин',goal,'bag')}${optionTile('website-goal','portfolio','Портфолио',goal,'grid')}${optionTile('website-goal','service','Услуги',goal,'briefcase')}</div></section><section class="v-settings-group">${groupTitle('sparkle','Визуальный стиль')}<div role="radiogroup" aria-label="Визуальный стиль"><label class="v-scenario"><input type="radio" name="website-style" value="editorial" ${site.style==='editorial'||!site.style?'checked':''}><span aria-hidden="true"></span><span><b>Редакционный</b><small>Выразительная типографика и ритм</small></span></label><label class="v-scenario"><input type="radio" name="website-style" value="minimal" ${site.style==='minimal'?'checked':''}><span aria-hidden="true"></span><span><b>Минималистичный</b><small>Воздух, точная сетка, спокойная подача</small></span></label><label class="v-scenario"><input type="radio" name="website-style" value="expressive" ${site.style==='expressive'?'checked':''}><span aria-hidden="true"></span><span><b>Выразительный</b><small>Сильная графическая идея без шума</small></span></label></div></section><section class="v-settings-group">${groupTitle('target','Характер')}<span class="v-sub-label">Тон</span><div class="v-segments v-segments--quad" role="radiogroup" aria-label="Тон">${radio('website-tone','premium','Премиум',site.tone||'premium')}${radio('website-tone','warm','Тёплый',site.tone||'premium')}${radio('website-tone','tech','Технологичный',site.tone||'premium')}${radio('website-tone','playful','Игривый',site.tone||'premium')}</div><span class="v-sub-label">Главный акцент</span><div class="v-segments" role="radiogroup" aria-label="Главный акцент страницы">${radio('website-focus','conversion','Конверсия',site.focus||'conversion')}${radio('website-focus','catalog','Каталог',site.focus||'conversion')}${radio('website-focus','story','История',site.focus||'conversion')}</div></section><section class="v-settings-group">${groupTitle('palette','Палитра')}${vitrioAccentSettings(s)}<input type="radio" name="ratio" value="9:16" checked hidden><p class="v-setting-note">Формат — длинная страница 9:16: первый экран и ещё минимум два блока.</p></section><section class="v-settings-group"><label class="v-field">${groupTitle('folder','Название проекта','','span')}<input id="title" value="${esc(project?.title||'')}" placeholder="Например, сайт для студии" required></label></section>${settingsFooter()}`;
}
function logoSettingsMarkup(s,project,radio){
  const logo=s.logo||{};
  return `${settingsHead('Логотип','tag')}<form id="studio-form"><div class="v-settings-scroll"><section class="v-settings-group"><h3>Проект</h3><label class="v-field"><span>Название проекта</span><input id="title" value="${esc(project?.title||'')}" placeholder="Например, Логотип для бренда" required></label><label class="v-field"><span>Название бренда</span><input id="logo-brand" value="${esc(logo.brand||'')}" maxlength="90" placeholder="Например, NORMA" required></label><label class="v-field"><span>Чем занимается бренд</span><input id="logo-industry" value="${esc(logo.industry||'')}" maxlength="140" placeholder="Например, натуральная косметика" required></label></section><section class="v-settings-group"><h3>Смысл логотипа</h3><label class="v-field"><span>Что должен передавать знак</span><textarea id="logo-idea" maxlength="400" placeholder="Например, спокойный союз сильных партнёров и понятный путь к росту. Опишите идею, характер и важные ассоциации." required>${esc(logo.idea||'')}</textarea></label></section><section class="v-settings-group"><h3>Основа логотипа</h3><div class="v-segments">${radio('logo-type','symbol','Знак',logo.type||'combination')}${radio('logo-type','wordmark','Название',logo.type||'combination')}${radio('logo-type','combination','Знак + название',logo.type||'combination')}${radio('logo-type','emblem','Эмблема',logo.type||'combination')}</div><p class="v-setting-note">Знак — отдельная иконка. Название — только особенная надпись. Знак + название — готовый комплект. Эмблема — знак внутри общей формы.</p></section><section class="v-settings-group"><h3>Характер логотипа</h3><label class="v-scenario"><input type="radio" name="logo-style" value="minimal" ${logo.style==='minimal'||!logo.style?'checked':''}><span>${icon('image','v-icon--tiny')}</span><span><b>Чистый</b><small>Простая форма и минимум лишних деталей</small></span></label><label class="v-scenario"><input type="radio" name="logo-style" value="geometric" ${logo.style==='geometric'?'checked':''}><span>${icon('grid','v-icon--tiny')}</span><span><b>Структурный</b><small>Точные формы и собранный характер</small></span></label><label class="v-scenario"><input type="radio" name="logo-style" value="expressive" ${logo.style==='expressive'?'checked':''}><span>${icon('sparkle','v-icon--tiny')}</span><span><b>Характерный</b><small>Больше индивидуальности, но без хаоса</small></span></label><label class="v-scenario"><input type="radio" name="logo-style" value="premium" ${logo.style==='premium'?'checked':''}><span>${icon('folder','v-icon--tiny')}</span><span><b>Сдержанный</b><small>Выверенные пропорции и уверенная подача</small></span></label></section><section class="v-settings-group"><h3>Где будет использоваться</h3><div class="v-segments">${radio('logo-application','digital','Онлайн',logo.application||'universal')}${radio('logo-application','packaging','Печать',logo.application||'universal')}${radio('logo-application','universal','Везде',logo.application||'universal')}</div><h3 class="v-palette-title">Фон для просмотра</h3><div class="v-segments">${radio('logo-base','adaptive','Подобрать',logo.base||'adaptive')}${radio('logo-base','light','Светлый',logo.base||'adaptive')}${radio('logo-base','dark','Тёмный',logo.base||'adaptive')}</div></section><section class="v-settings-group"><h3>Формат изображения</h3><div class="v-ratios">${['1:1','4:5','16:9'].map(v=>radio('ratio',v,v,s.aspectRatio||'1:1')).join('')}</div>${vitrioAccentSettings(s)}</section>${settingsFooter()}`;
}

const billingLayoutPreview=['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&location.pathname==='/vitrio/billing'&&new URLSearchParams(location.search).get('preview')==='payment-layout';
const registrationLayoutPreview=['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&location.pathname==='/vitrio/billing'&&new URLSearchParams(location.search).get('preview')==='registration-layout';
if(registrationLayoutPreview){
  import('/assets/vitrio-registration-preview.js?v=20261012-unbounded-loaded-1').then(({mountRegistrationPreview})=>mountRegistrationPreview({app,products:VITRIO_BILLING_PRODUCTS,planCode:billingPlanCode(),period:billingPeriodCode(),logo,icon,esc}));
}else if(billingLayoutPreview){
  import('/assets/vitrio-billing-preview.js?v=20261012-unbounded-loaded-1').then(({mountBillingPreview})=>mountBillingPreview({app,products:VITRIO_BILLING_PRODUCTS,planCode:billingPlanCode(),period:billingPeriodCode(),logo,icon,esc}));
}else{
  window.addEventListener('popstate',render);window.addEventListener('pagehide',stopVitrioGenerationView);window.addEventListener('pagehide',stopSupportView);window.addEventListener('pagehide',flushCanvasLayoutOnPageHide);window.addEventListener('keydown',(event)=>{if(event.key==='Escape'){const account=document.querySelector('.v-account-settings-backdrop');if(account&&studioRefreshEnabled()){closeStudioAccountSettings(account);return;}closeAppMenu();closeSettings();closeProjectMenus();dismissDialog(document.querySelector('.v-dialog-backdrop:not([data-closing])'));}});ensureVitrioCookieBanner();render();
}
