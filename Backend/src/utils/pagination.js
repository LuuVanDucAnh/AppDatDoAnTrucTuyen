/**
 * Tính toán thông tin phân trang
 * @param {Object} query - req.query
 * @returns {{ limit, offset, page, sort, order }}
 */
export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10))
  const offset = (page - 1) * limit
  const sort = query.sort
  const order = ['ASC', 'DESC'].includes((query.order || '').toUpperCase())
    ? query.order.toUpperCase()
    : 'DESC'

  return { limit, offset, page, sort, order }
}

/**
 * Tạo meta object cho response phân trang
 * @param {number} total - Tổng số bản ghi
 * @param {number} page  - Trang hiện tại
 * @param {number} limit - Số bản ghi mỗi trang
 */
export const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
})
