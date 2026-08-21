"use client";
import React from 'react';
import { StatBreakdown } from '../domain/stats';

interface StatInspectorModalProps {
  breakdown: StatBreakdown;
  onClose: () => void;
}

export function StatInspectorModal({ breakdown, onClose }: StatInspectorModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">STAT PROVENANCE & CALCULATION INSPECTOR</p>
            <h2>WHY THIS VALUE? · {breakdown.statName.toUpperCase()}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="total-stat-banner">
          <span>FINAL TOTAL VALUE</span>
          <b>{breakdown.totalValue}</b>
        </div>

        <div className="breakdown-list">
          <div className="breakdown-item">
            <span>Base Character Value</span>
            <b>+{breakdown.baseValue}</b>
          </div>

          {breakdown.permanentModifiers !== 0 && (
            <div className="breakdown-item">
              <span>Permanent Modifiers / Blessings</span>
              <b>+{breakdown.permanentModifiers}</b>
            </div>
          )}

          {breakdown.gearContributions.length > 0 ? (
            <div className="breakdown-section">
              <h3>Equipped Gear Contributions</h3>
              {breakdown.gearContributions.map((gear, idx) => (
                <div key={idx} className="breakdown-item gear-item">
                  <span>
                    [{gear.slot}] {gear.itemName}
                  </span>
                  <b>+{gear.amount}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="breakdown-item empty">
              <span>Equipped Gear Contributions</span>
              <small>None</small>
            </div>
          )}

          {breakdown.activeEffectContributions.length > 0 ? (
            <div className="breakdown-section">
              <h3>Active Status Effect Modifiers</h3>
              {breakdown.activeEffectContributions.map((eff, idx) => (
                <div key={idx} className="breakdown-item effect-item">
                  <span>
                    <i>{eff.icon}</i> {eff.effectName}
                  </span>
                  <b>{eff.amount >= 0 ? `+${eff.amount}` : eff.amount}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="breakdown-item empty">
              <span>Active Status Effect Modifiers</span>
              <small>None</small>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="outline" onClick={onClose}>
            CLOSE INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
}
