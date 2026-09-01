export interface DataDragonImage {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DataDragonGold {
  base: number;
  purchasable: boolean;
  total: number;
  sell: number;
}

export interface DataDragonChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  image: DataDragonImage;
  tags: string[];
  partype: string;
}

export interface DataDragonSpell {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldownBurn: string;
  image: DataDragonImage;
}

export interface DataDragonPassive {
  name: string;
  description: string;
  image: DataDragonImage;
}

export interface DataDragonChampionDetail extends DataDragonChampionSummary {
  spells: DataDragonSpell[];
  passive: DataDragonPassive;
}

export interface DataDragonItem {
  id?: string;
  name: string;
  description: string;
  plaintext: string;
  into?: string[];
  maps?: Record<string, boolean>;
  tags?: string[];
  gold: DataDragonGold;
  image: DataDragonImage;
}

export interface DataDragonRune {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

export interface DataDragonRuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: {
    runes: DataDragonRune[];
  }[];
}

export interface PlayerMatch {
  result: string;
  duration: string;
  kills: number;
  deaths: number;
  assists: number;
  csPerMin: number;
  gold: number;
  visionScore: number;
}

export interface PlayerData {
  summonerName: string;
  summonerLevel: number;
  rank: string;
  match: PlayerMatch;
}
