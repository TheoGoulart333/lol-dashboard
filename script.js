const DDRAGON = 'https://ddragon.leagueoflegends.com';
const LOCALE = 'pt_BR';

const cache = {
  version: null,
  championList: null, 
  championDetails: new Map(), 
  items: null,
  runes: null,
};

async function init() {
  try {
    await carregarVersaoEDadosEstaticos();
    renderizarSeletorDeCampeoes();
    document.getElementById('patch-tag').textContent = `Patch ${cache.version}`;

    // Seleciona um campeão inicial para já mostrar o painel preenchido

    const primeiroId = Object.keys(cache.championList)[0];
    await selecionarCampeao(primeiroId);
  } catch (erro) {
    console.error('Falha ao carregar dados da Data Dragon:', erro);
    document.getElementById('champion-list').innerHTML =
      '<p class="champion-select__loading">Não foi possível carregar os campeões agora. Verifique sua conexão e atualize a página.</p>';
  }

  carregarDadosMockDaPartida();
}

async function carregarVersaoEDadosEstaticos() {
  const versoes = await (await fetch(`${DDRAGON}/api/versions.json`)).json();
  cache.version = versoes[0];

  const [campeoes, itens, runas] = await Promise.all([
    fetch(`${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/champion.json`).then((r) => r.json()),
    fetch(`${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/item.json`).then((r) => r.json()),
    fetch(`${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/runesReforged.json`).then((r) => r.json()),
  ]);

  cache.championList = campeoes.data;
  cache.items = itens.data;
  cache.runes = runas;
}

function renderizarSeletorDeCampeoes() {
  const container = document.getElementById('champion-list');
  const campeoes = Object.values(cache.championList);

  container.innerHTML = campeoes
    .map(
      (champ) => `
      <button class="champion-chip" type="button" role="option"
        data-champion-id="${champ.id}" aria-selected="false">
        <img src="${DDRAGON}/cdn/${cache.version}/img/champion/${champ.image.full}"
             alt="${champ.name}" loading="lazy" width="44" height="44">
        <span>${champ.name}</span>
      </button>`
    )
    .join('');

  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.champion-chip');
    if (botao) selecionarCampeao(botao.dataset.championId);
  });
}

async function selecionarCampeao(championId) {
  marcarChipSelecionado(championId);

  if (!cache.championDetails.has(championId)) {
    const resposta = await fetch(
      `${DDRAGON}/cdn/${cache.version}/data/${LOCALE}/champion/${championId}.json`
    );
    const json = await resposta.json();
    cache.championDetails.set(championId, json.data[championId]);
  }

  const campeao = cache.championDetails.get(championId);
  renderizarBanner(campeao);
  renderizarHabilidades(campeao);
  renderizarBuild(championId);
}

function marcarChipSelecionado(championId) {
  document.querySelectorAll('.champion-chip').forEach((chip) => {
    const ativo = chip.dataset.championId === championId;
    chip.classList.toggle('is-selected', ativo);
    chip.setAttribute('aria-selected', String(ativo));
  });
}

function renderizarBanner(campeao) {
  document.getElementById('champion-avatar').innerHTML = `
    <img src="${DDRAGON}/cdn/${cache.version}/img/champion/${campeao.image.full}" alt="${campeao.name}">`;
  document.getElementById('champion-role').textContent = campeao.tags.join(' · ');
  document.getElementById('champion-name').textContent = campeao.name;
  document.getElementById('champion-title').textContent = `, ${campeao.title}`;
}

function renderizarHabilidades(campeao) {
  const grid = document.getElementById('abilities-grid');

  const passiva = {
    key: 'P',
    name: campeao.passive.name,
    cooldown: 'Passiva',
    description: campeao.passive.description,
    iconUrl: `${DDRAGON}/cdn/${cache.version}/img/passive/${campeao.passive.image.full}`,
  };

  const ativas = campeao.spells.map((spell, indice) => ({
    key: ['Q', 'W', 'E', 'R'][indice],
    name: spell.name,
    cooldown: spell.cooldownBurn ? `${spell.cooldownBurn}s` : '—',
    description: spell.description,
    iconUrl: `${DDRAGON}/cdn/${cache.version}/img/spell/${spell.image.full}`,
  }));

  grid.innerHTML = [passiva, ...ativas]
    .map(
      (hab) => `
      <div class="ability" tabindex="0" title="${limparTexto(hab.description)}">
        <span class="ability__icon" aria-hidden="true">
          <img src="${hab.iconUrl}" alt="${hab.name}" loading="lazy">
        </span>
        <span class="ability__key">${hab.key}</span>
        <span class="ability__name">${hab.name}</span>
        <span class="ability__cooldown">${hab.cooldown}</span>
      </div>`
    )
    .join('');
}

function renderizarBuild(championId) {
  const aleatorio = criarGeradorComSeed(championId);

  const itensFinais = Object.entries(cache.items)
    .filter(([, item]) => {
      const semEvolucao = !item.into || item.into.length === 0;
      const naSummonersRift = item.maps && item.maps['11'];
      const naoTrinketOuConsumivel = !(item.tags || []).some((t) =>
        ['Trinket', 'Consumable'].includes(t)
      );
      return semEvolucao && naSummonersRift && naoTrinketOuConsumivel && item.gold.total >= 1300;
    })
    .map(([id, item]) => ({ id, ...item }));

  const build = embaralharComSeed(itensFinais, aleatorio).slice(0, 6);

  document.getElementById('items-list').innerHTML = build
    .map(
      (item) => `
      <li title="${limparTexto(item.plaintext || item.description)}">
        <img class="item__icon" src="${DDRAGON}/cdn/${cache.version}/img/item/${item.image.full}" alt="${item.name}" loading="lazy">
        <span class="item__name">${item.name}</span>
        <span class="item__slot">${item.gold.total}g</span>
      </li>`
    )
    .join('');

  const trilha = cache.runes[Math.floor(aleatorio() * cache.runes.length)];
  const keystones = trilha.slots[0].runes;
  const keystone = keystones[Math.floor(aleatorio() * keystones.length)];

  document.getElementById('rune-icon').style.backgroundImage =
    `url(${DDRAGON}/cdn/img/${keystone.icon})`;
  document.getElementById('rune-name').textContent = `${keystone.name} (${trilha.name})`;
}

function limparTexto(texto = '') {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\{\{.*?\}\}/g, '').replace(/\s+/g, ' ').trim();
}

function criarGeradorComSeed(textoSeed) {
  let seed = 0;
  for (let i = 0; i < textoSeed.length; i++) seed = (seed * 31 + textoSeed.charCodeAt(i)) >>> 0;
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

/* ===================== DADOS MOCK DA PARTIDA ===================== */

async function carregarDadosMockDaPartida() {
  try {
    const resposta = await fetch('data.json');
    const { player } = await resposta.json();

    document.getElementById('summoner-name').textContent =
      `${player.summonerName} · ${player.rank} · Nível ${player.summonerLevel}`;

    const badge = document.getElementById('result-badge');
    badge.textContent = player.match.result;
    badge.classList.toggle('is-defeat', player.match.result.toLowerCase() !== 'vitória');
    document.getElementById('match-duration').textContent = player.match.duration;

    renderizarEstatisticas(player.match);
  } catch (erro) {
    console.error('Falha ao carregar o mock de partida (data.json):', erro);
  }
}

function renderizarEstatisticas(match) {
  const container = document.querySelector('.stats__grid');
  const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(1);

  const estatisticas = [
    { label: 'KDA', value: `${match.kills}/${match.deaths}/${match.assists}` },
    { label: 'Ratio KDA', value: kda },
    { label: 'CS / min', value: match.csPerMin },
    { label: 'Ouro', value: match.gold.toLocaleString('pt-BR') },
  ];

  container.innerHTML = estatisticas
    .map(
      (s) => `
      <div class="stat">
        <span class="stat__value">${s.value}</span>
        <span class="stat__label">${s.label}</span>
      </div>`
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', init);
