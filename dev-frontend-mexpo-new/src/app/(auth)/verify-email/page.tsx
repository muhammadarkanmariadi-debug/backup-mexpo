import VerificationBox from '@/features/auth/verify-email/components/VerificationBox'
import React, { Suspense } from 'react'

const VerifyEmailPage = () => {
    return (
        <Suspense fallback={null}>
            <VerificationBox />
        </Suspense>
    )
}

export default VerifyEmailPage