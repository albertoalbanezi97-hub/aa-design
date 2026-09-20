(() => {
  'use strict';

  // ---------- tweakable config (mirrors the design prototype's props) ----------
  const CONFIG = {
    contactEmail: 'info.aadesign@yahoo.com',
    contactPhone: '(647) 878-3117',
    slideSeconds: 10,      // seconds each hero slideshow image is shown (3-20)
    alwaysShowCaptions: false
  };

  // ---------- content data ----------
  const HOME_IMAGES = ['home-01.jpg','home-02.jpeg','home-03.jpg','home-04.jpg','home-05.jpeg','home-06.jpg','home-07.jpg','home-08.jpg','home-09.jpg','home-10.jpg'];
  const HOME_ZOOM_DIRS = ['homeZoomIn','homeZoomOut','homeZoomOut','homeZoomIn','homeZoomIn','homeZoomOut','homeZoomIn','homeZoomOut','homeZoomOut','homeZoomIn'];

  const PROJECT_TYPES = [
    { img: 'assets/pt-adu.jpg', title: 'ADU & Secondary Suite', text: 'Legal rental or family suite, drawn right — layouts, egress and fire separations handled from day one.', caption: 'Legalizing second unit dwelling in an unfinished basement accessed by existing side entrance of detached brick dwelling' },
    { img: 'assets/pt-deck-porch.jpg', title: 'Deck & Porch', text: "Code-compliant deck and porch drawings that meet Ontario's building code and keep your project moving.", caption: 'Rebuilding existing wood stair and deck above driveway and garage of a detached single family dwelling with same features, materials and dimensions' },
    { img: 'assets/pt-garage-carport.jpg', title: 'Garage & Carport', text: 'Detached garage or carport, drawn to the details your municipality expects, at any scale.', caption: '' },
    { img: 'assets/pt-basement.jpeg', title: 'Basement Finishing', text: 'Turn an unfinished basement into a bedroom, suite, or family room — with egress and fire safety built in.', caption: 'Building new rear deck with metal stair and side entrance to the basement with concrete stair and making interior alterations. Legalizing a secondary suite in the basement of detached house from new side stair and entrance.' },
    { img: 'assets/pt-home-addition.jpeg', title: 'Home Addition', text: 'Growing up, out, or back — addition drawings that get you more space without the runaround.', caption: 'Building rear addition to existing 1 storey brick dwelling, adding new storey atop and making exterior aesthetic with interior alterations' },
    { img: 'assets/pt-barndominium.jpg', title: 'Barndominium', text: 'Shop home or live-work space, balanced between lifestyle and code from the first sketch.', caption: '' },
    { img: 'assets/pt-custom-home.jpg', title: 'Custom Home', text: 'A full permit set for your dream build, with code compliance designed in from the start.', caption: 'Building new three storey siding and stucco dwelling on vacant property in township of tiny.' },
    { img: 'assets/pt-interior-alteration.jpg', title: 'Interior Alteration', text: 'Wall removals and layout changes, drawn with the structural detail your renovation needs.', caption: '' },
    { img: 'assets/pt-retroactive.jpg', title: 'Retroactive', text: "Built without a permit, or facing a stop-work order? We'll bring your project into compliance.", caption: 'Application to comply to obtain a building permit for a duplex of split 2 storey siding detached dwelling and finishing the basement of main dwelling' }
  ];

  const PROCESS_STEPS = [
    { n: '01', title: 'First Conversation', text: 'We learn about your project, confirm what’s required, and send you a clear quote.' },
    { n: '02', title: 'Site Measure', text: 'If your home needs an accurate as-built record, we arrange a fast laser scan to capture every dimension.' },
    { n: '03', title: 'Quote Accepted', text: 'Once you give the green light, your drawings go into production — on the timeline we promised.' },
    { n: '04', title: 'Design Review', text: 'You review the initial design and request any changes, free of charge, before we finalize anything.' },
    { n: '05', title: 'Drawings Delivered', text: 'Sealed, permit-ready drawings arrive by email, along with everything your municipality needs to submit.' },
    { n: '06', title: 'Permit Support', text: 'If the building department comes back with comments, we resolve them with the city on your behalf.' }
  ];

  const G1_DEFS = [
    ['n1-01.jpg', 'Building second storey atop existing bungalow.'],
    ['n1-02.jpeg', 'Adding new storey atop existing 1 storey brick dwelling'],
    ['n1-03.jpg', 'Building new car garage at the rear yard of detached dwelling & adding gable roof to its existing roof.'],
    ['n1-04.jpeg', 'Legalizing secondary suite in the basement of detached house.'],
    ['n1-05.jpg', 'New addition for basement, main & second floors with rear deck.'],
    ['n1-06.jpg', 'Building new 2 storey custom home with modern style and 2 car garage.'],
    ['n1-07.jpeg', 'Legalizing second unit at the basement of detached dwelling unit and making interior alterations.'],
    ['n1-08.jpg', 'Legalizing second unit at the basement of detached dwelling unit and making interior alterations.'],
    ['n1-09.jpg', 'Making interior alterations in units of the apartment building located in east of Toronto.'],
    ['n1-10.jpg', 'Legalizing second unit in the basement of semi-detached brick dwelling'],
    ['n1-11.jpg', 'Legalizing secondary suite in the basement of detached house.'],
    ['n1-12.jpg', 'Adding 2 storeys atop of existing detached dwelling.'],
    ['n1-13.jpg', 'Rebuilding wood stair and deck above garage of a detached dwelling.'],
    ['n1-14.jpg', 'Legalizing second unit dwelling in an unfinished basement.'],
    ['n1-15.jpg', 'Removing third floor rear balcony and applying for OTC'],
    ['n1-16.jpg', 'Legalizing duplex residential building and applying for OTC'],
    ['n1-17.jpg', 'New building of mixed use condominium, commercial and residential suites above.'],
    ['n1-18.jpg', 'Renovating basement, remodeling main and second floors.'],
    ['n1-19.jpg', 'Building new three storey custom home by Georgian Bay.'],
    ['n1-20.jpg', 'New 2 storey custom home with modern style for elevations and green roof on top']
  ];
  const G2_DEFS = [
    ['n2-01.jpg', 'Renovating the existing semi detached house for the main and second floors and making interior alterations'],
    ['n2-02.jpg', 'Basement underpinning and renovation of main, second and third floors remodeling for semi detached house'],
    ['n2-03.jpg', 'New sleeping cabin by Muskoka lake with 3 car garage at the ground level & 2 bedroom unit above'],
    ['n2-04.jpg', 'Rear addition for basement and 2 floors above for 2 storey detached house'],
    ['n2-05.jpg', 'Adding sunroom to an existing house by Lake Muskoka'],
    ['n2-06.jpg', 'Remodeling a boathouse belonging to a house by Lake Muskoka.'],
    ['n2-07.jpg', 'Adding new third floor atop existing semi-detached building facing Casa Loma.'],
    ['n2-08.jpg', 'Building rear addition & exposing stucco for existing two storey dwelling.'],
    ['n2-09.jpg', 'Major renovation of existing heritage building & conversion to a museum for the Weston Historical Society.'],
    ['n2-10.jpg', 'Rear addition for basement and 2 floors above with interior renovation for 2 storey detached house'],
    ['n2-11.jpg', 'Remodeling basement, main and second floors for detached house and making aesthetic upgrade for front elevation'],
    ['n2-12.jpg', 'New 2 storey custom home, large space in the main floor and 4 bedrooms in the second including master suite, the basement has a separate suite.'],
    ['n2-13.jpg', 'Front elevation renewing and garage remodeling for a detached 2 storey house.'],
    ['n2-14.jpg', 'Building one storey stucco addition at the rear for new family room and making interior alterations.'],
    ['n2-15.jpg', 'New roof cover over rear yard patio and building new pool with cabana for 2 storey house'],
    ['n2-16.jpg', 'Remodeling basement, main and second floor with options to build side and rear additions.']
  ];
  const G3_DEFS = [
    ['n3-01.jpg', '104 wood-construction units on a tight, irregular lot'],
    ['n3-02.jpg', 'Three-storey wood-frame complex matched to the surrounding streetscape']
  ];

  // per-picture caption offsets for gallery group 1 (1-indexed picture number -> {top, left} in px)
  const G1_OFFSETS = { 1: {top:31}, 2: {top:31}, 5: {top:31}, 6: {top:31}, 7: {top:31}, 8: {top:31}, 9: {top:31}, 10: {top:17}, 11: {top:20}, 12: {top:0, left:30}, 13: {top:31}, 14: {top:20}, 15: {top:31, left:48}, 16: {top:30, left:20}, 17: {top:0}, 18: {top:0}, 19: {top:31}, 20: {top:31} };
  // gallery group 3 has light (white) captions on dark photos, except picture 2 which is dark text
  const G3_DARK = { 2: true };

  const FAQ_DEFS = [
    ['What happens if I build without a permit?', 'Unpermitted work can trigger stop-work orders, fines, and forced teardown of finished construction — and can leave you without insurance coverage if something goes wrong. Our retroactive-permit service helps bring your project back into compliance.'],
    ['Do I need a permit for my project?', 'In almost every case, yes — basements, decks, garages, additions, custom homes, and barndominiums all require one. We prepare code-compliant drawings so you can apply with confidence.'],
    ['My project was already built without a permit — now what?', "You're not the first. We'll prepare the drawings your municipality needs to bring the work into compliance, legally and without drama."],
    ['How long does the process take?', 'Timelines vary by municipality and project type, but most reviews move in a matter of weeks, not months. Our Process page walks through every stage.'],
    ['Can you guarantee my drawings will be approved?', 'No one can guarantee approval — zoning and code review are ultimately up to your municipality. What we guarantee is a clear, code-compliant drawing set that gives your project its best shot at a smooth review.'],
    ['Can you help legalize a rental unit?', 'Yes — we regularly prepare drawings for basement apartments and secondary suites so they meet municipal and insurance requirements.']
  ];

  const galleryItems = (defs) => defs.map(([f, caption]) => ({ src: `assets/gallery/${f}`, caption }));
  const G1 = galleryItems(G1_DEFS), G2 = galleryItems(G2_DEFS), G3 = galleryItems(G3_DEFS);
  const ALL_GALLERY_IMAGES = [...G1, ...G2, ...G3];

  const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  // ---------- render: hero slideshow ----------
  function renderHeroSlideshow() {
    const el = document.getElementById('hero-slideshow');
    const overlay = el.querySelector('.hero-overlay');
    const slideSec = CONFIG.slideSeconds;
    const dur = HOME_IMAGES.length * slideSec;
    HOME_IMAGES.forEach((file, i) => {
      const img = document.createElement('img');
      img.src = `assets/home/${file}`;
      img.alt = 'AA-Design residential project';
      const delay = -i * slideSec;
      img.style.animation = `homeZoomFade ${dur}s step-end infinite, ${HOME_ZOOM_DIRS[i % HOME_ZOOM_DIRS.length]} ${dur}s linear infinite`;
      img.style.animationDelay = `${delay}s, ${delay}s`;
      el.insertBefore(img, overlay);
    });
  }

  // ---------- render: image marquee (below the text marquee) ----------
  function renderImageMarquee() {
    const groups = [document.getElementById('image-marquee-group-1'), document.getElementById('image-marquee-group-2')];
    groups.forEach((group) => {
      ALL_GALLERY_IMAGES.forEach((g) => {
        const img = document.createElement('img');
        img.src = g.src;
        img.alt = 'AA-Design gallery';
        group.appendChild(img);
      });
    });
  }

  // ---------- render: project types ----------
  function renderTypesGrid() {
    const grid = document.getElementById('types-grid');
    grid.innerHTML = PROJECT_TYPES.map((p) => `
      <div class="type-card">
        <div class="media">
          <img src="${p.img}" alt="${escapeHtml(p.title)}">
          ${p.caption ? `<div class="caption">${escapeHtml(p.caption)}</div>` : ''}
        </div>
        <div class="body">
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.text)}</p>
        </div>
      </div>
    `).join('');
  }

  // ---------- render: process steps ----------
  function renderProcessSteps() {
    const wrap = document.getElementById('process-steps');
    wrap.innerHTML = PROCESS_STEPS.map((s) => `
      <div class="process-step">
        <span class="n">${s.n}</span>
        <div>
          <div class="title">${escapeHtml(s.title)}</div>
          <div class="text">${escapeHtml(s.text)}</div>
        </div>
      </div>
    `).join('');
  }

  // ---------- render: gallery groups ----------
  function renderGalleryGroup(containerId, items, opts) {
    const { light = false, offsets = null, darkOverride = null } = opts || {};
    const container = document.getElementById(containerId);
    container.innerHTML = items.map((item, i) => {
      const num = i + 1;
      const off = offsets ? offsets[num] : null;
      const isDark = darkOverride ? !!darkOverride[num] : false;
      const classes = ['caption'];
      if (light) classes.push('light');
      if (isDark) classes.push('dark-on-light');
      let styleAttr = '';
      if (off && !light) {
        const top = off.top != null ? off.top : 10;
        const left = off.left != null ? off.left : 10;
        styleAttr = ` style="top:${top}px; left:${left}px;"`;
      }
      const caption = item.caption ? `<div class="${classes.join(' ')}"${styleAttr}>${escapeHtml(item.caption)}</div>` : '';
      return `
        <div class="gallery-tile">
          <img src="${item.src}" alt="AA-Design residential project">
          ${caption}
        </div>
      `;
    }).join('');
  }

  // ---------- render: FAQ ----------
  function renderFaq() {
    const list = document.getElementById('faq-list');
    list.innerHTML = FAQ_DEFS.map(([q, a], i) => `
      <div class="faq-item" data-faq-index="${i}">
        <button class="faq-question" type="button">
          <span>${escapeHtml(q)}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-body">
          <p>${escapeHtml(a)}</p>
        </div>
      </div>
    `).join('');

    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-question');
      if (!btn) return;
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach((el) => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  }

  // ---------- tabs ----------
  function initTabs() {
    const panels = document.querySelectorAll('.tab-panel');
    const navLinks = document.querySelectorAll('[data-tab-target]');

    function setTab(key) {
      panels.forEach((p) => {
        const isActive = p.dataset.tab === key;
        p.classList.toggle('active', isActive);
        if (isActive) {
          // restart the fadeUp animation on activation
          p.style.animation = 'none';
          // eslint-disable-next-line no-unused-expressions
          p.offsetHeight;
          p.style.animation = '';
        }
      });
      document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.dataset.tabTarget === key);
      });
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }

    navLinks.forEach((el) => {
      el.addEventListener('click', () => setTab(el.dataset.tabTarget));
    });

    setTab('home');
  }

  // ---------- contact form ----------
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const thanks = document.getElementById('contact-thanks');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.hidden = true;
      thanks.hidden = false;
    });
  }

  // ---------- footer / config ----------
  function applyConfig() {
    document.getElementById('footer-email').textContent = CONFIG.contactEmail;
    document.getElementById('footer-phone').textContent = CONFIG.contactPhone;
    if (CONFIG.alwaysShowCaptions) document.body.classList.add('always-captions');
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    renderHeroSlideshow();
    renderImageMarquee();
    renderTypesGrid();
    renderProcessSteps();
    renderGalleryGroup('gallery-g1', G1, { offsets: G1_OFFSETS });
    renderGalleryGroup('gallery-g2', G2, {});
    renderGalleryGroup('gallery-g3', G3, { light: true, darkOverride: G3_DARK });
    renderFaq();
    initTabs();
    initContactForm();
  });
})();
