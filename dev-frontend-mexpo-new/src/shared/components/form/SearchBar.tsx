import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

interface SearchBarProps {
    search: string;
    setSearch: (search: string) => void;
    placeholder?: string;
}

const SearchBar = ({ search, setSearch, placeholder }: SearchBarProps) => {
  return (
    <span className="flex items-center bg-white border border-gray-300 mx-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-full w-full ">
            <input
              type="text"
              placeholder={placeholder || "Search events..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none w-full font-jakarta text-gray-800 text-sm sm:text-base"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="w-4 sm:w-5 h-4 sm:h-5 text-gray-800"
            />
          </span>
  )
}

export default SearchBar