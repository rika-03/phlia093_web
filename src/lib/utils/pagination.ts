export interface Page<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  size: number;
  total: number;
  url: {
    current: string;
    next?: string;
    prev?: string;
    start: string;
    end: string;
  };
}

export function paginate<T>(
  items: T[],
  options: {
    pageSize: number;
    currentPage: number;
    baseUrl?: string;
  },
): Page<T> {
  const { pageSize, currentPage, baseUrl = "" } = options;
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, currentPage), lastPage);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const data = items.slice(startIndex, endIndex);

  const buildUrl = (pageNum: number) => {
    if (pageNum === 1) {
      return baseUrl || "/";
    }
    return `${baseUrl}/page/${pageNum}/`;
  };

  return {
    data,
    currentPage: page,
    lastPage,
    size: pageSize,
    total,
    url: {
      current: buildUrl(page),
      next: page < lastPage ? buildUrl(page + 1) : undefined,
      prev: page > 1 ? buildUrl(page - 1) : undefined,
      start: buildUrl(1),
      end: buildUrl(lastPage),
    },
  };
}
