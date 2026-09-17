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
  hostility: "hostile" | "non-hostile";
  isHostile: boolean;
  hostilityLabel: string;
  bondState: "unbonded" | "bonded";
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
    const isHostile = pet.hostility === "hostile";
    const isBonded = pet.bondState === "bonded";
    const displayName = pet.name ?? pet.species;
    const hasExplicitName = Boolean(pet.name);

    return {
      petId: pet.petId,
      displayName,
      hasExplicitName,
      species: pet.species,
      speciesLabel: `Species: ${pet.species}`,
      origin: pet.origin,
      originValueFormatted: pet.origin.toUpperCase(),
      classification: pet.classification,
      classificationValueFormatted: pet.classification.toUpperCase(),
      hostility: pet.hostility,
      isHostile,
      hostilityLabel: isHostile ? "HOSTILE" : "NON-HOSTILE",
      bondState: pet.bondState,
      isBonded,
      bondStateLabel: isBonded ? "BONDED" : "UNBONDED",
      bondHolderCrawlerId: pet.bondHolderCrawlerId,
      bondHolderLabel: pet.bondHolderCrawlerId
        ? pet.bondHolderCrawlerId
        : "NONE (UNBONDED)",
      title: pet.title,
      formattedTitle: pet.title ? `«${pet.title}»` : undefined,
      level: pet.level,
      formattedLevel: pet.level !== undefined ? `Level ${pet.level}` : undefined,
      deployment: pet.deployment,
      formattedDeployment: pet.deployment ? pet.deployment.toUpperCase() : undefined,
      conditionStatus: pet.condition?.status,
    };
  });

  return {
    hasPets,
    petCount,
    badgeLabel,
    pets: derivedPets,
  };
}
