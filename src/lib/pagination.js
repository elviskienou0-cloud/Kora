export function getPaginationRange(page = 1, pageSize = 20) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.min(
    100,
    Math.max(1, Number(pageSize) || 20)
  )

  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1

  return {
    page: safePage,
    pageSize: safePageSize,
    from,
    to,
  }
}

export function getTotalPages(count = 0, pageSize = 20) {
  const safeCount = Math.max(0, Number(count) || 0)
  const safePageSize = Math.min(
    100,
    Math.max(1, Number(pageSize) || 20)
  )

  return Math.max(1, Math.ceil(safeCount / safePageSize))
}

export function buildPaginatedResult(
  data,
  count,
  page = 1,
  pageSize = 20
) {
  const safePage = Math.max(1, Number(page) || 1)

  const safePageSize = Math.min(
    100,
    Math.max(1, Number(pageSize) || 20)
  )

  const safeCount = Math.max(
    0,
    Number(count) || 0
  )

  return {
    data: Array.isArray(data) ? data : [],
    count: safeCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: getTotalPages(
      safeCount,
      safePageSize
    ),
  }
}