import {
  AssessmentCategory,
  SubIndicatorScore,
  CategoryAverageScore
} from '../types';

/**
 * Calculates the arithmetic mean for an assessment category based on active sub-indicators.
 *
 * Rules:
 * 1. Only sub-indicators with an actual numeric score (including 0.0) participate in the average.
 * 2. 0.0 is included in the average IF AND ONLY IF explicitly selected by the coach.
 * 3. N/O (Not Observed) does NOT count as 0 and does NOT participate in the average.
 * 4. Blank (unscored) does NOT participate in the average.
 * 5. If no items have a numeric score, average is null (rendered as "No score", never "0").
 * 6. Precision: 2 decimal places (e.g. 3.50).
 */
export function calculateCategoryAverage(
  category: AssessmentCategory,
  activeSubIndicatorIds: string[],
  scores: Record<string, SubIndicatorScore> = {}
): CategoryAverageScore {
  // Filter category sub-indicators to only those active/selected for this session
  const applicableIndicators = category.subIndicators.filter((ind) =>
    activeSubIndicatorIds.length === 0 ? true : activeSubIndicatorIds.includes(ind.id)
  );

  let scoredSum = 0;
  let scoredCount = 0;
  let notObservedCount = 0;
  let uncompletedCount = 0;

  for (const ind of applicableIndicators) {
    const entry = scores[ind.id];
    if (!entry) {
      uncompletedCount++;
      continue;
    }

    if (entry.isNotObserved) {
      notObservedCount++;
    } else if (entry.score !== null && entry.score !== undefined && typeof entry.score === 'number') {
      scoredSum += entry.score;
      scoredCount++;
    } else {
      uncompletedCount++;
    }
  }

  const average = scoredCount > 0 ? Number((scoredSum / scoredCount).toFixed(2)) : null;

  return {
    categoryId: category.id,
    categoryName: category.name,
    average,
    scoredCount,
    totalSelectedCount: applicableIndicators.length,
    uncompletedCount,
    notObservedCount
  };
}

/**
 * Format score display for display:
 * If average is null -> "No score"
 * If average is number -> "3.50 / 5"
 */
export function formatCategoryScore(average: number | null): string {
  if (average === null || average === undefined) {
    return 'No score';
  }
  return `${average.toFixed(2)} / 5`;
}

/**
 * Format observed coverage display:
 * "Observed 3 / 4" (with uncompleted alert if blanks remain)
 */
export function formatCoverageBadge(result: CategoryAverageScore): {
  text: string;
  isComplete: boolean;
  hasUncompleted: boolean;
} {
  const observedCount = result.scoredCount + result.notObservedCount;
  const text = `Observed ${observedCount}/${result.totalSelectedCount}`;
  const isComplete = result.uncompletedCount === 0 && result.totalSelectedCount > 0;
  const hasUncompleted = result.uncompletedCount > 0;

  return { text, isComplete, hasUncompleted };
}
