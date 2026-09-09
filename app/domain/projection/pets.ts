import type {
  CrawlerState,
  Pet,
  PetBondState,
  PetClassification,
  PetHostility,
  PetOrigin,
  PetSpec,
} from '../types.ts';

export function applyPetAcquired(state: CrawlerState, event: Record<string, unknown>): void {
  const petSpec = event.pet as PetSpec | undefined;
  if (!petSpec || !petSpec.petId) return;

  if (!state.pets) {
    state.pets = [];
  }

  const existingIndex = state.pets.findIndex((p) => p.petId === petSpec.petId);
  const newPet: Pet = {
    petId: petSpec.petId,
    name: petSpec.name,
    species: petSpec.species,
    title: petSpec.title,
    origin: petSpec.origin as PetOrigin,
    classification: petSpec.classification as PetClassification,
    hostility: petSpec.hostility as PetHostility,
    bondState: petSpec.bondState as PetBondState,
    bondHolderCrawlerId: petSpec.bondHolderCrawlerId,
  };

  if (existingIndex >= 0) {
    state.pets[existingIndex] = { ...state.pets[existingIndex], ...newPet };
  } else {
    state.pets.push(newPet);
  }
}

export function applyPetHostilityChanged(state: CrawlerState, event: Record<string, unknown>): void {
  const petId = event.petId as string | undefined;
  const hostility = event.hostility as PetHostility | undefined;
  if (!petId || !hostility || !state.pets) return;

  const pet = state.pets.find((p) => p.petId === petId);
  if (pet) {
    pet.hostility = hostility;
  }
}

export function applyPetBonded(state: CrawlerState, event: Record<string, unknown>): void {
  const petId = event.petId as string | undefined;
  const bondHolderCrawlerId = event.bondHolderCrawlerId as string | undefined;
  const name = event.name as string | undefined;
  const title = event.title as string | undefined;
  if (!petId || !bondHolderCrawlerId || !state.pets) return;

  const pet = state.pets.find((p) => p.petId === petId);
  if (pet) {
    pet.bondState = 'bonded';
    pet.bondHolderCrawlerId = bondHolderCrawlerId;
    if (name !== undefined) {
      pet.name = name;
    }
    if (title !== undefined) {
      pet.title = title;
    }
  }
}

export function applyPetClassificationChanged(state: CrawlerState, event: Record<string, unknown>): void {
  const petId = event.petId as string | undefined;
  const classification = event.classification as PetClassification | undefined;
  if (!petId || !classification || !state.pets) return;

  const pet = state.pets.find((p) => p.petId === petId);
  if (pet) {
    pet.classification = classification;
  }
}
