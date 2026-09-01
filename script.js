const DDRAGON = 'https://ddragon.leagueoflegends.com';
const LOCALE = 'pt_BR';

const cache = {
  version: null,
  championList: null,
  championDetails: new Map(),
  items: null,
  runes: null,
  playerData: null,
};

function limparTexto(texto = '') {
  return texto
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function criarGeradorComSeed(textoSeed) {
  let seed = 0;
  for (let i = 0; i < textoSeed.length; i++) {
    seed = (seed * 31 + textoSeed.charCodeAt(i)) >>> 0;
  }
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function embaralharComSeed(lista, aleatorio) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function carregarVersaoEDadosEstaticos() {
  const resVersoes = await fetch(`${DDRAGON}/api/versions.json`);
  const versoes = await resVersoes.json();
  cache.version = versoes[0];

  const [resCampeoes, resItens, resRunas, resPlayer] = await Promise.all([
    fetch(`${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/champion.json`),
    fetch(`${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/item.json`),
    fetch(`${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/runesReforged.json`),
    fetch('data.json'),
  ]);

  const jsonCampeoes = await resCampeoes.json();
  const jsonItens = await resItens.json();
  const jsonRunas = await resRunas.json();
  const jsonPlayer = await resPlayer.json();

  cache.championList = jsonCampeoes.data;
  cache.items = jsonItens.data;
  cache.runes = jsonRunas;
  cache.playerData = jsonPlayer.player;
}

function renderizarSeletorDeCampeoes() {
  const container = document.getElementById('champion-list');
  if (!container || !cache.championList) return;

  container.innerHTML = '';

  Object.values(cache.championList).forEach((champion) => {
    const btn = document.createElement('button');
    btn.className = 'champion-chip';
    btn.dataset.id = champion.id;
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', 'false');

    const img = document.createElement('img');
    img.src = `${DDRAGON}/cdn/${cache.version}/img/champion/${champion.image.full}`;
    img.alt = champion.name;
    img.loading = 'lazy';

    const span = document.createElement('span');
    span.textContent = champion.name;

    btn.appendChild(img);
    btn.appendChild(span);

    btn.addEventListener('click', () => selecionarCampeao(champion.id));
    container.appendChild(btn);
  });
}

async function buscarDetalhesCampeao(championId) {
  if (cache.championDetails.has(championId)) {
    return cache.championDetails.get(championId);
  }

  const res = await fetch(
    `${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/champion/${championId}.json`
  );
  const json = await res.json();
  const detalhe = json.data[championId];
  cache.championDetails.set(championId, detalhe);
  return detalhe;
}

async function selecionarCampeao(championId) {
  document.querySelectorAll('.champion-chip').forEach((chip) => {
    const selecionado = chip.dataset.id === championId;
    chip.classList.toggle('is-selected', selecionado);
    chip.setAttribute('aria-selected', selecionado ? 'true' : 'false');
  });

  const detalhe = await buscarDetalhesCampeao(championId);
  if (!detalhe) return;

  renderizarBanner(detalhe);
  renderizarEstatisticas();
  renderizarBuildERunas(championId);
  renderizarHabilidades(detalhe);
}

function renderizarBanner(detalhe) {
  const avatar = document.getElementById('champion-avatar');
  if (avatar) {
    avatar.innerHTML = `<img src="${DDRAGON}/cdn/${cache.version}/img/champion/${detalhe.image.full}" alt="${detalhe.name}">`;
  }

  const role = document.getElementById('champion-role');
  if (role) {
    role.textContent = detalhe.tags ? detalhe.tags.join(' / ') : '—';
  }

  const name = document.getElementById('champion-name');
  if (name) {
    name.textContent = detalhe.name;
  }

  const title = document.getElementById('champion-title');
  if (title) {
    title.textContent = `— ${detalhe.title}`;
  }

  const player = cache.playerData;
  if (player) {
    const summoner = document.getElementById('summoner-name');
    if (summoner) {
      summoner.textContent = `${player.summonerName} (${player.rank})`;
    }

    const badge = document.getElementById('result-badge');
    if (badge) {
      badge.textContent = player.match.result;
      badge.classList.toggle('is-defeat', player.match.result.toLowerCase().includes('derrota'));
    }

    const duration = document.getElementById('match-duration');
    if (duration) {
      duration.textContent = player.match.duration;
    }
  }
}

function renderizarEstatisticas() {
  const container = document.querySelector('#stats-grid .stats__grid');
  if (!container || !cache.playerData) return;

  const match = cache.playerData.match;
  const kda = ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2);

  container.innerHTML = `
    <div class="stat">
      <span class="stat__value">${match.kills} / ${match.deaths} / ${match.assists}</span>
      <span class="stat__label">KDA (${kda})</span>
    </div>
    <div class="stat">
      <span class="stat__value">${match.csPerMin}</span>
      <span class="stat__label">CS / min</span>
    </div>
    <div class="stat">
      <span class="stat__value">${match.gold.toLocaleString('pt-BR')}</span>
      <span class="stat__label">Ouro Total</span>
    </div>
    <div class="stat">
      <span class="stat__value">${match.visionScore}</span>
      <span class="stat__label">Placar de Visão</span>
    </div>
  `;
}

function renderizarBuildERunas(championId) {
  if (!cache.items || !cache.runes) return;

  const gerador = criarGeradorComSeed(championId);

  // Runa principal
  const arvoreRunas = cache.runes[Math.floor(gerador() * cache.runes.length)];
  const runaPrincipal = arvoreRunas.slots[0].runes[0];

  const runeName = document.getElementById('rune-name');
  if (runeName) runeName.textContent = runaPrincipal.name;

  const runeIcon = document.getElementById('rune-icon');
  if (runeIcon) {
    runeIcon.style.backgroundImage = `url(${DDRAGON}/img/${runaPrincipal.icon})`;
  }

  // Itens da build
  const listaItensValidos = Object.entries(cache.items).filter(
    ([_, item]) => item.gold.purchasable && item.gold.total > 1500 && item.maps && item.maps['11']
  );

  const itensEmbaralhados = embaralharComSeed(listaItensValidos, gerador).slice(0, 6);
  const itemsList = document.getElementById('items-list');

  if (itemsList) {
    itemsList.innerHTML = itensEmbaralhados
      .map(([id, item], index) => `
        <li>
          <img class="item__icon" src="${DDRAGON}/cdn/${cache.version}/img/item/${id}.png" alt="${item.name}" loading="lazy">
          <span class="item__name">${item.name}</span>
          <span class="item__slot">Slot ${index + 1}</span>
        </li>
      `)
      .join('');
  }
}

function renderizarHabilidades(detalhe) {
  const grid = document.getElementById('abilities-grid');
  if (!grid) return;

  const habilidades = [
    {
      tecla: 'PASSIVA',
      nome: detalhe.passive.name,
      icone: `${DDRAGON}/cdn/${cache.version}/img/passive/${detalhe.passive.image.full}`,
      cooldown: 'Passiva',
    },
    ...detalhe.spells.map((spell, i) => ({
      tecla: ['Q', 'W', 'E', 'R'][i] || 'SPELL',
      nome: spell.name,
      icone: `${DDRAGON}/cdn/${cache.version}/img/spell/${spell.image.full}`,
      cooldown: spell.cooldownBurn ? `${spell.cooldownBurn}s` : '—',
    })),
  ];

  grid.innerHTML = habilidades
    .map(
      (hab) => `
      <div class="ability" title="${limparTexto(hab.nome)}">
        <div class="ability__icon">
          <img src="${hab.icone}" alt="${hab.nome}" loading="lazy">
        </div>
        <span class="ability__key">${hab.tecla}</span>
        <span class="ability__name">${hab.nome}</span>
        <span class="ability__cooldown">${hab.cooldown}</span>
      </div>
    `
    )
    .join('');
}

async function init() {
  try {
    await carregarVersaoEDadosEstaticos();
    renderizarSeletorDeCampeoes();

    const patchTag = document.getElementById('patch-tag');
    if (patchTag) {
      patchTag.textContent = `Patch ${cache.version}`;
    }

    const primeiroId = Object.keys(cache.championList)[0];
    if (primeiroId) {
      await selecionarCampeao(primeiroId);
    }
  } catch (erro) {
    console.error('Falha ao carregar dados:', erro);
    const patchTag = document.getElementById('patch-tag');
    if (patchTag) {
      patchTag.textContent = 'Erro ao carregar';
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
