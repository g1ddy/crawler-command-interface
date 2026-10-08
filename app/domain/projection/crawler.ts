import type { AttributeName, CrawlerConditionMetric, CrawlerState } from '../types.ts';

function markCausalField(
  state: CrawlerState,
  field: 'level' | 'xp' | 'maxXp' | 'availableAttributePoints' | CrawlerConditionMetric,
  sequence: number
): void {
  if (field in state.crawler.condition) {
    state.causalProvenance.condition[field as CrawlerConditionMetric] = sequence;
  } else {
    state.causalProvenance[field as 'level' | 'xp' | 'maxXp' | 'availableAttributePoints'] = sequence;
  }
}

export function applyAttributeModified(state: CrawlerState, event: Record<string, unknown>, sequence: number): void {
  const attr = event.attribute as AttributeName;
  if (!attr) return;
  const delta = Number(event.delta || 0);
  const currentVal = state.crawler.attributes[attr];
  if (event.source === 'allocation' || event.isAllocation) {
    if (currentVal !== undefined) {
      state.crawler.attributes[attr] = currentVal + delta;
      state.causalProvenance.attributes[attr] = sequence;
    }
    if (state.crawler.availableAttributePoints !== undefined) {
      state.crawler.availableAttributePoints = Math.max(0, state.crawler.availableAttributePoints - delta);
      state.causalProvenance.availableAttributePoints = sequence;
    }
  } else if (event.source === 'permanent_modifier') {
    state.crawler.permanentAttributeModifiers[attr] = (state.crawler.permanentAttributeModifiers[attr] ?? 0) + delta;
  } else {
    if (currentVal !== undefined) {
      state.crawler.attributes[attr] = currentVal + delta;
      state.causalProvenance.attributes[attr] = sequence;
    }
  }
}

export function applyLevelChanged(state: CrawlerState, event: Record<string, unknown>, sequence: number): void {
  const level = Number(event.level);
  if (Number.isInteger(level) && level > 0) {
    state.crawler.level = level;
    markCausalField(state, 'level', sequence);
  }
}

export function applyXPChanged(state: CrawlerState, event: Record<string, unknown>, sequence: number): void {
  if (event.maxXp !== undefined) {
    state.crawler.maxXp = Number(event.maxXp);
    markCausalField(state, 'maxXp', sequence);
  }
  if (event.xp !== undefined) {
    state.crawler.xp = Number(event.xp);
    markCausalField(state, 'xp', sequence);
  } else if (event.xpDelta !== undefined) {
    if (state.crawler.xp !== undefined) {
      state.crawler.xp = Math.max(0, state.crawler.xp + Number(event.xpDelta));
      markCausalField(state, 'xp', sequence);
    }
  }
}

export function applyConditionChanged(state: CrawlerState, event: Record<string, unknown>, sequence: number): void {
  if (event.maxHealth !== undefined) {
    state.crawler.condition.maxHealth = Number(event.maxHealth);
    markCausalField(state, 'maxHealth', sequence);
  }
  if (event.currentHealth !== undefined) {
    const newHealth = Number(event.currentHealth);
    state.crawler.condition.currentHealth = newHealth;
    markCausalField(state, 'currentHealth', sequence);
    if (state.crawler.condition.maxHealth !== null && newHealth > state.crawler.condition.maxHealth) {
      state.crawler.condition.maxHealth = newHealth;
      markCausalField(state, 'maxHealth', sequence);
    }
  } else if (event.healthDelta !== undefined && state.crawler.condition.currentHealth !== null) {
    let currentHealth = state.crawler.condition.currentHealth + Number(event.healthDelta);
    currentHealth = Math.max(0, currentHealth);
    if (state.crawler.condition.maxHealth !== null) {
      currentHealth = Math.min(state.crawler.condition.maxHealth, currentHealth);
    }
    state.crawler.condition.currentHealth = currentHealth;
    markCausalField(state, 'currentHealth', sequence);
  }

  if (event.maxMana !== undefined) {
    state.crawler.condition.maxMana = Number(event.maxMana);
    markCausalField(state, 'maxMana', sequence);
  }
  if (event.currentMana !== undefined) {
    const newMana = Number(event.currentMana);
    state.crawler.condition.currentMana = newMana;
    markCausalField(state, 'currentMana', sequence);
    if (state.crawler.condition.maxMana !== null && newMana > state.crawler.condition.maxMana) {
      state.crawler.condition.maxMana = newMana;
      markCausalField(state, 'maxMana', sequence);
    }
  } else if (event.manaDelta !== undefined && state.crawler.condition.currentMana !== null) {
    let currentMana = state.crawler.condition.currentMana + Number(event.manaDelta);
    currentMana = Math.max(0, currentMana);
    if (state.crawler.condition.maxMana !== null) {
      currentMana = Math.min(state.crawler.condition.maxMana, currentMana);
    }
    state.crawler.condition.currentMana = currentMana;
    markCausalField(state, 'currentMana', sequence);
  }

  if (event.maxStamina !== undefined) {
    state.crawler.condition.maxStamina = Number(event.maxStamina);
    markCausalField(state, 'maxStamina', sequence);
  }
  if (event.currentStamina !== undefined) {
    const newStamina = Number(event.currentStamina);
    state.crawler.condition.currentStamina = newStamina;
    markCausalField(state, 'currentStamina', sequence);
    if (state.crawler.condition.maxStamina !== null && newStamina > state.crawler.condition.maxStamina) {
      state.crawler.condition.maxStamina = newStamina;
      markCausalField(state, 'maxStamina', sequence);
    }
  } else if (event.staminaDelta !== undefined && state.crawler.condition.currentStamina !== null) {
    let currentStamina = state.crawler.condition.currentStamina + Number(event.staminaDelta);
    currentStamina = Math.max(0, currentStamina);
    if (state.crawler.condition.maxStamina !== null) {
      currentStamina = Math.min(state.crawler.condition.maxStamina, currentStamina);
    }
    state.crawler.condition.currentStamina = currentStamina;
    markCausalField(state, 'currentStamina', sequence);
  }
}

export function applyEffectApplied(state: CrawlerState, event: Record<string, unknown>, sequence: number): void {
  const effectId = String(event.effectId);
  state.effects = state.effects.filter((e) => e.effectId !== effectId);
  state.effects.push({
    effectId,
    name: String(event.name || ''),
    type: (event.effectType as 'good' | 'bad' | 'injury' | 'other') || 'other',
    icon: String(event.icon || '✦'),
    durationSeconds: Number(event.durationSeconds || 0),
    appliedAtSequence: sequence,
    description: String(event.description || ''),
    statModifiers: event.statModifiers as Record<string, number> | undefined,
  });
}

export function applyEffectExpired(state: CrawlerState, event: Record<string, unknown>): void {
  const effectId = String(event.effectId);
  state.effects = state.effects.filter((e) => e.effectId !== effectId);
}
