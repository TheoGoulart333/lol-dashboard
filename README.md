# Painel Hextech — League of Legends Dashboard

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-5.1-646CFF.svg)](https://vitejs.dev/) [![Vitest](https://img.shields.io/badge/Vitest-1.3-green.svg)](https://vitest.dev/) [![CI Status](https://github.com/TheoGoulart333/lol-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/TheoGoulart333/lol-dashboard/actions) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Painel interativo de estatísticas e build pós-partida com temática Hextech de League of Legends, alimentado diretamente pelos dados atualizados da Data Dragon API da Riot Games.

---

## 🏗️ Arquitetura do Sistema

```mermaid
flowchart TD
    A[Riot Data Dragon API] -->|Dados de Campeões & Itens| B[Services / Data Layer]
    C[Local Data / json] -->|Fallback & Mocks| B
    B -->|Modelos & Tipos| D[Core Application Logic]
    D -->|Render & DOM events| E[Hextech UI / DOM]
```
