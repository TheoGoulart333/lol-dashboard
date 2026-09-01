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
    
    const patchTag = document.getElementById('patch-tag');
    if (patchTag) {
      patchTag.textContent = `Patch ${cache.version}`;
    }

    const primeiroId = Object.keys(cache.championList)[0];
    if (primeiroId) {
      await selecionarCampeao(primeiroId);
    }
  } catch (erro) {
    console.error('Falha ao carregar