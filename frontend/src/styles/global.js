export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Playfair+Display:wght@400;700&display=swap');

  :root {
    /* Backgrounds */
    --le-bg:              #000000;
    --le-bg-mid:          #0A0A0A;
    --le-bg-card:         #111111;
    --le-bg-card-alt:     #161616;
    --le-bg-input:        #0A0A0A;
    --le-bg-hover:        rgba(255,255,255,0.03);
    --le-bg-overlay:      rgba(0,0,0,0.6);

    /* Text */
    --le-text:            #FFFFFF;
    --le-text-50:         rgba(255,255,255,0.5);
    --le-text-45:         rgba(255,255,255,0.45);
    --le-text-40:         rgba(255,255,255,0.4);
    --le-text-35:         rgba(255,255,255,0.35);
    --le-text-30:         rgba(255,255,255,0.3);
    --le-text-25:         rgba(255,255,255,0.25);
    --le-text-18:         rgba(255,255,255,0.18);
    --le-text-muted:      #A1A1AA;
    --le-text-dim:        #71717A;

    /* Borders */
    --le-border:          #1F1F1F;
    --le-border-sm:       #1A1A1A;
    --le-border-xs:       #161616;
    --le-border-04:       rgba(255,255,255,0.04);
    --le-border-06:       rgba(255,255,255,0.06);
    --le-border-09:       rgba(255,255,255,0.09);
    --le-border-10:       rgba(255,255,255,0.10);
    --le-border-12:       rgba(255,255,255,0.12);

    /* Replace ALL gold with white */
    --le-gold:            #FFFFFF;
    --le-gold-light:      #A1A1AA;
    --le-gold-bg:         rgba(255,255,255,0.03);
    --le-gold-bg-08:      rgba(255,255,255,0.05);
    --le-gold-bg-10:      rgba(255,255,255,0.06);
    --le-gold-bg-12:      rgba(255,255,255,0.08);
    --le-gold-b15:        rgba(255,255,255,0.08);
    --le-gold-b18:        rgba(255,255,255,0.10);
    --le-gold-b20:        rgba(255,255,255,0.12);
    --le-gold-b25:        rgba(255,255,255,0.15);
    --le-gold-b30:        rgba(255,255,255,0.18);
    --le-gold-b40:        rgba(255,255,255,0.22);
    --le-gold-b12end:     rgba(255,255,255,0.08);

    /* Nav */
    --le-nav-bg:          rgba(0,0,0,0.96);

    /* Sections */
    --le-section-dark-bg: #000000;
    --le-section-mid-bg:  #0A0A0A;
    --le-section-mid-border: #1F1F1F;

    /* Feature cards */
    --le-feat-grid-gap:   #1F1F1F;
    --le-feat-card-bg:    #111111;
    --le-feat-hover:      rgba(255,255,255,0.04);

    /* Input */
    --le-input-card-bg:      #111111;
    --le-input-card-border:  rgba(255,255,255,0.1);
    --le-input-header-bg:    rgba(255,255,255,0.03);
    --le-input-header-b:     rgba(255,255,255,0.08);
    --le-select-option-bg:   #111111;
    --le-textarea-focus:     rgba(255,255,255,0.04);

    /* Results */
    --le-results-grad:       linear-gradient(135deg,#111111,#000000);
    --le-results-border:     rgba(255,255,255,0.1);
    --le-insight-bg:         rgba(255,255,255,0.04);
    --le-insight-border:     rgba(255,255,255,0.1);

    /* Loading */
    --le-spinner-track:      rgba(255,255,255,0.08);
    --le-loading-bg:         rgba(255,255,255,0.03);

    /* Data visualization — keep these exactly */
    --le-green:  #4CAF7D;
    --le-orange: #FFB74D;
    --le-red:    #E57373;
    --le-blue:   #64B5F6;
    --le-teal:   #81C995;

    --le-transition: 0.25s ease;

    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 18px;
    --r-xl: 24px;

    --ink: var(--le-bg);
    --ink-mid: var(--le-bg-mid);
    --gold: var(--le-gold);
    --gold-light: var(--le-gold-light);
    --gold-faint: var(--le-gold-bg);
    --gold-faint2: var(--le-gold-bg);
    --text-primary: var(--le-text);
    --text-secondary: var(--le-text-50);
    --text-muted: var(--le-text-muted);
    --ink-border: var(--le-border-06);
    --ink-border2: var(--le-border-10);
    --red: var(--le-red);
    --green: var(--le-green);
    --blue: var(--le-blue);
    --amber: var(--le-orange);
  }

  [data-theme="light"] {
    --le-bg:              #F5F5F5;
    --le-bg-mid:          #EEEEEE;
    --le-bg-card:         rgba(0,0,0,0.03);
    --le-bg-card-alt:     rgba(0,0,0,0.05);
    --le-bg-input:        #FFFFFF;
    --le-bg-hover:        rgba(0,0,0,0.03);
    --le-text:            #000000;
    --le-text-50:         rgba(0,0,0,0.5);
    --le-text-45:         rgba(0,0,0,0.45);
    --le-text-40:         rgba(0,0,0,0.4);
    --le-text-35:         rgba(0,0,0,0.35);
    --le-text-30:         rgba(0,0,0,0.3);
    --le-text-25:         rgba(0,0,0,0.25);
    --le-text-18:         rgba(0,0,0,0.18);
    --le-text-muted:      #3F3F46;
    --le-text-dim:        #71717A;
    --le-border:          #E4E4E7;
    --le-border-sm:       #E4E4E7;
    --le-border-xs:       #F0F0F0;
    --le-gold:            #000000;
    --le-gold-light:      #3F3F46;
    --le-gold-bg:         rgba(0,0,0,0.03);
    --le-gold-bg-08:      rgba(0,0,0,0.05);
    --le-gold-bg-10:      rgba(0,0,0,0.06);
    --le-gold-bg-12:      rgba(0,0,0,0.08);
    --le-gold-b15:        rgba(0,0,0,0.08);
    --le-gold-b18:        rgba(0,0,0,0.10);
    --le-gold-b20:        rgba(0,0,0,0.12);
    --le-gold-b25:        rgba(0,0,0,0.15);
    --le-gold-b30:        rgba(0,0,0,0.18);
    --le-gold-b40:        rgba(0,0,0,0.22);
    --le-nav-bg:          rgba(245,245,245,0.96);
    --le-section-dark-bg: #F5F5F5;
    --le-section-mid-bg:  #EEEEEE;
    --le-section-mid-border: #E4E4E7;
    --le-feat-card-bg:    #FFFFFF;
    --le-feat-grid-gap:   #E4E4E7;
    --le-input-card-bg:   #FFFFFF;
    --le-input-card-border: rgba(0,0,0,0.12);
    --le-results-grad:    linear-gradient(135deg,#EEEEEE,#F5F5F5);
    --le-results-border:  rgba(0,0,0,0.1);
  }
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior:smooth; background:var(--ink); }
  body, #root { min-height:100%; background:var(--ink); color:var(--text-primary); }
  .le-root { font-family:'DM Sans',sans-serif; background:var(--ink); min-height:100vh; color:var(--text-primary); font-weight:300; }
  .le-page-stage { min-height:calc(100vh - 70px); background:var(--ink); will-change:transform,opacity; }

  /* NAV */
  .le-nav { display:flex; align-items:center; justify-content:space-between; padding:1rem 2.5rem; background:rgba(12,11,9,0.96); backdrop-filter:blur(16px); border-bottom:1px solid rgba(201,168,76,0.12); position:sticky; top:0; z-index:100; }
  .le-nav-logo { display:flex; align-items:center; gap:11px; cursor:pointer; }
  .le-nav-logo-mark {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    color: #000000;
    font-size: 17px;
  }
  .le-nav-name { color:#FFFFFF; font-size:15px; font-weight:600; letter-spacing:-0.3px; }
  .le-nav-tag { color:#FFFFFF; font-size:9.5px; letter-spacing:2px; text-transform:uppercase; font-weight:500; }
  .le-nav-pill { background:var(--gold-faint); border:1px solid rgba(201,168,76,0.25); color:var(--gold); padding:4px 12px; border-radius:100px; font-size:10.5px; font-weight:600; }

  /* BUTTONS */
  .le-btn-primary {
    background: #FFFFFF;
    color: #000000;
    font-weight: 900;
    font-size: 15px;
    padding: 14px 36px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Lato', sans-serif;
  }
  .le-btn-primary:hover {
    background: #F0F0F0;
    transform: scale(1.02);
    box-shadow: 0 0 24px rgba(255,255,255,0.15);
  }
  .le-btn-primary:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .le-btn-outline { background:transparent; color:var(--gold); border:1px solid rgba(201,168,76,0.35); font-weight:600; font-size:13px; padding:10px 22px; border-radius:var(--r-sm); cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .le-btn-outline:hover { background:var(--gold-faint); border-color:var(--gold); }
  .le-btn-ghost { background:rgba(255,255,255,0.06); color:var(--text-secondary); border:1px solid var(--ink-border2); font-weight:500; font-size:13px; padding:8px 18px; border-radius:var(--r-sm); cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .le-btn-ghost:hover { background:rgba(255,255,255,0.10); color:var(--text-primary); }

  /* HERO */
  .le-hero {
    background:
      radial-gradient(circle at 50% 18%, rgba(201,168,76,0.05), transparent 22%),
      linear-gradient(180deg, #020202 0%, #060606 44%, #040404 100%);
    padding: 5.6rem 2.5rem 6rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }
  .le-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 34%, rgba(0,0,0,0.04) 70%, rgba(0,0,0,0.28) 100%);
    pointer-events: none;
  }
  .le-hero-grid { display:none; }
  .le-hero-glow { position:absolute; top:-10px; left:50%; transform:translateX(-50%); width:680px; height:360px; z-index:1; pointer-events:none; background:radial-gradient(ellipse, rgba(201,168,76,0.14) 0%, rgba(201,168,76,0.05) 28%, transparent 68%); filter:blur(18px); opacity:0.8; }
  .le-hero-vignette { display:none; }
  .le-hero-beam { display:none; }
  .le-hero-image-wrap {
    position: absolute;
    left: 50%;
    bottom: 34%;
    width: min(1920px, 100vw);
    transform: translateX(-50%);
    z-index: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    pointer-events: none;
  }
  .le-hero-image {
    width: 100%;
    height: auto;
    max-width: none;
    object-fit: contain;
    opacity: 0.66;
    filter: grayscale(1) contrast(1.08) brightness(0.72);
    mix-blend-mode: screen;
    mask-image: radial-gradient(circle at 50% 52%, rgba(0,0,0,0.34) 0%, black 30%, black 70%, rgba(0,0,0,0.74) 84%, transparent 100%);
    -webkit-mask-image: radial-gradient(circle at 50% 52%, rgba(0,0,0,0.34) 0%, black 30%, black 70%, rgba(0,0,0,0.74) 84%, transparent 100%);
  }
  .le-hero-content {
    position: relative;
    z-index: 4;
    max-width: 760px;
    margin: 0 auto;
    padding: 0;
    border: none;
    background: none;
    box-shadow: none;
    backdrop-filter: none;
  }
  .le-hero-content::before {
    content: "";
    position: absolute;
    inset: -3rem -4rem -2.5rem;
    z-index: -1;
    pointer-events: none;
    background: radial-gradient(circle at 50% 42%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.18) 34%, transparent 78%);
    filter: blur(16px);
  }
  .le-hero::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent); }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .le-hero-eyebrow-dot { width:5px; height:5px; border-radius:50%; background:var(--gold); animation:pulse 2s ease infinite; }
  .le-hero-content,
  .le-hero-content * {
    opacity: 1 !important;
  }
  .le-hero-eyebrow { display:inline-flex; align-items:center; gap:9px; animation:fadeInUp 0.6s ease both; color:#FFFFFF !important; font-size:10.5px; letter-spacing:2.5px; text-transform:uppercase; border:1px solid rgba(255,255,255,0.22); padding:6px 18px; border-radius:100px; margin-bottom:2.5rem; background:rgba(255,255,255,0.04); font-weight:500; }
  .le-hero h1 { font-family:'Cormorant Garamond',serif; font-size:clamp(3.2rem,6.5vw,5.8rem); font-weight:600; color:#FFFFFF !important; line-height:1.02; margin-bottom:1.6rem; letter-spacing:-2px; animation:fadeInUp 0.6s 0.1s ease both; text-shadow:0 20px 50px rgba(0,0,0,0.96), 0 0 1px rgba(255,255,255,0.9); }
  .le-hero h1 em {
    color: #FFFFFF !important;
    font-style: italic;
    text-decoration: underline;
    text-underline-offset: 8px;
    text-decoration-color: rgba(255,255,255,0.25);
  }
  .le-hero-sub { color:#FFFFFF !important; font-size:1.15rem; max-width:560px; margin:0 auto 2.5rem; font-weight:300; line-height:1.8; animation:fadeInUp 0.6s 0.2s ease both; text-shadow:0 12px 34px rgba(0,0,0,0.9), 0 0 1px rgba(255,255,255,0.6); }
  .le-hero-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; animation:fadeInUp 0.6s 0.3s ease both; }
  .le-hero-stats { position:relative; z-index:3; display:flex; justify-content:center; flex-wrap:wrap; margin-top:8rem; padding-top:3.5rem; border-top:1px solid var(--ink-border); }
  .le-hero-stat { position:relative; padding:0 3rem; border-right:1px solid var(--ink-border); text-align:center; transition:transform 0.25s ease, filter 0.25s ease; }
  .le-hero-stat:last-child { border-right:none; }
  .le-hero-stat::before { content:''; position:absolute; left:22%; right:22%; top:-14px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent); opacity:0; transform:scaleX(0.7); transition:opacity 0.25s ease, transform 0.25s ease; }
  .le-hero-stat:hover { filter:brightness(1.08); }
  .le-hero-stat:hover::before { opacity:1; transform:scaleX(1); }
  .le-hero-stat-num { font-family:'Cormorant Garamond',serif; font-size:2.4rem; font-weight:600; color:var(--gold); text-shadow:0 0 18px rgba(255,255,255,0.06); }
  .le-hero-stat-lbl { color:#FFFFFF; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; margin-top:4px; font-weight:500; transition:color 0.25s ease; }
  .le-hero-stat:hover .le-hero-stat-lbl { color:var(--text-secondary); }

  /* SECTIONS */
  .le-section-dark { background:var(--ink); padding:6rem 2.5rem; }
  .le-section-mid { background:var(--ink-mid); padding:6rem 2.5rem; border-top:1px solid var(--ink-border); border-bottom:1px solid var(--ink-border); }
  .le-container { max-width:1060px; margin:0 auto; }
  .le-section-label { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#FFFFFF; font-weight:600; margin-bottom:1rem; }
  .le-section-h2 { font-family:'Cormorant Garamond',serif; font-size:clamp(2rem,3.8vw,3rem); font-weight:600; color:#FFFFFF; line-height:1.15; margin-bottom:1.25rem; letter-spacing:-0.5px; }
  .le-section-h2 em {
    color: #FFFFFF;
    font-style: normal;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    padding-bottom: 2px;
  }
  .le-section-sub { color:#FFFFFF; font-size:1rem; font-weight:300; line-height:1.8; max-width:480px; }

  /* FEATURE GRID */
  .le-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.5px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.05); border-radius:var(--r-lg); overflow:hidden; }
  .le-feat-card { background:var(--ink); padding:2.25rem; position:relative; }
  .le-feat-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.3s; background:radial-gradient(ellipse 60% 60% at 30% 40%,rgba(201,168,76,0.07),transparent); }
  .le-feat-card:hover::before { opacity:1; }
  .le-feat-icon { width:42px; height:42px; border-radius:var(--r-sm); background:var(--gold-faint); border:1px solid rgba(201,168,76,0.18); display:flex; align-items:center; justify-content:center; font-size:19px; margin-bottom:1.25rem; }
  .le-feat-title { font-weight:600; font-size:14.5px; color:#FFFFFF; margin-bottom:0.5rem; }
  .le-feat-desc { font-size:13px; color:#FFFFFF; line-height:1.75; }

  /* STEPS */
  .le-steps-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); }
  .le-step-card { padding:2rem 1.5rem; text-align:center; border-right:1px solid var(--ink-border); }
  .le-step-card:last-child { border-right:none; }
  .le-step-num { width:50px; height:50px; border-radius:50%; border:1px solid rgba(201,168,76,0.35); display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem; font-family:'Cormorant Garamond',serif; font-size:1.3rem; color:var(--gold); font-weight:600; background:rgba(201,168,76,0.06); }
  .le-step-title { font-weight:600; font-size:13px; color:#FFFFFF; margin-bottom:0.5rem; }
  .le-step-desc { font-size:12px; color:#FFFFFF; line-height:1.7; }

  /* PREVIEW */
  .le-preview-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
  .le-preview-card { background:rgba(255,255,255,0.035); border:1px solid var(--ink-border2); border-radius:var(--r-md); padding:1.5rem; }
  .le-preview-card-title { font-size:9.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--gold); font-weight:600; margin-bottom:1rem; }
  .le-preview-item { display:flex; align-items:flex-start; gap:10px; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:12px; color:#FFFFFF; }
  .le-preview-item:last-child { border-bottom:none; }
  .le-preview-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-top:4px; }

  /* TESTIMONIALS */
  .le-testi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.5rem; }
  .le-testi-card { background:rgba(255,255,255,0.03); border:1px solid var(--ink-border); border-radius:var(--r-lg); padding:1.75rem; transition:transform 0.25s ease,border-color 0.25s; }
  .le-testi-card:hover { transform:translateY(-3px); border-color:rgba(201,168,76,0.2); }
  .le-testi-quote { color:#FFFFFF; line-height:1.8; margin-bottom:1.25rem; font-style:italic; font-family:'Cormorant Garamond',serif; font-size:16px; }
  .le-testi-author { font-size:12px; font-weight:600; color:var(--gold); }
  .le-testi-role { font-size:11px; color:#FFFFFF; margin-top:2px; }
  .le-cta-band { background:linear-gradient(160deg,rgba(201,168,76,0.09),rgba(201,168,76,0.03)); border-top:1px solid rgba(201,168,76,0.16); border-bottom:1px solid rgba(201,168,76,0.10); padding:5rem 2.5rem; text-align:center; }

  /* INPUT */
  .le-input-section { max-width:820px; margin:0 auto; padding:4rem 2rem; }
  .le-input-card { background:rgba(255,255,255,0.025); border-radius:var(--r-xl); border:1px solid var(--ink-border2); overflow:hidden; box-shadow:0 40px 80px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06); }
  .le-input-header { background:rgba(201,168,76,0.07); padding:2rem 2.25rem; border-bottom:1px solid rgba(201,168,76,0.13); }
  .le-input-header h2 { font-family:'Cormorant Garamond',serif; color:var(--text-primary); font-size:1.6rem; font-weight:600; margin-bottom:4px; }
  .le-input-header p { color:var(--text-muted); font-size:13px; }
  .le-input-body { padding:2rem 2.25rem; }
  .le-textarea { width:100%; min-height:140px; resize:vertical; border:1.5px solid var(--ink-border2); border-radius:var(--r-md); padding:1rem 1.25rem; font-family:'DM Sans',sans-serif; font-size:14.5px; color:var(--text-primary); background:rgba(255,255,255,0.035); outline:none; transition:border-color 0.2s,background 0.2s; line-height:1.7; font-weight:300; }
  .le-textarea:focus { border-color:var(--gold); background:rgba(201,168,76,0.04); }
  .le-textarea::placeholder { color:rgba(255,255,255,0.22); }
  .le-meta-row { display:flex; gap:1rem; margin-top:1.5rem; flex-wrap:wrap; }
  .le-meta-group { flex:1; min-width:150px; }
  .le-meta-label { font-size:10.5px; color:var(--text-muted); letter-spacing:1px; text-transform:uppercase; margin-bottom:7px; font-weight:600; }
  .le-meta-select { width:100%; padding:10px 14px; border-radius:var(--r-sm); border:1.5px solid var(--ink-border2); background:rgba(255,255,255,0.04); font-family:'DM Sans',sans-serif; font-size:13.5px; color:var(--text-primary); cursor:pointer; outline:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23C9A84C' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; transition:border-color 0.2s; }
  .le-meta-select option { background:#1A1810; color:#fff; }
  .le-meta-select:focus { border-color:var(--gold); }
  .le-suggestions { margin-top:1rem; display:flex; gap:7px; flex-wrap:wrap; }
  .le-suggestion { background:rgba(255,255,255,0.04); border:1px solid var(--ink-border2); color:var(--text-muted); font-size:12px; padding:5px 13px; border-radius:100px; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; }
  .le-suggestion:hover { background:var(--gold-faint); border-color:rgba(201,168,76,0.4); color:var(--gold); }
  .le-input-footer { padding:1.25rem 2.25rem; background:rgba(0,0,0,0.2); border-top:1px solid var(--ink-border); display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
  .le-disclaimer { font-size:11px; color:var(--text-muted); max-width:400px; line-height:1.65; }

  /* LOADING */
  .le-loading-wrap { background:var(--ink); min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .le-loading { text-align:center; padding:3rem 2rem; max-width:480px; width:100%; }
  .le-spinner { width:50px; height:50px; margin:0 auto 2rem; border:2.5px solid rgba(255,255,255,0.07); border-top-color:var(--gold); border-radius:50%; animation:le-spin 0.75s linear infinite; box-shadow:0 0 20px rgba(201,168,76,0.15); }
  @keyframes le-spin { to{transform:rotate(360deg)} }
  .le-loading-stage { color:var(--gold); font-size:12px; letter-spacing:2px; text-transform:uppercase; font-weight:600; }
  .le-loading-sub { color:var(--text-muted); font-size:13.5px; margin-top:8px; }
  .le-loading-steps { margin-top:2.5rem; display:flex; flex-direction:column; gap:11px; text-align:left; background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-md); padding:1.5rem; }
  .le-loading-step { display:flex; align-items:center; gap:12px; font-size:13px; color:var(--text-muted); }
  .le-loading-step.done { color:var(--green); }
  .le-loading-step.active { color:var(--text-primary); font-weight:500; }
  .le-step-dot { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,0.10); flex-shrink:0; }
  .le-loading-step.done .le-step-dot { background:var(--green); }
  .le-loading-step.active .le-step-dot { background:var(--gold); box-shadow:0 0 10px rgba(201,168,76,0.6); animation:pulse 1.5s ease infinite; }

  /* BANNER */
  .le-banner { background:rgba(12,11,9,0.97); border-bottom:1px solid var(--ink-border); padding:0.75rem 2.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; position:sticky; top:65px; z-index:90; backdrop-filter:blur(10px); }
  .le-banner-txt { font-size:13px; color:var(--text-muted); }

  /* RESULTS */
  .le-results { max-width:1000px; margin:0 auto; padding:2.5rem 1.5rem 4rem; }
  .le-results-header { background:linear-gradient(135deg,var(--ink-mid),var(--ink)); border:1px solid rgba(201,168,76,0.18); border-radius:var(--r-xl); padding:2.5rem; margin-bottom:2rem; position:relative; overflow:hidden; }
  .le-results-header::before { content:''; position:absolute; top:-80px; right:-80px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,0.12),transparent 68%); pointer-events:none; }
  .le-results-meta { color:var(--gold); font-size:9.5px; letter-spacing:2px; text-transform:uppercase; margin-bottom:0.75rem; font-weight:600; }
  .le-results-title { font-family:'Cormorant Garamond',serif; color:var(--text-primary); font-size:2.1rem; font-weight:600; margin-bottom:0.6rem; line-height:1.15; letter-spacing:-0.5px; }
  .le-results-sub { color:var(--text-secondary); font-size:14px; line-height:1.75; max-width:660px; }
  .le-insight-box { margin-top:1.5rem; background:rgba(201,168,76,0.07); border:1px solid rgba(201,168,76,0.22); border-left:3px solid var(--gold); border-radius:var(--r-sm); padding:1rem 1.25rem; }

  /* KPIs */
  .le-kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:2rem; }
  .le-kpi-card { background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-lg); padding:1.75rem 1.25rem; text-align:center; transition:transform 0.2s ease,border-color 0.2s; }
  .le-kpi-card:hover { transform:translateY(-2px); border-color:rgba(201,168,76,0.2); }
  .le-kpi-label { font-size:9.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.9rem; font-weight:600; }
  .le-kpi-score { font-family:'Cormorant Garamond',serif; font-size:3.8rem; font-weight:600; line-height:1; }
  .le-kpi-badge { font-size:10.5px; font-weight:600; padding:4px 12px; border-radius:100px; margin-top:10px; display:inline-block; }
  .le-kpi-bar { height:2px; border-radius:100px; background:rgba(255,255,255,0.07); margin-top:1.25rem; overflow:hidden; }
  .le-kpi-fill { height:100%; border-radius:100px; }
  .le-kpi-note { font-size:11px; color:var(--text-muted); margin-top:10px; line-height:1.55; text-align:left; }

  /* SUMMARY */
  .le-summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:2rem; }
  .le-summary-stat { background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-md); padding:1.25rem 1.5rem; }
  .le-summary-label { font-size:9.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-muted); font-weight:600; margin-bottom:6px; }
  .le-summary-val { font-size:1.7rem; font-weight:600; color:var(--text-primary); font-family:'Cormorant Garamond',serif; }
  .le-summary-sub { font-size:11px; color:var(--text-muted); margin-top:4px; }

  /* ACCORDION SECTIONS */
  .le-sec { background:rgba(255,255,255,0.02); border:1px solid var(--ink-border); border-radius:var(--r-lg); margin-bottom:1.25rem; overflow:hidden; }
  .le-sec-head { padding:1.2rem 1.6rem; display:flex; align-items:center; gap:12px; cursor:pointer; transition:background 0.15s; }
  .le-sec-head.open { border-bottom:1px solid var(--ink-border); }
  .le-sec-head:hover { background:rgba(255,255,255,0.025); }
  .le-sec-icon { width:34px; height:34px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; line-height:1; flex-shrink:0; overflow:hidden; background:rgba(255,255,255,0.04); border:1px solid var(--ink-border); }
  .le-sec-title { font-weight:600; font-size:14.5px; color:var(--text-primary); }
  .le-sec-sub { font-size:12px; color:var(--text-muted); margin-top:2px; }
  .le-sec-count { margin-left:auto; font-size:10.5px; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:3px 10px; border-radius:100px; font-weight:600; flex-shrink:0; }
  .le-sec-chev { margin-left:8px; color:var(--text-muted); font-size:10px; transition:transform 0.25s; flex-shrink:0; }
  .le-sec-body { padding:1.75rem; }

  /* LICENSES */
  .le-lic { border:1px solid var(--ink-border); border-radius:var(--r-md); padding:1.5rem; margin-bottom:1rem; transition:border-color 0.2s; }
  .le-lic:last-child { margin-bottom:0; }
  .le-lic:hover { border-color:rgba(201,168,76,0.22); }
  .le-lic-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:0.6rem; }
  .le-lic-name { font-weight:600; font-size:15.5px; color:var(--text-primary); line-height:1.3; }
  .le-lic-org { font-size:12px; color:var(--text-muted); margin-bottom:0.75rem; }
  .le-lic-desc { font-size:13.5px; color:var(--text-secondary); line-height:1.7; margin-bottom:1rem; }
  .le-lic-doc-list { padding:0.85rem 1rem; background:rgba(255,255,255,0.025); border-radius:var(--r-sm); border:1px solid var(--ink-border); margin-bottom:1rem; }
  .le-lic-doc-title { font-size:9.5px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-muted); font-weight:600; margin-bottom:9px; }
  .le-lic-doc-item { display:flex; align-items:flex-start; gap:8px; font-size:12px; color:var(--text-secondary); padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.035); line-height:1.55; }
  .le-lic-doc-item:last-child { border-bottom:none; }
  .le-lic-meta { display:flex; gap:1.5rem; flex-wrap:wrap; padding-top:0.85rem; border-top:1px solid var(--ink-border); }
  .le-lic-meta-key { color:var(--text-muted); font-size:12px; }
  .le-lic-meta-val { font-weight:600; color:var(--text-primary); font-size:12px; margin-left:4px; }
  .le-priority-badge { font-size:9.5px; font-weight:700; letter-spacing:0.8px; padding:4px 11px; border-radius:100px; text-transform:uppercase; white-space:nowrap; flex-shrink:0; }
  .priority-critical { background:rgba(224,82,82,0.12); color:var(--red); border:1px solid rgba(224,82,82,0.25); }
  .priority-high { background:rgba(224,155,64,0.12); color:var(--amber); border:1px solid rgba(224,155,64,0.25); }
  .priority-medium { background:rgba(107,163,214,0.12); color:var(--blue); border:1px solid rgba(107,163,214,0.25); }
  .priority-low { background:rgba(76,175,125,0.12); color:var(--green); border:1px solid rgba(76,175,125,0.25); }

  /* RISKS */
  .le-risk { border-radius:var(--r-md); padding:1.5rem; margin-bottom:1rem; border:1px solid; }
  .le-risk:last-child { margin-bottom:0; }
  .le-risk-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:0.6rem; }
  .le-risk-name { font-weight:600; font-size:14.5px; line-height:1.3; }
  .le-risk-desc { font-size:13px; line-height:1.7; margin-bottom:0.85rem; opacity:0.75; }
  .le-risk-penalty { font-size:12px; font-weight:600; padding:5px 12px; border-radius:var(--r-sm); display:inline-flex; align-items:center; gap:6px; border:1px solid; }
  .le-risk-sev { font-size:9.5px; padding:3px 9px; border-radius:100px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; flex-shrink:0; }

  /* ACTION PLAN */
  .le-action { display:flex; gap:1.25rem; margin-bottom:1.5rem; }
  .le-action:last-child { margin-bottom:0; }
  .le-action-left { display:flex; flex-direction:column; align-items:center; }
  .le-action-num { width:34px; height:34px; border-radius:50%; background:linear-gradient(140deg,var(--gold),var(--gold-light)); color:var(--ink); font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .le-action-line { width:1px; flex:1; background:rgba(255,255,255,0.06); min-height:20px; margin-top:6px; }
  .le-action-content { flex:1; padding-bottom:1rem; }
  .le-action-title { font-weight:600; font-size:14.5px; color:var(--text-primary); margin-bottom:5px; }
  .le-action-desc { font-size:13px; color:var(--text-secondary); line-height:1.7; margin-bottom:10px; }
  .le-action-tags { display:flex; gap:7px; flex-wrap:wrap; }
  .le-action-tag { font-size:11px; padding:4px 11px; border-radius:100px; font-weight:600; border:1px solid; }

  /* NON COMPLIANCE */
  .le-nc { border-radius:var(--r-md); padding:1.5rem; margin-bottom:1rem; border-left:3px solid var(--red); background:rgba(224,82,82,0.055); border-top:1px solid rgba(224,82,82,0.12); border-right:1px solid rgba(224,82,82,0.12); border-bottom:1px solid rgba(224,82,82,0.12); }
  .le-nc:last-child { margin-bottom:0; }
  .le-nc-title { color:var(--red); font-weight:600; font-size:14px; margin-bottom:6px; display:flex; align-items:center; gap:8px; }
  .le-nc-desc { color:var(--text-secondary); font-size:13px; line-height:1.7; }

  /* COST TABLE */
  .le-cost-table { width:100%; border-collapse:collapse; }
  .le-cost-table th { font-size:9.5px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-muted); font-weight:600; padding:10px 14px; text-align:left; background:rgba(255,255,255,0.025); border-bottom:1px solid var(--ink-border); }
  .le-cost-table td { font-size:13px; padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.04); color:var(--text-secondary); vertical-align:top; line-height:1.55; }
  .le-cost-table tr:last-child td { border-bottom:none; }
  .le-cost-table tr:hover td { background:rgba(255,255,255,0.018); }
  .le-cost-num { font-weight:700; font-family:'Cormorant Garamond',serif; font-size:16px; color:var(--text-primary); white-space:nowrap; }

  /* BAR CHART */
  .le-bar-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
  .le-bar-row:last-child { margin-bottom:0; }
  .le-bar-name { font-size:13px; color:var(--text-secondary); min-width:180px; font-weight:500; }
  .le-bar-track { flex:1; height:6px; background:rgba(255,255,255,0.06); border-radius:100px; overflow:hidden; }
  .le-bar-fill { height:100%; border-radius:100px; }
  .le-bar-val { font-size:12px; font-weight:600; min-width:52px; text-align:right; }

  /* CHECKLIST */
  .le-check-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .le-check-item { display:flex; align-items:flex-start; gap:10px; padding:10px 14px; background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-sm); font-size:13px; color:var(--text-secondary); line-height:1.55; cursor:pointer; transition:all 0.15s; }
  .le-check-item.checked { background:rgba(76,175,125,0.06); border-color:rgba(76,175,125,0.25); color:var(--text-muted); text-decoration:line-through; }
  .le-check-item:hover { border-color:var(--ink-border2); }

  /* FOLLOW-UP */
  .le-followup { background:rgba(201,168,76,0.05); border:1px solid rgba(201,168,76,0.18); border-radius:var(--r-lg); padding:2rem; margin-top:2rem; }
  .le-followup h3 { font-family:'Cormorant Garamond',serif; color:var(--gold); font-size:1.2rem; font-weight:600; margin-bottom:0.5rem; }
  .le-followup p { color:var(--text-muted); font-size:13px; margin-bottom:1.25rem; }
  .le-followup-qs { display:flex; flex-direction:column; gap:8px; }
  .le-followup-q { background:rgba(255,255,255,0.035); border:1px solid var(--ink-border2); border-radius:var(--r-sm); padding:11px 16px; font-size:13px; color:var(--text-secondary); cursor:pointer; transition:all 0.18s; text-align:left; font-family:'DM Sans',sans-serif; }
  .le-followup-q:hover { background:rgba(201,168,76,0.08); border-color:rgba(201,168,76,0.28); color:var(--gold); transform:translateX(4px); }

  .le-chat-card {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at top right, rgba(100,181,246,0.16), transparent 28%),
      radial-gradient(circle at top left, rgba(255,255,255,0.07), transparent 22%),
      linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 28px;
    padding: 1.6rem;
    margin-top: 2rem;
    box-shadow: 0 28px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .le-chat-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .le-chat-eyebrow {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(100,181,246,0.10);
    border: 1px solid rgba(100,181,246,0.20);
    color: #9fc7eb;
    font-size: 10px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }
  .le-chat-head h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    line-height: 1;
    margin-bottom: 0.45rem;
    color: var(--text-primary);
  }
  .le-chat-head p {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
    max-width: 560px;
  }
  .le-chat-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .le-chat-meta span {
    font-size: 11px;
    color: var(--text-muted);
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    padding: 8px 12px;
    border-radius: 999px;
  }
  .le-chat-prompts {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .le-chat-prompt {
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: var(--text-primary);
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.18s ease;
    font-family: 'DM Sans', sans-serif;
  }
  .le-chat-prompt:hover {
    transform: translateY(-1px);
    border-color: rgba(100,181,246,0.28);
    background: rgba(100,181,246,0.08);
  }
  .le-chat-prompt:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  .le-chat-shell {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(5,9,14,0.96), rgba(10,14,20,0.92));
  }
  .le-chat-orb {
    position: absolute;
    width: 280px;
    height: 280px;
    top: -80px;
    right: -60px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(100,181,246,0.16), transparent 68%);
    filter: blur(12px);
    pointer-events: none;
  }
  .le-chat-messages {
    position: relative;
    max-height: 420px;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .le-chat-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }
  .le-chat-row.user {
    flex-direction: row-reverse;
  }
  .le-chat-avatar {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    background: rgba(255,255,255,0.06);
    color: var(--text-primary);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .le-chat-row.user .le-chat-avatar {
    background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(220,228,236,0.92));
    color: #091019;
    border-color: transparent;
  }
  .le-chat-bubble {
    max-width: min(720px, 84%);
    padding: 14px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .le-chat-row.user .le-chat-bubble {
    background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(233,238,243,0.88));
    color: #081018;
    border-color: transparent;
  }
  .le-chat-role {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 700;
  }
  .le-chat-row.user .le-chat-role {
    color: rgba(8,16,24,0.58);
  }
  .le-chat-content {
    white-space: pre-wrap;
    line-height: 1.7;
    font-size: 13px;
    color: inherit;
  }
  .le-chat-thinking {
    min-width: 120px;
  }
  .le-chat-dots {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-height: 16px;
  }
  .le-chat-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255,255,255,0.7);
    animation: le-chat-bounce 1.1s infinite ease-in-out;
  }
  .le-chat-dots span:nth-child(2) { animation-delay: 0.12s; }
  .le-chat-dots span:nth-child(3) { animation-delay: 0.24s; }
  @keyframes le-chat-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
    40% { transform: translateY(-4px); opacity: 1; }
  }
  .le-chat-compose {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    padding: 1rem 1.25rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.025);
  }
  .le-chat-input {
    width: 100%;
    min-height: 74px;
    resize: vertical;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 18px;
    background: rgba(0,0,0,0.28);
    color: var(--text-primary);
    padding: 14px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    outline: none;
    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }
  .le-chat-input:focus {
    border-color: rgba(100,181,246,0.35);
    background: rgba(0,0,0,0.42);
    box-shadow: 0 0 0 4px rgba(100,181,246,0.08);
  }
  .le-chat-input::placeholder {
    color: rgba(255,255,255,0.38);
  }
  .le-chat-send {
    align-self: end;
    border: none;
    border-radius: 16px;
    padding: 14px 20px;
    background: linear-gradient(135deg, #ffffff, #d8e3ec);
    color: #081018;
    font-family: 'Lato', sans-serif;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    box-shadow: 0 14px 30px rgba(0,0,0,0.28);
  }
  .le-chat-send:hover {
    transform: translateY(-1px);
  }
  .le-chat-send:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .le-chat-error {
    margin-top: 0.85rem;
    font-size: 12px;
    color: #ff9f9f;
  }
  .le-chat-footnote {
    margin-top: 0.8rem;
    font-size: 11px;
    color: rgba(255,255,255,0.35);
  }

  .le-pipeline-badge { display:inline-flex; align-items:center; gap:7px; background:rgba(76,175,125,0.12); border:1px solid rgba(76,175,125,0.25); border-radius:100px; padding:6px 14px; font-size:10.5px; color:var(--green); font-weight:600; }

  /* MISC */
  .le-report-viewer { background:var(--ink); min-height:100vh; }
  .le-report-viewer-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:1rem; }
  .le-dashboard { max-width:860px; margin:0 auto; padding:3rem 1.5rem; }
  .le-report-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:1rem 1.25rem; background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-md); margin-bottom:10px; cursor:pointer; transition:border-color 0.18s,background 0.18s,transform 0.18s; }
  .le-report-row:hover { border-color:rgba(201,168,76,0.28); background:rgba(201,168,76,0.04); transform:translateX(3px); }
  .le-report-row-id { font-size:15px; font-weight:700; color:var(--gold); font-family:'Cormorant Garamond',serif; min-width:80px; }
  .le-report-row-biz { font-size:14px; font-weight:600; color:var(--text-primary); flex:1; }
  .le-report-row-meta { font-size:11px; color:var(--text-muted); }
  .le-email-input { width:100%; padding:10px 14px; border-radius:var(--r-sm); border:1.5px solid var(--ink-border2); background:rgba(255,255,255,0.035); font-family:'DM Sans',sans-serif; font-size:13.5px; color:var(--text-primary); outline:none; transition:border-color 0.2s; }
  .le-email-input:focus { border-color:var(--gold); background:rgba(201,168,76,0.04); }
  .le-email-input::placeholder { color:rgba(255,255,255,0.20); }

  /* ═══════════════════════════════════════════ */
  /* NEW FEATURE STYLES                          */
  /* ═══════════════════════════════════════════ */

  /* SEARCH BAR */
  .le-search-bar { display:flex; gap:10px; margin-bottom:1.5rem; align-items:center; }
  .le-search-input { flex:1; padding:10px 16px 10px 40px; border-radius:var(--r-md); border:1.5px solid var(--ink-border2); background:rgba(255,255,255,0.035); font-family:'DM Sans',sans-serif; font-size:13.5px; color:var(--text-primary); outline:none; transition:border-color 0.2s; }
  .le-search-input:focus { border-color:var(--gold); background:rgba(201,168,76,0.04); }
  .le-search-input::placeholder { color:rgba(255,255,255,0.25); }
  .le-search-wrap { position:relative; flex:1; }
  .le-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px; pointer-events:none; }
  .le-doc-note {
    width: 100%;
    min-height: 44px;
    background: rgba(255,255,255,0.05);
    color: var(--text-primary);
    border: 1px solid var(--ink-border2);
    border-radius: var(--r-sm);
    padding: 11px 14px;
  }
  .le-doc-note::placeholder { color: rgba(255,255,255,0.5); }
  .le-doc-note:focus {
    outline: none;
    border-color: rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.07);
  }
  .le-search-clear { position:absolute; right:13px; top:50%; transform:translateY(-50%); color:var(--text-muted); cursor:pointer; font-size:13px; background:none; border:none; padding:2px; }
  .le-search-clear:hover { color:var(--text-primary); }
  .le-search-count { font-size:11px; color:var(--text-muted); white-space:nowrap; padding:0 8px; }
  .le-search-highlight { background:rgba(201,168,76,0.25); color:var(--gold); border-radius:3px; padding:0 2px; }

  /* SHARE BUTTON + TOAST */
  .le-share-btn { display:inline-flex; align-items:center; gap:7px; background:rgba(107,163,214,0.12); border:1px solid rgba(107,163,214,0.25); color:var(--blue); font-size:12px; font-weight:600; padding:7px 14px; border-radius:100px; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .le-share-btn:hover { background:rgba(107,163,214,0.2); border-color:rgba(107,163,214,0.4); }
  .le-toast { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%) translateY(80px); background:rgba(30,28,22,0.98); border:1px solid rgba(201,168,76,0.3); color:var(--gold); font-size:13px; font-weight:500; padding:11px 24px; border-radius:100px; z-index:9999; backdrop-filter:blur(12px); box-shadow:0 8px 32px rgba(0,0,0,0.5); transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),opacity 0.35s; opacity:0; pointer-events:none; }
  .le-toast.show { transform:translateX(-50%) translateY(0); opacity:1; pointer-events:auto; }

  /* PROGRESS TRACKER */
  .le-progress-bar-outer { height:4px; background:rgba(255,255,255,0.06); border-radius:100px; margin-bottom:1.5rem; overflow:hidden; }
  .le-progress-bar-inner { height:100%; border-radius:100px; background:linear-gradient(90deg,var(--gold),var(--gold-light)); transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
  .le-progress-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem; }
  .le-progress-label { font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:1px; }
  .le-progress-pct { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:var(--gold); }
  .le-check-item-tracker { display:flex; align-items:flex-start; gap:12px; padding:12px 16px; background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-sm); font-size:13px; color:var(--text-secondary); line-height:1.55; cursor:pointer; transition:all 0.2s; margin-bottom:8px; }
  .le-check-item-tracker:last-child { margin-bottom:0; }
  .le-check-item-tracker.checked { background:rgba(76,175,125,0.06); border-color:rgba(76,175,125,0.22); color:var(--text-muted); }
  .le-check-item-tracker:hover { border-color:var(--ink-border2); transform:translateX(3px); }
  .le-check-box { width:20px; height:20px; border-radius:6px; border:1.5px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; background:rgba(255,255,255,0.03); margin-top:1px; }
  .le-check-item-tracker.checked .le-check-box { background:var(--green); border-color:var(--green); }
  .le-check-box-tick { color:#fff; font-size:11px; font-weight:700; opacity:0; transition:opacity 0.15s; }
  .le-check-item-tracker.checked .le-check-box-tick { opacity:1; }

  /* TIMELINE VIEW */
  .le-timeline { position:relative; padding-left:0; }
  .le-timeline-week { margin-bottom:2rem; }
  .le-timeline-week-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--gold); font-weight:600; margin-bottom:0.75rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(201,168,76,0.15); }
  .le-timeline-item { display:flex; gap:12px; margin-bottom:8px; padding:12px 14px; background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-sm); align-items:center; transition:border-color 0.15s; }
  .le-timeline-item:hover { border-color:rgba(201,168,76,0.2); }
  .le-timeline-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .le-timeline-title { font-size:13.5px; font-weight:600; color:var(--text-primary); flex:1; }
  .le-timeline-cat { font-size:10.5px; font-weight:600; padding:3px 9px; border-radius:100px; flex-shrink:0; }
  .le-timeline-cost { font-size:11px; color:var(--gold); font-weight:600; font-family:'Cormorant Garamond',serif; font-size:13px; flex-shrink:0; }

  /* COST CALCULATOR */
  .le-calc-wrap { background:rgba(255,255,255,0.02); border:1px solid var(--ink-border); border-radius:var(--r-lg); padding:1.75rem; margin-top:1.5rem; }
  .le-calc-title { font-family:'Cormorant Garamond',serif; color:var(--text-primary); font-size:1.3rem; font-weight:600; margin-bottom:1.25rem; }
  .le-calc-row { display:flex; align-items:center; gap:12px; margin-bottom:1rem; }
  .le-calc-row:last-of-type { margin-bottom:0; }
  .le-calc-label { font-size:13px; color:var(--text-secondary); flex:1; min-width:140px; }
  .le-calc-slider { flex:2; -webkit-appearance:none; appearance:none; height:4px; border-radius:100px; background:rgba(255,255,255,0.08); outline:none; cursor:pointer; }
  .le-calc-slider::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:linear-gradient(140deg,var(--gold),var(--gold-light)); cursor:pointer; box-shadow:0 0 8px rgba(201,168,76,0.4); transition:transform 0.15s; }
  .le-calc-slider::-webkit-slider-thumb:hover { transform:scale(1.2); }
  .le-calc-val { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; color:var(--gold); min-width:100px; text-align:right; }
  .le-calc-total { display:flex; align-items:center; justify-content:space-between; margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--ink-border); }
  .le-calc-total-label { font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; }
  .le-calc-total-val { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:var(--gold); }
  .le-calc-breakdown { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:1rem; }
  .le-calc-breakdown-item { display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); padding:7px 10px; background:rgba(255,255,255,0.025); border-radius:var(--r-sm); }
  .le-calc-breakdown-item strong { color:var(--text-secondary); }

  /* COMPARISON MODE */
  .le-compare-wrap { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
  .le-compare-col { background:rgba(255,255,255,0.025); border:1px solid var(--ink-border); border-radius:var(--r-lg); overflow:hidden; }
  .le-compare-col-header { padding:1.25rem 1.5rem; background:rgba(201,168,76,0.06); border-bottom:1px solid rgba(201,168,76,0.12); }
  .le-compare-col-title { font-family:'Cormorant Garamond',serif; font-size:1.1rem; font-weight:600; color:var(--text-primary); }
  .le-compare-col-meta { font-size:11px; color:var(--text-muted); margin-top:3px; }
  .le-compare-col-body { padding:1.25rem 1.5rem; }
  .le-compare-row { display:flex; justify-content:space-between; align-items:flex-start; padding:8px 0; border-bottom:1px solid var(--ink-border); font-size:13px; }
  .le-compare-row:last-child { border-bottom:none; }
  .le-compare-key { color:var(--text-muted); font-size:12px; }
  .le-compare-val { color:var(--text-primary); font-weight:600; text-align:right; max-width:55%; }
  .le-compare-win { color:var(--green); }
  .le-compare-empty { text-align:center; padding:3rem 2rem; color:var(--text-muted); font-size:13px; }
  .le-compare-score-row { display:flex; align-items:center; gap:10px; margin-bottom:0.75rem; }
  .le-compare-score-label { font-size:11px; color:var(--text-muted); min-width:90px; }
  .le-compare-score-track { flex:1; height:6px; background:rgba(255,255,255,0.06); border-radius:100px; overflow:hidden; }
  .le-compare-score-fill { height:100%; border-radius:100px; }
  .le-compare-score-num { font-size:12px; font-weight:600; min-width:36px; text-align:right; }

  /* LICENSE APPLY ASSISTANT */
  .le-assistant-wrap { max-width:680px; margin:0 auto; }
  .le-assistant-progress { display:flex; gap:0; margin-bottom:2rem; border-radius:100px; overflow:hidden; border:1px solid var(--ink-border); }
  .le-assistant-step { flex:1; padding:8px 4px; text-align:center; font-size:11px; font-weight:600; color:var(--text-muted); letter-spacing:0.5px; background:rgba(255,255,255,0.02); transition:all 0.2s; }
  .le-assistant-step.active { background:rgba(201,168,76,0.12); color:var(--gold); }
  .le-assistant-step.done { background:rgba(76,175,125,0.10); color:var(--green); }
  .le-assistant-card { background:rgba(255,255,255,0.025); border:1px solid var(--ink-border2); border-radius:var(--r-xl); padding:2.5rem; }
  .le-assistant-card h3 { font-family:'Cormorant Garamond',serif; font-size:1.6rem; font-weight:600; color:var(--text-primary); margin-bottom:0.5rem; }
  .le-assistant-card p { color:var(--text-secondary); font-size:14px; line-height:1.7; margin-bottom:1.5rem; }
  .le-assistant-checklist { display:flex; flex-direction:column; gap:8px; margin-bottom:1.5rem; }
  .le-assistant-item { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--ink-border); border-radius:var(--r-sm); cursor:pointer; transition:all 0.15s; }
  .le-assistant-item.checked { background:rgba(76,175,125,0.07); border-color:rgba(76,175,125,0.22); }
  .le-assistant-item-box { width:22px; height:22px; border-radius:6px; border:1.5px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; background:rgba(255,255,255,0.03); }
  .le-assistant-item.checked .le-assistant-item-box { background:var(--green); border-color:var(--green); }
  .le-assistant-item-text { font-size:13.5px; color:var(--text-secondary); line-height:1.55; }
  .le-assistant-link { display:inline-flex; align-items:center; gap:8px; background:rgba(107,163,214,0.10); border:1px solid rgba(107,163,214,0.25); color:var(--blue); font-size:13px; font-weight:600; padding:10px 18px; border-radius:var(--r-sm); text-decoration:none; transition:all 0.2s; margin-top:0.5rem; }
  .le-assistant-link:hover { background:rgba(107,163,214,0.18); transform:translateY(-1px); }
  .le-assistant-nav { display:flex; gap:10px; justify-content:space-between; margin-top:1.5rem; }

  /* EXPORT BUTTONS */
  .le-export-btn { display:inline-flex; align-items:center; gap:7px; background:rgba(76,175,125,0.10); border:1px solid rgba(76,175,125,0.25); color:var(--green); font-size:12px; font-weight:600; padding:7px 14px; border-radius:100px; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .le-export-btn:hover { background:rgba(76,175,125,0.18); border-color:rgba(76,175,125,0.4); transform:translateY(-1px); }

  /* MODAL OVERLAY */
  .le-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:12000; display:flex; align-items:center; justify-content:center; padding:2rem; backdrop-filter:blur(10px); overflow-y:auto; overscroll-behavior:contain; }
  .le-modal { background:var(--ink-mid); border:1px solid var(--ink-border2); border-radius:var(--r-xl); width:min(100%, 860px); max-height:min(88vh, 900px); display:flex; flex-direction:column; box-shadow:0 40px 80px rgba(0,0,0,0.7); overflow:hidden; }
  .le-modal-timeline,
  .le-modal-calculator,
  .le-modal-assistant,
  .le-modal-compare { width:min(100%, 960px); }
  .le-modal-header { padding:1.75rem 2rem 1.25rem; border-bottom:1px solid var(--ink-border); display:flex; align-items:center; justify-content:space-between; }
  .le-modal-title { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:600; color:var(--text-primary); }
  .le-modal-close { background:rgba(255,255,255,0.06); border:1px solid var(--ink-border); color:var(--text-muted); width:32px; height:32px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all 0.15s; }
  .le-modal-close:hover { background:rgba(255,255,255,0.12); color:var(--text-primary); }
  .le-modal-body { padding:1.75rem 2rem; overflow-y:auto; overscroll-behavior:contain; }

  /* FEATURE TOOLBAR (in results banner) */
  .le-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }

  /* RESPONSIVE */
  @media (max-width:768px) {
    .le-kpi-grid { grid-template-columns:1fr 1fr; }
    .le-summary-grid { grid-template-columns:1fr 1fr; }
    .le-check-grid { grid-template-columns:1fr; }
    .le-preview-grid { grid-template-columns:1fr; }
    .le-compare-wrap { grid-template-columns:1fr; }
    .le-calc-breakdown { grid-template-columns:1fr; }
    .le-nav { padding:1rem 1.25rem; }
    .le-hero { padding:5rem 1.25rem 4rem; }
    .le-hero-image-wrap { width: min(1200px, 138vw); bottom: 34%; }
    .le-hero-image { width:100%; opacity:0.72; }
    .le-hero-content { padding:0; background:none; }
    .le-results { padding:1.5rem 1rem; }
    .le-modal-overlay { padding:1rem; align-items:flex-start; }
    .le-modal { max-height:min(92vh, 900px); margin-top:0.5rem; }
    .le-modal-header, .le-modal-body { padding-left:1rem; padding-right:1rem; }
    .le-hero-stat { padding:0 1.5rem; }
    .le-section-dark,.le-section-mid { padding:4rem 1.5rem; }
    .le-steps-row { grid-template-columns:1fr 1fr; }
    .le-chat-head,
    .le-chat-compose {
      grid-template-columns: 1fr;
      display: grid;
    }
    .le-chat-meta {
      justify-content: flex-start;
    }
    .le-chat-bubble {
      max-width: 100%;
    }
  }
  @media (max-width:500px) {
    .le-kpi-grid,.le-summary-grid { grid-template-columns:1fr; }
    .le-hero-stats { flex-direction:column; gap:0; }
    .le-hero-stat { border-right:none; border-bottom:1px solid var(--ink-border); padding:1.25rem 0; }
    .le-steps-row { grid-template-columns:1fr; }
  }

  /* Noise grain overlay */
  .le-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.025;
    pointer-events: none;
    z-index: 9997;
  }

  /* Linear-style section dividers */
  .le-section-divider {
    width: 100%;
    height: 1px;
    background: #1F1F1F;
    margin: 0;
  }

  /* Feature card hover — top border glow like Linear */
  .le-feat-card-sm:hover {
    border-top: 1px solid rgba(255,255,255,0.2) !important;
    background: rgba(255,255,255,0.04) !important;
  }

  /* Document showcase */
  .le-doc-showcase {
    position: relative;
    overflow: hidden;
    padding: 5.5rem 2.5rem;
    background:
      radial-gradient(circle at 50% 18%, rgba(255,255,255,0.08), transparent 38%),
      linear-gradient(180deg, #040404 0%, #080808 100%);
    border-top: 1px solid var(--ink-border);
    border-bottom: 1px solid var(--ink-border);
  }
  .le-doc-showcase-head {
    max-width: 640px;
    margin: 0 auto 3rem;
    text-align: center;
  }
  .le-doc-showcase-head .le-section-sub {
    margin: 0 auto;
  }
  .le-doc-showcase-stage {
    position: relative;
    padding: 1rem 0 0.5rem;
  }
  .le-doc-showcase-glow {
    position: absolute;
    inset: 8% 15% auto;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
    filter: blur(28px);
    pointer-events: none;
  }
  .le-doc-showcase-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
    align-items: stretch;
  }
  .le-doc-card {
    position: relative;
    min-height: 280px;
    padding: 1.4rem;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,0.1);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)),
      rgba(10,10,10,0.82);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.06),
      0 24px 70px rgba(0,0,0,0.45);
  }
  .le-doc-card.featured {
    transform: translateY(-14px);
    border-color: rgba(255,255,255,0.16);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 32px 90px rgba(0,0,0,0.55);
  }
  .le-doc-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .le-doc-card-label {
    color: rgba(255,255,255,0.34);
    font-size: 10px;
    letter-spacing: 2.2px;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    font-family: 'Lato', sans-serif;
  }
  .le-doc-card-title {
    color: var(--text-primary);
    font-family: 'Playfair Display', serif;
    font-size: 1.35rem;
    line-height: 1.15;
    font-weight: 700;
  }
  .le-doc-card-badge {
    flex-shrink: 0;
    border: 1px solid;
    border-radius: 999px;
    padding: 0.36rem 0.72rem;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: 700;
    white-space: nowrap;
  }
  .le-doc-card-divider {
    height: 1px;
    background: rgba(255,255,255,0.08);
    margin-bottom: 0.85rem;
  }
  .le-doc-card-lines {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .le-doc-card-line {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.72);
    font-size: 0.95rem;
    line-height: 1.5;
  }
  .le-doc-card-line:last-child {
    border-bottom: none;
  }
  .le-doc-card-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 0.4rem;
    box-shadow: 0 0 14px currentColor;
  }

  /* Loading bar white fill */
  .le-loading-bar-fill {
    height: 100%;
    border-radius: 100px;
    background: #FFFFFF;
    transition: width 0.6s ease;
  }

  @media (max-width: 960px) {
    .le-doc-showcase-grid {
      grid-template-columns: 1fr;
    }
    .le-doc-card.featured {
      transform: none;
    }
  }
  @media (max-width: 768px) {
    .le-doc-showcase {
      padding: 4rem 1.5rem;
    }
    .le-doc-card {
      min-height: auto;
      padding: 1.2rem;
    }
    .le-doc-card-top {
      flex-direction: column;
      align-items: flex-start;
    }
    .le-doc-card-badge {
      white-space: normal;
    }
  }

  .le-nav-links {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 4px;
  }
  .le-nav-link {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--text-muted);
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'DM Sans', sans-serif;
  }
  .le-nav-link:hover,
  .le-nav-link.active {
    color: var(--text-primary);
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.05);
  }
  .le-page-shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: 3rem 2rem 4rem;
  }
  .le-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .le-page-eyebrow {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .le-page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.4rem;
    color: var(--text-primary);
    margin-bottom: 10px;
  }
  .le-page-sub {
    color: var(--text-muted);
    max-width: 680px;
    line-height: 1.7;
    font-size: 14px;
  }
  .le-page-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .le-stat-grid,
  .le-panel-grid,
  .le-tool-grid,
  .le-quick-grid {
    display: grid;
    gap: 1rem;
  }
  .le-stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-bottom: 1.25rem;
  }
  .le-panel-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-bottom: 1.25rem;
  }
  .le-tool-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-bottom: 1.25rem;
  }
  .le-stat-card,
  .le-panel-card,
  .le-tool-card {
    background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015));
    border: 1px solid var(--ink-border);
    border-radius: 18px;
    padding: 1.25rem;
  }
  .le-stat-label,
  .le-tool-label {
    color: var(--text-muted);
    font-size: 12px;
    margin-bottom: 10px;
  }
  .le-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.3rem;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 10px;
  }
  .le-stat-note,
  .le-tool-result {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
  .le-panel-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }
  .le-quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .le-quick-action {
    text-align: left;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.025);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
    font-family: 'DM Sans', sans-serif;
  }
  .le-quick-action:hover {
    background: rgba(255,255,255,0.05);
    transform: translateY(-1px);
  }
  .le-quick-action:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
  .le-feature-list {
    display: grid;
    gap: 10px;
  }
  .le-feature-line {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.6;
    padding-left: 14px;
    position: relative;
  }
  .le-feature-line::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
  }

  @media (max-width: 960px) {
    .le-stat-grid,
    .le-panel-grid,
    .le-tool-grid,
    .le-quick-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 768px) {
    .le-nav-links {
      display: none;
    }
    .le-page-shell {
      padding: 2rem 1rem 3rem;
    }
    .le-stat-grid,
    .le-panel-grid,
    .le-tool-grid,
    .le-quick-grid {
      grid-template-columns: 1fr;
    }
  }
`;
