/* Sourcing Sense — shared behaviour
   1. ssSend(): form submission that reads the Apps Script reply
   2. Live network background (canvas)
   3. Source-to-pay map illustrations for headers and cards
*/
(function () {
    'use strict';

    /* ---------- 1. form sending ---------- */
    // Remember where the visitor came from (first landing in this tab) so each
    // form row in the sheet says which post, page or campaign brought the lead.
    (function rememberSource() {
        try {
            if (sessionStorage.getItem('ss-src')) return;
            const q = new URLSearchParams(location.search);
            const src = {
                utm_source: q.get('utm_source') || '', utm_medium: q.get('utm_medium') || '',
                utm_campaign: q.get('utm_campaign') || '', utm_content: q.get('utm_content') || '',
                referrer: document.referrer ? new URL(document.referrer).hostname : '',
                landing: location.pathname
            };
            sessionStorage.setItem('ss-src', JSON.stringify(src));
        } catch (e) { /* storage blocked: send without source */ }
    })();

    function withSource(url) {
        try {
            const u = new URL(url);
            const raw = u.searchParams.get('data');
            if (!raw) return url;
            const payload = JSON.parse(raw);
            const src = JSON.parse(sessionStorage.getItem('ss-src') || '{}');
            payload.page = location.pathname;
            Object.keys(src).forEach(k => { if (src[k] && payload[k] === undefined) payload[k] = src[k]; });
            u.searchParams.set('data', JSON.stringify(payload));
            return u.toString();
        } catch (e) { return url; }
    }

    window.ssSend = async function (url) {
        const res = await fetch(withSource(url), { method: 'GET', redirect: 'follow' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let data = null;
        try { data = await res.json(); } catch (e) { /* non-JSON reply still means the script ran */ }
        if (data && (data.status === 'error' || data.ok === false)) throw new Error(data.message || 'Rejected');
        return data;
    };

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- source-to-pay taxonomy ---------- */
    const STAGES = [
        ['spend', 'Spend'], ['sourcing', 'Sourcing'], ['negotiation', 'Negotiation'], ['contract', 'Contract'],
        ['order', 'Order'], ['invoice', 'Invoice'], ['suppliers', 'Suppliers']
    ];
    const ALL = STAGES.map(s => s[0]).concat('governance');
    const PAGE = {
        '/insights/5-processes-to-automate': ['spend', 'sourcing', 'contract', 'order', 'invoice'],
        '/insights/ai-in-procurement-start': ['spend', 'governance'],
        '/insights/ai-myths-procurement': ['governance'],
        '/insights/ai-negotiation-suppliers': ['negotiation'],
        '/insights/ai-policy-procurement': ['governance'],
        '/insights/ai-projects-fail': ['governance'],
        '/insights/ai-transition-cost': ['spend', 'governance'],
        '/insights/car-booking-automation': ['order'],
        '/insights/chatgpt-prompts-procurement': ['sourcing', 'negotiation', 'contract', 'suppliers'],
        '/insights/claude-safety-guide': ['governance'],
        '/insights/contract-nemesis': ['contract'],
        '/insights/copilot-procurement-workflows': ['spend', 'sourcing', 'suppliers'],
        '/insights/kaizen-portal-power-apps': ['suppliers', 'governance'],
        '/insights/prompt-engineering-procurement': ['sourcing', 'negotiation', 'contract'],
        '/insights/quotation-analyzer': ['sourcing'],
        '/insights/shadow-software': ['spend', 'governance'],
        '/insights/supplier-scoreboard': ['suppliers'],
        '/insights/procurement-savings-tracking': ['negotiation', 'contract', 'invoice'],
        '/insights/how-to-calculate-procurement-savings': ['spend', 'negotiation', 'invoice'],
        '/insights/will-ai-replace-procurement': ALL,
        '/tools/savings-calculator': ['spend', 'order', 'invoice'],
        '/tools/rfq-builder': ['sourcing'],
        '/tools/email-generator': ['sourcing', 'negotiation', 'suppliers'],
        '/tools/total-procurement-roi': ALL,
        '/tools/ai-readiness-score': ['governance'],
        '/resources/ai-policy-template': ['governance'],
        '/ai-use-cases': ALL
    };
    const norm = p => (p || '/').replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    const stagesFor = p => PAGE[norm(p)] || ALL;
    window.ssStagesFor = stagesFor;
    window.ssStages = STAGES;

    /* seeded random */
    function rng(seed) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
        return function () {
            h += 0x6D2B79F5; let t = h;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* ---------- 3. the map ---------- */
    let uid = 0;
    function mapSVG(opts) {
        const on = new Set(opts.stages || ALL);
        const labels = opts.labels !== false;
        const W = 600, H = labels ? 340 : 260;
        const r = rng(opts.seed || 'ss');
        const id = 'ssm' + (uid++);
        const phase = r() * Math.PI * 2;
        const padX = 56, cy = H / 2 + (labels ? 6 : 0), amp = H * 0.2;

        const pts = STAGES.map((s, i) => ({
            key: s[0], name: s[1],
            x: padX + i * (W - padX * 2) / (STAGES.length - 1),
            y: cy + Math.sin(i * 0.95 + phase) * amp
        }));

        // smooth segments (Catmull-Rom to Bezier)
        const seg = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
            const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
            seg.push({ d: `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`, hot: on.has(p1.key) || on.has(p2.key), both: on.has(p1.key) && on.has(p2.key) });
        }

        // supplier satellites around the route
        const sats = [];
        const nSat = labels ? 14 : 9;
        let guard = 0;
        while (sats.length < nSat && guard++ < 400) {
            const x = 20 + r() * (W - 40), y = 22 + r() * (H - 44);
            const near = pts.reduce((a, p) => Math.hypot(p.x - x, p.y - y) < Math.hypot(a.x - x, a.y - y) ? p : a, pts[0]);
            const d = Math.hypot(near.x - x, near.y - y);
            if (d < 34 || d > 120) continue;
            if (sats.some(s => Math.hypot(s.x - x, s.y - y) < 26)) continue;
            sats.push({ x, y, to: near, r: 2.5 + r() * 2.5 });
        }

        let svg = `<svg class="ss-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Source-to-pay map highlighting ${[...on].filter(k => k !== 'governance').join(', ') || 'governance'}" xmlns="http://www.w3.org/2000/svg">`;
        const gOn = on.has('governance');
        svg += `<rect data-stage="governance" class="gov${gOn ? ' on' : ''}" x="6" y="6" width="${W - 12}" height="${H - 12}" rx="18"/>`;
        if (labels) svg += `<text data-stage="governance" class="gov-label${gOn ? ' on' : ''}" x="22" y="26">Governance &amp; policy</text>`;

        sats.forEach(s => {
            const hot = on.has(s.to.key);
            const mx = (s.x + s.to.x) / 2 + (s.y - s.to.y) * 0.25, my = (s.y + s.to.y) / 2 - (s.x - s.to.x) * 0.25;
            s.d = `M${s.x.toFixed(1)},${s.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${s.to.x.toFixed(1)},${s.to.y.toFixed(1)}`;
            s.hot = hot;
            svg += `<path class="spoke${hot ? ' on' : ''}" d="${s.d}"/>`;
        });
        seg.forEach(s => { svg += `<path class="route${s.hot ? ' on' : ''}" d="${s.d}"/>`; });
        sats.forEach(s => { svg += `<circle class="sat${s.hot ? ' on' : ''}" cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(1)}"/>`; });

        pts.forEach((p, i) => {
            const isOn = on.has(p.key);
            if (isOn) {
                svg += `<circle class="halo" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="13">` +
                    (reduceMotion ? '' : `<animate attributeName="r" values="11;16;11" dur="${(3 + r() * 2).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="0.45;0.05;0.45" dur="${(3 + r() * 2).toFixed(1)}s" repeatCount="indefinite"/>`) +
                    `</circle>`;
            }
            svg += `<circle data-stage="${p.key}" class="stage${isOn ? ' on' : ''}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isOn ? 7.5 : 5.5}"/>`;
            if (labels) {
                const below = p.y >= cy;
                svg += `<text data-stage="${p.key}" class="label${isOn ? ' on' : ''}" x="${p.x.toFixed(1)}" y="${(p.y + (below ? 28 : -18)).toFixed(1)}" text-anchor="middle">${p.name}</text>`;
            }
        });

        // signals: documents moving along the active parts of the chain
        if (!reduceMotion) {
            const hotSegs = seg.filter(s => s.hot);
            const paths = hotSegs.length ? hotSegs : seg;
            paths.forEach((s, i) => {
                const dur = (2.4 + r() * 2.2).toFixed(2), begin = (r() * 3).toFixed(2);
                svg += `<circle class="signal" r="2.6" opacity="${hotSegs.length ? 1 : 0.5}"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${s.d}"/></circle>`;
            });
            sats.filter(s => s.hot).slice(0, 5).forEach(s => {
                svg += `<circle class="signal" r="1.8" opacity="0.8"><animateMotion dur="${(3 + r() * 3).toFixed(2)}s" begin="${(r() * 4).toFixed(2)}s" repeatCount="indefinite" path="${s.d}"/></circle>`;
            });
        }
        return svg + '</svg>';
    }
    window.ssMap = mapSVG;

    function caption(stages) {
        const names = STAGES.filter(s => stages.includes(s[0])).map(s => `<b>${s[1]}</b>`);
        if (stages.length >= ALL.length) return 'Covers the whole source-to-pay chain.';
        if (!names.length) return 'About the rules around AI use: <b>governance and policy</b>.';
        return 'Where this sits in source-to-pay: ' + names.join(', ') + (stages.includes('governance') ? ', plus <b>governance</b>.' : '.');
    }

    function plate(cls, stages, seed, withCaption) {
        const fig = document.createElement('figure');
        fig.className = 'ss-plate ' + cls;
        fig.innerHTML = mapSVG({ stages, seed, labels: true }) + (withCaption ? `<figcaption>${caption(stages)}</figcaption>` : '');
        return fig;
    }

    function hydrate() {
        const path = location.pathname;
        const stages = stagesFor(path);

        // article and tool headers
        document.querySelectorAll('.article-header-inner, .tool-header-inner').forEach(inner => {
            if (inner.classList.contains('ss-has-map')) return;
            const text = document.createElement('div');
            text.className = 'ss-head-text';
            while (inner.firstChild) text.appendChild(inner.firstChild);
            inner.appendChild(text);
            inner.appendChild(plate('ss-head-map', stages, norm(path), true));
            inner.classList.add('ss-has-map');
        });

        // homepage hero
        if (norm(path) === '/') {
            const hero = document.querySelector('.hero .hero-inner');
            if (hero && !hero.classList.contains('ss-has-map')) {
                const fig = plate('ss-hero-map', ALL, 'home', false);
                const cap = document.createElement('figcaption');
                cap.innerHTML = 'Source-to-pay, stage by stage. <a href="/ai-use-cases">Browse 28 AI use cases by stage</a>.';
                fig.appendChild(cap);
                hero.appendChild(fig);
                hero.classList.add('ss-has-map');
            }
        }

        // article cards
        document.querySelectorAll('a.post-card, a.featured-card').forEach(card => {
            const vis = card.querySelector('.post-card-visual, .featured-visual');
            if (!vis || vis.dataset.ssMap) return;
            const href = card.getAttribute('href');
            vis.insertAdjacentHTML('beforeend', mapSVG({ stages: stagesFor(href), seed: norm(href), labels: false }));
            vis.dataset.ssMap = '1';
        });

        // tool icons
        document.querySelectorAll('.tool-card').forEach(card => {
            const icon = card.querySelector('.tool-icon');
            const link = card.querySelector('a[href^="/tools/"]');
            if (!icon || icon.classList.contains('ss-glyph')) return;
            const st = link ? stagesFor(link.getAttribute('href')) : ALL;
            const n = Math.min(st.length, 3);
            icon.classList.add('ss-glyph');
            icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15 C8 4, 16 20, 21 9" fill="none" stroke="#d4924a" stroke-opacity=".6" stroke-width="1.4"/>` +
                [[3, 15], [12, 12], [21, 9]].map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i < n ? 2.6 : 2}" fill="${i < n ? '#d4924a' : '#0b1633'}" stroke="#d4924a" stroke-width="1.2"/>`).join('') + '</svg>';
        });
    }

    /* ---------- 2. network background ---------- */
    function background() {
        const c = document.createElement('canvas');
        c.id = 'ss-bg';
        c.setAttribute('aria-hidden', 'true');
        document.body.prepend(c);
        const ctx = c.getContext('2d');
        const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        let W, H, nodes = [], pulses = [], last = 0, running = true;
        const R = rng('background');

        function size() {
            W = window.innerWidth; H = window.innerHeight;
            c.width = W * DPR; c.height = H * DPR;
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            const n = Math.max(18, Math.min(64, Math.round(W * H / 26000)));
            nodes = Array.from({ length: n }, () => ({
                x: R() * W, y: R() * H * 1.6, vx: (R() - 0.5) * 0.12, vy: (R() - 0.5) * 0.12,
                r: R() < 0.15 ? 2.4 : 1.4, hub: R() < 0.15
            }));
        }

        function edges() {
            const out = [];
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                const near = [];
                for (let j = 0; j < nodes.length; j++) {
                    if (i === j) continue;
                    const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < 230) near.push([d, j]);
                }
                near.sort((p, q) => p[0] - q[0]);
                near.slice(0, 2).forEach(([d, j]) => { if (i < j) out.push([i, j, d]); });
            }
            return out;
        }

        function frame(t) {
            if (!running) return;
            if (t - last < 33) { requestAnimationFrame(frame); return; }
            last = t;
            const shift = (window.scrollY * 0.12) % (H * 1.6);
            ctx.clearRect(0, 0, W, H);
            nodes.forEach(n => {
                if (!reduceMotion) { n.x += n.vx; n.y += n.vy; }
                if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
                if (n.y < -20) n.y = H * 1.6; if (n.y > H * 1.6) n.y = -20;
            });
            const pos = n => ({ x: n.x, y: ((n.y - shift) % (H * 1.6) + H * 1.6) % (H * 1.6) - H * 0.3 });
            const E = edges();
            ctx.lineWidth = 1;
            E.forEach(([i, j, d]) => {
                const a = pos(nodes[i]), b = pos(nodes[j]);
                if (Math.abs(a.y - b.y) > 300) return;
                ctx.strokeStyle = `rgba(120,150,215,${(0.16 * (1 - d / 230)).toFixed(3)})`;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            });
            nodes.forEach(n => {
                const p = pos(n);
                ctx.fillStyle = n.hub ? 'rgba(212,146,74,0.55)' : 'rgba(150,175,230,0.35)';
                ctx.beginPath(); ctx.arc(p.x, p.y, n.r, 0, 6.283); ctx.fill();
            });
            if (!reduceMotion && E.length && Math.random() < 0.08 && pulses.length < 14) {
                const e = E[Math.floor(Math.random() * E.length)];
                pulses.push({ a: e[0], b: e[1], t: 0, s: 0.006 + Math.random() * 0.01 });
            }
            pulses = pulses.filter(p => p.t <= 1);
            pulses.forEach(p => {
                p.t += p.s;
                const a = pos(nodes[p.a]), b = pos(nodes[p.b]);
                if (Math.abs(a.y - b.y) > 300) { p.t = 2; return; }
                const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
                const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
                g.addColorStop(0, 'rgba(255,200,140,0.9)'); g.addColorStop(1, 'rgba(212,146,74,0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.283); ctx.fill();
            });
            if (!reduceMotion) requestAnimationFrame(frame);
        }

        size();
        window.addEventListener('resize', () => { size(); if (reduceMotion) frame(1e9); });
        document.addEventListener('visibilitychange', () => {
            running = !document.hidden;
            if (running && !reduceMotion) requestAnimationFrame(frame);
        });
        if (reduceMotion) { window.addEventListener('scroll', () => frame(performance.now() + 1e6), { passive: true }); }
        requestAnimationFrame(frame);
    }

    function init() {
        try { background(); } catch (e) { /* decorative only */ }
        try { hydrate(); } catch (e) { /* decorative only */ }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
