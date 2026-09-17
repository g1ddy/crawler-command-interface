import type { Pet } from "../../../app/domain/types.ts";

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
  hostility?: string;
  isHostile: boolean;
  hostilityLabel: string;
  bondState?: string;
  isBonded: boolean;
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
  pets?: Partial<Pet>[];
}): DerivedPetPresentation {
  const activePets = pets || [];
  const petCount = activePets.length;
  const hasPets = petCount > 0;
  const badgeLabel = hasPets
    ? `${petCount} ${petCount === 1 ? "PET" : "PETS"}`
    : "NO PETS";

  const derivedPets: DerivedPetItem[] = activePets.map((pet) => {
    const isHostile = pet.hostility === "hostile";
    const isBonded = pet.bondState === "bonded";
    const displayName = pet.name ?? pet.species ?? pet.petId ?? "UNKNOWN PET";
    const hasExplicitName = Boolean(pet.name);

    const rawHostility: string | undefined = pet.hostility;
    let hostilityLabel = "UNKNOWN";
    if (rawHostility === "hostile") {
      hostilityLabel = "HOSTILE";
    } else if (rawHostility === "non-hostile") {
      hostilityLabel = "NON-HOSTILE";
    } else if (typeof rawHostility === "string" && rawHostility.trim().length > 0) {
      hostilityLabel = rawHostility.toUpperCase();
    }

    const rawBondState: string | undefined = pet.bondState;
    let bondStateLabel = "UNKNOWN";
    if (rawBondState === "bonded") {
      bondStateLabel = "BONDED";
    } else if (rawBondState === "unbonded") {
      bondStateLabel = "UNBONDED";
    } else if (typeof rawBondState === "string" && rawBondState.trim().length > 0) {
      bondStateLabel = rawBondState.toUpperCase();
    }

    const origin = pet.origin ?? "UNSPECIFIED";
    const originValueFormatted = typeof pet.origin === "string" && pet.origin.trim().length > 0
      ? pet.origin.toUpperCase()
      : "UNSPECIFIED";

    const classification = pet.classification ?? "UNSPECIFIED";
    const classificationValueFormatted = typeof pet.classification === "string" && pet.classification.trim().length > 0
      ? pet.classification.toUpperCase()
      : "UNSPECIFIED";

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
      hostility: pet.hostility,
      isHostile,
      hostilityLabel,
      bondState: pet.bondState,
      isBonded,
      bondStateLabel,
      bondHolderCrawlerId: pet.bondHolderCrawlerId,
      bondHolderLabel: pet.bondHolderCrawlerId
        ? pet.bondHolderCrawlerId
        : "NONE (UNBONDED)",
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
