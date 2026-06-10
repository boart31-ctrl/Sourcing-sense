# Google Apps Script — nastavení e-mail reportů (jediný krok, který musíš udělat ty)

Nástroje na webu nově posílají leady s typem `tool_report` na tvůj existující Apps Script
(stejná URL, kterou už používá newsletter a early access). Web je hotový — chybí jen to,
aby tvůj skript na tento typ reagoval: uložil lead do tabulky a poslal člověku report.

**Čas na nastavení: ~10 minut. Nic jiného dělat nemusíš.**

## Krok 1 — Otevři svůj Apps Script projekt

1. Jdi na [script.google.com](https://script.google.com) a otevři projekt, který obsluhuje formuláře webu
   (ten s URL končící `...9m8vogZM4v9sn1UR0uQ/exec`).
2. Najdi funkci `doGet(e)`. Uvnitř se parsuje `e.parameter.data` a větví se podle `data.type`.

## Krok 2 — Přidej větev pro `tool_report`

Do místa, kde se rozhoduje podle `data.type` (vedle `early_access`, `newsletter`, …), přidej:

```javascript
if (data.type === 'tool_report') {
  handleToolReport(data);
}
```

## Krok 3 — Vlož tuto funkci na konec souboru

```javascript
function handleToolReport(data) {
  // 1) Ulož lead do listu "tool_reports" (vytvoří se sám)
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // nebo openById('TVOJE_SHEET_ID')
  var sheet = ss.getSheetByName('tool_reports') || ss.insertSheet('tool_reports');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'email', 'tool', 'lang', 'payload']);
  }
  sheet.appendRow([new Date(), data.email, data.tool, data.lang, JSON.stringify(data)]);

  // 2) Pošli report
  var cs = data.lang === 'cs';
  var subject, body;

  if (data.tool === 'savings-calculator') {
    var i = data.inputs || {}, r = data.results || {};
    subject = cs ? 'Váš report: úspory z automatizace nákupu' : 'Your report: procurement automation savings';
    body = (cs
      ? '<h2>Report z kalkulačky úspor</h2>'
        + '<p>Díky, že jste si spočítali potenciál automatizace. Tady jsou vaše čísla:</p>'
      : '<h2>Your Savings Calculator report</h2>'
        + '<p>Thanks for running the numbers. Here is your result:</p>')
      + '<table cellpadding="6" style="border-collapse:collapse;border:1px solid #e2e8f0;">'
      + row(cs ? 'Roční úspora' : 'Annual savings', r.annualSavings)
      + row(cs ? 'Současné roční náklady' : 'Current annual cost', r.currentAnnualCost)
      + row(cs ? 'Ušetřené hodiny / rok' : 'Hours freed / year', r.hoursFreed)
      + row(cs ? 'Návratnost' : 'Payback', r.payback)
      + row(cs ? 'ROI v 1. roce' : 'First-year ROI', r.firstYearRoi)
      + '</table>'
      + '<h3>' + (cs ? 'Vstupy výpočtu' : 'Calculation inputs') + '</h3>'
      + '<table cellpadding="6" style="border-collapse:collapse;border:1px solid #e2e8f0;">'
      + row(cs ? 'Hodin na 1 opakování' : 'Hours per occurrence', i.hoursPerOccurrence)
      + row(cs ? 'Opakování / rok' : 'Occurrences / year', i.occurrencesPerYear)
      + row(cs ? 'Počet lidí' : 'People involved', i.people)
      + row(cs ? 'Hodinová sazba' : 'Hourly cost', i.hourlyCost + ' ' + (data.currency || 'EUR'))
      + row(cs ? 'Míra automatizace' : 'Automation efficiency', i.efficiencyPct + ' %')
      + row(cs ? 'Náklady na implementaci' : 'Implementation cost', i.implementationCost + ' ' + (data.currency || 'EUR'))
      + '</table>'
      + nextSteps(cs);

  } else if (data.tool === 'total-procurement-roi') {
    var r2 = data.results || {};
    subject = cs ? 'Váš business case: Total Procurement ROI' : 'Your business case: Total Procurement ROI';
    body = (cs
      ? '<h2>Total Procurement ROI — souhrn</h2>'
        + (data.project ? '<p>Projekt: <strong>' + esc(data.project) + '</strong></p>' : '')
      : '<h2>Total Procurement ROI — summary</h2>'
        + (data.project ? '<p>Project: <strong>' + esc(data.project) + '</strong></p>' : ''))
      + '<table cellpadding="6" style="border-collapse:collapse;border:1px solid #e2e8f0;">'
      + row(cs ? 'Celková roční hodnota' : 'Total annual value', r2.totalAnnualValue)
      + row('ROI', r2.roi)
      + row(cs ? 'Návratnost' : 'Payback', r2.payback)
      + row(cs ? 'Ušetřené hodiny' : 'Hours freed', r2.hoursFreed)
      + row(cs ? 'Ušetřené CO₂' : 'CO₂ saved', r2.co2Saved)
      + row(cs ? 'Předejité incidenty' : 'Incidents prevented', r2.incidentsPrevented)
      + '</table>'
      + '<p>' + (cs
        ? 'Tip: kompletní 8dimenzní rozpad se zdroji si vygenerujete tlačítkem „Uložit jako PDF" přímo v nástroji.'
        : 'Tip: the full 8-dimension breakdown with sources is available via the "Save as PDF" button in the tool.') + '</p>'
      + nextSteps(cs);

  } else if (data.tool === 'rfq-builder') {
    subject = cs ? 'Vaše RFQ je připravené' : 'Your RFQ is ready';
    body = (cs
      ? '<h2>Vaše RFQ</h2><p>Níže je hotový dokument. Před odesláním dodavatelům zkontrolujte:</p>'
      : '<h2>Your RFQ</h2><p>Your document is below. Before sending to suppliers, verify:</p>')
      + (cs
        ? '<ul><li>termín pro odevzdání nabídek je reálný (min. 10 pracovních dní)</li>'
          + '<li>hodnoticí kritéria a váhy odpovídají tomu, co skutečně rozhoduje</li>'
          + '<li>technická specifikace neobsahuje název konkrétního dodavatele</li>'
          + '<li>je jasné, kdo je kontaktní osoba a kam přijdou dotazy</li></ul>'
        : '<ul><li>the submission deadline is realistic (min. 10 working days)</li>'
          + '<li>evaluation criteria and weights match what will actually decide</li>'
          + '<li>the spec does not name a specific supplier</li>'
          + '<li>the single contact person and Q&A channel are clear</li></ul>')
      + '<pre style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;white-space:pre-wrap;font-size:13px;">'
      + esc(data.document || '') + '</pre>'
      + nextSteps(cs);

  } else if (data.tool === 'email-generator') {
    subject = cs ? 'Balíček: 8 nákupních e-mail šablon + 10 vyjednávacích frází' : 'Your pack: 8 procurement email templates + 10 negotiation phrases';
    body = (cs
      ? '<h2>Balíček šablon</h2><p>Všech 8 šablon najdete kdykoli živě na '
        + '<a href="https://sourcing-sense.com/tools/email-generator">sourcing-sense.com/tools/email-generator</a> (EN i CZ, s náhledem).</p>'
        + '<h3>10 frází, na které dodavatelé odpovídají</h3>'
      : '<h2>Your template pack</h2><p>All 8 templates are always live at '
        + '<a href="https://sourcing-sense.com/tools/email-generator">sourcing-sense.com/tools/email-generator</a> (EN + CZ, with preview).</p>'
        + '<h3>10 phrases that consistently get supplier replies</h3>')
      + (cs
        ? '<ol><li>„Abychom mohli pokračovat, potřebujeme od vás do [datum]…"</li><li>„Vaše nabídka je o X % nad benchmarkem kategorie — pomozte mi pochopit proč."</li><li>„Co by se muselo stát, abyste se dostali na [cílovou cenu]?"</li><li>„Připravujeme rozhodnutí na [datum]. Bez odpovědi počítáme s variantou B."</li><li>„Které části rozsahu můžeme upravit, aby cena klesla, aniž by utrpěla kvalita?"</li><li>„Dlouhodobý objem výměnou za podmínky — co umíte nabídnout?"</li><li>„Potvrďte prosím písemně do [datum], jinak eskalujeme dle smlouvy."</li><li>„Vážíme si vztahu — právě proto chci tohle vyřešit teď, ne při obnově smlouvy."</li><li>„Jaká je vaše nejlepší a finální nabídka? Po [datum] uzavíráme hodnocení."</li><li>„Co potřebujete ode mě, abyste mohli odpovědět do [datum]?"</li></ol>'
        : '<ol><li>"To move forward, we need [X] from you by [date]…"</li><li>"Your quote is X% above the category benchmark — help me understand why."</li><li>"What would need to happen for you to reach [target price]?"</li><li>"We decide on [date]. Without your reply we will proceed with option B."</li><li>"Which parts of the scope could we adjust to reduce price without hurting quality?"</li><li>"Long-term volume in exchange for terms — what can you offer?"</li><li>"Please confirm in writing by [date], otherwise we escalate per contract."</li><li>"We value the relationship — which is exactly why I want to fix this now, not at renewal."</li><li>"What is your best and final offer? Evaluation closes after [date]."</li><li>"What do you need from me so you can reply by [date]?"</li></ol>')
      + nextSteps(cs);

  } else {
    subject = 'Sourcing Sense — your report';
    body = '<p>Thanks! Your data: </p><pre>' + esc(JSON.stringify(data, null, 2)) + '</pre>';
  }

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: body
      + '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">'
      + '<p style="color:#64748b;font-size:13px;">David Račak · Sourcing Sense · '
      + '<a href="https://sourcing-sense.com">sourcing-sense.com</a><br>'
      + (data.lang === 'cs'
         ? 'Tento e-mail jste si vyžádali v nástroji na sourcing-sense.com. Žádný další bez vašeho souhlasu nepřijde.'
         : 'You requested this email in a tool on sourcing-sense.com. No further emails without your consent.')
      + '</p>',
    name: 'David Račak — Sourcing Sense',
    replyTo: 'info@sourcing-sense.com'
  });
}

function row(label, value) {
  return '<tr><td style="border:1px solid #e2e8f0;color:#64748b;">' + esc(label)
       + '</td><td style="border:1px solid #e2e8f0;font-weight:600;">' + esc(value || '—') + '</td></tr>';
}

function nextSteps(cs) {
  return cs
    ? '<h3>3 další kroky</h3><ol>'
      + '<li>Vyberte jeden proces s nejkratší návratností — ne tři najednou.</li>'
      + '<li>Změřte týden reálné práce (baseline) — bez něj nikdy neprokážete úsporu.</li>'
      + '<li>Postavte pilot v nástrojích, které už máte (M365 / Power Automate), než koupíte nový software.</li></ol>'
      + '<p><a href="https://calendly.com/sourcing-sense/" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Chcete to projít spolu? 20 minut zdarma →</a></p>'
    : '<h3>3 next steps</h3><ol>'
      + '<li>Pick ONE process with the shortest payback — not three at once.</li>'
      + '<li>Measure one week of real work (baseline) — without it you can never prove the saving.</li>'
      + '<li>Pilot with the tools you already own (M365 / Power Automate) before buying new software.</li></ol>'
      + '<p><a href="https://calendly.com/sourcing-sense/" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Want to walk through it together? Free 20 minutes →</a></p>';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

> Pokud tvůj skript není napojený na konkrétní tabulku (`getActiveSpreadsheet` selže),
> nahraď první řádek `SpreadsheetApp.openById('ID_TVÉ_TABULKY')` — ID je dlouhý řetězec v URL tabulky.

## Krok 4 — Nasaď novou verzi

1. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**
   (Bez nové verze se změna v `/exec` URL neprojeví!)
2. URL zůstává stejná — na webu se nic měnit nemusí.

## Krok 5 — Otestuj (2 minuty)

1. Otevři `https://sourcing-sense.com/tools/savings-calculator`, zadej svůj e-mail do bloku „Get this as a detailed report".
2. Zkontroluj: (a) přišel e-mail, (b) v tabulce přibyl řádek v listu `tool_reports`.
3. Totéž zopakuj na `/tools/rfq-builder` (vygeneruj RFQ → „Email me the RFQ").

## Limity, o kterých je dobré vědět

- Gmail účet zdarma: **100 e-mailů/den** přes MailApp; Google Workspace: 1 500/den. Pro začátek bohatě stačí.
- Když limit dojde, lead se pořád uloží do tabulky — jen nedojde e-mail. Ráno je můžeš poslat ručně.
