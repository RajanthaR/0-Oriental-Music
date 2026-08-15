import fs from 'fs';
import path from 'path';

const files = [
  'src/data/ragas.json',
  'src/data/talas.json',
  'src/data/lessons.json',
  'src/data/instruments.json',
  'src/data/cultural-traditions.json',
  'src/data/theatre-traditions.json',
  'src/data/learning-paths.json',
  'src/data/exam-papers.json',
];

const terminologyFile = 'data/terminology-si.json';

const unverifiedMetadata = {
  status: 'Needs Revision',
  reviewer: 'නොදනී / සනාථ වී නැත',
  reviewDate: 'නොදනී / සනාථ වී නැත',
  lastVerifiedDate: 'නොදනී / සනාථ වී නැත',
  changeNotes: 'Publication containment baseline: the previous review metadata is not evidence of a completed review.',
  license: 'නොදනී / සනාථ වී නැත',
  reuseStatus: 'Unknown / Unverified'
};

for (const relPath of files) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item && typeof item === 'object') {
        if ('reviewMetadata' in item) {
          item.reviewMetadata = { ...unverifiedMetadata };
        }
        if ('published' in item) {
          item.published = false;
        }
      }
    }
    fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log('Sanitized:', relPath);
  }
}

const terminologyPath = path.resolve(terminologyFile);
if (fs.existsSync(terminologyPath)) {
  const terms = JSON.parse(fs.readFileSync(terminologyPath, 'utf8'));
  if (Array.isArray(terms)) {
    for (const term of terms) {
      if (term && typeof term === 'object') {
        term.confidence = 'Unverified';
        term.reviewStatus = 'Needs Review';
      }
    }
    fs.writeFileSync(terminologyPath, JSON.stringify(terms, null, 2) + '\n', 'utf8');
    console.log('Sanitized:', terminologyFile);
  }
}
