export function normalizeName(name: string) {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
