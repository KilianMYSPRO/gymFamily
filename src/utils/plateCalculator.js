export const calculatePlates = (targetWeight, barWeight = 20) => {
    if (!targetWeight || targetWeight <= barWeight) return [];

    const weightPerSide = (targetWeight - barWeight) / 2;
    const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const result = [];

    let remainingWeight = weightPerSide;

    for (const plate of plates) {
        while (remainingWeight >= plate) {
            result.push(plate);
            remainingWeight -= plate;
            // Handle floating point precision issues
            remainingWeight = Math.round(remainingWeight * 100) / 100;
        }
    }

    return result;
};
