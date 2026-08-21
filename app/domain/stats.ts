import { AttributeName, CrawlerState } from './types.ts';

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
