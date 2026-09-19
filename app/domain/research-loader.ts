import fs from 'node:fs';
import path from 'node:path';
import type { ResearchClaimDocument } from './types/research.ts';
import { validateResearchClaimDocument } from './research-validator.ts';

export function parseResearchClaimDocument(content: string): ResearchClaimDocument {
  let doc: unknown;
  try {
    doc = JSON.parse(content);
  } catch (err) {
    throw new Error(`Research loader error: Invalid JSON document. ${(err as Error).message}`);
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
