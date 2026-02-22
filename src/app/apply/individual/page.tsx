'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Check, ArrowRight, ArrowLeft, Clock, BookOpen, Users, CreditCard, ClipboardCheck, CheckCircle2, Home, User, Loader2, AlertCircle,
} from 'lucide-react'
import { SUBJECTS, DAYS_OF_WEEK, PAYMENT_METHODS } from '@/lib/constants'
import type { PaymentMethod } from '@/lib/types/database'

// ============================================================
// 個別指導の時間帯定数
// ============================================================
const INDIVIDUAL_PERIODS_WEEKDAY = [
  { label: '1限', time: '15:30〜16:50' },
  { label: '2限', time: '17:00〜18:20' },
  { label: '3限', time: '18:30〜19:50' },
]
const INDIVIDUAL_PERIODS_SATURDAY = [
  { label: '1限', time: '13:10〜14:30' },
  { label: '2限', time: '14:40〜16:00' },
  { label: '3限', time: '16:10〜17:30' },
  { label: '4限', time: '17:40〜19:00' },
]

const FORMAT_OPTIONS = [
  { value: 'individual_1on1', label: '1対1', description: '講師1名に対して生徒1名', price: 0 },
  { value: 'individual_1on2', label: '1対2', description: '講師1名に対して生徒2名（友人と一緒に受講）', price: 0 },
  { value: 'individual_1on3', label: '1対3', description: '講師1名に対して生徒3名（友人と一緒に受講）', price: 0 },
]

const STEP_LABELS = ['時間帯', '教科', '形態', '支払い', '確認', '完了']
const STEP_ICONS = [Clock, BookOpen, Users, CreditCard, ClipboardCheck, CheckCircle2]

export default function IndividualApplyPage() {
  const router = useRouter()
  const supabase = createClient()

  // Step state
  const [step, setStep] = useState(0)

  // Step 1: 時間帯
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  // Step 2: 教科
  const [selectedSubject, setSelectedSubject] = useState<string>('')

  // Step 3: 形態
  const [selectedFormat, setSelectedFormat] = useState<string>('individual_1on1')
  const [friendName1, setFriendName1] = useState('')
  const [friendName2, setFriendName2] = useState('')

  // Step 4: 支払い
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')

  // Step 5: 確認・送信
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(false)

  // Auth check before step 5
  useEffect(() => {
    if (step === 4) {
      setAuthChecking(true)
      const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // Save state to session storage, redirect to login
          sessionStorage.setItem('individual_apply_state', JSON.stringify({
            selectedDay, selectedPeriod, selectedSubject, selectedFormat,
            friendName1, friendName2, paymentMethod,
          }))
          const redirectUrl = `/apply/individual?restore=true`
          router.push(`/auth/student-login?next=${encodeURIComponent(redirectUrl)}`)
          return
        }
        setUserEmail(user.email ?? '')
        setUserName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '')
        setAuthChecking(false)
      }
      checkAuth()
    }
  }, [step])

  // Restore state after login redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('restore') === 'true') {
      const saved = sessionStorage.getItem('individual_apply_state')
      if (saved) {
        try {
          const state = JSON.parse(saved)
          setSelectedDay(state.selectedDay || '')
          setSelectedPeriod(state.selectedPeriod || '')
          setSelectedSubject(state.selectedSubject || '')
          setSelectedFormat(state.selectedFormat || 'individual_1on1')
          setFriendName1(state.friendName1 || '')
          setFriendName2(state.friendName2 || '')
          setPaymentMethod(state.paymentMethod || 'bank_transfer')
          setStep(4)
          sessionStorage.removeItem('individual_apply_state')
        } catch { /* ignore */ }
      }
    }
  }, [])

  const canProceed = () => {
    switch (step) {
      case 0: return selectedDay !== '' && selectedPeriod !== ''
      case 1: return selectedSubject !== ''
      case 2:
        if (selectedFormat === 'individual_1on2') return friendName1.trim() !== ''
        if (selectedFormat === 'individual_1on3') return friendName1.trim() !== '' && friendName2.trim() !== ''
        return true
      case 3: return true
      default: return true
    }
  }

  const handleNext = () => {
    if (step < 5 && canProceed()) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'individual',
          day: selectedDay,
          period: selectedPeriod,
          subject: selectedSubject,
          format: selectedFormat,
          friendNames: [friendName1, friendName2].filter(Boolean),
          paymentMethod,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || '申し込みに失敗しました。')
        setSubmitting(false)
        return
      }
      setStep(5)
    } catch {
      setError('ネットワークエラーが発生しました。')
      setSubmitting(false)
    }
  }

  const periodLabel = (() => {
    if (!selectedDay || !selectedPeriod) return ''
    const isSaturday = selectedDay === '土'
    const periods = isSaturday ? INDIVIDUAL_PERIODS_SATURDAY : INDIVIDUAL_PERIODS_WEEKDAY
    const p = periods.find((p) => p.label === selectedPeriod)
    return p ? `${selectedDay}曜 ${p.label} (${p.time})` : `${selectedDay}曜 ${selectedPeriod}`
  })()

  const formatLabel = FORMAT_OPTIONS.find((f) => f.value === selectedFormat)?.label ?? ''

  return (
    <div className="space-y-6">
      {/* ステッパー */}
      <div className="border-b bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 -mt-6 sm:-mt-8 mb-2">
        <nav aria-label="個別指導申し込み手順">
          <ol className="flex items-center justify-between max-w-2xl mx-auto">
            {STEP_LABELS.map((label, index) => {
              const isCompleted = index < step
              const isCurrent = index === step
              const Icon = STEP_ICONS[index]
              return (
                <li key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      'flex size-7 sm:size-9 items-center justify-center rounded-full border-2 transition-colors',
                      isCompleted && 'border-[#1b99a4] bg-[#1b99a4] text-white',
                      isCurrent && 'border-[#1b99a4] bg-white text-[#1b99a4]',
                      !isCompleted && !isCurrent && 'border-slate-300 bg-white text-slate-400'
                    )}>
                      {isCompleted ? <Check className="size-3 sm:size-4" /> : <Icon className="size-3 sm:size-4" />}
                    </div>
                    <span className={cn(
                      'text-[9px] sm:text-xs font-medium whitespace-nowrap',
                      isCurrent ? 'text-[#1b99a4]' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    )}>
                      {label}
                    </span>
                  </div>
                  {index < STEP_LABELS.length - 1 && (
                    <div className={cn(
                      'mx-0.5 sm:mx-2 mt-[-1rem] h-0.5 flex-1',
                      index < step ? 'bg-[#1b99a4]' : 'bg-slate-200'
                    )} />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      {/* ===== Step 0: 時間帯選択 ===== */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">受講時間帯を選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">ご希望の曜日と時限を選んでください。</p>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">曜日</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setSelectedPeriod('') }}
                    className={cn(
                      'py-3 rounded-xl text-sm font-bold transition-all border-2',
                      selectedDay === day
                        ? 'border-[#1b99a4] bg-[#e0f4f8] text-[#1b99a4]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {day}曜
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedDay && (
            <Card>
              <CardHeader><CardTitle className="text-base">時限</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(selectedDay === '土' ? INDIVIDUAL_PERIODS_SATURDAY : INDIVIDUAL_PERIODS_WEEKDAY).map((period) => (
                    <button
                      key={period.label}
                      onClick={() => setSelectedPeriod(period.label)}
                      className={cn(
                        'py-3 px-2 rounded-xl text-center transition-all border-2',
                        selectedPeriod === period.label
                          ? 'border-[#f6ad3c] bg-[#fff3e0] text-[#e09520]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <div className="text-sm font-bold">{period.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{period.time}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== Step 1: 教科選択 ===== */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">教科を選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">受講したい教科を選んでください。</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={cn(
                      'py-4 rounded-xl text-base font-bold transition-all border-2',
                      selectedSubject === subject
                        ? 'border-[#1b99a4] bg-[#e0f4f8] text-[#1b99a4] shadow-md'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== Step 2: 形態選択 ===== */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">受講形態を選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">1対1、1対2、1対3から選んでください。</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="space-y-3">
                {FORMAT_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer',
                      selectedFormat === opt.value
                        ? 'border-[#1b99a4] bg-[#e0f4f8]'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => setSelectedFormat(opt.value)}
                  >
                    <RadioGroupItem value={opt.value} id={`format-${opt.value}`} className="mt-0.5" />
                    <div>
                      <Label htmlFor={`format-${opt.value}`} className="text-base font-bold cursor-pointer">
                        {opt.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 友人名の入力 */}
          {(selectedFormat === 'individual_1on2' || selectedFormat === 'individual_1on3') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">一緒に受講する友人の氏名</CardTitle>
                <CardDescription>
                  {selectedFormat === 'individual_1on2'
                    ? '一緒に受講する友人1名の氏名を入力してください。'
                    : '一緒に受講する友人2名の氏名を入力してください。'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="friend1" className="text-sm font-medium">友人1</Label>
                  <Input
                    id="friend1"
                    value={friendName1}
                    onChange={(e) => setFriendName1(e.target.value)}
                    placeholder="氏名を入力"
                    className="mt-1"
                  />
                </div>
                {selectedFormat === 'individual_1on3' && (
                  <div>
                    <Label htmlFor="friend2" className="text-sm font-medium">友人2</Label>
                    <Input
                      id="friend2"
                      value={friendName2}
                      onChange={(e) => setFriendName2(e.target.value)}
                      placeholder="氏名を入力"
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== Step 3: 支払い方法 ===== */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">支払い方法の選択</h1>
            <p className="mt-1 text-sm text-muted-foreground">お支払い方法を選択してください。</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="space-y-3"
              >
                {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, string][]).map(([value, label]) => (
                  <div
                    key={value}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer',
                      paymentMethod === value
                        ? 'border-[#1b99a4] bg-[#e0f4f8]'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => setPaymentMethod(value)}
                  >
                    <RadioGroupItem value={value} id={`pay-${value}`} />
                    <Label htmlFor={`pay-${value}`} className="flex-1 cursor-pointer font-medium">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== Step 4: 確認 ===== */}
      {step === 4 && (
        <div className="space-y-6">
          {authChecking ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">お申し込み内容の確認</h1>
                <p className="mt-1 text-sm text-muted-foreground">内容をご確認のうえ、申し込みボタンを押してください。</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="size-4" />受講生情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">氏名</span>
                    <span className="text-sm font-medium">{userName || '未設定'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">メール</span>
                    <span className="text-sm font-medium break-all">{userEmail}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">申し込み内容</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">時間帯</span>
                    <span className="text-sm font-medium">{periodLabel}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">教科</span>
                    <span className="text-sm font-medium">{selectedSubject}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">受講形態</span>
                    <span className="text-sm font-medium">{formatLabel}</span>
                  </div>
                  {friendName1 && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">友人1</span>
                        <span className="text-sm font-medium">{friendName1}</span>
                      </div>
                    </>
                  )}
                  {friendName2 && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">友人2</span>
                        <span className="text-sm font-medium">{friendName2}</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">支払い方法</span>
                    <span className="text-sm font-medium">{PAYMENT_METHODS[paymentMethod]}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitting} size="lg" className="min-w-[200px]">
                  {submitting ? (
                    <><Loader2 className="size-4 animate-spin" />送信中...</>
                  ) : (
                    '申し込む'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Step 5: 完了 ===== */}
      {step === 5 && (
        <div className="flex justify-center py-8">
          <Card className="w-full max-w-lg text-center">
            <CardHeader className="items-center">
              <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">お申し込み完了</CardTitle>
              <CardDescription className="text-base">個別指導のお申し込みありがとうございます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-slate-50 p-4 text-left">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">お申し込み内容</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">時間帯</dt><dd className="font-medium">{periodLabel}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">教科</dt><dd className="font-medium">{selectedSubject}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">形態</dt><dd className="font-medium">{formatLabel}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">支払い方法</dt><dd className="font-medium">{PAYMENT_METHODS[paymentMethod]}</dd></div>
                </dl>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left text-sm text-blue-800">
                <p>確認が完了次第、担当者よりご連絡いたします。</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild variant="outline"><Link href="/"><Home className="size-4" />トップページへ</Link></Button>
                <Button asChild><Link href="/student"><User className="size-4" />マイページへ</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ナビゲーションボタン（Step 0-3） ===== */}
      {step < 4 && (
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            <ArrowLeft className="size-4" />
            戻る
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            次へ
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
      {step === 4 && !authChecking && (
        <div className="flex items-center justify-start pt-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            戻る
          </Button>
        </div>
      )}
    </div>
  )
}
