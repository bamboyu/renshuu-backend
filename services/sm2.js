function sm2(card, quality) {
  let { repetition, interval, easeFactor } = card;

  // quality: 0=Again, 1=Hard, 2=Good, 3=Easy

  if (quality === 0) {
    // If called, reset reps.
    repetition = 0;
    interval = 1;
  } else {
    // Passing grades (1, 2, 3)
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      // Repetition >= 2: Apply modifiers based on rating
      if (quality === 1) {
        // Hard: 1.2x multiplier (minimum increase)
        interval = Math.round(interval * 1.2);
      } else if (quality === 2) {
        // Good: Standard EF multiplier
        interval = Math.round(interval * easeFactor);
      } else if (quality === 3) {
        // Easy: EF multiplier + Bonus (x1.3)
        interval = Math.round(interval * easeFactor * 1.3);
      }
    }
    repetition += 1;
  }

  // Ease Factor
  easeFactor =
    easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));

  // Minimum EF limit
  if (easeFactor < 1.3) easeFactor = 1.3;

  return { repetition, interval, easeFactor };
}

module.exports = sm2;
