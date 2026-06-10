# Sourcing Sense — SEO & Marketing Master Plan

> Tento soubor je pracovní plán. Každá session: otevři, najdi první nehotovou fázi, pokračuj.
> Strategie potvrzená Davidem (2026-06-10): **trh 50/50 CZ+EN · nástroje volně, detailní report za e-mail · primární konverze = Calendly discovery call.**

---

## Fáze 0 — Hloubkový audit ✅ HOTOVO (2026-06-10)

### Kritické nálezy

| # | Nález | Dopad | Stav |
|---|-------|-------|------|
| 1 | `index.html` má Cloudflare skript **před** `<!DOCTYPE html>` → prohlížeč jede v quirks mode, validátory selžou | Vysoký | ✅ opraveno |
| 2 | **AI Readiness Score** (`/tools/ai-readiness-score`) je hotový nástroj s e-mail gate, ale **nikde na webu na něj nevede odkaz** (jen sitemap) — osiřelá stránka | Vysoký | ✅ opraveno |
| 3 | Canonical u 14 článků obsahuje `.html`, sitemap má URL bez přípony → rozdvojené signály | Vysoký | ✅ opraveno |
| 4 | `og-image.svg` — LinkedIn/Twitter/Slack **SVG nerenderují** → sdílené odkazy bez náhledu | Vysoký | ✅ og-image.png |
| 5 | Duplicitní článek: `ai-projects-fail` vs `why-ai-projects-fail` (stejné téma, oba indexované, oba na /insights) | Střední | ✅ canonical sjednocen |
| 6 | Web sbírá e-maily (GAS), cílí na EU, ale **neexistuje privacy policy** (`/privacy` je dokonce rozbitý odkaz) | Vysoký (GDPR) | ✅ /privacy vytvořeno |
| 7 | 6 rozbitých interních odkazů (4× na neexistující články, /privacy, spend-analysis) | Střední | ✅ opraveno |
| 8 | hreflang `en`/`cs`/`x-default` všechny ukazují na **stejnou URL** → nesmyslný signál (jazyk se přepíná JS, ne URL) | Střední | ✅ odstraněno |
| 9 | Countdown na launch 2026-04-08 (2 měsíce prošlý) → trvale ukazuje „Live now!" | Nízký | ✅ odstraněno |
| 10 | `tool-template.html` a tajné resource stránky (`-a7f3k9x2`, `-m4p8q1w6`) bez noindex | Střední | ✅ noindex |
| 11 | `/insights/ai-policy-procurement` chybí v sitemap | Střední | ✅ doplněno |
| 12 | `about.html` nemá `<h1>` | Střední | ✅ opraveno |
| 13 | FAQ schema slibuje nástroje, které neexistují („Supplier Classifier", „Quick Spend Analyzer") → riziko pro důvěru i AI odpovědi | Střední | ✅ opraveno |
| 14 | `llms.txt` neodpovídá realitě (chybí AI Readiness Score, nové články; uvádí neexistující nástroje) | Střední | ✅ aktualizováno |
| 15 | Kalkulačky (savings, total-roi, rfq) **nesbírají žádné e-maily** — lead magnet bez capture | Vysoký | → Fáze 2 |

### Silné stránky (neměnit)
- robots.txt vzorově nastavený pro AI crawlery; llms.txt + llms-full.txt existují
- Schema markup nadprůměrný (Article, FAQPage, SoftwareApplication, ProfessionalService)
- 18 článků s reálnou hloubkou, dobré title/description, žádné duplicitní title
- 5 funkčních nástrojů bez registrace = SEO + důvěra
- GAS backend na sběr e-mailů už běží (early access, newsletter, AI readiness gate)

---

## Fáze 1 — Technické SEO opravy ✅ HOTOVO (2026-06-10)

Vše z tabulky výše kromě #15. Detail v commitu.

---

## Fáze 2 — Lead capture na nástrojích 🔜 DALŠÍ NA ŘADĚ

Cíl: každý nástroj = lead magnet. Vzor: výsledek zdarma na obrazovce, **„Pošlete mi detailní report + akční plán na e-mail"** → postToGAS (backend už existuje, payload `type: 'tool_report'`).

- [ ] `savings-calculator` — po výpočtu nabídnout e-mail report (vstupy + výsledky + doporučené další kroky + CTA na Calendly)
- [ ] `total-procurement-roi` — totéž, report je tu nejhodnotnější (CPO business case)
- [ ] `rfq-builder` — „pošlete si hotové RFQ na e-mail" (přirozený důvod dát e-mail)
- [ ] `email-generator` — soft CTA na newsletter po zkopírování šablony
- [ ] Po odeslání e-mailu vždy zobrazit Calendly CTA („Chcete to projít spolu? 20 min zdarma")
- [ ] GAS skript: David musí v Apps Script doplnit odeslání reportu e-mailem (připravím přesný kód do `GAS-SETUP.md` — jediný setup, který bude potřeba)

## Fáze 3 — CZ SEO obsah (trh 50/50)

Čeština je dnes schovaná v JS přepínači → pro Google CZ neexistuje. Řešení: samostatné CZ stránky.

- [ ] `/cz/automatizace-nakupu` — pilíř (kw: „automatizace nákupu", „digitalizace nákupního procesu")
- [ ] `/cz/ai-ve-firme-kde-zacit` — (kw: „AI ve firmě", „využití AI ve firmě")
- [ ] `/cz/kalkulacka-uspor-nakup` — CZ landing pro savings calculator
- [ ] Interní prolinkování CZ ↔ EN, správný hreflang (teď už na reálné alternativní URL)
- [ ] CZ verze llms.txt sekce

## Fáze 4 — EN obsahové mezery + interní linkování

- [ ] Napsat `will-ai-replace-procurement` (2 články na něj už odkazují!)
- [ ] Napsat `ai-adoption-checklist` (odkazováno z chatgpt-prompts)
- [ ] Hub-and-spoke: každý článek linkuje na 1 nástroj + 2 související články + Calendly
- [ ] Breadcrumb schema na článcích
- [ ] Obrázky: alt texty, OG obrázky per článek (aspoň pro top 5)

## Fáze 5 — Konverzní optimalizace

- [ ] Sticky CTA lišta na článcích (Calendly)
- [ ] Sekce „Co o spolupráci říkají" — David dodá 2–3 reference/citace (jediný vstup od Davida)
- [ ] Exit-intent na tools stránkách → AI Readiness Score
- [ ] Thank-you flow po každém formuláři → Calendly

## Fáze 6 — Distribuce & off-page (checklist pro Davida, max 30 min týdně)

- [ ] `DISTRIBUTION.md`: GSC + Bing Webmaster ověření, LinkedIn publikační rytmus (1 článek → 3 posty), 5 katalogů/komunit (CZ: Lupa, StartupJobs blog, ProcurementČR LinkedIn skupiny; EN: Procurement subreddit, Art of Procurement)
- [ ] UTM šablony na všechny odchozí kampaně

---
*Poslední aktualizace: 2026-06-10 · Fáze 0–1 hotovo, pokračovat Fází 2.*
