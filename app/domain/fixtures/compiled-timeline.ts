import type { CrawlerTimelineDocument } from "../types.ts";

export const compiledTimeline: CrawlerTimelineDocument = {
  "schemaVersion": "crawler-timeline/v2",
  "timeline": {
    "id": "tl-compiled-dungeon-crawler-carl",
    "title": "Compiled Crawler Storyline (Floors 1)",
    "story": {
      "id": "dungeon-crawler-carl",
      "title": "World Dungeon Storyline",
      "spoilerScope": {
        "book": 1,
        "floor": 1
      }
    },
    "createdAt": "2026-08-22T05:02:35.979Z",
    "updatedAt": "2026-08-22T05:02:35.979Z"
  },
  "floors": [
    {
      "id": "floor-1",
      "ordinal": 1,
      "title": "First Floor",
      "book": 1,
      "bookTitle": "Dungeon Crawler Carl",
      "startSequence": 1,
      "endSequence": 19
    }
  ],
  "sources": [
    {
      "id": "src-book-1",
      "kind": "official-text",
      "trust": "primary",
      "title": "Dungeon Crawler Carl, Book 1",
      "url": "https://www.mattdinniman.com/",
      "citationStyle": "Chapter {chapter}"
    },
    {
      "id": "src-wiki-carl-floor-1",
      "kind": "wiki",
      "trust": "corroborating",
      "title": "Carl/Floor 1",
      "url": "https://dungeon-crawler-carl.fandom.com/wiki/Carl/Floor_1"
    },
    {
      "id": "src-wiki-floor-1-achievements",
      "kind": "wiki",
      "trust": "corroborating",
      "title": "Floor 1 Achievements",
      "url": "https://dungeon-crawler-carl.fandom.com/wiki/Floor_1_Achievements"
    },
    {
      "id": "src-wiki-carl-inventory",
      "kind": "wiki",
      "trust": "corroborating",
      "title": "Carl/Inventory",
      "url": "https://dungeon-crawler-carl.fandom.com/wiki/Carl/Inventory"
    },
    {
      "id": "src-reddit-inventory-list",
      "kind": "discussion",
      "trust": "candidate",
      "title": "Carl's inventory list discussion",
      "url": "https://www.reddit.com/r/DungeonCrawlerCarl/comments/1togyb2/carls_inventory_list/"
    }
  ],
  "initialState": {
    "crawler": {
      "name": "CARL G.",
      "level": 1,
      "race": "HUMAN",
      "class": "SCOUT",
      "xp": 0,
      "maxXp": 1000,
      "attributes": {
        "Strength": 10,
        "Dexterity": 10,
        "Constitution": 10,
        "Intelligence": 10,
        "Charisma": 10
      },
      "condition": {
        "currentHealth": 100,
        "maxHealth": 100,
        "currentMana": 50,
        "maxMana": 50,
        "currentStamina": 50,
        "maxStamina": 50
      }
    },
    "inventory": [],
    "achievements": [],
    "skills": [],
    "quests": [],
    "entitlements": []
  },
  "events": [
    {
      "id": "evt-f1-001-entered",
      "sequence": 1,
      "type": "NarrativeEvent",
      "kind": "floor-entered",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 1
      },
      "summary": "Carl enters the First Floor with Donut.",
      "evidence": [
        {
          "sourceId": "src-book-1",
          "locator": {
            "chapter": 1
          },
          "confidence": "confirmed"
        }
      ]
    },
    {
      "id": "evt-f1-002-empty-pockets",
      "sequence": 2,
      "type": "AchievementUnlocked",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 2
      },
      "summary": "Carl receives the Empty Pockets Achievement.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Entering the Dungeon"
          },
          "confidence": "corroborated"
        }
      ],
      "achievement": {
        "id": "achievement-empty-pockets",
        "title": "Empty Pockets Achievement",
        "reward": [
          {
            "kind": "box",
            "boxType": "adventurer",
            "rarity": "bronze"
          }
        ]
      }
    },
    {
      "id": "evt-f1-003-no-pants",
      "sequence": 3,
      "type": "AchievementUnlocked",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 2
      },
      "summary": "Carl receives the Why Aren't You Wearing Pants? Achievement.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Entering the Dungeon"
          },
          "confidence": "corroborated"
        }
      ],
      "achievement": {
        "id": "achievement-why-no-pants",
        "title": "Why Aren't You Wearing Pants? Achievement",
        "reward": [
          {
            "kind": "box",
            "boxType": "apparel",
            "rarity": "gold"
          }
        ]
      }
    },
    {
      "id": "evt-f1-004-unarmed-combat",
      "sequence": 4,
      "type": "AchievementUnlocked",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 2
      },
      "summary": "Carl receives the Unarmed Combat Achievement.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Entering the Dungeon"
          },
          "confidence": "corroborated"
        }
      ],
      "achievement": {
        "id": "achievement-unarmed-combat",
        "title": "Unarmed Combat Achievement",
        "reward": [
          {
            "kind": "box",
            "boxType": "weapon",
            "rarity": "bronze"
          }
        ]
      }
    },
    {
      "id": "evt-f1-005-goblin-pass",
      "sequence": 5,
      "type": "PermanentEntitlementGranted",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 5
      },
      "summary": "Carl receives the Goblin Pass Tattoo.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "entitlement": {
        "id": "entitlement-goblin-pass-tattoo",
        "name": "Goblin Pass Tattoo",
        "location": "left inner forearm"
      }
    },
    {
      "id": "evt-f1-006-trollskin-shirt",
      "sequence": 6,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 6
      },
      "summary": "Carl acquires the Enchanted Trollskin Shirt of Pummeling.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-trollskin-shirt",
        "itemId": "item-trollskin-shirt-of-pummeling",
        "name": "Enchanted Trollskin Shirt of Pummeling",
        "category": "equipment",
        "slot": "UNDERSHIRT",
        "rarity": "common",
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-007-nightgaunt-cloak",
      "sequence": 7,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 6
      },
      "summary": "Carl acquires the Enchanted Nightgaunt Cloak of Stoutness.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-nightgaunt-cloak",
        "itemId": "item-nightgaunt-cloak-of-stoutness",
        "name": "Enchanted Nightgaunt Cloak of Stoutness",
        "category": "equipment",
        "slot": "NECK",
        "rarity": "common",
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-008-toe-ring",
      "sequence": 8,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 6
      },
      "summary": "Carl acquires the Enchanted Toe Ring of the Splatter Skunk.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-toe-ring",
        "itemId": "item-toe-ring-of-splatter-skunk",
        "name": "Enchanted Toe Ring of the Splatter Skunk",
        "category": "equipment",
        "slot": "FEET",
        "rarity": "common",
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-009-first-magic-gear",
      "sequence": 9,
      "type": "AchievementUnlocked",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 6
      },
      "summary": "Carl earns Oooh, Magic after first equipping magical gear.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Dungeon Crawling"
          },
          "confidence": "corroborated"
        }
      ],
      "achievement": {
        "id": "achievement-oooh-magic",
        "title": "Oooh, Magic Achievement",
        "reward": [
          {
            "kind": "box",
            "boxType": "adventurer",
            "rarity": "bronze"
          }
        ]
      }
    },
    {
      "id": "evt-f1-010-silver-ring-plus-1-con",
      "sequence": 10,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 9
      },
      "summary": "Carl acquires a Silver Ring of +1 CON.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-silver-ring-plus-1-con",
        "itemId": "item-silver-ring-plus-1-con",
        "name": "Silver Ring of +1 CON",
        "category": "equipment",
        "slot": "RING",
        "rarity": "common",
        "stats": {
          "Constitution": 1
        },
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-011-shade-gnoll-kneepads",
      "sequence": 11,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 12
      },
      "summary": "Carl acquires the Enchanted Spiked Kneepads of the Shade Gnoll Riot Forces after the Hoarder battle.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-shade-gnoll-kneepads",
        "itemId": "item-spiked-kneepads-shade-gnoll",
        "name": "Enchanted Spiked Kneepads of the Shade Gnoll Riot Forces",
        "category": "equipment",
        "slot": "KNEES",
        "rarity": "common",
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-012-goblin-copper-chopper",
      "sequence": 12,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 17
      },
      "summary": "Carl acquires the Goblin Copper Chopper.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-goblin-copper-chopper",
        "itemId": "item-goblin-copper-chopper",
        "name": "Goblin Copper Chopper",
        "category": "vehicle",
        "rarity": "common",
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-013-desperado-pass",
      "sequence": 13,
      "type": "PermanentEntitlementGranted",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 19
      },
      "summary": "Carl receives the Desperado Pass Tattoo.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "entitlement": {
        "id": "entitlement-desperado-pass-tattoo",
        "name": "Desperado Pass Tattoo",
        "location": "neck"
      }
    },
    {
      "id": "evt-f1-014-silver-ring-plus-2-con",
      "sequence": 14,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 19
      },
      "summary": "Carl acquires a Silver Ring of +2 CON.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-silver-ring-plus-2-con",
        "itemId": "item-silver-ring-plus-2-con",
        "name": "Silver Ring of +2 CON",
        "category": "equipment",
        "slot": "RING",
        "rarity": "common",
        "stats": {
          "Constitution": 2
        },
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-015-boom",
      "sequence": 15,
      "type": "AchievementUnlocked",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 19
      },
      "summary": "Carl earns Boom! for his first explosion.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Combat"
          },
          "confidence": "corroborated"
        }
      ],
      "achievement": {
        "id": "achievement-boom",
        "title": "Boom! Achievement",
        "reward": [
          {
            "kind": "box",
            "boxType": "goblin",
            "rarity": "silver"
          }
        ]
      }
    },
    {
      "id": "evt-f1-016-war-gauntlet",
      "sequence": 16,
      "type": "ItemAcquired",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 25
      },
      "summary": "Carl acquires the Enchanted War Gauntlet of the Exalted Grull.",
      "evidence": [
        {
          "sourceId": "src-wiki-carl-floor-1",
          "locator": {
            "section": "Gear Gained"
          },
          "confidence": "corroborated"
        }
      ],
      "item": {
        "instanceId": "inst-f1-war-gauntlet",
        "itemId": "item-war-gauntlet-exalted-grull",
        "name": "Enchanted War Gauntlet of the Exalted Grull",
        "category": "equipment",
        "slot": "WRISTS",
        "rarity": "common",
        "quantity": {
          "known": true,
          "value": 1
        },
        "sourceDescription": "First Floor"
      }
    },
    {
      "id": "evt-f1-017-podophilia",
      "sequence": 17,
      "type": "AchievementUnlocked",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 25
      },
      "summary": "Carl earns Podophilia! for crushing an opponent with his bare feet.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Combat"
          },
          "confidence": "corroborated"
        }
      ],
      "achievement": {
        "id": "achievement-podophilia",
        "title": "Podophilia! Achievement",
        "reward": [
          {
            "kind": "box",
            "boxType": "shoe",
            "rarity": "gold"
          }
        ]
      }
    },
    {
      "id": "evt-f1-018-battlefield-construction",
      "sequence": 18,
      "type": "AchievementUnlocked",
      "position": {
        "floor": 1,
        "book": 1,
        "chapter": 30
      },
      "summary": "Carl earns Battlefield Construction for deploying a crafted structure in battle.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Combat"
          },
          "confidence": "corroborated"
        }
      ],
      "achievement": {
        "id": "achievement-battlefield-construction",
        "title": "Battlefield Construction Achievement",
        "reward": [
          {
            "kind": "box",
            "boxType": "mechanic",
            "rarity": "silver"
          }
        ]
      }
    },
    {
      "id": "evt-f1-019-exit",
      "sequence": 19,
      "type": "NarrativeEvent",
      "kind": "floor-exited",
      "position": {
        "floor": 1,
        "book": 1
      },
      "summary": "Carl reaches the stairs and completes the First Floor.",
      "evidence": [
        {
          "sourceId": "src-wiki-floor-1-achievements",
          "locator": {
            "section": "Achievements for Dungeon Crawling"
          },
          "confidence": "corroborated"
        }
      ]
    }
  ]
};
