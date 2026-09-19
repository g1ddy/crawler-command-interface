import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import type { ResearchClaimDocument, ModelingDecisionDocument } from './types/research.ts';
import {
  validateResearchClaimDocument,
  validateModelingDecisionDocument
} from './research-validator.ts';

export function parseResearchClaimDocument(content: string): ResearchClaimDocument {
  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new Error(`Research loader error: Invalid YAML document. ${(err as Error).message}`);
  }

  const validation = validateResearchClaimDocument(doc);
  if (!validation.valid) {
    throw new Error(
      `Research claim document validation failed:\n  - ${validation.errors.join('\n  - ')}`
    );
  }

  return doc as ResearchClaimDocument;
}

export function loadResearchClaimDocument(filePath: string): ResearchClaimDocument {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Research loader error: Could not find file "${resolvedPath}".`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf8');
  return parseResearchClaimDocument(content);
}

export function parseModelingDecisionDocument(content: string): ModelingDecisionDocument {
  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new Error(`Modeling decision loader error: Invalid YAML document. ${(err as Error).message}`);
  }

  const validation = validateModelingDecisionDocument(doc);
  if (!validation.valid) {
    throw new Error(
      `Modeling decision document validation failed:\n  - ${validation.errors.join('\n  - ')}`
    );
  }

  return doc as ModelingDecisionDocument;
}

export function loadModelingDecisionDocument(filePath: string): ModelingDecisionDocument {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Modeling decision loader error: Could not find file "${resolvedPath}".`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf8');
  return parseModelingDecisionDocument(content);
}
