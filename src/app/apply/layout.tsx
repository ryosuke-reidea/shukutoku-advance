'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const groupSteps = [
  { path: '/apply', label: '講座選択' },
  { path: '/apply/login', label: 'ログイン' },
  { path: '/apply/payment', label: '支払い方法' },
  { path: '/apply/confirm', label: '確認' },
  { path: '/apply/complete', label: '完了' },
]

const individualSteps = [
  { path: '/apply/individual', label: '時間帯' },
  { path: '/apply/individual', label: '教科' },
  { path: '/apply/individual', label: '形態' },
  { path: '/apply/individual', label: '支払い' },
  { path: '/apply/individual', label: '確認' },
  { path: '/apply/individual', label: '完了' },
]

function getStepIndex(pathname: string): number {
  const index = groupSteps.findIndex((step) => step.path === pathname)
  return index === -1 ? 0 : index
}

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isIndividual = pathname.startsWith('/apply/individual')

  // For individual flow, we handle step display inside the page itself
  const steps = isIndividual ? [] : groupSteps
  const currentStep = isIndividual ? -1 : getStepIndex(pathname)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        {/* Stepper - only for group flow */}
        {steps.length > 0 && (
          <div className="border-b bg-white">
            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              <nav aria-label="お申し込みの手順">
                <ol className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep

                    return (
                      <li key={step.path} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <div
                            className={cn(
                              'flex size-6 sm:size-8 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-semibold transition-colors',
                              isCompleted && 'border-primary bg-primary text-primary-foreground',
                              isCurrent && 'border-primary bg-white text-primary',
                              !isCompleted && !isCurrent && 'border-slate-300 bg-white text-slate-400'
                            )}
                          >
                            {isCompleted ? <Check className="size-3 sm:size-4" /> : index + 1}
                          </div>
                          <span
                            className={cn(
                              'text-[10px] sm:text-xs font-medium whitespace-nowrap',
                              isCurrent ? 'text-primary' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={cn(
                              'mx-1 sm:mx-2 mt-[-1rem] sm:mt-[-1.5rem] h-0.5 flex-1',
                              index < currentStep ? 'bg-primary' : 'bg-slate-200'
                            )}
                          />
                        )}
                      </li>
                    )
                  })}
                </ol>
              </nav>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
