import React from "react";

export function renderHighlightedTitle(name: string) {
  const words = name.split(' ')
  return words.map((word, i) => {
    const isHighlight =
      /\d/.test(word) ||        // mengandung angka: 3.000, 600, (3+1)
      /^[A-Z]{2,}/.test(word)   // singkatan kapital: SMK, LKP
    return (
      <React.Fragment key={i}>
        <span className={isHighlight ? 'text-secondary' : 'text-black'}>
          {word}
        </span>
        {i < words.length - 1 ? ' ' : ''}
      </React.Fragment>
    )
  })
}