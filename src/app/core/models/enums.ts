/** Servidor global do Albion Online. */
export enum GameServer {
  Americas = 'Americas',
  Asia = 'Asia',
  Europe = 'Europe',
}

export const SERVER_HOSTS: Record<GameServer, string> = {
  [GameServer.Americas]: 'west',
  [GameServer.Asia]: 'east',
  [GameServer.Europe]: 'europe',
};

export const SERVER_LABELS: Record<GameServer, string> = {
  [GameServer.Americas]: 'Americas',
  [GameServer.Asia]: 'Asia',
  [GameServer.Europe]: 'Europe',
};

/** As cinco cidades principais + Caerleon (Black Market / zona sem facção). */
export enum City {
  Caerleon = 'Caerleon',
  Bridgewatch = 'Bridgewatch',
  Lymhurst = 'Lymhurst',
  FortSterling = 'Fort Sterling',
  Martlock = 'Martlock',
  Thetford = 'Thetford',
  BlackMarket = 'Black Market',
}

/** Cidades onde há postos de venda (Black Market só compra, não vende para NPC). */
export const TRADABLE_CITIES: City[] = [
  City.Caerleon,
  City.Bridgewatch,
  City.Lymhurst,
  City.FortSterling,
  City.Martlock,
  City.Thetford,
];

export const ALL_MARKET_LOCATIONS: City[] = [...TRADABLE_CITIES, City.BlackMarket];

/** Tipos de recurso bruto extraídos por coleta. */
export enum ResourceType {
  Wood = 'WOOD',
  Ore = 'ORE',
  Fiber = 'FIBER',
  Hide = 'HIDE',
  Rock = 'ROCK',
}

/** Material refinado correspondente a cada recurso bruto. */
export enum RefinedType {
  Planks = 'PLANKS',
  Metalbar = 'METALBAR',
  Cloth = 'CLOTH',
  Leather = 'LEATHER',
  Stoneblock = 'STONEBLOCK',
}

export const REFINED_BY_RESOURCE: Record<ResourceType, RefinedType> = {
  [ResourceType.Wood]: RefinedType.Planks,
  [ResourceType.Ore]: RefinedType.Metalbar,
  [ResourceType.Fiber]: RefinedType.Cloth,
  [ResourceType.Hide]: RefinedType.Leather,
  [ResourceType.Rock]: RefinedType.Stoneblock,
};

/** Nome amigável (PT-BR) de cada recurso/refinado. */
export const RESOURCE_LABELS: Record<ResourceType, string> = {
  [ResourceType.Wood]: 'Madeira',
  [ResourceType.Ore]: 'Minério',
  [ResourceType.Fiber]: 'Fibra',
  [ResourceType.Hide]: 'Couro Bruto',
  [ResourceType.Rock]: 'Pedra',
};

export const REFINED_LABELS: Record<RefinedType, string> = {
  [RefinedType.Planks]: 'Tábuas',
  [RefinedType.Metalbar]: 'Barras de Metal',
  [RefinedType.Cloth]: 'Tecido',
  [RefinedType.Leather]: 'Couro',
  [RefinedType.Stoneblock]: 'Blocos de Pedra',
};

/** Cidade "casa" de cada linha de refino, onde o bônus de retorno é aplicado. */
export const REFINING_BONUS_CITY: Record<ResourceType, City> = {
  [ResourceType.Wood]: City.Martlock,
  [ResourceType.Ore]: City.Bridgewatch,
  [ResourceType.Fiber]: City.Lymhurst,
  [ResourceType.Hide]: City.Thetford,
  [ResourceType.Rock]: City.FortSterling,
};

/** Journal (diário) de coleta/refino gerado por cada linha de recurso. */
export enum JournalType {
  Lumberjack = 'JOURNAL_LUMBERJACK',
  Prospector = 'JOURNAL_PROSPECTOR',
  Skinner = 'JOURNAL_SKINNER',
  Farmer = 'JOURNAL_HARVESTER',
  Quarrier = 'JOURNAL_STONEMASON',
}

export const JOURNAL_BY_RESOURCE: Record<ResourceType, JournalType> = {
  [ResourceType.Wood]: JournalType.Lumberjack,
  [ResourceType.Ore]: JournalType.Prospector,
  [ResourceType.Fiber]: JournalType.Farmer,
  [ResourceType.Hide]: JournalType.Skinner,
  [ResourceType.Rock]: JournalType.Quarrier,
};

export const JOURNAL_LABELS: Record<JournalType, string> = {
  [JournalType.Lumberjack]: 'Diário do Lenhador',
  [JournalType.Prospector]: 'Diário do Prospector',
  [JournalType.Skinner]: 'Diário do Peleiro',
  [JournalType.Farmer]: 'Diário do Fazendeiro',
  [JournalType.Quarrier]: 'Diário do Pedreiro',
};

/** Categorias de equipamento usadas no módulo de Crafting. */
export enum GearCategory {
  WeaponSword = 'WEAPON_SWORD',
  WeaponBow = 'WEAPON_BOW',
  WeaponFirestaff = 'WEAPON_FIRESTAFF',
  ArmorPlate = 'ARMOR_PLATE',
  ArmorLeather = 'ARMOR_LEATHER',
  ArmorCloth = 'ARMOR_CLOTH',
}

export const GEAR_CATEGORY_LABELS: Record<GearCategory, string> = {
  [GearCategory.WeaponSword]: 'Espada (Guerreiro)',
  [GearCategory.WeaponBow]: 'Arco (Caçador)',
  [GearCategory.WeaponFirestaff]: 'Cajado de Fogo (Mago)',
  [GearCategory.ArmorPlate]: 'Armadura de Placas',
  [GearCategory.ArmorLeather]: 'Armadura de Couro',
  [GearCategory.ArmorCloth]: 'Armadura de Tecido',
};

/** ID base do item de equipamento (convenção AODP) por categoria. */
export const GEAR_BASE_ID: Record<GearCategory, string> = {
  [GearCategory.WeaponSword]: 'T{tier}_2H_SWORD',
  [GearCategory.WeaponBow]: 'T{tier}_2H_BOW',
  [GearCategory.WeaponFirestaff]: 'T{tier}_MAIN_FIRESTAFF',
  [GearCategory.ArmorPlate]: 'T{tier}_ARMOR_PLATE_SET1',
  [GearCategory.ArmorLeather]: 'T{tier}_ARMOR_LEATHER_SET1',
  [GearCategory.ArmorCloth]: 'T{tier}_ARMOR_CLOTH_SET1',
};

/**
 * Recurso "primário" de cada categoria de equipamento, usado apenas para aproximar o RRR
 * de crafting reaproveitando a árvore de Spec de coleta/refino do usuário (simplificação:
 * o jogo possui árvores de especialização de crafting dedicadas por linha de equipamento).
 */
export const GEAR_PRIMARY_RESOURCE: Record<GearCategory, ResourceType> = {
  [GearCategory.WeaponSword]: ResourceType.Ore,
  [GearCategory.WeaponBow]: ResourceType.Wood,
  [GearCategory.WeaponFirestaff]: ResourceType.Fiber,
  [GearCategory.ArmorPlate]: ResourceType.Ore,
  [GearCategory.ArmorLeather]: ResourceType.Hide,
  [GearCategory.ArmorCloth]: ResourceType.Fiber,
};

/** Cidade com bônus de retorno de material para cada linha de equipamento (aproximado). */
export const GEAR_BONUS_CITY: Record<GearCategory, City> = {
  [GearCategory.WeaponSword]: City.FortSterling,
  [GearCategory.ArmorPlate]: City.FortSterling,
  [GearCategory.WeaponBow]: City.Martlock,
  [GearCategory.ArmorLeather]: City.Martlock,
  [GearCategory.WeaponFirestaff]: City.Lymhurst,
  [GearCategory.ArmorCloth]: City.Lymhurst,
};

/** Tier em número (T4-T8) e nível de encantamento (0-4). */
export type Tier = 4 | 5 | 6 | 7 | 8;
export type Enchant = 0 | 1 | 2 | 3 | 4;

export const TIERS: Tier[] = [4, 5, 6, 7, 8];
export const ENCHANTS: Enchant[] = [0, 1, 2, 3, 4];
