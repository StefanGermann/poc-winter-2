# POC Simulation – Adelboden 2026/27

A browser-based simulation tool for the Adelboden ski-pass pricing model ("POC" sheet from the Excel workbook). It lets you interactively explore how early-booking discounts and adoption rates affect the revenue elasticity across different ski-pass product tiers.

## Key Technologies

- **TanStack Start** – React SSR/SPA framework
- **React** – UI with hooks for reactive state
- **Tailwind CSS v4** – utility-first styling
- **Netlify** – hosting and deployment

## Running Locally

```bash
npm install
npm run dev
```

The app starts on port 3000. No environment variables are required.

## Usage

1. **max_EBD** – Set the maximum early-booking discount (0–100%). Corresponds to cell A3 in the spreadsheet (stored as a negative fraction internally).
2. **Adoption** – Select one of four adoption levels (weak / medium / strong / very strong). Controls the base early-booker rate per product segment.
3. **Share sliders** – Adjust the market-share percentage of each product. The sum should equal 100%; a "Normalisieren" button rescales all values proportionally if it doesn't.

**Outputs shown:**
- **w1** – product-specific EBD weight (uses each product's own early-booker rate)
- **w2_old** – portfolio-EBD weight (uses the portfolio-wide weighted early-booker rate)
- **Total_Effect (J6)** – the sum of (w2_old − w1) × Share across all products, matching cell J6 in the Excel model
