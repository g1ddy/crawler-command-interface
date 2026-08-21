import { CrawlerEvent, CrawlerState, Snapshot } from './types.ts';

export function createInitialState(): CrawlerState {
  return {
    sequence: 0,
    occurredAt: '04:00:00',
    crawler: {
      name: 'CARL G.',
      level: 42,
      race: 'PRIMAL',
      class: 'SCOUT',
      xp: 21500,
      maxXp: 74000,
      availableAttributePoints: 0,
      attributes: {
        Strength: 24,
        Dexterity: 34,
        Constitution: 30,
        Intelligence: 18,
        Charisma: 20,
      },
      permanentAttributeModifiers: {
        Strength: 0,
        Dexterity: 0,
        Constitution: 0,
        Intelligence: 0,
        Charisma: 0,
      },
      condition: {
        currentHealth: 3100,
        maxHealth: 4200,
        currentMana: 800,
        maxMana: 1360,
        currentStamina: 200,
        maxStamina: 280,
      },
    },
    inventory: [],
    equippedSlots: {
      HEAD: null,
      FACE: null,
      NECK: null,
      TORSO: null,
      WRISTS: null,
      RING: null,
      WAIST: null,
      LEGS: null,
      FEET: null,
      SPECIAL: null,
    },
    effects: [],
    skills: [],
    hotlist: [],
    quests: [],
    achievements: [],
    broadcast: {
      viewers: 42100,
      viewerDelta: '+0%',
      followers: 3520,
      fameRank: '#21',
      sponsorInterest: false,
    },
    recentLogs: [],
  };
}

export function applyEvent(currentState: CrawlerState, event: CrawlerEvent): CrawlerState {
  // Deep clone state to ensure pure transformation
  const state: CrawlerState = JSON.parse(JSON.stringify(currentState));
  state.sequence = event.sequence;
  state.occurredAt = event.occurred_at;

  // Add log entry
  state.recentLogs = [
    {
      sequence: event.sequence,
      timestamp: event.occurred_at,
      message: event.summary,
      category: event.category,
    },
    ...state.recentLogs,
  ].slice(0, 30);

  switch (event.type) {
    case 'ItemAcquired': {
      const existing = state.inventory.find((i) => i.instanceId === event.itemInstanceId);
      if (existing) {
        existing.quantity += event.quantity;
      } else {
        state.inventory.push({
          instanceId: event.itemInstanceId,
          itemId: event.itemId,
          name: event.name,
          icon: event.icon,
          rarity: event.rarity,
          category: event.category,
          slot: event.slot,
          quantity: event.quantity,
          maxStack: event.maxStack,
          value: event.value,
          stats: event.stats,
          description: event.description,
          durability: event.durability,
          acquiredAtSequence: event.sequence,
          source: event.source,
          isLocked: false,
          isEquipped: false,
        });
      }
      break;
    }

    case 'ItemQuantityChanged': {
      const item = state.inventory.find((i) => i.instanceId === event.itemInstanceId);
      if (item) {
        item.quantity += event.delta;
        if (item.quantity <= 0) {
          state.inventory = state.inventory.filter((i) => i.instanceId !== event.itemInstanceId);
        }
      }
      break;
    }

    case 'ItemEquipped': {
      // Unequip current slot occupant if present
      const currentEquippedId = state.equippedSlots[event.slot];
      if (currentEquippedId) {
        const currentItem = state.inventory.find((i) => i.instanceId === currentEquippedId);
        if (currentItem) currentItem.isEquipped = false;
      }

      state.equippedSlots[event.slot] = event.itemInstanceId;
      const targetItem = state.inventory.find((i) => i.instanceId === event.itemInstanceId);
      if (targetItem) {
        targetItem.isEquipped = true;
      }
      break;
    }

    case 'ItemUnequipped': {
      if (state.equippedSlots[event.slot] === event.itemInstanceId) {
        state.equippedSlots[event.slot] = null;
      }
      const item = state.inventory.find((i) => i.instanceId === event.itemInstanceId);
      if (item) {
        item.isEquipped = false;
      }
      break;
    }

    case 'ItemConsumed': {
      const item = state.inventory.find((i) => i.instanceId === event.itemInstanceId);
      if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
          state.inventory = state.inventory.filter((i) => i.instanceId !== event.itemInstanceId);
        }
      }
      if (event.healthRestored) {
        state.crawler.condition.currentHealth = Math.min(
          state.crawler.condition.maxHealth,
          state.crawler.condition.currentHealth + event.healthRestored
        );
      }
      if (event.manaRestored) {
        state.crawler.condition.currentMana = Math.min(
          state.crawler.condition.maxMana,
          state.crawler.condition.currentMana + event.manaRestored
        );
      }
      break;
    }

    case 'ItemDiscarded': {
      state.inventory = state.inventory.filter((i) => i.instanceId !== event.itemInstanceId);
      for (const slot in state.equippedSlots) {
        if (state.equippedSlots[slot] === event.itemInstanceId) {
          state.equippedSlots[slot] = null;
        }
      }
      break;
    }

    case 'AttributeModified': {
      if (event.source === 'allocation') {
        state.crawler.attributes[event.attribute] += event.delta;
      } else if (event.source === 'permanent_modifier') {
        state.crawler.permanentAttributeModifiers[event.attribute] += event.delta;
      }
      break;
    }

    case 'EffectApplied': {
      // Remove previous effect with same id if replacing
      state.effects = state.effects.filter((e) => e.effectId !== event.effectId);
      state.effects.push({
        effectId: event.effectId,
        name: event.name,
        type: event.effectType,
        icon: event.icon,
        durationSeconds: event.durationSeconds,
        appliedAtSequence: event.sequence,
        description: event.description,
        statModifiers: event.statModifiers,
      });
      break;
    }

    case 'EffectExpired': {
      state.effects = state.effects.filter((e) => e.effectId !== event.effectId);
      break;
    }

    case 'SkillGranted': {
      if (!state.skills.some((s) => s.skillId === event.skillId)) {
        state.skills.push({
          skillId: event.skillId,
          name: event.name,
          icon: event.icon,
          rank: event.rank,
          description: event.description,
          cooldown: event.cooldown,
          category: event.category,
          cost: event.cost,
          synergies: event.synergies,
        });
        if (state.hotlist.length < 10) {
          state.hotlist.push(event.skillId);
        }
      }
      break;
    }

    case 'XpAwarded': {
      state.crawler.xp = event.newTotalXp;
      if (event.levelUp) {
        state.crawler.level = event.levelUp;
        state.crawler.availableAttributePoints += 5;
      }
      break;
    }

    case 'QuestUpdated': {
      const questIndex = state.quests.findIndex((q) => q.questId === event.questId);
      const updatedQuest = {
        questId: event.questId,
        title: event.title,
        urgency: event.urgency,
        goals: event.goals,
        rewards: event.rewards,
        status: event.status,
      };
      if (questIndex >= 0) {
        state.quests[questIndex] = updatedQuest;
      } else {
        state.quests.push(updatedQuest);
      }
      break;
    }

    case 'AchievementUnlocked': {
      if (!state.achievements.some((a) => a.achievementId === event.achievementId)) {
        state.achievements.push({
          achievementId: event.achievementId,
          title: event.title,
          description: event.description,
          rewards: event.rewards,
          icon: event.icon,
          unlockedAtSequence: event.sequence,
        });
      }
      break;
    }

    case 'BroadcastUpdated': {
      state.broadcast = {
        viewers: event.viewers,
        viewerDelta: event.viewerDelta,
        followers: event.followers,
        fameRank: event.fameRank,
        sponsorInterest: event.sponsorInterest,
      };
      break;
    }

    case 'ConditionChanged': {
      if (event.currentHealth !== undefined) state.crawler.condition.currentHealth = event.currentHealth;
      if (event.maxHealth !== undefined) state.crawler.condition.maxHealth = event.maxHealth;
      if (event.currentMana !== undefined) state.crawler.condition.currentMana = event.currentMana;
      if (event.maxMana !== undefined) state.crawler.condition.maxMana = event.maxMana;
      if (event.currentStamina !== undefined) state.crawler.condition.currentStamina = event.currentStamina;
      if (event.maxStamina !== undefined) state.crawler.condition.maxStamina = event.maxStamina;
      break;
    }
  }

  return state;
}

export function projectState(
  events: CrawlerEvent[],
  targetSequence: number,
  snapshots: Snapshot[] = []
): CrawlerState {
  if (events.length === 0) return createInitialState();

  const minSeq = events[0].sequence;
  const maxSeq = events[events.length - 1].sequence;
  const clampedTarget = Math.max(minSeq, Math.min(targetSequence, maxSeq));

  // Find nearest snapshot <= targetSequence
  let baseState: CrawlerState = createInitialState();
  let startSequence = minSeq;

  const validSnapshots = snapshots
    .filter((s) => s.sequence <= clampedTarget)
    .sort((a, b) => b.sequence - a.sequence);

  if (validSnapshots.length > 0) {
    baseState = JSON.parse(JSON.stringify(validSnapshots[0].state));
    startSequence = validSnapshots[0].sequence + 1;
  }

  // Replay events from startSequence to clampedTarget
  let currentState = baseState;
  const eventsToApply = events.filter(
    (e) => e.sequence >= startSequence && e.sequence <= clampedTarget
  );

  for (const event of eventsToApply) {
    currentState = applyEvent(currentState, event);
  }

  return currentState;
}
