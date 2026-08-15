import { Event } from "@/entities/event/event.entity";
import { httpGet } from "../shared/utils/http-client";
import { QueryEntity } from "@/entities/query.entity";
import { META_ISR } from "@/shared/utils/http-meta";

export async function getEvents(query?: QueryEntity & { search?: string; event_type?: string }) {

    const params: Record<string, string> = {};
    if (query?.page != null) params.page = String(query.page);
    if (query?.quantity != null) params.quantity = String(query.quantity);
    if (query?.search) params.search = query.search;
    if (query?.event_type) params.event_type = query.event_type;

    const res = await httpGet(
        "public-api/events",
        "Basic",
        { cache: "no-store" },
        params
    );



    return {
        meta: {
            counts: (res.meta as { counts?: number } | null)?.counts,
            count: (res.meta as { count?: number } | null)?.count,
            page: (res.meta as { page?: number } | null)?.page,

        },
        data: res.data as Event[],
        status: res.status,
        code: res.code,
        message: res.message
    };
}
export async function getMyEvents(query?: QueryEntity & { search?: string }) {

    const params: Record<string, string> = {};
    if (query?.page != null) params.page = String(query.page);
    if (query?.quantity != null) params.quantity = String(query.quantity);
    if (query?.search) params.search = query.search;

    const res = await httpGet(
        "events/me",
        "token",
        { cache: "no-store" },
        params
    );

    const meta = res.meta as { counts?: number; count?: number; page?: number } | null;

    return {
        meta: {
            counts: meta?.counts,
            count: meta?.count,
            page: meta?.page,
        },
        data: res.data as Event[],
        status: res.status,
        code: res.code,
        message: res.message
    };
}


export async function getEventByUuid(uuid: string) {
    const res = await httpGet(
        `public-api/events/${uuid}`,
        "Basic",
        // Revalidate periodically instead of force-cache so newly published
        // events and updated stats appear without a full redeploy (FIX-21).
        META_ISR(60)
    );

    return {
        data: res.data as Event,
        status: res.status,
        code: res.code,
        message: res.message
    };


}



