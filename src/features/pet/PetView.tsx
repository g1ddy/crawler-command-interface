"use client";

import React from "react";
import { Panel } from "../../shared/ui/Panel.tsx";
import {
  type DerivedPetPresentation,
  type PetBondState,
  type PetHostilityState,
} from "./public.ts";
import styles from "./PetView.module.css";

export function PetView({
  presentation,
}: {
  presentation: DerivedPetPresentation;
}) {
  const petPresentation = presentation;

  const getBondTagClass = (state: PetBondState) => {
    if (state === "bonded") return styles.bondedTag;
    if (state === "unbonded") return styles.unbondedTag;
    return styles.unknownTag;
  };

  const getHostilityTagClass = (state: PetHostilityState) => {
    if (state === "hostile") return styles.hostileTag;
    if (state === "non-hostile") return styles.nonHostileTag;
    return styles.unknownTag;
  };

  return (
    <section className={styles.viewContent}>
      <header className={styles.title}>
        <div>
          <p className={styles.eyebrow}>PET & DUNGEON FAMILIARS</p>
          <h1>PETS</h1>
        </div>
        {petPresentation.hasPets && (
          <b className={styles.petBadge}>{petPresentation.badgeLabel}</b>
        )}
      </header>

      {petPresentation.hasPets ? (
        <div className={styles.petList}>
          {petPresentation.pets.map((pet) => (
            <Panel
              key={pet.petId}
              title={`PET · ${pet.displayName.toUpperCase()}`}
              ariaLabel={`Pet ${pet.displayName}`}
            >
              <header className={styles.petHeader}>
                <div>
                  <div className={styles.petIdentity}>
                    <h2 className={styles.petName}>{pet.displayName}</h2>
                    {pet.formattedTitle && (
                      <span className={styles.petTitle}>{pet.formattedTitle}</span>
                    )}
                  </div>
                  <p className={styles.speciesSubtext}>{pet.speciesLabel}</p>
                </div>
                <div className={styles.statusTags}>
                  <span
                    className={`${styles.statusTag} ${getBondTagClass(pet.bondState)}`}
                  >
                    {pet.bondStateLabel}
                  </span>
                  <span
                    className={`${styles.statusTag} ${getHostilityTagClass(
                      pet.hostilityState,
                    )}`}
                  >
                    {pet.hostilityLabel}
                  </span>
                </div>
              </header>

              <div className={styles.petDetailsGrid}>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>ORIGIN</span>
                  <b className={styles.fieldValue}>{pet.originValueFormatted}</b>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>CLASSIFICATION</span>
                  <b className={styles.fieldValue}>{pet.classificationValueFormatted}</b>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>BOND HOLDER</span>
                  <b
                    className={
                      pet.bondHolderCrawlerId
                        ? styles.fieldValueAccent
                        : styles.fieldValueSubdued
                    }
                  >
                    {pet.bondHolderLabel}
                  </b>
                </div>
                {pet.formattedLevel && (
                  <div className={styles.detailField}>
                    <span className={styles.fieldLabel}>LEVEL</span>
                    <b className={styles.fieldValue}>{pet.formattedLevel}</b>
                  </div>
                )}
                {pet.formattedDeployment && (
                  <div className={styles.detailField}>
                    <span className={styles.fieldLabel}>DEPLOYMENT</span>
                    <b className={styles.fieldValue}>{pet.formattedDeployment}</b>
                  </div>
                )}
                {pet.conditionStatus && (
                  <div className={styles.detailField}>
                    <span className={styles.fieldLabel}>CONDITION</span>
                    <b className={styles.fieldValue}>{pet.conditionStatus}</b>
                  </div>
                )}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <p className={styles.unavailableText}>
          No pet state is available at this replay sequence.
        </p>
      )}
    </section>
  );
}
