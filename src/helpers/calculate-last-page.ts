export function getLastPage(total: number, perPage: number) {
  return Math.ceil(total / perPage);
}
