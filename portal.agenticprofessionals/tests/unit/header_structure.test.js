const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PORTAL_ROOT = path.resolve(__dirname, '../..');

const PAGES = [
  { name: 'index.html', track: 'employees' },
  { name: 'employees_nsqf.html', track: 'employees' },
  { name: 'employers_sop.html', track: 'employers' },
  { name: 'entrepreneurs_msme.html', track: 'entrepreneurs' },
  { name: 'personalities_vedic.html', track: 'employees' }
];

describe('Federated Master Header & Track Picker Structure', () => {

  for (const page of PAGES) {
    describe(`Page: ${page.name}`, () => {
      const filePath = path.join(PORTAL_ROOT, page.name);
      const content = fs.readFileSync(filePath, 'utf8');

      it('should contain the static brand title and dash', () => {
        assert.ok(
          content.includes('class="brand-title-static">agentic professionals</span>'),
          `${page.name} must contain static brand title "agentic professionals"`
        );
        assert.ok(
          content.includes('class="brand-dash">-</span>'),
          `${page.name} must contain separator dash "-"`
        );
      });

      it('should isolate track picker button in .track-picker-wrapper', () => {
        assert.ok(
          content.includes('class="track-picker-wrapper" id="brand-trigger"'),
          `${page.name} must have .track-picker-wrapper with id="brand-trigger"`
        );
      });

      it('should locate .subdomain-dropdown strictly inside .track-picker-wrapper', () => {
        const wrapperIdx = content.indexOf('class="track-picker-wrapper"');
        const dropdownIdx = content.indexOf('class="subdomain-dropdown"');
        const wrapperCloseIdx = content.indexOf('</div>', dropdownIdx);

        assert.ok(wrapperIdx !== -1, `${page.name} missing track-picker-wrapper`);
        assert.ok(dropdownIdx !== -1, `${page.name} missing subdomain-dropdown`);
        assert.ok(
          dropdownIdx > wrapperIdx && dropdownIdx < wrapperCloseIdx,
          `${page.name} .subdomain-dropdown must be nested inside .track-picker-wrapper`
        );
      });

      it('should list all 3 track options with lowercase labels', () => {
        assert.ok(content.includes('data-track="employees">employees</a>'));
        assert.ok(content.includes('data-track="employers">employers</a>'));
        assert.ok(content.includes('data-track="entrepreneurs">entrepreneurs</a>'));
      });

      it('should mark the correct active track option', () => {
        const activeRegex = new RegExp(`data-track="${page.track}"[^>]*class="[^"]*active[^"]*"|class="[^"]*active[^"]*"[^>]*data-track="${page.track}"`);
        assert.ok(
          activeRegex.test(content),
          `${page.name} should have ${page.track} marked as active in track picker`
        );
      });

      it('should contain the unified actions tray with answers, reports, and sign in', () => {
        assert.ok(content.includes('id="nav-answers-btn"'));
        assert.ok(content.includes('id="nav-reports-btn"'));
        assert.ok(content.includes('id="open-auth-btn"'));
      });
    });
  }

  describe('CSS Dropdown Alignment & Animation Guard', () => {
    const cssPath = path.join(PORTAL_ROOT, 'css/responsive.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    it('should anchor .subdomain-dropdown to left: 0 of track-picker-wrapper', () => {
      assert.ok(
        cssContent.includes('.subdomain-dropdown {') && cssContent.includes('left: 0;'),
        'subdomain-dropdown must be positioned at left: 0 of its relative parent'
      );
    });

    it('should use vertical-only @keyframes dropdownFadeIn without translateX(-50%)', () => {
      assert.ok(
        cssContent.includes('@keyframes dropdownFadeIn'),
        'responsive.css must define @keyframes dropdownFadeIn'
      );
      assert.ok(
        cssContent.includes('animation: dropdownFadeIn'),
        'subdomain-dropdown must use dropdownFadeIn'
      );
      assert.ok(
        !cssContent.includes('animation: fadeInDown 0.12s'),
        'subdomain-dropdown must NOT use fadeInDown to prevent jump glitch'
      );
    });
  });

  describe('JavaScript Dynamic Shell Builder', () => {
    const jsPath = path.join(PORTAL_ROOT, 'js/components.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    it('should generate .track-picker-wrapper in buildMasterHeaderHtml', () => {
      assert.ok(
        jsContent.includes('class="track-picker-wrapper" id="brand-trigger"'),
        'components.js buildMasterHeaderHtml must output track-picker-wrapper'
      );
    });

    it('should hydrate header if track-picker-wrapper is missing', () => {
      assert.ok(
        jsContent.includes('hasTrackPicker'),
        'components.js renderSiteHeader must check hasTrackPicker before skipping hydration'
      );
    });
  });

});
