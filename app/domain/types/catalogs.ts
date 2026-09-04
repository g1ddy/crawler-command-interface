export interface TimelineSource {
  id: string;
  kind: 'official-text' | 'official-audio' | 'official-preview' | 'wiki' | 'fan-compendium' | 'discussion' | 'editorial';
  trust: 'primary' | 'corroborating' | 'candidate';
  title: string;
  url: string;
  citationStyle?: string;
  accessedAt?: string;
  revision?: string;
}

export interface TimelineEvidence {
  sourceId: string;
  locator?: {
    book?: number;
    chapter?: number;
    floor?: number;
    section?: string;
    timestamp?: string;
  };
  note?: string;
  confidence?: 'confirmed' | 'corroborated' | 'candidate' | 'disputed';
}

export interface PatronInfo {
  id: string;
  name: string;
  tier?: string;
  contribution?: string;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'celestial' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'unknown';

export type ItemCategory =
  | 'EQUIPMENT'
  | 'CONSUMABLES'
  | 'QUEST ITEMS'
  | 'CRAFTING'
  | 'BOXES'
  | 'JUNK'
  | 'equipment'
  | 'consumable'
  | 'quest-item'
  | 'crafting'
  | 'box'
  | 'weapon'
  | 'tool'
  | 'document'
  | 'vehicle'
  | 'miscellaneous';

export interface RewardSpec {
  kind: 'box' | 'item' | 'xp' | 'entitlement' | 'feature' | 'other';
  boxType?: string;
  rarity?: ItemRarity;
  itemId?: string;
  amount?: number;
  description?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: 'equipment' | 'consumable' | 'quest-item' | 'crafting' | 'box' | 'weapon' | 'tool' | 'document' | 'vehicle' | 'miscellaneous';
  slot?: string;
  rarity?: ItemRarity;
  persistent: boolean;
  description?: string;
  stats?: Record<string, number>;
}

export interface CatalogAchievement {
  id: string;
  title: string;
  recipient?: 'carl' | 'donut' | 'party';
  description?: string;
  reward: RewardSpec[];
}
