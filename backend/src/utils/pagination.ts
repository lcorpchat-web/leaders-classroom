import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  parPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export interface Page<T> {
  donnees: T[];
  total: number;
  page: number;
  parPage: number;
}

export const skipTake = ({ page, parPage }: Pagination) => ({ skip: (page - 1) * parPage, take: parPage });
