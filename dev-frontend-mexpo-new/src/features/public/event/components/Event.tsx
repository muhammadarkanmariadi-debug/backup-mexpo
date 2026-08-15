"use client";
import React from "react";
import EventDetail from "./content/EventDetail";
import RegistrationFlow from "./content/RegistrationFlow";
import Hero from "./content/Hero";
import { Event } from "@/entities/event/event.entity";



export default function EventdetailPage({ eventData }: { eventData: Event }) {


    const speakers = eventData.eventSpeakers ?? [];
    const sponsors = eventData.eventSponsors ?? [];
    const rundown = eventData.eventRundowns ?? [];
    const contacts = eventData.eventContacts ?? [];
    const workshops = eventData.workshops ?? [];
    const tenants = eventData.tenants ?? [];

    return (
        <div className="-mt-16 xs:-mt-18 sm:-mt-20 md:-mt-22 lg:-mt-24 xl:-mt-25 overflow-hidden">
            <Hero eventData={eventData} />

            <RegistrationFlow />

            <EventDetail
                tenants={tenants}
                workshops={workshops}
                eventData={eventData}
                speakers={speakers}
                sponsors={sponsors}
                rundown={rundown}
                contacts={contacts}
            />

         


        </div>
    );
}

