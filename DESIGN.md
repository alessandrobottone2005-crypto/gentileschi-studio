# Gentileschi Studio — interface conventions

The account and studio surfaces extend the existing Figma identity. Blue and lime template output is preserved.

Original template output remains the default. Project compositions can override colors, typography and element geometry independently; editing a project or a shared theme never mutates the official template assets. Graphic controls retain the Italian studio identity and expose equivalent touch and numeric operations on mobile. The editor uses white panels, a light gray canvas workspace, blue selections and lime accents. A tool rail opens contextual panels; mobile uses a bottom rail and compact drawers while keeping the canvas visible. Theme cards show large covers and an explicit preview/apply flow. Photo search shows provider attribution; effects and crop are reversible.

- Ground: `#0b0e2b`; surfaces: `#10143d`; inputs: `#141842`; borders: `#283261`.
- Actions: electric blue `#1728e8` and acid lime `#dfff2f`; white/off-white foreground; muted text `#afbbea`.
- Display headings: Archivo Black. Body and forms: Inter. Existing template dates keep Roboto Mono.
- Desktop navigation: fixed 236px sidebar; content uses fluid space. At 900px and below, a compact header opens the navigation. At 600px, identity details and forms stack; project actions and user roles wrap.
- Account hierarchy: identity and editable name, personal contribution strip, AI usage panel, personal project list. The preview image is in `.impeccable/mocks/account-preview.png`; the real screen uses Google imagery and database values.
- Shared project lists show creator attribution without implying private ownership. Empty archive offers “Crea il primo progetto”.
- Controls have keyboard focus, disabled/pending states and Italian recovery messages. Counts use an em dash during loading/error rather than falsely showing zero.
- The photo library uses real private-bucket assets and signed previews; the editor picker protects keyboard focus while choosing a photo.
