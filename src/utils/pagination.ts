export function normalizePagination(
  page?: string,
  pageSize?: string,
  defaultPage = 1,
  defaultPageSize = 20,
  maxPageSize = 100,
) {
  const parsedPage = Number(page);
  const parsedPageSize = Number(pageSize);

  return {
    page:
      Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : defaultPage,
    pageSize:
      Number.isInteger(parsedPageSize) && parsedPageSize > 0
        ? Math.min(parsedPageSize, maxPageSize)
        : defaultPageSize,
  };
}
