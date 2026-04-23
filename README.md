<div align="center">
  <img src="https://raw.githubusercontent.com/SIDD2310/DATA-VIZ-Assignment/main/public/favicon.svg" alt="WorldMonitor Logo" width="100" />
  <h1>WorldMonitor Logistics Intelligence</h1>
  <p><strong>A high-density, temporally-synchronized intelligence platform for global risk analysis.</strong></p>
</div>

---

## 🌐 Overview

WorldMonitor is a cinematic, highly-interactive intelligence dashboard built to visualize the intersection of **physical hazards, global logistics, and market volatility**. Designed for risk analysts, the platform correlates massive global datasets in real-time, allowing users to scrub backwards through time to analyze how natural disasters impact supply chains and trigger subsequent market reactions.

Built with **React, Three.js, Recharts, and MapboxGL/Maplibre**, the application pushes the boundaries of dense data visualization and frontend performance.

---

## ✨ Core Features

### ⏱️ The Temporal Scrubber
At the heart of the platform is a global, interactive time-window filter. When an analyst drags the scrubber backward in time, all historical data pipelines—including seismic events, thermal anomalies, and market prices—synchronize perfectly to that exact moment. This enables the discovery of 4-8 hour causal lag effects between physical events and market reactions.

### 🗺️ Dual-Mode Geospatial Mapping
- **3D WebGL Globe (`react-globe.gl`)**: A fully immersive, rotatable 3D projection rendering 80+ distinct telemetry layers (submarine cables, conflict zones, flight arcs) seamlessly.
- **2D Custom SVG FlatMap**: A custom-engineered, ultra-fast Mercator projection that features a **mathematically precise, dynamically calculated day/night solar terminator curve**. The shadow reacts instantly to the Temporal Scrubber to show exactly where the sun was at any given moment.

### 📊 Multi-Domain Telemetry
1. **Seismic & Thermal Layers**: Live integration with **USGS** (Earthquakes) and **NASA FIRMS** (Active fire lines/thermal anomalies).
2. **Logistics & Aviation**: Live airspace tracking via **OpenSky/Aviationstack** and maritime chokepoint monitoring (e.g., Suez, Panama).
3. **Financial Markets**: High-performance candlestick charts, sector resilience trackers, and volatility metrics (VIX) powered by a robust Python/`yfinance` pipeline that caches data locally to bypass API rate-limiting. Includes intelligent "Carry-Forward" visual states for closed markets.
4. **World Events & Financial News**: Live narrative context integrated directly onto the Markets dashboard using the **GNews API**, featuring a seamless mock-data failover system to protect against API rate limits during development.

---

## 🧭 Dashboard Architecture

The application is split into specialized analytical views:
- **Landing Page**: A cinematic, narrative-driven entry sequence featuring interactive "Functional Artifacts" (Diagnostic Shuffler, Telemetry Typewriter).
- **Geospatial Map (3D/2D)**: The primary visualization canvas for global telemetry.
- **Intelligence**: High-level statistical summaries and compound risk assessments (Radar Charts).
- **Markets**: Deep-dive financial analysis featuring inline candlestick rendering, ETF spread trackers, and context-aware financial news headlines directly beside the ticker data.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, Vite
- **Styling**: TailwindCSS v3.4, Custom CSS Animations (Glassmorphism, Micro-interactions)
- **Data Visualization**: Recharts (Composed Charts, Radar, Candlesticks)
- **Geospatial Processing**: Three.js, D3-Geo mathematical projections
- **Data Ingestion**: Python (`yfinance`, `pandas`) for robust historical market generation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+ (For the market data ingestion pipeline)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SIDD2310/DATA-VIZ-Assignment.git
   cd DATA-VIZ-Assignment
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Fetch the latest market datasets (Optional but recommended):
   ```bash
   python scripts/fetch_candles.py
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables
To enable live news and aviation tracking, add the following to a `.env` file at the root:
```env
VITE_GNEWS_API_KEY=your_key_here
VITE_AVIATIONSTACK_KEY=your_key_here
```

---

## 📜 License
This project is proprietary and intended for demonstration of advanced data visualization architectures.
