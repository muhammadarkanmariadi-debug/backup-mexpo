'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons'
import { UserCircle, LogOut, User, ShieldCheck, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/context/ThemeContext'
import Button from '@/shared/components/button/Button'
import { cn } from '@/shared/utils/cn'
import { logoutAction } from '@/features/auth/auth'
import { ProfileModal } from '@/features/dashboard/profile/ProfileModal'

interface NavItem {
  title: string
  href?: string
  dropdown?: { title: string; href: string }[]
}

const HIDDEN_ROUTES = [
  '/auth',
  '/verification',
  '/forgot-passwords',
  '/profile',
  '/choose-role',
  '/stats',
  '/onsite-register',
  '/report',
  '/Owner',
]

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const pathname = usePathname()
  const { user } = useAuthStore()
 

  const username = user?.full_name
  const userPhoto = user?.photo
  const userRole = user?.role

  const handleLogout = async () => {
    await logoutAction();
    setIsUserMenuOpen(false)
    setIsMobileOpen(false)
    window.location.href = '/auth'
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu on navigation
    setIsMobileOpen(false)
    setMobileDropdown(null)
  }, [pathname])

  const shouldHide = HIDDEN_ROUTES.some(route => pathname.startsWith(route))
  if (shouldHide) return null

  const navItems: NavItem[] = [
    { title: 'Beranda', href: '/' },
    { title: 'Tentang Kami', href: '/about' },
    { title: 'Bantuan', href: '/faq' },
    { title: 'Hubungi Kami', href: '/contact' },
    ...(username ? [{
      title: 'Dashboard',
      href: '/dashboard'
    }] : []),
  ]

  const isActive = (href?: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href || '')

  return (
    <nav className="top-0 z-[999] w-full">

      {/* ── Desktop Bar ── */}
      <div className="relative flex justify-between items-center bg-white dark:bg-gray-900 xl:bg-transparent xl:dark:bg-transparent border-b border-gray-100 dark:border-gray-800 xl:border-none mx-auto px-6 py-4 xl:py-0 w-full 2xl:max-w-[1400px] xl:max-w-[1300px]">

        {/* Logo */}
        <Link href="/" className="xl:mt-9 shrink-0">
          <Image
            src="/logo/logo.png"
            alt="Mexpo"
            width={140}
            height={60}
            className=" object-contain dark:brightness-0 dark:invert"
          />
        </Link>

        {/* Floating pill nav — desktop only */}
        <div
          className={cn(
            'hidden left-1/2 z-[999] fixed lg:flex items-center transition-all -translate-x-1/2 duration-500',
            scrolled
              ? 'top-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-neutral-200 dark:border-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full px-6 py-2.5'
              : 'top-8 bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-full px-8 py-3'
          )}
        >
          {/* Logo in pill (shown when scrolled) */}
          <AnimatePresence>
            {scrolled && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="mr-6 overflow-hidden"
              >
                <Link href="/">
                  <Image
                    src="/images/logo/logo-m.svg"
                    alt="Mexpo"
                    width={72}
                    height={32}
                    className="h-8 object-contain dark:brightness-0 dark:invert"
                  />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav links */}
          <div className="flex items-center gap-1" ref={dropdownRef}>
            {navItems.map(item =>
              item.dropdown ? (
                <div key={item.title} className="relative">
                  <button
                    onClick={() =>
                      setActiveDropdown(activeDropdown === item.title ? null : item.title)
                    }
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200',
                      activeDropdown === item.title
                        ? 'bg-secondary/10 text-secondary'
                        : 'text-gray-600 dark:text-gray-300 hover:text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    {item.title}
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={cn(
                        'text-[10px] transition-transform duration-200',
                        activeDropdown === item.title ? 'rotate-180' : ''
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === item.title && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="top-full left-0 absolute bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] mt-2 py-1 border border-neutral-200 dark:border-gray-700 rounded-2xl w-44 overflow-hidden"
                      >
                        {item.dropdown.map(sub => (
                          <Link
                            key={sub.title}
                            href={sub.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-2 hover:bg-secondary/5 dark:hover:bg-secondary/10 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-secondary text-sm transition-colors"
                          >
                            {sub.title}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.title}
                  href={item.href || '#'}
                  className={cn(
                    'px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-secondary text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  {item.title}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Right side — user / login */}
        <div className="hidden lg:flex items-center gap-3 xl:mt-9 shrink-0" ref={userMenuRef}>
     
          {username ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:shadow-sm px-2 py-1.5 border border-neutral-200 dark:border-gray-700 hover:border-secondary/40 rounded-full transition-all duration-200"
              >
                {/* Avatar */}
                <div className="relative bg-secondary/10 rounded-full w-7 h-7 overflow-hidden shrink-0">
                  {userPhoto ? (
                    <Image
                      src={userPhoto}
                      alt={username || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <UserCircle size={28} className="text-secondary" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="max-w-[110px] font-semibold text-gray-700 dark:text-gray-200 text-xs truncate leading-tight">
                    {username}
                  </span>
                  {userRole && (
                    <span className="font-medium text-[10px] text-secondary/70 capitalize leading-tight">
                      {userRole.toLowerCase().replace('_', ' ')}
                    </span>
                  )}
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={cn(
                    'ml-0.5 text-[10px] text-gray-400 dark:text-gray-500 transition-transform duration-200',
                    isUserMenuOpen ? 'rotate-180' : ''
                  )}
                />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="top-full right-0 z-[100] absolute bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] mt-2 py-1 border border-neutral-200 dark:border-gray-700 rounded-2xl w-52 overflow-hidden"
                  >
                    {/* User header in dropdown */}
                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <div className="relative bg-secondary/10 rounded-full w-9 h-9 overflow-hidden shrink-0">
                          {userPhoto ? (
                            <Image src={userPhoto} alt={username || 'User'} fill className="object-cover" />
                          ) : (
                            <UserCircle size={36} className="text-secondary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{username}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {userRole === 'SUPERADMIN' && (
                              <ShieldCheck size={11} className="text-secondary shrink-0" />
                            )}
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate capitalize">
                              {userRole?.toLowerCase().replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setProfileOpen(true); setIsUserMenuOpen(false); }}
                      className="flex items-center gap-2.5 hover:bg-secondary/5 dark:hover:bg-secondary/10 px-4 py-2.5 w-full text-left text-gray-700 dark:text-gray-300 hover:text-secondary text-sm transition-colors"
                    >
                      <User size={15} />
                      Profil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2.5 w-full text-red-500 text-sm transition-colors"
                    >
                      <LogOut size={15} />
                      Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button
              href="/auth"
              variant="primary"
              className="px-5 py-2 text-sm"
            >
              Masuk
            </Button>
          )}
        </div>

        {/* Toggle + Hamburger — mobile only */}
        <div className="lg:hidden flex items-center gap-2">
    
          <button
            className="xl:hidden flex justify-center items-center border border-neutral-200 dark:border-gray-700 hover:border-secondary/40 rounded-full w-9 h-9 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 transition-all"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={isMobileOpen ? faTimes : faBars} className="text-sm" />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="xl:hidden bg-white dark:bg-gray-900 shadow-lg border-t border-neutral-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {/* User info / Login */}
              {username ? (
                <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/15 dark:to-secondary/5 mb-4 p-3 border border-secondary/20 dark:border-secondary/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="relative bg-secondary/20 rounded-full w-10 h-10 overflow-hidden shrink-0">
                      {userPhoto ? (
                        <Image src={userPhoto} alt={username} fill className="object-cover" />
                      ) : (
                        <div className="flex justify-center items-center w-full h-full">
                          <UserCircle size={24} className="text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{username}</p>
                      <div className="flex items-center gap-1">
                        {userRole === 'SUPERADMIN' && (
                          <ShieldCheck size={11} className="text-secondary shrink-0" />
                        )}
                        <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                          {userRole?.toLowerCase().replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(true); setIsMobileOpen(false); }}
                      className="flex flex-1 justify-center items-center gap-1.5 bg-white dark:bg-gray-800 hover:bg-secondary/5 dark:hover:bg-secondary/10 px-3 py-1.5 border border-secondary/30 rounded-full font-semibold text-secondary text-xs transition-colors"
                    >
                      <User size={12} /> Profil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex flex-1 justify-center items-center gap-1.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 border border-red-200 dark:border-red-500/30 rounded-full font-semibold text-red-500 text-xs transition-colors"
                    >
                      <LogOut size={12} /> Keluar
                    </button>
                  </div>
                </div>
              ) : (
                <Button href="/auth" variant="primary" className="mb-4 py-2.5 w-full text-sm">
                  Masuk
                </Button>
              )}

              {/* Nav Links */}
              {navItems.map(item =>
                item.dropdown ? (
                  <div key={item.title}>
                    <button

                      onClick={() =>
                        setMobileDropdown(mobileDropdown === item.title ? null : item.title)
                      }
                      className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-3 rounded-xl w-full font-semibold text-gray-700 dark:text-gray-300 text-sm transition-colors"
                    >
                      {item.title}
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={cn(
                          'text-[10px] text-gray-400 dark:text-gray-500 transition-transform duration-200',
                          mobileDropdown === item.title ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileDropdown === item.title && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-4 overflow-hidden"
                        >
                          {item.dropdown.map(sub => (
                            <Link
                              key={sub.title}
                              href={sub.href}
                              onClick={() => {
                                setIsMobileOpen(false)
                                setMobileDropdown(null)
                              }}
                              className="flex items-center gap-2 hover:bg-secondary/5 dark:hover:bg-secondary/10 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-secondary text-sm transition-colors"
                            >
                              <span className="bg-secondary/40 rounded-full w-1 h-1" />
                              {sub.title}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.title}
                    href={item.href || '#'}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors',
                      isActive(item.href)
                        ? 'bg-secondary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-secondary'
                    )}
                  >
                    {item.title}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile popup — opened from the user menu (desktop + mobile). */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </nav>
  )
}