import {
  DataDragonChampionSummary,
  DataDragonChampionDetail,
  DataDragonItem,
  DataDragonRuneTree,
  PlayerData,
} from '../types';

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const LOCALE = 'pt_BR';

export async function buscarUltimaVersao(): Promise<string> {
  const resposta = await fetch(`${DDRAGON}/api/versions.json`);
  const versoes: string[] = await resposta.json();
  return versoes[0];
}

export async function buscarDadosEstaticos(versao: string): Promise<{
  championList: Record<string, DataDragonChampionSummary>;
  items: Record<string, DataDragonItem>;
  runes: DataDragonRuneTree[];
}> {
  const [resCampeoes, resItens, resRunas] = await Promise.all([
    fetch(`${DDRAGON}/cdn/${versao}/data/${LOCALE}/champion.json`),
    fetch(`${DDRAGON}/cdn/${versao}/data/${LOCALE}/item.json`),
    fetch(`${DDRAGON}/cdn/${versao}/data/${LOCALE}/runesReforged.json`),
  ]);

  const jsonCampeoes = await resCampeoes.json();
  const jsonItens = await resItens.json();
  const jsonRunas = await resRunas.json();

  return {
    championList: jsonCampeoes.data,
    items: jsonItens.data,
    runes: jsonRunas,
  };
}

export async function buscarDetalhesCampeao(
  versao: string,
  championId: string
): Promise<DataDragonChampionDetail> {
  const resposta = await fetch(
    `${DDRAGON}/cdn/${versao}/data/${LOCALE}/champion/${championId}.json`
  );
  const json = await resposta.json();
  return json.data[championId];
}

export async function buscarDadosMockDaPartida(): Promise<PlayerData> {
  const resposta = await fetch('data.json');
  const dados = await resposta.json();
  return dados.player;
}
