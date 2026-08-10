import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Per-event feature keys (A2 — docx "Core System Concept").
 * `tenant` gates the tenant subsystem, `seminar` the workshop/seminar flow,
 * `souvenir` the souvenir module, `product`/`pos` the product & POS modules,
 * and `paidTicket` is reserved for the future ticketing system (A1).
 */
export type EventFeatureKey =
  | 'tenant'
  | 'seminar'
  | 'souvenir'
  | 'product'
  | 'pos'
  | 'paidTicket';

export type EventFeatures = Record<EventFeatureKey, boolean | undefined>;

/** Read the feature config of an event, defaulting every feature to enabled. */
export async function getEventFeatures(
  prisma: PrismaService,
  eventId: string,
): Promise<EventFeatures> {
  const event = await prisma.events.findFirst({
    where: { uuid: eventId },
    select: { features: true },
  });
  return (event?.features ?? {}) as EventFeatures;
}

/**
 * Throws ForbiddenException when the given feature is explicitly disabled
 * (`false`) on the event. Absent keys mean "enabled".
 */
export async function assertEventFeature(
  prisma: PrismaService,
  eventId: string,
  feature: EventFeatureKey,
): Promise<void> {
  const event = await prisma.events.findFirst({
    where: { uuid: eventId },
    select: { name: true, features: true },
  });
  if (!event) return;

  const features = (event.features ?? {}) as EventFeatures;
  if (features[feature] === false) {
    throw new ForbiddenException(
      `The "${feature}" feature is disabled for event "${event.name}"`,
    );
  }
}
