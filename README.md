# 🛡️ Painel Hextech — Dashboard de Estatísticas (LoL)

Protótipo front-end de um painel de estatísticas de partida, com **dados reais
de campeões, itens, habilidades e runas** vindos da Data Dragon (Riot Games),
e estatísticas de partida fictícias. Projeto de portfólio focado em **CSS
moderno (Grid + Flexbox)** e **integração com uma API pública**.

> ⚠️ Projeto não-oficial, sem vínculo com a Riot Games. KDA, ouro e duração de
> partida são fictícios (ver seção "De onde vêm os dados" abaixo).

🔗 **Demo:** `https://seu-usuario.github.io/nome-do-repo/`

![preview](docs/preview.png)

---

## ✨ Funcionalidades

- Seletor de campeões com ícones reais (rolagem horizontal).
- Banner, habilidades (passiva + Q/W/E/R) e build sugerida (itens + runa)
  carregados em tempo real da Data Dragon ao trocar de campeão.
- Build "sorteada" de forma determinística por campeão (mesmo campeão →
  mesma build, sem precisar de back-end).
- Estatísticas de partida (KDA, CS, ouro, duração) via mock local.
- Ícones de habilidade em hexágono (CSS `clip-path`) com transição de hover.
- 100% responsivo, construído **mobile-first**.

---

## 🧱 Stack

- HTML5 semântico
- CSS3 (Custom Properties, Grid, Flexbox, `clip-path`)
- JavaScript puro (sem frameworks ou build step)
- [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) — CDN
  público e sem autenticação da Riot Games

---

## 🌐 De onde vêm os dados

| Dado | Origem | Por quê |
|---|---|---|
| Campeões, ícones, habilidades | **Real** — Data Dragon | CDN público, CORS liberado, sem chave de API — pode ser chamado direto do navegador. |
| Itens e runas | **Real** — Data Dragon | Mesmo motivo acima. A "build sugerida" é um sorteio determinístico entre os itens finais reais do patch atual. |
| KDA, ouro, duração, resultado da partida | **Mock** — `data.json` | Dados de uma partida específica vêm da **Riot Games API** autenticada (chave de API secreta). Uma chave de API nunca pode ficar exposta em código front-end público — isso exigiria um back-end fazendo essa chamada por trás (ex: uma Cloud Function), o que está fora do escopo deste protótipo estático. |

Essa separação é intencional e está comentada no topo do `script.js` — é um
bom ponto para comentar em entrevista: saber diferenciar o que pode ser
resolvido 100% no front-end e o que exige infraestrutura de back-end.

---

## 📂 Estrutura do projeto

```
.
├── index.html      # Estrutura semântica do dashboard
├── styles.css       # Tokens de design, Grid, Flexbox, responsivo
├── script.js        # Integração com a Data Dragon + injeção no DOM
├── data.json        # Mock das estatísticas da partida
└── README.md
```

---

## 🎯 Decisões técnicas

Esta seção é o destaque do projeto — explica **por que** cada ferramenta
de layout foi escolhida, e não apenas o que foi usado.

### Por que Grid no layout principal

O `<main class="dashboard">` tem regiões em **duas dimensões**: seletor de
campeões e banner ocupando a largura toda, estatísticas e build lado a lado,
habilidades na base. A partir de 980px, `grid-template-areas` reorganiza os
cards em colunas sem precisar alterar a ordem do HTML.

```css
.dashboard {
  display: grid;
  grid-template-areas:
    "banner   banner"
    "stats    items"
    "abilities abilities";
}
```

### Por que Grid nos cards de habilidade

A grade de habilidades usa `repeat(auto-fill, minmax(110px, 1fr))`, o que
permite que o número de colunas se ajuste automaticamente ao espaço
disponível — sem media queries adicionais para cada breakpoint.

### Por que Flexbox no menu, no seletor de campeões e na lista de itens

Menu de navegação, seletor de campeões e lista de itens são estruturas
**unidimensionais**: uma sequência de elementos em linha (menu e seletor,
com rolagem horizontal) ou em coluna (itens), cada um do mesmo "peso"
visual. Flexbox resolve isso com menos código que Grid e com alinhamento
(`align-items`, `gap`) mais direto.

### Mobile-first

Os estilos base assumem a tela mais estreita (uma coluna, menu em coluna).
As media queries (`min-width: 640px` e `min-width: 980px`) **adicionam**
complexidade de layout conforme o espaço cresce, em vez de remover regras
de uma versão desktop.

### Acessibilidade

- `prefers-reduced-motion` respeitado (transições desativadas se o usuário
  preferir).
- Estados de `:focus-visible` espelham o `:hover` nas habilidades, para
  navegação por teclado.
- Tratamento de erro: se a Data Dragon estiver fora do ar, o seletor de
  campeões mostra uma mensagem em vez de travar a página.

---

## 🚀 Rodando localmente

Como o `script.js` usa `fetch()` (para `data.json` e para a Data Dragon), é
preciso servir os arquivos por HTTP (abrir o `index.html` direto do disco
bloqueia o fetch local por CORS em alguns navegadores).

```bash

# qualquer servidor estático funciona, por exemplo:

npx serve .

# ou

python3 -m http.server
```
---


