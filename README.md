# n8n-nodes-german-company-data

An [n8n](https://n8n.io) community node for **verified German company data** — KYB company profiles, insolvency register checks and Impressum contact extraction. Powered by three [Apify](https://apify.com) actors; you only need a (free) Apify account and API token.

Works great for KYB/compliance checks, B2B lead enrichment, CRM hygiene and risk monitoring — directly inside your n8n workflows, and usable as a tool by n8n AI agents.

## Operations

| Operation | What it does | Apify actor |
| --- | --- | --- |
| **Company Intelligence (KYB)** | Turn a domain, company name or VAT ID (USt-IdNr.) into a verified company profile: Handelsregister, Impressum, VIES VAT validation, insolvency status and Bundesanzeiger financial signals — merged into one record with evidence. | [dach-company-intel](https://apify.com/ayyouba/dach-company-intel) |
| **Insolvency Check** | Check company names against the official German insolvency register (Insolvenzbekanntmachungen) for proceedings, matched to the company name, with case numbers. | [german-insolvency-api](https://apify.com/ayyouba/german-insolvency-api) |
| **Impressum Scraper** | Extract legal name, address, managing directors, register number, VAT ID and contact email/phone from any German website's Impressum, plus shop system & tech stack. | [german-impressum-scraper](https://apify.com/ayyouba/german-impressum-scraper) |

Each operation starts an actor run on Apify, waits for it to finish and outputs one n8n item per result record. Turn off **Wait for Finish** in the options to fire-and-forget (the node then returns the run object, including a console URL).

## Installation

In n8n: **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-german-company-data
```

(Requires a self-hosted n8n or a plan that allows community nodes. See the [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/installation/).)

## Credentials

The node needs an **Apify API token**:

1. Create a free account at [apify.com](https://apify.com).
2. In the Apify Console, open **Settings → API & Integrations** and copy your personal API token.
3. In n8n, create a **German Company Data (Apify) API** credential and paste the token.

The actors bill through your Apify account (pay-per-event / usage-based, see the actor pages for pricing). No further login or API key is needed — the actors access only public registers.

## Usage

**Example: enrich a lead list.** Feed items with a `website` field into the node, choose *Company Intelligence (KYB)* and set **Companies** to `{{ $json.website }}`. The node auto-detects whether each entry is a domain, a company name or a VAT ID. List fields accept comma- or newline-separated strings, or an expression returning an array.

Useful options:

- **Timeout (Seconds)** — how long to wait for the run (default 300). The run also gets this as its Apify timeout.
- **Wait for Finish** — disable to start the run and continue immediately.
- **Redact Personal Data (GDPR)** — hash names of natural persons in the output.
- **Custom Input JSON** — advanced overrides merged into the actor input (e.g. `proxyConfiguration`).

## Compatibility

Requires n8n 1.x (tested against recent releases) and Node.js ≥ 20 for local builds. No additional runtime dependencies.

## Resources

- [Apify Store: dach-company-intel](https://apify.com/ayyouba/dach-company-intel)
- [Apify Store: german-insolvency-api](https://apify.com/ayyouba/german-insolvency-api)
- [Apify Store: german-impressum-scraper](https://apify.com/ayyouba/german-impressum-scraper)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
