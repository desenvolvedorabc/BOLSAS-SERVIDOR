import {
  paginate,
  Pagination,
  PaginationTypeEnum,
} from 'nestjs-typeorm-paginate';
import { SelectQueryBuilder } from 'typeorm';

export async function paginateData<T>(
  page: number,
  limit: number,
  queryBuilder: SelectQueryBuilder<T>,
): Promise<Pagination<T>> {
  const totalItems = await queryBuilder.getCount();

  return paginate(queryBuilder, {
    page,
    limit,
    paginationType: PaginationTypeEnum.TAKE_AND_SKIP,
    metaTransformer: ({ currentPage, itemCount, itemsPerPage }) => {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return {
        currentPage,
        itemCount,
        itemsPerPage,
        totalItems,
        totalPages: totalPages === 0 ? 1 : totalPages,
      };
    },
  });
}
