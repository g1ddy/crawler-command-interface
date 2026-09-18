import type { Pet } from "../../../app/domain/types.ts";

export type PetHostilityState = "hostile" | "non-hostile" | "unknown";
export type PetBondState = "bonded" | "unbonded" | "unknown";

export interface DerivedPetItem {
  petId: string;
  displayName: string;
  hasExplicitName: boolean;
  species: string;
  speciesLabel: string;
  origin: string;
  originValueFormatted: string;
  classification: string;
  classificationValueFormatted: string;
  hostilityState: PetHostilityState;
  hostilityLabel: string;
  bondState: PetBondState;
  bondStateLabel: string;
  bondHolderCrawlerId?: string;
  bondHolderLabel: string;
  title?: string;
  formattedTitle?: string;
  level?: number;
  formattedLevel?: string;
  deployment?: string;
  formattedDeployment?: string;
  conditionStatus?: string;
}

export interface DerivedPetPresentation {
  hasPets: boolean;
  petCount: number;
  badgeLabel: string;
  status: "established" | "unavailable";
  pets: DerivedPetItem[];
}

/** Derives the narrow Pet surface from the selected temporal Pet state. */
export function derivePetPresentation({
  pets = [],
}: {
  pets?: Pet[];
}): DerivedPetPresentation {
  const activePets = pets || [];
  const petCount = activePets.length;
  const hasPets = petCount > 0;
  const badgeLabel = hasPets
    ? `${petCount} ${petCount === 1 ? "PET" : "PETS"}`
    : "NO PETS";

  const derivedPets: DerivedPetItem[] = activePets.map((pet) => {
    const displayName = pet.name ?? pet.species ?? "UNKNOWN PET";
    const hasExplicitName = Boolean(pet.name);

    const rawHostility = pet.hostility as string | undefined;
    let hostilityState: PetHostilityState = "unknown";
    let hostilityLabel = "UNKNOWN";

    if (rawHostility === "hostile") {
      hostilityState = "hostile";
      hostilityLabel = "HOSTILE";
    } else if (rawHostility === "non-hostile") {
      hostilityState = "non-hostile";
      hostilityLabel = "NON-HOSTILE";
    } else if (typeof rawHostility === "string" && rawHostility.trim().length > 0) {
      hostilityLabel = rawHostility.toUpperCase();
    }

    const rawBondState = pet.bondState as string | undefined;
    let bondState: PetBondState = "unknown";
    let bondStateLabel = "UNKNOWN";

    if (rawBondState === "bonded") {
      bondState = "bonded";
      bondStateLabel = "BONDED";
    } else if (rawBondState === "unbonded") {
      bondState = "unbonded";
      bondStateLabel = "UNBONDED";
    } else if (typeof rawBondState === "string" && rawBondState.trim().length > 0) {
      bondStateLabel = rawBondState.toUpperCase();
    }

    let bondHolderLabel = "UNKNOWN";
    if (pet.bondHolderCrawlerId) {
      bondHolderLabel = pet.bondHolderCrawlerId;
    } else if (bondState === "unbonded") {
      bondHolderLabel = "NONE (UNBONDED)";
    } else if (bondState === "bonded") {
      bondHolderLabel = "UNKNOWN (BONDED)";
    } else {
      bondHolderLabel = "UNKNOWN";
    }

    const origin = pet.origin ?? "UNKNOWN";
    const originValueFormatted = typeof pet.origin === "string" && pet.origin.trim().length > 0
      ? pet.origin.toUpperCase()
      : "UNKNOWN";

    const classification = pet.classification ?? "UNKNOWN";
    const classificationValueFormatted = typeof pet.classification === "string" && pet.classification.trim().length > 0
      ? pet.classification.toUpperCase()
      : "UNKNOWN";

    return {
      petId: pet.petId ?? "unknown-pet-id",
      displayName,
      hasExplicitName,
      species: pet.species ?? "unknown",
      speciesLabel: pet.species ? `Species: ${pet.species}` : "Species: unknown",
      origin,
      originValueFormatted,
      classification,
      classificationValueFormatted,
      hostilityState,
      hostilityLabel,
      bondState,
      bondStateLabel,
      bondHolderCrawlerId: pet.bondHolderCrawlerId,
      bondHolderLabel,
      title: pet.title,
      formattedTitle: pet.title ? `«${pet.title}»` : undefined,
      level: pet.level,
      formattedLevel: pet.level !== undefined ? `Level ${pet.level}` : undefined,
      deployment: pet.deployment,
      formattedDeployment: typeof pet.deployment === "string" && pet.deployment.trim().length > 0
        ? pet.deployment.toUpperCase()
        : undefined,
      conditionStatus: pet.condition?.status,
    };
  });

  return {
    hasPets,
    petCount,
    badgeLabel,
    status: hasPets ? "established" : "unavailable",
    pets: derivedPets,
  };
}
