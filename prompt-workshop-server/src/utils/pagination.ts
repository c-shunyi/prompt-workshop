export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface NormalizePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
}

export function normalizePagination(
  params: PaginationParams = {},
  options: NormalizePaginationOptions = {},
) {
  const defaultPage = options.defaultPage ?? 1;
  const defaultPageSize = options.defaultPageSize ?? 10;
  const maxPageSize = options.maxPageSize ?? 50;

  const parsedPage = Number(params.page);
  const parsedPageSize = Number(params.pageSize);

  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : defaultPage;
  const pageSize = Number.isInteger(parsedPageSize) && parsedPageSize > 0
    ? Math.min(parsedPageSize, maxPageSize)
    : defaultPageSize;

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}
