export type EventStatus = "Upcoming" | "On Going" | "Past" | null;

export function getEventCategory(
  startDate: string | Date,
  endDate: string | Date,
): EventStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventStart = new Date(startDate);
  const eventEnd = new Date(endDate);

  eventStart.setHours(0, 0, 0, 0);
  eventEnd.setHours(0, 0, 0, 0);

  if (today > eventEnd)                        return "Past";
  if (today < eventStart)                      return "Upcoming";
  if (today >= eventStart && today <= eventEnd) return "On Going";

  return null;
}

export function validateEventRegistration(
  registrationStartDate: string | Date | null,
  registrationDeadline: string | Date | null,
) {
  // Jika deadline tidak ada / invalid → anggap registrasi belum dibuka
  if (!registrationDeadline) {
    return {
      canRegister: false,
      message: "Informasi pendaftaran belum tersedia.",
      category: "upcoming" as const,
    };
  }

  const deadline = new Date(registrationDeadline);

  // Guard: kalau string yang masuk tidak valid sebagai tanggal
  if (isNaN(deadline.getTime())) {
    return {
      canRegister: false,
      message: "Informasi pendaftaran belum tersedia.",
      category: "upcoming" as const,
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  if (now > deadline) {
    return {
      canRegister: false,
      message: "Maaf, batas waktu pendaftaran telah berakhir.",
      category: "past" as const,
    };
  }

  if (registrationStartDate) {
    const startDate = new Date(registrationStartDate);

    if (!isNaN(startDate.getTime())) {
      startDate.setHours(0, 0, 0, 0);
      if (now < startDate) {
        return {
          canRegister: false,
          message: "Pendaftaran belum dibuka.",
          category: "upcoming" as const,
        };
      }
    }
  }

  return {
    canRegister: true,
    message: "Registrasi sedang dibuka",
    category: "on-going" as const,
  };
}