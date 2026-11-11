import { withInsensitiveSearch } from './case-insensitive';

describe('withInsensitiveSearch', () => {
  it('adds mode to contains, startsWith and endsWith filters', () => {
    expect(
      withInsensitiveSearch({
        where: {
          OR: [
            { name: { contains: 'expo' } },
            { email: { startsWith: 'a' } },
            { slug: { endsWith: 'z' } },
          ],
        },
      }),
    ).toEqual({
      where: {
        OR: [
          { name: { contains: 'expo', mode: 'insensitive' } },
          { email: { startsWith: 'a', mode: 'insensitive' } },
          { slug: { endsWith: 'z', mode: 'insensitive' } },
        ],
      },
    });
  });

  it('reaches filters inside relations and nested includes', () => {
    const result = withInsensitiveSearch({
      where: { user: { full_name: { contains: 'budi' } } },
      include: { tenants: { where: { name: { contains: 'x' } } } },
    });
    expect(result.where.user.full_name).toEqual({
      contains: 'budi',
      mode: 'insensitive',
    });
    expect(result.include.tenants.where.name).toEqual({
      contains: 'x',
      mode: 'insensitive',
    });
  });

  it('keeps an explicit mode', () => {
    const where = { name: { contains: 'a', mode: 'default' } };
    expect(withInsensitiveSearch({ where })).toEqual({ where });
  });

  it('leaves write payloads, non-string values and dates alone', () => {
    const date = new Date();
    const args = {
      data: { note: { contains: 'literal' } },
      where: { created_at: { gte: date }, qty: { contains: 5 } },
    };
    const result = withInsensitiveSearch(args);
    expect(result.data).toBe(args.data);
    expect(result.where.created_at.gte).toBe(date);
    expect(result.where.qty).toEqual({ contains: 5 });
  });

  it('does not mutate its input', () => {
    const args = { where: { name: { contains: 'a' } } };
    withInsensitiveSearch(args);
    expect(args.where.name).toEqual({ contains: 'a' });
  });
});
