/** 추정 1RM (Epley), weight·reps는 양수 가정 */
export function estimate1RmKg(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function roundToPlate(kg: number, plateUnitKg: number): number {
  if (plateUnitKg <= 0) return kg;
  return Math.round(kg / plateUnitKg) * plateUnitKg;
}
