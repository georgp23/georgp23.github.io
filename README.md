# georgp23.github.io

Personal portfolio of **George Pedder** - BSc Computer Science (Sheffield Hallam), incoming Met Office AI placement (Jul 2026 - Jul 2027).

Live at: **https://georgp23.github.io/**

## About

A single-page portfolio focused on applied AI, machine learning and automation work. The site is hand-written HTML/CSS/JS - no build step, no framework, no tracking. Highlights include:

- **Met Office placement** - AI Foundation Software Engineer (incoming)
- **IBM SHUmachers** - reinforcement-learning driver in TORCS with an LLM commentary layer
- **Sheffield Collisions ML Pipeline** - end-to-end traffic-collision analysis and risk modelling
- **Hybrid LLM + ML Caffeine Recommender** - LLM-as-parser with per-user feedback re-ranking ([repo](https://github.com/georgp23/llm-ml-caffeine-assistant) · [writeup](https://medium.com/@georgep23/from-zero-data-to-personalised-intelligence-a-hybrid-llm-and-ml-approach-3dfb80d6e9d2))
- **Responsible AI** - interest in safety, explainability and operational ethics

Three interactive canvas animations (collision simulation, live-feedback re-rank, racing track) and an SVG tree with hover-radius glow / wind animation.

## Stack

- HTML5, CSS3 (custom properties, grid, `@keyframes`)
- Vanilla JS (Canvas 2D, `IntersectionObserver`, `requestAnimationFrame`)
- SVG (dynamic leaf generation, CSS-driven animations)
- Google Fonts: Space Mono, Bebas Neue, DM Sans
- [Formspree](https://formspree.io) for the contact form (no backend)

## Local preview

```bash
python -m http.server 8080
```

Then open <http://localhost:8080/>.

## Deployment

This repository is configured for **GitHub Pages**:

1. Push to `main`.
2. Repository → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)`.
3. Enforce HTTPS.

> Note: for the root URL `https://georgp23.github.io/` to work, the repo must be named `georgp23.github.io` (matching the GitHub username exactly).

## Contact

- LinkedIn - [in/george-p-28a83b1a5](https://www.linkedin.com/in/george-p-28a83b1a5)
- GitHub - [@georgp23](https://github.com/georgp23)
- Medium - [@georgep23](https://medium.com/@georgep23)
- Contact form on the live site

## Licence

Code released under the MIT licence. All written content, photography and project copy © George Pedder.
