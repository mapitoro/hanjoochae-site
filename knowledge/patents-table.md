# Patents — Master Reference Table

**Source of truth for the website:** `content/patents.json`.
This table is the human-readable knowledge record, reconciled against Google Scholar
(`https://scholar.google.com/citations?user=GM3F4jsAAAAJ`) and Google Patents.

- **Last reconciled:** 2026-06-30.
- **Inclusion rule:** **Granted / published (registered) patents only.** Pending
  applications (`US Patent App. …`, no grant number) are **excluded**.
- **Display rule (decided 2026-06-30): family-representative with span + count.**
  Most grants are continuations of the same invention (identical title, same disclosure,
  prosecuted as a chain of continuations off one priority filing). The site shows **one
  row per invention family**, anchored on the **earliest** grant (the foundational
  patent — honest about when the invention was actually made), and annotates each row
  with the grant **year range** (first–latest grant) and **grant count**. This shows a
  sustained, multi-year track record without listing near-duplicate rows.
- **Ordering:** newest first by latest grant year.
- **Totals:** **27 granted US patents across 8 invention families** (+ 1 Australian
  counterpart). `profile.json` → highlights "15+ Granted US patents" stays true/conservative.

## Reference style (the format to follow)

`patents.json` fields per family:
- **id** — the family's **earliest** granted patent, normalized: country code + number
  (no commas/spaces) + kind code (`US9672483B2`). US utility grants are normally `B2`.
- **firstYear / lastYear** — grant year of the earliest / latest grant in the family
  (equal when the family has a single grant).
- **count** — number of granted patents in the family.
- **title** — official patent title as printed on the grant.

Inventor verification: Han Joo Chae appears as "CHAE, HAN-JOO" / "Han-joo CHAE" in the
USPTO inventor list. Confirmed on Google Patents for US12536891B2, US12035277B2,
US10852841B2, US10540013B2, US10020835B2, US9672483B2.

## A. Published on the site (8 family rows)

These are the rows in `content/patents.json` (id = earliest grant; span + count shown):

| # | Span | Grants | id (earliest grant) | Title (invention family) |
|---|------|--------|---------------------|--------------------------|
| 1 | 2017–2026 | 7 | US9672483B2 | Method of providing activity notification and device thereof |
| 2 | 2017–2024 | 11 | US9629120B2 | Method and apparatus for providing notification |
| 3 | 2019–2021 | 2 | US10374648B2 | Wearable device for transmitting a message comprising strings associated with a state of a user |
| 4 | 2020 | 2 | US10540013B2 | Method of performing function of device and device for performing the method |
| 5 | 2018–2020 | 2 | US10123064B2 | Content providing method and device |
| 6 | 2018 | 1 | US10020835B2 | Wearable device and method of transmitting message from the same |
| 7 | 2016 | 1 | US9338620B2 | Method and apparatus for executing alarm with respect to missed received call for mobile communication terminal |
| 8 | 2012 | 1 | US8310537B2 | Detecting ego-motion on a mobile device displaying three-dimensional content |

## B. Full granted inventory by family (complete record)

All granted patents where Chae is a confirmed co-inventor, grouped by family. **Bold** =
earliest grant (the id shown on the site). 27 US grants across 8 families + 1 AU.

**1. Method and apparatus for providing notification** — 2017–2024, 11 US grants
- **US9629120B2 (2017)**, US9622214B2 (2017), US10009873B2 (2018), US10051604B2 (2018),
  US10136409B2 (2018), US10292134B2 (2019), US10638451B2 (2020), US10638452B2 (2020),
  US11057866B2 (2021), US11445475B2 (2022), US12035277B2 (2024)

**2. Method of providing activity notification and device thereof** — 2017–2026, 7 US grants
- **US9672483B2 (2017)**, US10055970B2 (2018), US10068458B2 (2018), US10325477B2 (2019),
  US10748409B2 (2020), US11443611B2 (2022), US12536891B2 (2026)

**3. Method of performing function of device and device for performing the method** — 2020, 2 US grants (+1 AU)
- **US10540013B2 (2020)**, US10852841B2 (2020); AU2016235039B2 (2017, Australian counterpart)

**4. Content providing method and device** — 2018–2020, 2 US grants
- **US10123064B2 (2018)**, US10674193B2 (2020)

**5. Wearable device for transmitting a message comprising strings associated with a state of a user** — 2019–2021, 2 US grants
- **US10374648B2 (2019)**, US10924147B2 (2021)

**6. Wearable device and method of transmitting message from the same** — 2018, 1 US grant
- **US10020835B2 (2018)**

**7. Method and apparatus for executing alarm with respect to missed received call for mobile communication terminal** — 2016, 1 US grant
- **US9338620B2 (2016)**

**8. Detecting ego-motion on a mobile device displaying three-dimensional content** — 2012, 1 US grant
- **US8310537B2 (2012)** — co-inventors S. Marti, S.W. Kim

> The Australian grant AU2016235039B2 (family 3) is not separately shown under the
> family-representative rule (same invention as the US grants). It can be surfaced as a
> 9th row or a note if the international filing is worth signalling.

## C. Excluded

| Year | Identifier | Title | Reason |
|------|-----------|-------|--------|
| 2024 | US App. 18/680,603 | Method and apparatus for providing notification | Pending application (not granted) |
| 2018 | US App. 15/737,459 | Method for providing exercise information and wearable device therefor | Pending application |
| 2017 | US App. 15/532,285 | Method and device for providing content | Pending application |
| 2016 | US 286,902 | Audio fingerprinting (J Han, B Coover) | Likely a different inventor ("J Han"); not Han Joo Chae |
