import VerificationBox from '@/features/auth/verify-email/components/VerificationBox'
import { AuthTemplate } from '@/templates/AuthTemplate'
import React, { Suspense } from 'react'

const VerifyEmailPage = () => {
    return (
        <Suspense fallback={null}>
            <VerificationBox />
        </Suspense>
    )
}

export default VerifyEmailPage