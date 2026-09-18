import fs from 'node:fs';
import YAML from 'yaml';
import type { ResearchClaimDocument } from './types/research.ts';

export function parseResearchDocumentContent(content: string, filePathForError?: string): ResearchClaimDocument {
  try {
    const doc = YAML.parse(content);
    if (!doc || typeof doc !== 'object') {
      throw new Error(`Research document${filePathForError ? ` "${filePathForError}"` : ''} must parse to a non-null object.`);
    }
    return doc as ResearchClaimDocument;
  } catch (err) {
    if (err instanceof Error && err.message.includes('must parse to a non-null object')) {
      throw err;
    }
    throw new Error(
      `Research document loader error${filePathForError ? ` in "${filePathForError}"` : ''}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

export function loadResearchDocument(filePath: string): ResearchClaimDocument {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Research document loader error: Could not find file at "${filePath}".`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseResearchDocumentContent(content, filePath);
}
