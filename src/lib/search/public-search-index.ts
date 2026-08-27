/**
 * Repository-facing composition root for the default public search index.
 *
 * The search engine itself (search-engine.ts) is repository-free: it accepts
 * explicit inputs through `SearchDataSource`. This module is the
 * repository-facing layer that constructs those inputs from the content
 * repository at call time, keeping the dependency direction one-way:
 * repository -> engine (filtering) and composition -> both. There is no cycle
 * and no import-time catalog snapshot; every `search()` call re-reads the
 * repository through its per-operation public projections.
 */

import { repository } from "@/lib/data/repository";
import { SearchIndex } from "@/lib/search/search-engine";

const searchIndex = new SearchIndex({
  getFeaturedLessons: () => repository.getLessons().slice(0, 4),
  getPublicSearchCatalogs: () => repository.getPublicSearchCatalogs(),
});

export { searchIndex };
