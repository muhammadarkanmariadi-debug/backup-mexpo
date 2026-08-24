import { CertificateTemplateEnvelope } from "@/entities/event/certificate-template.entity";

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplateEnvelope = {
  version: 1,
  width: 1200,
  height: 840,
  background: {
    type: "image",
    url: "/images/cert.png",
  },
  nodes: [
    {
      className: "Layer",
      attrs: {
        id: "main-layer",
      },
      children: [
        // Certificate Number
        {
          className: "Text",
          attrs: {
            id: "cert-number",
            x: 300,
            y: 95,
            width: 600,
            height: 24,
            fontSize: 15,
            fontFamily: "Inter, sans-serif",
            fill: "#64748b",
            align: "center",
            text: "No. MXP/2026/0001",
            binding: {
              type: "dynamic",
              key: "certificate_number",
              value: "No. MXP/2026/0001",
            },
          },
        },
        // Certificate Main Title
        {
          className: "Text",
          attrs: {
            id: "cert-title",
            x: 150,
            y: 135,
            width: 900,
            height: 50,
            fontSize: 40,
            fontFamily: "Poppins, sans-serif",
            fontStyle: "bold",
            fill: "#1e3a8a",
            align: "center",
            text: "SERTIFIKAT PENGHARGAAN",
            binding: {
              type: "static",
              value: "SERTIFIKAT PENGHARGAAN",
            },
          },
        },
        // Subtitle / Given To
        {
          className: "Text",
          attrs: {
            id: "cert-subtitle",
            x: 250,
            y: 195,
            width: 700,
            height: 30,
            fontSize: 16,
            fontFamily: "Inter, sans-serif",
            fontStyle: "italic",
            fill: "#6b7280",
            align: "center",
            text: "DIBERIKAN KEPADA",
            binding: {
              type: "static",
              value: "DIBERIKAN KEPADA",
            },
          },
        },
        // Participant Name (Dynamic)
        {
          className: "Text",
          attrs: {
            id: "cert-participant-name",
            x: 100,
            y: 240,
            width: 1000,
            height: 65,
            fontSize: 48,
            fontFamily: "Poppins, sans-serif",
            fontStyle: "bold",
            fill: "#0f172a",
            align: "center",
            text: "Rizky Pratama",
            binding: {
              type: "dynamic",
              key: "participant_name",
              value: "Rizky Pratama",
            },
          },
        },
        // Decorative Underline for Name
        {
          className: "Rect",
          attrs: {
            id: "cert-name-underline",
            x: 350,
            y: 315,
            width: 500,
            height: 2,
            fill: "#3b82f6",
            opacity: 0.8,
          },
        },
        // Description
        {
          className: "Text",
          attrs: {
            id: "cert-description",
            x: 150,
            y: 345,
            width: 900,
            height: 30,
            fontSize: 17,
            fontFamily: "Inter, sans-serif",
            fill: "#475569",
            align: "center",
            text: "Atas partisipasi dan kontribusinya sebagai peserta aktif dalam kegiatan:",
            binding: {
              type: "static",
              value: "Atas partisipasi dan kontribusinya sebagai peserta aktif dalam kegiatan:",
            },
          },
        },
        // Workshop Title (Dynamic)
        {
          className: "Text",
          attrs: {
            id: "cert-workshop-title",
            x: 100,
            y: 395,
            width: 1000,
            height: 45,
            fontSize: 28,
            fontFamily: "Poppins, sans-serif",
            fontStyle: "bold",
            fill: "#1d4ed8",
            align: "center",
            text: "Workshop UI/UX Design dengan Figma",
            binding: {
              type: "dynamic",
              key: "workshop_title",
              value: "Workshop UI/UX Design dengan Figma",
            },
          },
        },
        // Event Name (Dynamic)
        {
          className: "Text",
          attrs: {
            id: "cert-event-name",
            x: 150,
            y: 450,
            width: 900,
            height: 30,
            fontSize: 16,
            fontFamily: "Inter, sans-serif",
            fill: "#64748b",
            align: "center",
            text: "MEXPO 2026 · Pameran & Lokakarya SMK Telkom Malang",
            binding: {
              type: "dynamic",
              key: "event_name",
              value: "MEXPO 2026 · Pameran & Lokakarya SMK Telkom Malang",
            },
          },
        },
        // Date (Dynamic)
        {
          className: "Text",
          attrs: {
            id: "cert-date",
            x: 400,
            y: 525,
            width: 400,
            height: 25,
            fontSize: 15,
            fontFamily: "Inter, sans-serif",
            fill: "#475569",
            align: "center",
            text: "24 Agustus 2026",
            binding: {
              type: "dynamic",
              key: "date",
              value: "24 Agustus 2026",
            },
          },
        },
        // Left Signature Line
        {
          className: "Rect",
          attrs: {
            id: "cert-sig-line-left",
            x: 200,
            y: 655,
            width: 250,
            height: 1,
            fill: "#94a3b8",
          },
        },
        // Left Signature Name (Dynamic Organizer Name)
        {
          className: "Text",
          attrs: {
            id: "cert-sig-name-left",
            x: 175,
            y: 668,
            width: 300,
            height: 25,
            fontSize: 16,
            fontFamily: "Poppins, sans-serif",
            fontStyle: "bold",
            fill: "#1e293b",
            align: "center",
            text: "SMK Telkom Malang",
            binding: {
              type: "dynamic",
              key: "organizer_name",
              value: "SMK Telkom Malang",
            },
          },
        },
        // Left Signature Title
        {
          className: "Text",
          attrs: {
            id: "cert-sig-title-left",
            x: 175,
            y: 695,
            width: 300,
            height: 22,
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            fill: "#64748b",
            align: "center",
            text: "Penyelenggara / Ketua Pelaksana",
            binding: {
              type: "static",
              value: "Penyelenggara / Ketua Pelaksana",
            },
          },
        },
        // Right Signature Line
        {
          className: "Rect",
          attrs: {
            id: "cert-sig-line-right",
            x: 750,
            y: 655,
            width: 250,
            height: 1,
            fill: "#94a3b8",
          },
        },
        // Right Signature Name
        {
          className: "Text",
          attrs: {
            id: "cert-sig-name-right",
            x: 725,
            y: 668,
            width: 300,
            height: 25,
            fontSize: 16,
            fontFamily: "Poppins, sans-serif",
            fontStyle: "bold",
            fill: "#1e293b",
            align: "center",
            text: "Kepala SMK Telkom Malang",
            binding: {
              type: "static",
              value: "Kepala SMK Telkom Malang",
            },
          },
        },
        // Right Signature Title
        {
          className: "Text",
          attrs: {
            id: "cert-sig-title-right",
            x: 725,
            y: 695,
            width: 300,
            height: 22,
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            fill: "#64748b",
            align: "center",
            text: "Penanggung Jawab",
            binding: {
              type: "static",
              value: "Penanggung Jawab",
            },
          },
        },
      ],
    },
  ],
};
