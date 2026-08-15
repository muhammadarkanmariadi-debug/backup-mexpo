/**
 * Centralized TanStack Query key factory.
 *
 * Every query in the app is keyed through here so invalidation after a
 * mutation (`queryClient.invalidateQueries({ queryKey })`) is always precise
 * and never relies on ad-hoc string literals scattered in components.
 *
 * Naming convention:
 *   <domain>.<resource> = list base key (invalidate all lists of that resource)
 *   <domain>.<resource>(params) = a specific list/detail instance
 */

export const keys = {
  events: {
    all: ["events"] as const,
    list: (query: Record<string, string>) =>
      ["events", "list", query] as const,
    detail: (uuid: string) => ["events", "detail", uuid] as const,
    my: (query: Record<string, string>) => ["events", "my", query] as const,
    approvalQueue: (query: Record<string, string>) =>
      ["events", "approval-queue", query] as const,
  },
  qr: {
    all: ["qr"] as const,
    my: (eventUuid: string) => ["qr", "my", eventUuid] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (query: Record<string, string>) => ["users", "list", query] as const,
  },
  eventUsers: {
    all: (eventUuid: string) => ["event-users", eventUuid] as const,
    list: (eventUuid: string, query: Record<string, string>) =>
      ["event-users", eventUuid, "list", query] as const,
  },
  eventTenants: {
    all: (eventUuid: string) => ["event-tenants", eventUuid] as const,
    list: (eventUuid: string, query: Record<string, string>) =>
      ["event-tenants", eventUuid, "list", query] as const,
  },
  tenants: {
    all: ["tenants"] as const,
    mine: (query: Record<string, string>) =>
      ["tenants", "mine", query] as const,
    detail: (uuid: string) => ["tenants", "detail", uuid] as const,
    members: (tenantUuid: string) => ["tenants", "members", tenantUuid] as const,
  },
  products: {
    all: (tenantUuid: string) => ["products", tenantUuid] as const,
    list: (tenantUuid: string, query: Record<string, string>) =>
      ["products", tenantUuid, "list", query] as const,
  },
  transactions: {
    all: (tenantUuid: string) => ["transactions", tenantUuid] as const,
    list: (tenantUuid: string, query: Record<string, string>) =>
      ["transactions", tenantUuid, "list", query] as const,
  },
  tickets: {
    all: (eventUuid: string) => ["tickets", eventUuid] as const,
    list: (eventUuid: string) => ["tickets", eventUuid, "list"] as const,
  },
  regFields: {
    all: (eventUuid: string) => ["reg-fields", eventUuid] as const,
    list: (eventUuid: string) => ["reg-fields", eventUuid, "list"] as const,
  },
  content: {
    all: (eventUuid: string) => ["content", eventUuid] as const,
    rundowns: (eventUuid: string) => ["content", eventUuid, "rundowns"] as const,
    sponsors: (eventUuid: string) => ["content", eventUuid, "sponsors"] as const,
    contacts: (eventUuid: string) => ["content", eventUuid, "contacts"] as const,
    speakers: (eventUuid: string) => ["content", eventUuid, "speakers"] as const,
  },
  workshops: {
    all: (eventUuid: string) => ["workshops", eventUuid] as const,
    list: (eventUuid: string, query: Record<string, string>) =>
      ["workshops", eventUuid, "list", query] as const,
  },
  reports: {
    all: (eventUuid: string) => ["reports", eventUuid] as const,
    range: (
      eventUuid: string,
      from?: string,
      to?: string,
    ) => ["reports", eventUuid, "range", from ?? "", to ?? ""] as const,
  },
  certificates: {
    mine: ["certificates", "mine"] as const,
  },
  attendance: {
    all: (eventUuid: string) => ["attendance", eventUuid] as const,
    list: (eventUuid: string, query: Record<string, string>) =>
      ["attendance", eventUuid, "list", query] as const,
  },
  tenantCategories: () => ["tenant-categories"] as const,
} as const;
