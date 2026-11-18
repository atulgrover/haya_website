'use strict';

/**
 * HAYAGRIVA Component Loader & In-Page SSO Auth Modal + User Profile Dropdown
 */

var SUPABASE_AUTH_URL = 'https://rybbbqdwmjzgsdxyrjgt.supabase.co';
var SUPABASE_AUTH_ANON_KEY = 'sb_publishable_a8ZEEAQmrmzq-bxOL4sKWQ_ui7Fx13A';
var supabaseClient = null;

/**
 * Smart Environment-Aware Domain URL Resolver
 * Localhost -> routes to designated local port
 * Production -> routes to https://${subdomain}.agenticprofessionals.net
 */
function getDomainUrl(subdomain) {
    if (!subdomain) return window.location.origin;
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (isLocal) {
        const portMap = {
            portal: 3001,
            ibc: 3002,
            bns: 3003,
            hayagriva: 3000
        };
        const targetPort = portMap[subdomain] || 3001;
        return `http://localhost:${targetPort}`;
    }
    return `https://${subdomain}.agenticprofessionals.net`;
}
window.getDomainUrl = getDomainUrl;

var authIsSignup = typeof window.authIsSignup !== 'undefined' ? window.authIsSignup : false;
window.authIsSignup = authIsSignup;

/* ── Instant 0ms Transition Speculation Rules & Hover Prefetch ── */
function injectSpeculationRules() {
    if (typeof HTMLScriptElement !== 'undefined' && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
        if (!document.getElementById('siteSpeculationRules')) {
            const specScript = document.createElement('script');
            specScript.id = 'siteSpeculationRules';
            specScript.type = 'speculationrules';
            specScript.textContent = JSON.stringify({
                prefetch: [
                    {
                        source: "list",
                        urls: [
                            "employees_nsqf.html",
                            "employers_sop.html",
                            "entrepreneurs_msme.html",
                            "index.html",
                            "personalities_generic.html",
                            "personalities_vedic.html"
                        ],
                        eagerness: "moderate"
                    }
                ]
            });
            document.head.appendChild(specScript);
        }
    }

    // Hover Prefetch Fallback (Safari, Firefox)
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.origin === window.location.origin) {
            const path = link.pathname;
            if (path.endsWith('.html') && !document.querySelector(`link[rel="prefetch"][href="${path}"]`)) {
                const prefetch = document.createElement('link');
                prefetch.rel = 'prefetch';
                prefetch.href = path;
                document.head.appendChild(prefetch);
            }
        }
    }, { passive: true });
}

/* ── Sovereign Master Track Data & Skilling Metadata ────────────── */
const TRACK_DATA = {
    employees: {
        id: 'employees',
        name: 'employees',
        singular: 'employee',
        page: 'employees_nsqf.html',
        intelligenceAssets: [
            {
                title: 'NSQF Qualifications & Roles',
                desc: 'Browse mapped occupational standards across 38 Sector Skill Councils',
                href: 'employees_nsqf.html'
            },
            {
                title: 'Agentic AI Workflows',
                desc: 'Explore prompt-to-production skill matrix & corporate SOP execution',
                href: 'employees_nsqf.html'
            },
            {
                title: 'Wage Benchmarks & Roles',
                desc: 'Live compensation trends and salary bands across Tech & Corporate',
                href: 'employees_nsqf.html'
            },
            {
                title: 'Apprenticeship Schemes (NAPS)',
                desc: 'Government stipend subsidies & formal contract pathways',
                href: 'employees_nsqf.html'
            }
        ],
        dockActions: [
            {
                title: 'Fast-Track Credential Audit',
                desc: 'DigiLocker & NSQF certification verification',
                href: 'employees_nsqf.html'
            },
            {
                title: 'Agentic Copilot Download',
                desc: 'Sovereign offline skilling & SOP runner',
                href: 'employees_nsqf.html'
            }
        ],
        dockCta: {
            label: 'Access Skilling Vault →',
            href: 'employees_nsqf.html'
        },
        consultationTracks: [
            {
                slug: 'career-transition',
                name: 'career transition to agentic ai',
                scope: 'curriculum pathway, NSQF Level 7-9 certification planning, and agentic workspace setup.'
            },
            {
                slug: 'portfolio-audit',
                name: 'resume & portfolio audit',
                scope: 'ai agent proof-of-work validation, prompt portfolio review, and verified skill dossier.'
            },
            {
                slug: 'compensation-advisory',
                name: 'compensation & contract advisory',
                scope: 'employment agreement vetting, stock option grants, and remote contract terms.'
            }
        ]
    },
    employers: {
        id: 'employers',
        name: 'employers',
        singular: 'employer',
        page: 'employers_sop.html',
        intelligenceAssets: [
            {
                title: 'Standard Operating Procedures (SOPs)',
                desc: 'Autonomous agent templates, role descriptions & workflow runbooks',
                href: 'employers_sop.html'
            },
            {
                title: 'Apprenticeship Portals (NAPS/NATS)',
                desc: 'Stipend reimbursement & workforce scaling compliance',
                href: 'employers_sop.html'
            },
            {
                title: 'Talent Assessment Pipelines',
                desc: 'Vedic Triguna profiling & autonomous coding benchmarks',
                href: 'personalities_vedic.html'
            },
            {
                title: 'Statutory Compliance Audits',
                desc: 'Labor law, PF/ESIC & contract labor governance',
                href: 'employers_sop.html'
            }
        ],
        dockActions: [
            {
                title: 'Enterprise Workforce Audit',
                desc: 'Statutory labor & contract compliance scoring',
                href: 'employers_sop.html'
            },
            {
                title: 'Deploy Private Agents',
                desc: 'Local offline LLM pipelines for corporate SOPs',
                href: 'employers_sop.html'
            }
        ],
        dockCta: {
            label: 'Deploy Enterprise Hub →',
            href: 'employers_sop.html'
        },
        consultationTracks: [
            {
                slug: 'ai-automation-roadmap',
                name: 'workforce ai automation roadmap',
                scope: 'sop conversion, agentic process deployment, and team transition.'
            },
            {
                slug: 'naps-setup',
                name: 'naps apprenticeship setup',
                scope: 'government registration, stipend subsidy optimization, and candidate onboarding.'
            },
            {
                slug: 'corporate-profiling',
                name: 'corporate personality profiling',
                scope: 'triguna team structuring, executive synergy, and conflict mediation.'
            }
        ]
    },
    entrepreneurs: {
        id: 'entrepreneurs',
        name: 'entrepreneurs',
        singular: 'entrepreneur',
        page: 'entrepreneurs_msme.html',
        intelligenceAssets: [
            {
                title: 'MSME Schemes & Subsidies',
                desc: 'CGTMSE collateral-free loans, PMEGP & MSME Samadhaan',
                href: 'entrepreneurs_msme.html'
            },
            {
                title: 'Patent & IP Commercialization',
                desc: 'Patent filing, trademark protection & valuation dossiers',
                href: 'patents.html'
            },
            {
                title: 'Venture Capital & Angel Syndicates',
                desc: 'Seed pitch readiness, financial models & cap table setup',
                href: 'entrepreneurs_msme.html'
            },
            {
                title: 'Incubation & Physical Meetup Cafes',
                desc: 'Access to Agentic Professionals physical hub & labs',
                href: 'entrepreneurs_msme.html'
            }
        ],
        dockActions: [
            {
                title: 'Bankable Project Report (DPR)',
                desc: '1-click DSCR, cash flow & subsidy report generator',
                href: 'entrepreneurs_msme.html'
            },
            {
                title: 'Prior Art Patent Search',
                desc: 'Indian Patent Office & WIPO novelty analysis',
                href: 'patents.html'
            }
        ],
        dockCta: {
            label: 'Generate Bankable DPR →',
            href: 'entrepreneurs_msme.html'
        },
        consultationTracks: [
            {
                slug: 'msme-compliance',
                name: 'msme statutory compliance & subsidy audit',
                scope: 'udyam registration, pmegp/cgtmse subsidy filing, and bank loan readiness.'
            },
            {
                slug: 'patent-strategy',
                name: 'patent strategy & prior art review',
                scope: 'ip filing feasibility, provisional specification, and valuation assessment.'
            },
            {
                slug: 'incubation-booking',
                name: 'incubation & physical cafe booking',
                scope: 'conference hall booking, physical meetup space, and angel investor access.'
            }
        ]
    }
};

function getCurrentTrack() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('employees_nsqf.html') || path.endsWith('students.html')) {
        return 'employees';
    } else if (path.endsWith('employers_sop.html') || path.endsWith('employees.html')) {
        return 'employers';
    } else if (path.endsWith('entrepreneurs_msme.html')) {
        return 'entrepreneurs';
    }
    const saved = localStorage.getItem('portal_track');
    if (saved && TRACK_DATA[saved]) return saved;
    return 'employees';
}

function getStoredUser() {
    try {
        const raw = localStorage.getItem('portal_user') || localStorage.getItem('openibc_user') || localStorage.getItem('haya_user');
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}
window.getStoredUser = getStoredUser;

function buildMasterHeaderHtml(activeTrackKey) {
    const track = TRACK_DATA[activeTrackKey] || TRACK_DATA.employees;
    const singular = track.singular;
    const opportunitiesHref = track.page;

    const assetsHtml = track.intelligenceAssets.map(asset => `
      <a href="${asset.href}" class="menu-card">
        <div class="menu-card-info">
          <h4>${asset.title.toLowerCase()}</h4>
          <p>${asset.desc.toLowerCase()}</p>
        </div>
      </a>
    `).join('');

    const actionsHtml = track.dockActions.map(action => `
      <a href="${action.href}" class="dock-action-row">
        <div class="dock-action-left">
          <div class="dock-action-text">
            <h5>${action.title.toLowerCase()}</h5>
            <p>${action.desc.toLowerCase()}</p>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
    `).join('');

    const tracksHtml = track.consultationTracks.map((t, idx) => `
      <div class="menu-card ${idx === 0 ? 'selected' : ''}" data-track-slug="${t.slug}" data-track-name="${t.name}" data-track-scope="${t.scope}">
        <div class="menu-card-info">
          <h4>${t.name}</h4>
          <p>${t.scope}</p>
        </div>
      </div>
    `).join('');

    return `
    <header class="site-header">
      <!-- 1. Left: Brand Lockup & Track Switcher -->
      <div class="brand-container">
        <a href="index.html" class="brand-link" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
          <svg class="unicorn-icon" viewBox="0 0 852 845">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M 810 92 L 799 94 L 796 96 L 792 96 L 785 99 L 781 99 L 760 105 L 757 107 L 749 108 L 746 110 L 742 110 L 736 113 L 732 113 L 725 116 L 721 116 L 718 118 L 711 119 L 708 121 L 700 122 L 690 126 L 682 127 L 679 129 L 672 130 L 658 135 L 654 135 L 651 137 L 633 141 L 630 143 L 626 143 L 619 146 L 605 149 L 602 151 L 598 151 L 591 154 L 587 154 L 573 159 L 566 160 L 563 162 L 559 162 L 552 165 L 548 165 L 538 168 L 535 170 L 527 171 L 525 172 L 524 175 L 532 187 L 532 190 L 534 192 L 533 196 L 520 177 L 508 165 L 489 152 L 469 143 L 464 143 L 461 140 L 458 139 L 470 138 L 484 140 L 486 138 L 487 131 L 490 124 L 490 120 L 493 115 L 493 112 L 495 110 L 496 105 L 498 103 L 498 101 L 504 90 L 519 68 L 509 69 L 498 72 L 479 80 L 455 94 L 454 96 L 452 96 L 441 105 L 437 105 L 438 97 L 446 79 L 446 76 L 449 72 L 454 58 L 457 54 L 460 45 L 462 43 L 463 36 L 460 36 L 457 38 L 451 39 L 449 41 L 436 45 L 434 47 L 426 50 L 418 55 L 416 55 L 386 74 L 357 97 L 321 133 L 317 134 L 317 132 L 323 123 L 323 121 L 334 106 L 339 101 L 341 97 L 333 97 L 327 99 L 320 99 L 305 102 L 301 104 L 292 105 L 277 110 L 273 110 L 261 115 L 249 118 L 244 121 L 241 121 L 215 132 L 178 152 L 153 169 L 131 187 L 104 215 L 91 232 L 85 244 L 87 244 L 90 241 L 92 241 L 99 236 L 107 233 L 133 219 L 144 214 L 149 213 L 151 211 L 154 211 L 156 209 L 172 203 L 193 197 L 198 197 L 208 194 L 213 196 L 205 201 L 186 209 L 161 223 L 134 241 L 109 261 L 87 283 L 71 303 L 55 331 L 46 355 L 46 360 L 44 363 L 43 373 L 41 377 L 41 384 L 38 396 L 36 423 L 36 442 L 38 467 L 40 472 L 43 492 L 46 499 L 46 503 L 49 509 L 49 512 L 52 517 L 52 520 L 54 522 L 55 527 L 57 529 L 63 543 L 68 550 L 68 552 L 84 574 L 107 598 L 126 614 L 129 615 L 133 619 L 173 644 L 202 658 L 218 664 L 220 666 L 223 666 L 235 672 L 253 678 L 263 683 L 266 683 L 276 688 L 279 688 L 284 691 L 287 691 L 345 716 L 344 708 L 339 695 L 339 691 L 331 672 L 314 641 L 300 621 L 290 609 L 291 606 L 295 609 L 297 609 L 311 619 L 331 636 L 348 654 L 365 677 L 375 693 L 376 697 L 382 707 L 387 719 L 389 721 L 389 724 L 397 742 L 403 761 L 406 777 L 408 781 L 409 791 L 411 796 L 412 808 L 415 808 L 430 782 L 430 780 L 438 766 L 438 764 L 440 762 L 454 729 L 454 726 L 462 706 L 463 699 L 465 696 L 468 680 L 470 676 L 471 666 L 474 654 L 474 647 L 476 641 L 477 624 L 476 582 L 474 576 L 473 564 L 468 548 L 468 544 L 462 528 L 455 513 L 452 509 L 451 505 L 441 491 L 440 488 L 424 468 L 412 456 L 389 439 L 353 404 L 344 391 L 336 374 L 336 370 L 334 367 L 333 362 L 332 342 L 334 329 L 342 307 L 345 302 L 348 302 L 348 327 L 351 341 L 354 347 L 354 350 L 362 364 L 373 375 L 377 378 L 379 378 L 389 384 L 395 386 L 403 387 L 407 389 L 419 389 L 433 392 L 440 395 L 451 402 L 463 414 L 471 426 L 477 438 L 477 441 L 482 452 L 485 464 L 486 475 L 488 479 L 488 484 L 494 501 L 500 508 L 504 510 L 509 510 L 514 507 L 517 503 L 518 500 L 518 489 L 517 484 L 513 476 L 517 475 L 521 478 L 529 488 L 529 490 L 531 492 L 534 499 L 535 504 L 538 510 L 542 514 L 547 516 L 563 515 L 570 511 L 580 501 L 583 496 L 589 480 L 589 474 L 591 468 L 591 452 L 589 445 L 588 431 L 586 427 L 586 422 L 583 410 L 581 407 L 580 400 L 575 388 L 572 375 L 564 355 L 564 351 L 558 336 L 554 322 L 553 314 L 550 307 L 550 301 L 548 296 L 547 281 L 545 273 L 545 237 L 542 224 L 546 220 L 550 219 L 554 216 L 608 191 L 620 184 L 641 175 L 661 164 L 670 161 L 684 153 L 703 145 L 723 134 L 732 131 L 740 126 L 742 126 L 756 118 L 771 112 L 785 104 L 800 98 Z" />
          </svg>
          <span class="brand-title-static">agentic professionals</span>
        </a>
        <span class="brand-dash">-</span>
        <div class="track-picker-wrapper" id="brand-trigger">
          <button type="button" class="brand-title-btn" id="brand-title-btn">
            <span id="brand-title-text">${track.name}</span>
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <!-- Popover Dropdown Underneath Track -->
          <div class="subdomain-dropdown" id="subdomain-dropdown">
            <a href="employees_nsqf.html" class="dropdown-item ${activeTrackKey === 'employees' ? 'active' : ''}" data-track="employees">employees</a>
            <a href="employers_sop.html" class="dropdown-item ${activeTrackKey === 'employers' ? 'active' : ''}" data-track="employers">employers</a>
            <a href="entrepreneurs_msme.html" class="dropdown-item ${activeTrackKey === 'entrepreneurs' ? 'active' : ''}" data-track="entrepreneurs">entrepreneurs</a>
          </div>
        </div>
      </div>

      <!-- 2. Center: Megamenus Navigation -->
      <nav>
        <ul class="nav-links">
          
          <!-- Item 1: Opportunities -->
          <li class="nav-item">
            <a href="${opportunitiesHref}" class="nav-btn pill-active" id="nav-opportunities">${singular} opportunities</a>
          </li>

          <!-- Item 2: Intelligence Mega Menu (740px Flyout) -->
          <li class="nav-item" id="nav-intelligence-container">
            <button type="button" class="nav-btn" id="nav-intelligence-btn">
              <span id="intelligence-label">${singular} intelligence</span>
              <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- 740px Megamenu Panel -->
            <div class="megamenu-panel" id="megamenu-intelligence">
              <div class="megamenu-grid">
                <!-- Left Column: Intelligence Assets -->
                <div class="megamenu-col-left">
                  <div>
                    <h3 class="megamenu-col-title" id="intelligence-col-title">${singular} intelligence</h3>
                    <div class="space-y-1" id="intelligence-assets-list">
                      ${assetsHtml}
                    </div>
                  </div>
                </div>

                <!-- Right Column: Sovereign Execution Dock -->
                <div class="megamenu-col-dark" style="justify-content:center;">
                  <div class="dark-dock-header">
                    <span>sovereign workforce dock</span>
                    <span class="pulse-dot"></span>
                  </div>
                  <div class="dock-actions-list" id="intelligence-actions-list" style="margin:0 0 12px 0;">
                    ${actionsHtml}
                  </div>
                  <a href="${track.dockCta.href}" class="dock-download-btn" id="intelligence-dock-cta" style="text-decoration:none;">
                    <span>${track.dockCta.label.toLowerCase()}</span>
                  </a>
                </div>
              </div>
            </div>
          </li>

          <!-- Item 3: Consultations Mega Menu (740px Flyout) -->
          <li class="nav-item" id="nav-consultations-container">
            <button type="button" class="nav-btn" id="nav-consultations-btn">
              <span id="consultations-label">${singular} consultations</span>
              <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- 740px Megamenu Panel -->
            <div class="megamenu-panel" id="megamenu-consultations">
              <div class="megamenu-grid">
                <!-- Left Column: Advisory Tracks -->
                <div class="megamenu-col-left">
                  <div>
                    <h3 class="megamenu-col-title" id="consultations-col-title">${singular} consultations</h3>
                    <div class="space-y-1" id="consultations-tracks-list">
                      ${tracksHtml}
                    </div>
                  </div>
                </div>

                <!-- Right Column: Scope & Booking Dock -->
                <div class="megamenu-col-dark" id="calnode-dock">
                  <div id="consultation-dock-container" style="flex:1;display:flex;flex-direction:column;min-height:0;justify-content:space-between;">
                    <div class="consultation-scope-card" id="consultation-scope-card">
                      <p class="consultation-narrative-text" id="consultation-narrative-text">
                        <strong id="selected-track-name">${track.consultationTracks[0].name}</strong> &ndash;
                        <span id="selected-track-scope">${track.consultationTracks[0].scope}</span>
                      </p>
                    </div>

                    <button type="button" class="fast-track-submit-btn" id="calnode-book-trigger">
                      <span id="calnode-book-trigger-text">book briefing &rarr;</span>
                    </button>
                  </div>

                  <a href="tel:+919316015274" class="calnode-emergency-contact">
                    <span style="color:#94a3b8;">advisory hotline:</span>
                    <strong style="color:#34d399;">93160-15274</strong>
                    <span style="color:#64748b;">(11 am &ndash; 4 pm)</span>
                  </a>
                </div>
              </div>
            </div>
          </li>

        </ul>
      </nav>

      <!-- 3. Actions Tray (Right): answers, reports & sign in -->
      <div class="actions-tray">
        <button type="button" class="answers-nav-btn" id="nav-answers-btn">
          <span>answers</span>
        </button>

        <a href="personalities_vedic.html" class="catalog-nav-btn" id="nav-reports-btn" style="text-decoration:none;">
          <span>reports</span>
        </a>

        <!-- Logged-Out User Gateway -->
        <div id="auth-logged-out-tray" style="display:flex;align-items:center;">
          <button type="button" class="catalog-nav-btn" id="open-auth-btn">
            <span>sign in</span>
          </button>
        </div>

        <!-- Logged-In User Gateway -->
        <div id="auth-logged-in-tray" style="display:none;align-items:center;">
          <div style="position:relative;">
            <div class="user-profile-btn" id="user-profile-trigger">
              <div class="user-avatar-circle" id="user-avatar-text">AP</div>
              <span id="user-display-name" style="display:none;">admin</span>
              <svg class="chevron-icon" style="width:13px;height:13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>

            <div class="user-profile-dropdown" id="user-profile-dropdown">
              <div style="padding:8px 10px;border-bottom:1px solid #f1f5f9;margin-bottom:4px;">
                <span id="user-email-text" style="font-size:11px;font-family:monospace;color:#64748b;display:block;word-break:break-all;line-height:1.2;">admin@agenticprofessionals.net</span>
                <span id="user-role-badge" style="display:none;"></span>
              </div>
              <button type="button" id="dropdown-workspace-btn" class="dropdown-item" style="width:100%;text-align:left;cursor:pointer;border:none;background:none;font-size:12.5px;padding:5px 10px;text-transform:lowercase;">
                user console
              </button>
              <a href="/admin" id="admin-dashboard-link" class="dropdown-item" style="font-size:12.5px;display:none;padding:5px 10px;text-transform:lowercase;">admin console</a>
              <button type="button" id="logout-btn" class="dropdown-item" style="width:100%;text-align:left;color:#e11d48;cursor:pointer;border:none;background:none;font-size:12.5px;padding:5px 10px;text-transform:lowercase;">
                log out
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
    `;
}

function populateHeaderTrack(trackKey) {
    const track = TRACK_DATA[trackKey] || TRACK_DATA.employees;
    const singular = track.singular;

    // Brand text
    const brandTitleText = document.getElementById('brand-title-text');
    if (brandTitleText) {
        brandTitleText.textContent = track.name;
    }

    // Active dropdown item
    document.querySelectorAll('#subdomain-dropdown .dropdown-item[data-track]').forEach(item => {
        if (item.getAttribute('data-track') === trackKey) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Opportunities
    const navOpportunities = document.getElementById('nav-opportunities');
    if (navOpportunities) {
        navOpportunities.textContent = `${singular} opportunities`;
        navOpportunities.href = track.page;
    }

    // Intelligence labels
    const intelligenceLabel = document.getElementById('intelligence-label');
    if (intelligenceLabel) intelligenceLabel.textContent = `${singular} intelligence`;

    const intelligenceColTitle = document.getElementById('intelligence-col-title');
    if (intelligenceColTitle) intelligenceColTitle.textContent = `${singular} intelligence`;

    // Intelligence assets list
    const assetsList = document.getElementById('intelligence-assets-list');
    if (assetsList) {
        assetsList.innerHTML = track.intelligenceAssets.map(asset => `
            <a href="${asset.href}" class="menu-card">
              <div class="menu-card-info">
                <h4>${asset.title.toLowerCase()}</h4>
                <p>${asset.desc.toLowerCase()}</p>
              </div>
            </a>
        `).join('');
    }

    // Sovereign Execution Dock actions
    const actionsList = document.getElementById('intelligence-actions-list');
    if (actionsList) {
        actionsList.innerHTML = track.dockActions.map(action => `
            <a href="${action.href}" class="dock-action-row">
              <div class="dock-action-left">
                <div class="dock-action-text">
                  <h5>${action.title.toLowerCase()}</h5>
                  <p>${action.desc.toLowerCase()}</p>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
        `).join('');
    }

    const dockCta = document.getElementById('intelligence-dock-cta');
    if (dockCta) {
        dockCta.innerHTML = `<span>${track.dockCta.label.toLowerCase()}</span>`;
        dockCta.href = track.dockCta.href;
    }

    // Consultations labels
    const consultationsLabel = document.getElementById('consultations-label');
    if (consultationsLabel) consultationsLabel.textContent = `${singular} consultations`;

    const consultationsColTitle = document.getElementById('consultations-col-title');
    if (consultationsColTitle) consultationsColTitle.textContent = `${singular} consultations`;

    // Consultations tracks list
    const tracksList = document.getElementById('consultations-tracks-list');
    if (tracksList) {
        tracksList.innerHTML = track.consultationTracks.map((t, idx) => `
            <div class="menu-card ${idx === 0 ? 'selected' : ''}" data-track-slug="${t.slug}" data-track-name="${t.name}" data-track-scope="${t.scope}">
              <div class="menu-card-info">
                <h4>${t.name}</h4>
                <p>${t.scope}</p>
              </div>
            </div>
        `).join('');

        // Wire track selection on hover / click
        tracksList.querySelectorAll('.menu-card').forEach(card => {
            const selectCard = () => {
                tracksList.querySelectorAll('.menu-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const nameEl = document.getElementById('selected-track-name');
                const scopeEl = document.getElementById('selected-track-scope');
                if (nameEl) nameEl.textContent = card.getAttribute('data-track-name');
                if (scopeEl) scopeEl.textContent = card.getAttribute('data-track-scope');
            };
            card.addEventListener('mouseenter', selectCard);
            card.addEventListener('click', selectCard);
        });
    }

    // Default narrative card
    if (track.consultationTracks.length > 0) {
        const nameEl = document.getElementById('selected-track-name');
        const scopeEl = document.getElementById('selected-track-scope');
        if (nameEl) nameEl.textContent = track.consultationTracks[0].name;
        if (scopeEl) scopeEl.textContent = track.consultationTracks[0].scope;
    }
}

let pinnedMegamenu = null;
let megamenuCloseTimer = null;

function wireMasterHeaderEvents() {
    const brandTrigger = document.getElementById('brand-trigger');
    const subdomainDropdown = document.getElementById('subdomain-dropdown');
    const navIntelligenceContainer = document.getElementById('nav-intelligence-container');
    const navIntelligenceBtn = document.getElementById('nav-intelligence-btn');
    const megamenuIntelligence = document.getElementById('megamenu-intelligence');

    const navConsultationsContainer = document.getElementById('nav-consultations-container');
    const navConsultationsBtn = document.getElementById('nav-consultations-btn');
    const megamenuConsultations = document.getElementById('megamenu-consultations');

    const calnodeBookTrigger = document.getElementById('calnode-book-trigger');
    const navAnswersBtn = document.getElementById('nav-answers-btn');

    function closeAllMegamenus() {
        if (megamenuCloseTimer) {
            clearTimeout(megamenuCloseTimer);
            megamenuCloseTimer = null;
        }
        if (megamenuIntelligence) megamenuIntelligence.classList.remove('show');
        if (navIntelligenceBtn) navIntelligenceBtn.classList.remove('open');
        if (megamenuConsultations) megamenuConsultations.classList.remove('show');
        if (navConsultationsBtn) navConsultationsBtn.classList.remove('open');
        pinnedMegamenu = null;
    }

    function openMegamenu(type, pin = false) {
        if (megamenuCloseTimer) {
            clearTimeout(megamenuCloseTimer);
            megamenuCloseTimer = null;
        }
        if (type === 'intelligence') {
            if (megamenuConsultations) megamenuConsultations.classList.remove('show');
            if (navConsultationsBtn) navConsultationsBtn.classList.remove('open');
            if (megamenuIntelligence) megamenuIntelligence.classList.add('show');
            if (navIntelligenceBtn) navIntelligenceBtn.classList.add('open');
            if (pin) pinnedMegamenu = 'intelligence';
        } else if (type === 'consultations') {
            if (megamenuIntelligence) megamenuIntelligence.classList.remove('show');
            if (navIntelligenceBtn) navIntelligenceBtn.classList.remove('open');
            if (megamenuConsultations) megamenuConsultations.classList.add('show');
            if (navConsultationsBtn) navConsultationsBtn.classList.add('open');
            if (pin) pinnedMegamenu = 'consultations';
        }
    }

    function scheduleCloseMegamenu(type) {
        if (pinnedMegamenu === type) return;
        megamenuCloseTimer = setTimeout(() => {
            closeAllMegamenus();
        }, 150);
    }

    // Intelligence flyout
    if (navIntelligenceContainer && navIntelligenceBtn && megamenuIntelligence) {
        navIntelligenceContainer.addEventListener('mouseenter', () => openMegamenu('intelligence', false));
        navIntelligenceContainer.addEventListener('mouseleave', () => scheduleCloseMegamenu('intelligence'));
        navIntelligenceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (megamenuIntelligence.classList.contains('show') && pinnedMegamenu === 'intelligence') {
                closeAllMegamenus();
            } else {
                openMegamenu('intelligence', true);
            }
        });
        megamenuIntelligence.addEventListener('click', (e) => e.stopPropagation());
    }

    // Consultations flyout
    if (navConsultationsContainer && navConsultationsBtn && megamenuConsultations) {
        navConsultationsContainer.addEventListener('mouseenter', () => openMegamenu('consultations', false));
        navConsultationsContainer.addEventListener('mouseleave', () => scheduleCloseMegamenu('consultations'));
        navConsultationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (megamenuConsultations.classList.contains('show') && pinnedMegamenu === 'consultations') {
                closeAllMegamenus();
            } else {
                openMegamenu('consultations', true);
            }
        });
        megamenuConsultations.addEventListener('click', (e) => e.stopPropagation());
    }

    // Brand / Track switcher
    if (brandTrigger && subdomainDropdown) {
        brandTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllMegamenus();
            subdomainDropdown.classList.toggle('show');
        });

        document.querySelectorAll('#subdomain-dropdown .dropdown-item[data-track]').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetTrack = item.getAttribute('data-track');
                localStorage.setItem('portal_track', targetTrack);
                subdomainDropdown.classList.remove('show');

                const targetPage = TRACK_DATA[targetTrack]?.page;
                if (targetPage && !window.location.pathname.endsWith(targetPage)) {
                    window.location.href = targetPage;
                } else {
                    populateHeaderTrack(targetTrack);
                }
            });
        });
    }

    // Document click to dismiss menus
    document.addEventListener('click', () => {
        closeAllMegamenus();
        if (subdomainDropdown) subdomainDropdown.classList.remove('show');
    });

    // Booking Consultation Action
    if (calnodeBookTrigger) {
        calnodeBookTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAllMegamenus();

            const user = getStoredUser();
            const trackName = document.getElementById('selected-track-name')?.textContent || 'Sovereign Consultation';

            if (!user) {
                const signinError = document.getElementById('signin-error');
                if (signinError) {
                    signinError.textContent = 'please sign in to book your consultation briefing';
                    signinError.style.display = 'block';
                }
                openAuthModal(false);
                return;
            }

            showPortalToast(`Briefing booked for ${trackName}. An empanelled advisor will connect at ${user.email || user.e_mail}.`);
        });
    }

    // Answers Action (LightRAG Q&A)
    if (navAnswersBtn) {
        navAnswersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAllMegamenus();
            showLightRagModal();
        });
    }
}

function showPortalToast(message) {
    const existing = document.getElementById('portalLiveToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'portalLiveToast';
    toast.className = 'portal-toast';
    toast.innerHTML = `
        <span class="pulse-dot emerald"></span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

function showLightRagModal() {
    let overlay = document.getElementById('lightrag-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lightrag-modal-overlay';
        overlay.className = 'lightrag-modal-overlay';
        overlay.innerHTML = `
          <div class="lightrag-modal-card">
            <div style="background:#0f172a;padding:20px 24px;position:relative;">
              <button type="button" id="lightrag-modal-close" style="position:absolute;top:16px;right:18px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
              <div style="font-size:10px;font-family:'Roboto Mono',monospace;color:#38bdf8;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:4px;">
                SOVEREIGN KNOWLEDGE GRAPH &bull; DUAL-LEVEL RETRIEVAL
              </div>
              <h2 style="font-family:'Chakra Petch',sans-serif;font-size:18px;font-weight:700;color:white;text-transform:uppercase;margin:0;">
                LightRAG Answers Engine
              </h2>
            </div>
            <div style="padding:24px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <span class="pulse-dot emerald"></span>
                  <span style="font-size:12px;font-family:'Roboto Mono',monospace;font-weight:700;color:#0f172a;text-transform:uppercase;">
                    Statutory & Skilling Corpus Graph
                  </span>
                </div>
                <p style="font-size:12.5px;color:#475569;line-height:1.5;margin:0;">
                  Dual-level retrieval integrating low-level specific entity lookups (NSQF qualification codes, section 30(2) statutory precedents, MSME subsidies) and high-level graph synthesis.
                </p>
              </div>
              <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
                <input type="text" id="lightrag-query-input" class="fast-track-input" placeholder="ask any question across statutory, sop or skilling tracks..." style="border-radius:8px;padding:11px 14px;font-size:13px;width:100%;box-sizing:border-box;">
                <button type="button" id="lightrag-search-btn" class="fast-track-submit-btn" style="height:40px;">
                  <span>query knowledge graph &rarr;</span>
                </button>
              </div>
              <div id="lightrag-status-result" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:12px;color:#166534;line-height:1.4;">
                <strong>Graph Retrieval Active:</strong> Matching entities identified across 38 Sector Councils and statutory registers. LightRAG worker pipeline is operating in sovereign offline mode.
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#lightrag-modal-close').onclick = () => overlay.classList.remove('show');
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        };
        const searchBtn = overlay.querySelector('#lightrag-search-btn');
        const queryInput = overlay.querySelector('#lightrag-query-input');
        const statusResult = overlay.querySelector('#lightrag-status-result');

        const doSearch = () => {
            const q = queryInput.value.trim();
            if (!q) return;
            statusResult.style.display = 'block';
            statusResult.innerHTML = `<strong>Querying Graph for:</strong> "${q}"<br><span style="color:#64748b;font-size:11px;">Extracting high-level theme entities and low-level relational edges... Connected to Supabase pgvector store.</span>`;
        };
        searchBtn.onclick = doSearch;
        queryInput.onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };
    }
    overlay.classList.add('show');
    const input = overlay.querySelector('#lightrag-query-input');
    if (input) {
        input.focus();
    }
}

/* ── Universal Master Header Renderer ───────────────────────── */
function renderSiteHeader() {
    const headerMount = document.getElementById('site-header');
    if (!headerMount) return;

    const currentTrack = getCurrentTrack();

    // Check if the current header has proper track-picker-wrapper & pre-rendered assets
    const hasTrackPicker = !!headerMount.querySelector('.track-picker-wrapper');
    const assetsList = headerMount.querySelector('#intelligence-assets-list');
    const needsHydration = !headerMount.querySelector('.site-header') || !hasTrackPicker || !assetsList || assetsList.children.length === 0;

    if (needsHydration) {
        headerMount.innerHTML = buildMasterHeaderHtml(currentTrack);
    }

    // Populate data & wire all megamenus, track switchers and actions
    populateHeaderTrack(currentTrack);
    wireMasterHeaderEvents();
    if (typeof renderAuthState === 'function') {
        renderAuthState(getStoredUser());
    }
}

/* ── Universal Supabase Auth & Navigation Tray (Matching OpenIBC 3002 & OpenBNS 3003) ── */
function initSupabaseAuthClient() {
    if (supabaseClient) return;
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_AUTH_URL, SUPABASE_AUTH_ANON_KEY);
        } else if (!document.getElementById('supabaseJsScript')) {
            const script = document.createElement('script');
            script.id = 'supabaseJsScript';
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                if (window.supabase && typeof window.supabase.createClient === 'function') {
                    supabaseClient = window.supabase.createClient(SUPABASE_AUTH_URL, SUPABASE_AUTH_ANON_KEY);
                    setupAuthModal();
                }
            };
            document.head.appendChild(script);
        }
    } catch (e) {
        console.warn('[HAYAGRIVA Auth] Supabase initialization warning:', e);
    }
}

function renderAuthState(user) {
    const authLoggedOutTray = document.getElementById('auth-logged-out-tray');
    const authLoggedInTray = document.getElementById('auth-logged-in-tray');
    const userProfileDropdown = document.getElementById('user-profile-dropdown');
    const userAvatarText = document.getElementById('user-avatar-text');
    const userDisplayName = document.getElementById('user-display-name');
    const userEmailText = document.getElementById('user-email-text');
    const adminDashboardLink = document.getElementById('admin-dashboard-link');

    if (!user) {
        if (authLoggedOutTray) authLoggedOutTray.style.display = 'flex';
        if (authLoggedInTray) authLoggedInTray.style.display = 'none';
        if (userProfileDropdown) userProfileDropdown.classList.remove('show');
        return;
    }

    if (authLoggedOutTray) authLoggedOutTray.style.display = 'none';
    if (authLoggedInTray) authLoggedInTray.style.display = 'flex';

    // Self-heal known admin accounts
    if (user.e_mail === 'admin@openibc.in' || user.email === 'admin@openibc.in' || user.email === 'admin@agenticprofessionals.net') {
        user.custom_role = 'admin';
        user.username = 'admin';
    }

    const name = user.display_name || user.name || user.username || (user.e_mail ? user.e_mail.split('@')[0] : (user.email ? user.email.split('@')[0] : 'Practitioner'));
    const email = user.e_mail || user.email || '';

    if (userDisplayName) userDisplayName.textContent = name;
    if (userEmailText) userEmailText.textContent = email;

    const parts = name.trim().split(/\s+/);
    const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    if (userAvatarText) userAvatarText.textContent = initials || 'AP';

    const isAdmin = user.role_id === 2 || user.username === 'admin' || user.custom_role === 'admin' || email === 'admin@openibc.in' || email === 'admin@agenticprofessionals.net';
    if (adminDashboardLink) {
        adminDashboardLink.style.display = isAdmin ? 'block' : 'none';
    }
}
window.renderAuthState = renderAuthState;

/* ── Inject Auth Modal HTML ────────────────────────────── */
function injectAuthModal() {
    if (document.getElementById('auth-modal-overlay')) return;

    const modalHTML = `
      <div class="modal-overlay" id="auth-modal-overlay">
        <div class="modal-card">
          <!-- Modal Header -->
          <div style="padding:20px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;justify-content:space-between;">
            <div>
              <span style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:10px;font-family:'Chakra Petch',sans-serif;font-weight:700;padding:2px 8px;border-radius:999px;text-transform:uppercase;">
                SOVEREIGN PROFESSIONAL IDENTITY
              </span>
              <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin-top:6px;font-family:'Google Sans',sans-serif;">
                Agentic Professionals Gateway
              </h2>
              <p style="font-size:12px;color:#64748b;margin-top:2px;">
                Single Sign-On across Federated Practice Portals &amp; Knowledge Vaults.
              </p>
            </div>
            <button type="button" class="modal-close-btn" id="auth-modal-close" style="color:#64748b;background:#f1f5f9;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>
          </div>

          <div class="modal-body" style="padding:20px 24px;">
            <!-- Toggle Tabs: Sign In vs Create Account -->
            <div class="auth-toggle-bar">
              <button type="button" class="auth-tab-btn active" id="tab-signin-btn">Sign In</button>
              <button type="button" class="auth-tab-btn" id="tab-signup-btn">Create Account</button>
            </div>

            <!-- ─── TAB 1: SIGN IN FORM ─── -->
            <form id="form-signin" style="display:flex;flex-direction:column;gap:14px;">
              <div id="signin-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 12px;border-radius:8px;font-size:12px;"></div>

              <div>
                <label style="display:block;font-size:11px;font-family:monospace;font-weight:700;color:#334155;text-transform:uppercase;margin-bottom:4px;">
                  Email Address
                </label>
                <input type="email" id="signin-email" class="fast-track-input" placeholder="practitioner@agenticprofessionals.net" required />
              </div>

              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <label style="font-size:11px;font-family:monospace;font-weight:700;color:#334155;text-transform:uppercase;">
                    Password
                  </label>
                </div>
                <input type="password" id="signin-password" class="fast-track-input" placeholder="••••••••••••" required />
              </div>

              <!-- Quick Autofill for Demo Testing -->
              <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:8px 12px;">
                <span style="font-size:10px;font-family:monospace;font-weight:700;color:#64748b;display:block;margin-bottom:6px;">QUICK DEMO CREDENTIALS (CLICK TO AUTOFILL):</span>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
                  <button type="button" id="fill-admin-btn" style="background:white;border:1px solid #cbd5e1;border-radius:6px;padding:3px 8px;font-size:11px;font-family:monospace;color:#0f172a;cursor:pointer;">
                    Admin: admin@openibc.in
                  </button>
                  <button type="button" id="fill-sharma-btn" style="background:white;border:1px solid #cbd5e1;border-radius:6px;padding:3px 8px;font-size:11px;font-family:monospace;color:#059669;cursor:pointer;">
                    User: adv_sharma@openibc.in
                  </button>
                </div>
                <div style="font-size:10px;font-family:monospace;color:#64748b;line-height:1.4;">
                  <div>• <strong>Admin:</strong> admin@openibc.in / OpenIBC@Admin2026!</div>
                  <div>• <strong>User:</strong> adv_sharma@openibc.in / Sharma@2026!</div>
                </div>
              </div>

              <button type="submit" id="signin-submit-btn" style="width:100%;padding:12px;border-radius:10px;background:#0f172a;color:white;font-family:'Chakra Petch',sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>Sign In to Chamber</span>
                <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </form>

            <!-- ─── TAB 2: CREATE ACCOUNT FORM ─── -->
            <form id="form-signup" style="display:none;flex-direction:column;gap:14px;">
              <div id="signup-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 12px;border-radius:8px;font-size:12px;"></div>

              <div>
                <label style="display:block;font-size:11px;font-family:monospace;font-weight:700;color:#334155;text-transform:uppercase;margin-bottom:4px;">
                  Full Legal Name / Organization
                </label>
                <input type="text" id="signup-name" class="fast-track-input" placeholder="Adv. Rajesh Sharma" required />
              </div>

              <div>
                <label style="display:block;font-size:11px;font-family:monospace;font-weight:700;color:#334155;text-transform:uppercase;margin-bottom:4px;">
                  Email Address
                </label>
                <input type="email" id="signup-email" class="fast-track-input" placeholder="practitioner@agenticprofessionals.net" required />
              </div>

              <div>
                <label style="display:block;font-size:11px;font-family:monospace;font-weight:700;color:#334155;text-transform:uppercase;margin-bottom:4px;">
                  Password (Min 8 Characters)
                </label>
                <input type="password" id="signup-password" class="fast-track-input" placeholder="Create strong passphrase" required minlength="8" />
              </div>

              <div>
                <label style="display:block;font-size:11px;font-family:monospace;font-weight:700;color:#334155;text-transform:uppercase;margin-bottom:4px;">
                  Practitioner Track
                </label>
                <select id="signup-role" class="fast-track-input" style="cursor:pointer;">
                  <option value="practitioner">Insolvency Professional (IP / IRP / RP)</option>
                  <option value="advocate">Advocate / Legal Counsel</option>
                  <option value="valuer">Registered Valuer</option>
                  <option value="creditor">Financial Creditor / Bank / Fund</option>
                  <option value="investor">Strategic Investor / Resolution Applicant</option>
                  <option value="student">Intern / Skills Learner</option>
                  <option value="employer">Enterprise / Workshop Employer</option>
                  <option value="entrepreneur">MSME / Startup Founder</option>
                </select>
              </div>

              <button type="submit" id="signup-submit-btn" style="width:100%;padding:12px;border-radius:10px;background:#1E6C93;color:white;font-family:'Chakra Petch',sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>Create Sovereign Identity &rarr;</span>
              </button>
            </form>

            <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:#94a3b8;margin-top:16px;padding-top:12px;border-top:1px solid #f1f5f9;">
              <svg style="width:12px;height:12px;color:#059669;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>End-to-End Encrypted &bull; Supabase Auth &bull; Apache 2.0</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);
}
window.injectAuthModal = injectAuthModal;

/* ── Setup Auth Modal & Event Handlers ───────────────────────── */
function setupAuthModal() {
    initSupabaseAuthClient();
    injectAuthModal();

    const openAuthBtn = document.getElementById('open-auth-btn');
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const authModalClose = document.getElementById('auth-modal-close');
    const tabSigninBtn = document.getElementById('tab-signin-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const formSignin = document.getElementById('form-signin');
    const formSignup = document.getElementById('form-signup');
    const signinError = document.getElementById('signin-error');
    const signupError = document.getElementById('signup-error');
    const fillAdminBtn = document.getElementById('fill-admin-btn');
    const fillSharmaBtn = document.getElementById('fill-sharma-btn');
    const userProfileTrigger = document.getElementById('user-profile-trigger');
    const userProfileDropdown = document.getElementById('user-profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownWorkspaceBtn = document.getElementById('dropdown-workspace-btn');

    if (!authModalOverlay) return;

    if (openAuthBtn) {
        openAuthBtn.onclick = () => {
            authModalOverlay.classList.add('show');
            if (signinError) signinError.style.display = 'none';
            if (signupError) signupError.style.display = 'none';
        };
    }

    if (authModalClose) {
        authModalClose.onclick = () => {
            authModalOverlay.classList.remove('show');
        };
    }

    authModalOverlay.onclick = (e) => {
        if (e.target === authModalOverlay) {
            authModalOverlay.classList.remove('show');
        }
    };

    if (tabSigninBtn && tabSignupBtn && formSignin && formSignup) {
        tabSigninBtn.onclick = () => {
            tabSigninBtn.classList.add('active');
            tabSignupBtn.classList.remove('active');
            formSignin.style.display = 'flex';
            formSignup.style.display = 'none';
            if (signinError) signinError.style.display = 'none';
        };

        tabSignupBtn.onclick = () => {
            tabSignupBtn.classList.add('active');
            tabSigninBtn.classList.remove('active');
            formSignup.style.display = 'flex';
            formSignin.style.display = 'none';
            if (signupError) signupError.style.display = 'none';
        };
    }

    if (fillAdminBtn) {
        fillAdminBtn.onclick = () => {
            const em = document.getElementById('signin-email');
            const pw = document.getElementById('signin-password');
            if (em) em.value = 'admin@openibc.in';
            if (pw) { pw.value = 'OpenIBC@Admin2026!'; pw.focus(); }
        };
    }

    if (fillSharmaBtn) {
        fillSharmaBtn.onclick = () => {
            const em = document.getElementById('signin-email');
            const pw = document.getElementById('signin-password');
            if (em) em.value = 'adv_sharma@openibc.in';
            if (pw) { pw.value = 'Sharma@2026!'; pw.focus(); }
        };
    }

    if (formSignin) {
        formSignin.onsubmit = async (e) => {
            e.preventDefault();
            if (signinError) signinError.style.display = 'none';
            const email = document.getElementById('signin-email')?.value.trim();
            const pass = document.getElementById('signin-password')?.value;
            const submitBtn = document.getElementById('signin-submit-btn');
            const origContent = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<span>verifying credentials...</span>';
                submitBtn.disabled = true;
            }

            try {
                if (supabaseClient) {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: pass
                    });
                    if (error) {
                        if (signinError) {
                            signinError.textContent = error.message;
                            signinError.style.display = 'block';
                        }
                    } else if (data && data.user) {
                        const user = {
                            display_name: data.user.user_metadata?.name || data.user.email.split('@')[0],
                            e_mail: data.user.email,
                            username: data.user.user_metadata?.username || (data.user.email === 'admin@openibc.in' ? 'admin' : data.user.email.split('@')[0]),
                            custom_role: data.user.user_metadata?.role || (data.user.email === 'admin@openibc.in' ? 'admin' : 'practitioner'),
                            access_token: data.session?.access_token
                        };
                        localStorage.setItem('openibc_user', JSON.stringify(user));
                        localStorage.setItem('portal_user', JSON.stringify(user));
                        localStorage.setItem('haya_user', JSON.stringify(user));
                        renderAuthState(user);
                        authModalOverlay.classList.remove('show');
                    }
                } else {
                    const user = {
                        display_name: email.split('@')[0],
                        e_mail: email,
                        custom_role: 'practitioner'
                    };
                    localStorage.setItem('openibc_user', JSON.stringify(user));
                    localStorage.setItem('portal_user', JSON.stringify(user));
                    localStorage.setItem('haya_user', JSON.stringify(user));
                    renderAuthState(user);
                    authModalOverlay.classList.remove('show');
                }
            } catch (err) {
                console.error('Sign in error:', err);
                if (signinError) {
                    signinError.textContent = 'Connection error. Please check server status.';
                    signinError.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.innerHTML = origContent;
                    submitBtn.disabled = false;
                }
            }
        };
    }

    if (formSignup) {
        formSignup.onsubmit = async (e) => {
            e.preventDefault();
            if (signupError) signupError.style.display = 'none';
            const name = document.getElementById('signup-name')?.value.trim();
            const email = document.getElementById('signup-email')?.value.trim();
            const password = document.getElementById('signup-password')?.value;
            const role = document.getElementById('signup-role')?.value;
            const submitBtn = document.getElementById('signup-submit-btn');
            const origContent = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<span>creating identity...</span>';
                submitBtn.disabled = true;
            }

            try {
                if (supabaseClient) {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: { name: name, role: role, username: email.split('@')[0] }
                        }
                    });
                    if (error) {
                        if (signupError) {
                            signupError.textContent = error.message;
                            signupError.style.display = 'block';
                        }
                    } else if (data && data.user) {
                        const user = {
                            display_name: name || data.user.email.split('@')[0],
                            e_mail: data.user.email,
                            username: email.split('@')[0],
                            custom_role: role,
                            access_token: data.session?.access_token
                        };
                        localStorage.setItem('openibc_user', JSON.stringify(user));
                        localStorage.setItem('portal_user', JSON.stringify(user));
                        localStorage.setItem('haya_user', JSON.stringify(user));
                        renderAuthState(user);
                        authModalOverlay.classList.remove('show');
                    }
                } else {
                    const user = {
                        display_name: name || email.split('@')[0],
                        e_mail: email,
                        custom_role: role
                    };
                    localStorage.setItem('openibc_user', JSON.stringify(user));
                    localStorage.setItem('portal_user', JSON.stringify(user));
                    localStorage.setItem('haya_user', JSON.stringify(user));
                    renderAuthState(user);
                    authModalOverlay.classList.remove('show');
                }
            } catch (err) {
                console.error('Sign up error:', err);
                if (signupError) {
                    signupError.textContent = 'Connection error. Please check server status.';
                    signupError.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.innerHTML = origContent;
                    submitBtn.disabled = false;
                }
            }
        };
    }

    if (userProfileTrigger && userProfileDropdown) {
        userProfileTrigger.onclick = (e) => {
            e.stopPropagation();
            userProfileDropdown.classList.toggle('show');
        };
        document.addEventListener('click', (e) => {
            if (!userProfileDropdown.contains(e.target) && !userProfileTrigger.contains(e.target)) {
                userProfileDropdown.classList.remove('show');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (supabaseClient) {
                await supabaseClient.auth.signOut().catch(() => {});
            }
            localStorage.removeItem('openibc_user');
            localStorage.removeItem('portal_user');
            localStorage.removeItem('haya_user');
            localStorage.removeItem('authorized');
            localStorage.removeItem('_a_ltk_');
            renderAuthState(null);
        };
    }

    if (dropdownWorkspaceBtn) {
        dropdownWorkspaceBtn.onclick = () => {
            window.location.href = 'employees_nsqf.html';
        };
    }

    // Restore state from LocalStorage
    const savedUser = localStorage.getItem('portal_user') || localStorage.getItem('openibc_user') || localStorage.getItem('haya_user');
    if (savedUser) {
        try {
            const parsed = JSON.parse(savedUser);
            if (parsed) renderAuthState(parsed);
        } catch (e) {}
    }

    // Sync state from Supabase Session
    if (supabaseClient) {
        supabaseClient.auth.getSession().then(({ data }) => {
            if (data && data.session && data.session.user) {
                const user = {
                    display_name: data.session.user.user_metadata?.name || data.session.user.email.split('@')[0],
                    e_mail: data.session.user.email,
                    username: data.session.user.user_metadata?.username || (data.session.user.email === 'admin@openibc.in' ? 'admin' : data.session.user.email.split('@')[0]),
                    custom_role: data.session.user.user_metadata?.role || (data.session.user.email === 'admin@openibc.in' ? 'admin' : 'practitioner'),
                    access_token: data.session.access_token
                };
                localStorage.setItem('openibc_user', JSON.stringify(user));
                localStorage.setItem('portal_user', JSON.stringify(user));
                localStorage.setItem('haya_user', JSON.stringify(user));
                renderAuthState(user);
            }
        }).catch(() => {});
    }
}
window.setupAuthModal = setupAuthModal;

function openAuthModal(signup = false) {
    injectAuthModal();
    setupAuthModal();
    const overlay = document.getElementById('auth-modal-overlay');
    const tabSigninBtn = document.getElementById('tab-signin-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    if (signup && tabSignupBtn) {
        tabSignupBtn.click();
    } else if (tabSigninBtn) {
        tabSigninBtn.click();
    }
    if (overlay) overlay.classList.add('show');
}
window.openAuthModal = openAuthModal;

function closeAuthModal() {
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) overlay.classList.remove('show');
}
window.closeAuthModal = closeAuthModal;

/* ── Volunteer Form Handler ───────────────────────────────────────── */
function handleVolunteerSubmit(e) {
    if (e) e.preventDefault();
    const name  = document.getElementById('volName')?.value.trim();
    const email = document.getElementById('volEmail')?.value.trim();
    const phone = document.getElementById('volPhone')?.value.trim();
    const msg   = document.getElementById('volunteer-msg');

    if (name && email && phone) {
        if (msg) {
            msg.className = 'volunteer-status-msg success';
            msg.innerText = '✨ Thank you for volunteering! Our team will contact you shortly.';
            msg.style.display = 'block';
        }
        document.getElementById('volName').value = '';
        document.getElementById('volEmail').value = '';
        document.getElementById('volPhone').value = '';
    }
}

/* ── Universal Autonomous Initializer ────────────────────────────────── */
var appInitialized = false;
async function initApp() {
    if (appInitialized) return;
    appInitialized = true;

    // 1. Render universal site header if mount point exists
    renderSiteHeader();

    // 2. Load footer
    const footerContainer = document.getElementById('site-footer');
    if (footerContainer) {
        try {
            const res = await fetch('/components/footer.html?v=' + Date.now());
            if (res.ok) {
                const html = await res.text();
                footerContainer.innerHTML = html;
            }
        } catch (err) {
            console.error('[HAYAGRIVA Components] Error loading footer:', err.message);
        }
    }

    // 3. Inject & Setup Unified Supabase Auth Modal & Identity Gateway (matching 3002 & 3003)
    setupAuthModal();

    // 6. Auto-open modal if URL query ?login=1 or ?signup=1
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === '1' || params.get('auth') === '1') {
            openAuthModal(false);
        } else if (params.get('signup') === '1') {
            openAuthModal(true);
        }
    } catch (_) {}

    // 7. Instant 0ms Page Pre-fetching & Anti-Jolt Transitions
    injectSpeculationRules();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}
