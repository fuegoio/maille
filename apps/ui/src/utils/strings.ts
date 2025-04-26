function escapeAccents(string: string): string {
  return string.normalize("NFD").replace(/[\u0300-\u036F]/g, "");
}

export function searchCompare(search: string, value: string): boolean {
  const valueUniform = escapeAccents(value).toLowerCase();
  const searchUniform = escapeAccents(search).toLowerCase();
  return valueUniform.includes(searchUniform.toLowerCase());
}
