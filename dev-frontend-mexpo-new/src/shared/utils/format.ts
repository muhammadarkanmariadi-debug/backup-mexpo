export const dateTimeFormat = (dateString: string) => {
  const date = new Date(dateString);

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  let convertedDate =
    date.getDate() +
    " " +
    monthNames[date.getMonth()] +
    " " +
    date.getFullYear();
  if (dateString.length > 10) {
    convertedDate += ` ${hours}:${minutes}:${seconds}`;
  }
  return convertedDate;
};

export const shortDateFormat = (dateString: string) => {
  const date = new Date(dateString);
  const convertedDate =
    date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

  return convertedDate;
};

export const dateFormat = (dateString: string) => {
  const date = new Date(dateString);

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const convertedDate =
    date.getDate() +
    " " +
    monthNames[date.getMonth()] +
    " " +
    date.getFullYear();

  return convertedDate;
};

export const numberFormat = (number: number) => {
  return number.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

export const dateFillFormat = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const formattedDate =
    year +
    "-" +
    month +
    "-" +
    day +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;
  return formattedDate;
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().substring(0, 10);
};

export const getMonthAgo = (): string => {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .substring(0, 10);
};

export const formatNumber = (number: number, locale: string = "de-DE") => {
  return number.toLocaleString(locale, {
    maximumFractionDigits: 2,
  });
};



 export const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
}
  

export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const maxWidth = 1024
    const maxHeight = 1024
    const quality = 0.7

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = event => {
      const img = document.createElement('img')
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = error => reject(error)
    }
    reader.onerror = error => reject(error)
  })
}


export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatDateWithDay = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("id-ID", options);
};

export const getDayName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
  });
};

export const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatTabDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
};

export const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();

  const startStr = s.toLocaleDateString("id-ID", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: sameYear ? undefined : "numeric",
  });
  const endStr = e.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startStr} – ${endStr}`;
};