export function calculate1RM(weight, reps) {
    if (!weight || !reps) return 0;
    if (reps === 1) return weight;
    // Epley Formula: 1RM = w * (1 + r/30)
    return Math.round(weight * (1 + reps / 30));
}

export function getBestSet(sets) {
    let max1RM = 0;
    let bestSet = null;

    sets.forEach(set => {
        const oneRM = calculate1RM(set.weight, set.reps);
        if (oneRM > max1RM) {
            max1RM = oneRM;
            bestSet = { ...set, oneRM };
        }
    });

    return bestSet;
}
