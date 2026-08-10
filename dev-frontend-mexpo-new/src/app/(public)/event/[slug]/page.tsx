import EventdetailPage from '@/features/public/event/components/Event'
import { getEventByUuid } from '@/services/public.service'
import { ErrorPage } from '@/shared/components/fallback/errorMessage'
import React from 'react'

const EventPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params


    const eventData = await getEventByUuid(slug)

    return eventData.status == true || eventData.code == 200 ? <EventdetailPage eventData={eventData.data} /> : <ErrorPage code={eventData.code} title={eventData.message} />
}

export default EventPage    