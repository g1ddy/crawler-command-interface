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
  if (attr in state.crawler.attributes) {
    const delta = Number(event.delta || 0);
    if (event.source === 'allocation' || event.isAllocation) {
      state.crawler.attributes[attr] += delta;
      state.crawler.availableAttributePoints = Math.max(0, state.crawler.availableAttributePoints - delta);
      state.causalProvenance.availableAttributePoints = sequence;
    } else if (event.source === 'permanent_modifier') {
      state.crawler.permanentAttributeModifiers[attr] += delta;
    } else {
      state.crawler.attributes[attr] += delta;
    }
    state.causalProvenance.attributes[attr] = sequence;
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
    state.crawler.xp = Math.max(0, state.crawler.xp + Number(event.xpDelta));
    markCausalField(state, 'xp', sequence);
  }
}

export function applyConditionChanged(state: CrawlerState, event: Record<string, unknown>, sequence: number): void {
  if (event.maxHealth !== undefined) {
    state.crawler.condition.maxHealth = Number(event.maxHealth);
    markCausalField(state, 'maxHealth', sequence);
  }
  if (event.currentHealth !== undefined) {
    state.crawler.condition.currentHealth = Number(event.currentHealth);
    markCausalField(state, 'currentHealth', sequence);
    if (state.crawler.condition.currentHealth > state.crawler.condition.maxHealth) {
      state.crawler.condition.maxHealth = state.crawler.condition.currentHealth;
      markCausalField(state, 'maxHealth', sequence);
    }
  } else if (event.healthDelta !== undefined) {
    state.crawler.condition.currentHealth = Math.min(
      state.crawler.condition.maxHealth,
      Math.max(0, state.crawler.condition.currentHealth + Number(event.healthDelta))
    );
    markCausalField(state, 'currentHealth', sequence);
  }

  if (event.maxMana !== undefined) {
    state.crawler.condition.maxMana = Number(event.maxMana);
    markCausalField(state, 'maxMana', sequence);
  }
  if (event.currentMana !== undefined) {
    state.crawler.condition.currentMana = Number(event.currentMana);
    markCausalField(state, 'currentMana', sequence);
    if (state.crawler.condition.currentMana > state.crawler.condition.maxMana) {
      state.crawler.condition.maxMana = state.crawler.condition.currentMana;
      markCausalField(state, 'maxMana', sequence);
    }
  } else if (event.manaDelta !== undefined) {
    state.crawler.condition.currentMana = Math.min(
      state.crawler.condition.maxMana,
      Math.max(0, state.crawler.condition.currentMana + Number(event.manaDelta))
    );
    markCausalField(state, 'currentMana', sequence);
  }

  if (event.maxStamina !== undefined) {
    state.crawler.condition.maxStamina = Number(event.maxStamina);
    markCausalField(state, 'maxStamina', sequence);
  }
  if (event.currentStamina !== undefined) {
    state.crawler.condition.currentStamina = Number(event.currentStamina);
    markCausalField(state, 'currentStamina', sequence);
    if (state.crawler.condition.currentStamina > state.crawler.condition.maxStamina) {
      state.crawler.condition.maxStamina = state.crawler.condition.currentStamina;
      markCausalField(state, 'maxStamina', sequence);
    }
  } else if (event.staminaDelta !== undefined) {
    state.crawler.condition.currentStamina = Math.min(
      state.crawler.condition.maxStamina,
      Math.max(0, state.crawler.condition.currentStamina + Number(event.staminaDelta))
    );
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
