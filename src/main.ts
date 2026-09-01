import {
  DataDragonChampionSummary,
  DataDragonChampionDetail,
  DataDragonItem,
  DataDragonRuneTree,
  PlayerData,
} from './types';
import {
  buscarUltimaVersao,
  buscarDadosEstaticos,
  buscarDetalhesCampeao,
  buscarDadosMockDaPartida,
} from './services/api';
import {
  limparTexto,
  criarGeradorComSeed,
  embaralharComSeed,
} from './utils/helpers';

const DDRAGON = 'https://ddragon.leagueoflegends.com';

interface CacheAppState {
  version: string | null;
  championList: Record<string, DataDragonChampionSummary> | null;
  championDetails: Map<string, DataDragonChampionDetail>;
  items: Record<string, DataDragonItem> | null;
  runes: DataDragonRuneTree[] | null;
  playerData: PlayerData | null;
}

const cache: CacheAppState = {
  version: null,
  championList: null,
  championDetails: new Map(),
  items: null,
  runes: null,
  playerData: null,
};

async function carregarVersaoEDadosEstaticos(): Promise<void> {
  const versao = await buscarUltimaVersao();
  cache.version = versao;

  const [dadosEstaticos, playerData] = await Promise.all([
    buscarDadosEstaticos(versao),
    buscarDadosMockDaPartida(),
  ]);

  cache.championList = dadosEstaticos.championList;
  cache.items = dadosEstaticos.items;
  cache.runes = dadosEstaticos.runes;
  cache.playerData = playerData;
}

function renderizarSeletorDeCampeoes(): void {
  const container = document.getElementById('champion-list');
  if (!container || !cache.championList || !cache.version) return;

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

async function obterDetalhesCampeao(championId: string): Promise<DataDragonChampionDetail | null> {
  if (cache.championDetails.has(championId)) {
    return cache.championDetails.get(championId)!;
  }

  if (!cache.version) return null;

  const detalhe = await buscarDetalhesCampeao(cache.version, championId);
  cache.championDetails.set(championId, detalhe);
  return detalhe;
}

async function selecionarCampeao(championId: string): Promise<void> {
  document.querySelectorAll('.champion-chip').forEach((chip) => {
    const el = chip as HTMLElement;
    const selecionado = el.dataset.id === championId;
    el.classList.toggle('is-selected', selecionado);
    el.setAttribute('aria-selected', selecionado ? 'true' : 'false');
  });

  const detalhe = await obterDetalhesCampeao(championId);
  if (!detalhe) return;

  renderizarBanner(detalhe);
  renderizarEstatisticas();
  renderizarBuildERunas(championId);
  renderizarHabilidades(detalhe);
}

function renderizarBanner(detalhe: DataDragonChampionDetail): void {
  const avatar = document.getElementById('champion-avatar');
  if (avatar && cache.version) {
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

function renderizarEstatisticas(): void {
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

function renderizarBuildERunas(championId: string): void {
  if (!cache.items || !cache.runes || !cache.version) return;

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

function renderizarHabilidades(detalhe: DataDragonChampionDetail): void {
  const grid = document.getElementById('abilities-grid');
  if (!grid || !cache.version) return;

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

async function init(): Promise<void> {
  try {
    await carregarVersaoEDadosEstaticos();
    renderizarSeletorDeCampeoes();

    const patchTag = document.getElementById('patch-tag');
    if (patchTag && cache.version) {
      patchTag.textContent = `Patch ${cache.version}`;
    }

    if (cache.championList) {
      const primeiroId = Object.keys(cache.championList)[0];
      if (primeiroId) {
        await selecionarCampeao(primeiroId);
      }
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
