# Section Inventory v3.3

Source: `https://www.jobyaviation.com`

Captured in MCP-REF on `2026-04-12` with viewport `1440x1200`.

`preExpandContent()` ran before each inventory capture.

## `/`

- `scrollHeight`: `37874`
- `preExpandContent()` sections: `19`
- Inventory items captured: `24`
- Primary source sections:
  - nav fixed transparent, `80px`
  - hero/video wrapper, `14400px`, background `rgb(0, 122, 229)`, video present
  - `#experience-highlights`, `7408px`
  - `#app`, cream app section, `885px`
  - `#technology`, entry section, `1390px`
  - `#news`, cream grid section, `900px`
  - `#section-partners`, cream partner section, `4625px`
  - `#story`, entry section, `1390px`
  - `#illustration`, blue illustration section, `4632px`
  - `#footer`, footer art/structure section, `2243px`

## `/experience`

- `scrollHeight`: `39253`
- Inventory items captured: `13`
- Primary source sections:
  - nav fixed transparent, `80px`
  - hero/video wrapper, `16800px`, video present
  - `#intro`, `1544px`
  - `#experience`, `7850px`
  - `#map`, `4800px`, SVG map present
  - `#section-partners`, `4625px`
  - `#page-entry`, `1390px`
  - `#footer`, `2243px`

## `/technology`

- `scrollHeight`: `51418`
- Inventory items captured: `17`
- Primary source sections:
  - nav fixed transparent, `80px`
  - `#technology`, `6000px`, video present
  - `#introduction`, `6900px`, video and canvas present
  - `#safety`, `1390px`
  - `#safety-in`, `10300px`
  - `#sound`, `6080px`, video and canvas present
  - `#engineering`, `5260px`, video present
  - sustainability/text section, `765px`
  - `#sustainability`, `3859px`
  - technical breakdown section, `7995px`, canvas present
  - `#explore`, `1390px`
  - `#footer`, `2243px`

## `/company`

- `scrollHeight`: `23805`
- Inventory items captured: `12`
- Primary source sections:
  - nav fixed transparent, `80px`
  - intro title section, `3000px`
  - `#intro`, `2400px`
  - `#mythology`, `12681px`
  - `#about`, `2090px`, SVG present
  - `#explore`, `1390px`, SVG present
  - `#footer`, `2243px`

## `/privacy-policy`

- `scrollHeight`: `4814`
- Inventory items captured: `8`
- Primary source sections:
  - nav fixed transparent/hidden, `80px`
  - legal document section, `2571px`
  - `#footer`, `2243px`

## `/terms-of-use`

- `scrollHeight`: `7274`
- Inventory items captured: `8`
- Primary source sections:
  - nav fixed transparent dark variant, `80px`
  - legal document section, `5030px`
  - `#footer`, `2243px`

## Blocking Implications

- Target section counts must map 1:1 to the source page selected in `PAGE_MAPPING.md`.
- `/technology` is the highest-risk page because MCP inventory confirms videos and canvases in multiple sections.
- Footer parity is required on every mapped page because Joby footer has a full visual structure with SVG/art, not plain text.
