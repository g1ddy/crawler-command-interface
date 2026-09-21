import type { Pet } from "../../../app/domain/types.ts";
import type {
  PresentationChange,
  PresentationSemantics,
} from "../../presentation/semantic/public.ts";

export type PetHostilityState = "hostile" | "non-hostile" | "unknown";
export type PetBondState = "bonded" | "unbonded" | "unknown";
export type PetPresentationStatus = "not-established" | "established" | "known-empty" | "unknown" | "unavailable";

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
  status: PetPresentationStatus;
  pets: DerivedPetItem[];
}

/** Derives the narrow Pet surface from the selected temporal Pet state. */
export function derivePetPresentation({
  pets,
}: {
  pets?: Pet[];
}): DerivedPetPresentation {
  const activePets = pets ?? [];
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
    if (rawHostility === "hostile") { hostilityState = "hostile"; hostilityLabel = "HOSTILE"; }
    else if (rawHostility === "non-hostile") { hostilityState = "non-hostile"; hostilityLabel = "NON-HOSTILE"; }
    else if (typeof rawHostility === "string" && rawHostility.trim()) hostilityLabel = rawHostility.toUpperCase();

    const rawBondState = pet.bondState as string | undefined;
    let bondState: PetBondState = "unknown";
    let bondStateLabel = "UNKNOWN";
    if (rawBondState === "bonded") { bondState = "bonded"; bondStateLabel = "BONDED"; }
    else if (rawBondState === "unbonded") { bondState = "unbonded"; bondStateLabel = "UNBONDED"; }
    else if (typeof rawBondState === "string" && rawBondState.trim()) bondStateLabel = rawBondState.toUpperCase();

    let bondHolderLabel = "UNKNOWN";
    if (pet.bondHolderCrawlerId) bondHolderLabel = pet.bondHolderCrawlerId;
    else if (bondState === "unbonded") bondHolderLabel = "NONE (UNBONDED)";
    else if (bondState === "bonded") bondHolderLabel = "UNKNOWN (BONDED)";

    const origin = pet.origin ?? "unknown";
    const originValueFormatted = typeof pet.origin === "string" && pet.origin.trim() ? pet.origin.toUpperCase() : "UNKNOWN";
    const classification = pet.classification ?? "unknown";
    const classificationValueFormatted = typeof pet.classification === "string" && pet.classification.trim() ? pet.classification.toUpperCase() : "UNKNOWN";

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
      formattedDeployment: typeof pet.deployment === "string" && pet.deployment.trim() ? pet.deployment.toUpperCase() : undefined,
      conditionStatus: pet.condition?.status,
    };
  });

  return {
    hasPets,
    petCount,
    badgeLabel,
    status: hasPets ? "established" : "known-empty",
    pets: derivedPets,
  };
}

/**
 * Maps Pet status and optional change intent into presentation semantics.
 */
export function mapPetStatusToSemantics(
  petStatus: PetPresentationStatus,
  change?: PresentationChange
): PresentationSemantics {
  switch (petStatus) {
    case "known-empty":
      return { status: "known-empty", affordance: "none" };
    case "established":
      return {
        status: "present",
        ...(change ? { change } : {}),
        affordance: "none",
      };
    case "not-established":
      return { status: "not-established", affordance: "none" };
    case "unavailable":
      return { status: "unavailable", affordance: "none" };
    case "unknown":
    default:
      return { status: "unknown", affordance: "none" };
  }
}
