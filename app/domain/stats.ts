import type { AttributeName, CrawlerState } from './types.ts';

export interface StatBreakdown {
  statName: string;
  baseValue: number;
  permanentModifiers: number;
  gearContributions: { itemName: string; slot: string; amount: number }[];
  activeEffectContributions: { effectName: string; icon: string; amount: number }[];
  totalValue: number;
}

export function getStatBreakdown(state: CrawlerState, statName: string): StatBreakdown {
  const isAttr = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Charisma'].includes(statName);

  let baseValue = 0;
  let permanentModifiers = 0;

  if (isAttr) {
    const attrKey = statName as AttributeName;
    baseValue = state.crawler.attributes[attrKey] || 0;
    permanentModifiers = state.crawler.permanentAttributeModifiers[attrKey] || 0;
  } else if (statName === 'Armor' || statName === 'Physical Resistance') {
    baseValue = 10;
  } else if (statName === 'Movement Speed') {
    baseValue = 100; // base %
  } else if (statName === 'Max Health') {
    baseValue = state.crawler.condition.maxHealth;
  } else if (statName === 'Max Mana') {
    baseValue = state.crawler.condition.maxMana;
  }

  const gearContributions: { itemName: string; slot: string; amount: number }[] = [];

  for (const slot in state.equippedSlots) {
    const instanceId = state.equippedSlots[slot];
    if (!instanceId) continue;
    const item = state.inventory.find((i) => i.instanceId === instanceId);
    if (!item || !item.stats) continue;

    // Direct match or attribute match
    const keyMatch = Object.keys(item.stats).find(
      (k) => k.toLowerCase() === statName.toLowerCase()
    );
    if (keyMatch) {
      gearContributions.push({
        itemName: item.name,
        slot,
        amount: item.stats[keyMatch],
      });
    }
  }

  const activeEffectContributions: { effectName: string; icon: string; amount: number }[] = [];

  for (const effect of state.effects) {
    if (!effect.statModifiers) continue;
    const keyMatch = Object.keys(effect.statModifiers).find(
      (k) => k.toLowerCase() === statName.toLowerCase()
    );
    if (keyMatch) {
      activeEffectContributions.push({
        effectName: effect.name,
        icon: effect.icon,
        amount: effect.statModifiers[keyMatch],
      });
    }
  }

  const gearTotal = gearContributions.reduce((sum, g) => sum + g.amount, 0);
  const effectTotal = activeEffectContributions.reduce((sum, e) => sum + e.amount, 0);

  const totalValue = baseValue + permanentModifiers + gearTotal + effectTotal;

  return {
    statName,
    baseValue,
    permanentModifiers,
    gearContributions,
    activeEffectContributions,
    totalValue,
  };
}

export interface StatDelta {
  statName: string;
  equippedValue: number;
  candidateValue: number;
  delta: number;
}

export function compareGearStats(
  equippedItem?: { stats?: Record<string, number> },
  candidateItem?: { stats?: Record<string, number> }
): StatDelta[] {
  const equippedStats = equippedItem?.stats || {};
  const candidateStats = candidateItem?.stats || {};

  const allStatNames = Array.from(
    new Set([...Object.keys(equippedStats), ...Object.keys(candidateStats)])
  );

  return allStatNames.map((statName) => {
    const equippedValue = equippedStats[statName] || 0;
    const candidateValue = candidateStats[statName] || 0;
    const delta = candidateValue - equippedValue;

    return {
      statName,
      equippedValue,
      candidateValue,
      delta,
    };
  });
}

export interface RequirementDetail {
  key: string;
  required: string | number;
  current: string | number;
  met: boolean;
}

export interface RequirementResult {
  met: boolean;
  details: RequirementDetail[];
}

export function checkItemRequirements(
  crawler: CrawlerState['crawler'],
  requirements?: Record<string, number | string>
): RequirementResult {
  if (!requirements || Object.keys(requirements).length === 0) {
    return { met: true, details: [] };
  }

  const details: RequirementDetail[] = [];
  let allMet = true;

  for (const [key, required] of Object.entries(requirements)) {
    let current: string | number = 'N/A';
    let isMet = false;

    const lowerKey = key.toLowerCase();
    if (lowerKey === 'level') {
      current = crawler.level;
      isMet = crawler.level >= Number(required);
    } else if (lowerKey === 'class') {
      current = crawler.class;
      isMet = String(crawler.class).toLowerCase() === String(required).toLowerCase();
    } else if (lowerKey === 'race') {
      current = crawler.race;
      isMet = String(crawler.race).toLowerCase() === String(required).toLowerCase();
    } else {
      const attributeKey = Object.keys(crawler.attributes).find(
        (attribute) => attribute.toLowerCase() === lowerKey
      ) as AttributeName | undefined;
      if (attributeKey) {
        current = crawler.attributes[attributeKey];
        isMet = crawler.attributes[attributeKey] >= Number(required);
      }
    }

    if (!isMet) allMet = false;

    details.push({
      key,
      required,
      current,
      met: isMet,
    });
  }

  return {
    met: allMet,
    details,
  };
}
