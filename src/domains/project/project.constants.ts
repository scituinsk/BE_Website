/**
 * Mapping antara field API (yang diterima dari client) dengan field database Prisma
 * Ini untuk mencegah client langsung mengakses nama kolom database
 */
export const PROJECT_SORT_FIELD_MAPPING: Record<string, string> = {
  title: 'title',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  launch_year: 'launchYear',
  status: 'status',
};

/**
 * Field-field yang diperbolehkan untuk sorting
 */
export const ALLOWED_PROJECT_SORT_FIELDS = Object.keys(
  PROJECT_SORT_FIELD_MAPPING,
);
