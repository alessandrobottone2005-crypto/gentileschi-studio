# Gentileschi Studio — interface conventions

The account and studio surfaces extend the existing Figma identity. Blue and lime template output is preserved.

- Ground: `#0b0e2b`; surfaces: `#10143d`; inputs: `#141842`; borders: `#283261`.
- Actions: electric blue `#1728e8` and acid lime `#dfff2f`; white/off-white foreground; muted text `#afbbea`.
- Display headings: Archivo Black. Body and forms: Inter. Existing template dates keep Roboto Mono.
- Desktop navigation: fixed 236px sidebar; content uses fluid space. At 900px and below, a compact header opens the navigation. At 600px, identity details and forms stack; project actions and user roles wrap.
- Account hierarchy: identity and editable name, personal contribution strip, AI usage panel, personal project list. The preview image is in `.impeccable/mocks/account-preview.png`; the real screen uses Google imagery and database values.
- Shared project lists show creator attribution without implying private ownership. Empty archive offers “Crea il primo progetto”.
- Controls have keyboard focus, disabled/pending states and Italian recovery messages. Counts use an em dash during loading/error rather than falsely showing zero.
- The photo library uses real private-bucket assets and signed previews; the editor picker protects keyboard focus while choosing a photo.
