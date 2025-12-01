// SM-2 review algorithm
function sm2(card, quality) {
  let { repetition, interval, easeFactor } = card;

  // quality: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy

  // If user pressed "Again"
  if (quality === 0) {
    repetition = 0;
    interval = 1;
    // EF stays the same
  } else {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    repetition += 1;

    // Update EF using standard SM-2 formula
    easeFactor =
      easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));

    // Minimum EF = 1.3
    if (easeFactor < 1.3) easeFactor = 1.3;
  }

  // Set next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { repetition, interval, easeFactor, nextReview };
}

module.exports = sm2;
