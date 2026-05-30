# Livsplan med AI Agent — prosjektkontekst for Claude Code

## Hva er dette
En personlig livsplan-webapp (HTML/CSS/JS, ingen rammeverk) der en AI-agent
stiller brukeren spørsmål og genererer en helt personalisert livsplan.
Åpnes direkte i nettleseren — ingen server eller backend nødvendig.
All data lagres i `localStorage`.

Dette prosjektet er basert på "livsplan riktig" (Paris sin versjon), men
er gjort helt generisk — hvem som helst skal kunne bruke den til sine egne
drømmer og mål, enten det er en drømmereise, en dyr veske, flytte til utlandet,
spare til noe stort, eller noe helt annet.

---

## Hva som er bygget (arvet fra originalprosjektet)

- ✅ Cutesy design — Playfair Display + Nunito, rosa/lilla/mint fargepalett
- ✅ Countdown til en valgfri dato
- ✅ Sparetracker med progressbar og milepæler
- ✅ Tidslinje med månedskort — todos, notater, redigerbare felter
- ✅ Budsjett med seksjoner og inline redigering
- ✅ Mål med contenteditable tittel/beskrivelse og slider
- ✅ localStorage — alt lagres automatisk

## Hva som skal bygges (nytt i denne versjonen)

- [ ] AI-onboarding-chat øverst i appen
- [ ] AI-agent som stiller spørsmål og personaliserer appen
- [ ] Generisk data.js uten hardkodede referanser til Paris sin reiseplan
- [ ] Brukeren kan starte på nytt / resette og kjøre onboarding igjen

---

## Prosjektstruktur

```
livsplan-ai-agent/
├── index.html          ← HTML-skjelett, alle panels + ny onboarding-seksjon
├── CONTEXT.md          ← denne filen
├── css/
│   └── style.css       ← all styling inkl. AI-chat-komponenter
└── js/
    ├── data.js         ← tomme defaults, konstanter, GOAL_ICONS
    ├── app.js          ← all app-logikk: state, persist(), buildX()
    └── agent.js        ← NY: AI-agent logikk, Anthropic API-kall, onboarding-flyt
```

---

## AI-agent — hvordan det skal fungere

### Flyt
1. Bruker åpner appen for første gang
2. Onboarding-chat vises øverst — resten av appen er skjult
3. AI-agenten ønsker velkommen og stiller spørsmål ett om gangen:
   - Hva heter du?
   - Hva drømmer du om? (reise, gjenstand, opplevelse, flytte, noe annet?)
   - Når vil du nå målet ditt?
   - Hva er budsjettet ditt / hvor mye kan du spare per måned?
   - Jobber du, studerer du, eller begge deler?
4. Basert på svarene genererer AI-en:
   - En personalisert tidslinje (månedskort med relevante todos)
   - Et budsjett tilpasset målet
   - 5–7 personlige mål
   - En sparemål-sum og countdown-dato
5. Appen fylles inn automatisk med dataene
6. Brukeren kan redigere alt etterpå som normalt
7. En liten "Start på nytt"-knapp lar brukeren kjøre onboarding igjen

### API-oppsett
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [...]
  })
});
```

API-nøkkel legges inn av brukeren i appen (et enkelt inputfelt) — lagres i
localStorage så de ikke trenger å skrive den inn igjen. Aldri hardkod API-nøkkel.

### Hva AI-en skal returnere (JSON)
AI-agenten skal til slutt returnere et JSON-objekt som app.js kan bruke direkte:
```json
{
  "navn": "Mia",
  "maal": "Drømmetur til Japan",
  "avreisedato": "2026-09-01",
  "sparemaal": 30000,
  "months": [...],
  "budgetSections": [...],
  "goals": [...]
}
```

---

## Design-system

**Fonter:** Playfair Display (serif, headings) + Nunito (sans, body)
**Palett:**
```css
--pink: #E8619A
--pink-light: #FDE8F2
--pink-deep: #C2436F
--lilac: #C9A8E0
--lilac-light: #F0E8FA
--mint: #7ECBB8
--mint-light: #E4F7F4
--peach: #F4A97A
--bg: #FFF8FB
--surface: #FFFFFF
--surface2: #FFF0F6
--text: #3D2535
--text-muted: #9B7A8A
--border: #F2CEDE
--radius: 16px
--radius-pill: 50px
--shadow: 0 2px 12px rgba(232,97,154,0.10)
```
**Stil:** Cutesy, myke skygger, pill-border-radius, gradient-knapper, polka dot bakgrunn

### AI-chat-komponenten skal ha samme cutesy stil:
- Bobler for bruker (rosa, høyre) og AI (hvit/lilla, venstre)
- Skriveindikator (tre animerte prikker) mens AI tenker
- Smooth scroll ned til siste melding
- Avsluttende "Generer min livsplan 🌸"-knapp

---

## Viktige regler

- **Aldri hardkod API-nøkkel** — brukeren skriver den inn selv
- **Ingen backend** — alle API-kall skjer direkte fra frontend
- **Generisk innhold** — data.js skal ikke inneholde Paris sin reiseplan
- **Samme design** — ikke endre fargepalett eller fonter
- **Mobilvennlig** — appen skal fungere på telefon

---

## Ideer til videre utvikling

- [ ] Flere språk (engelsk, spansk)
- [ ] Del livsplanen som bilde / PDF
- [ ] Ukentlig påminnelse (push notifications via browser)
- [ ] Sammenlign to mål mot hverandre
- [ ] Integrasjon med Google Calendar for milepæler

---

## Hvordan starte lokalt

```bash
open index.html
# eller
npx serve .
python3 -m http.server 3000
```

## Første melding til Claude Code

```
Les CONTEXT.md og bli kjent med prosjektet. 
Bygg agent.js og legg til AI-onboarding-chatten i appen.
Start med å rense data.js for hardkodet innhold fra originalprosjektet.
```
