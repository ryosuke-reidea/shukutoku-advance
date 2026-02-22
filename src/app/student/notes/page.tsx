'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { StudentUsageNote, InstructorNote } from '@/lib/types/database'
import { AlertTriangle, MessageSquare, FileText } from 'lucide-react'

export default function NotesPage() {
  const { supabase } = useAuth()
  const [usageNotes, setUsageNotes] = useState<StudentUsageNote[]>([])
  const [instructorNotes, setInstructorNotes] = useState<InstructorNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      const [usageRes, instructorRes] = await Promise.all([
        supabase
          .from('student_usage_notes')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('instructor_notes')
          .select('*')
          .in('target_audience', ['student', 'both'])
          .order('created_at', { ascending: false }),
      ])

      if (usageRes.data) {
        setUsageNotes(usageRes.data as StudentUsageNote[])
      }
      if (instructorRes.data) {
        setInstructorNotes(instructorRes.data as InstructorNote[])
      }
      setLoading(false)
    }

    fetchNotes()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">アドバンス利用の注意点</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const hasNoContent = usageNotes.length === 0 && instructorNotes.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">アドバンス利用の注意点</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          受講にあたっての注意事項やお知らせを確認してください
        </p>
      </div>

      {hasNoContent ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">注意点はまだ登録されていません</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              注意点が登録されるとここに表示されます
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Usage Notes Section */}
          {usageNotes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                <h2 className="text-lg font-semibold">利用上の注意</h2>
              </div>
              <div className="space-y-3">
                {usageNotes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{note.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {usageNotes.length > 0 && instructorNotes.length > 0 && (
            <Separator />
          )}

          {/* Instructor Notes Section */}
          {instructorNotes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">講師からのお知らせ</h2>
              </div>
              <div className="space-y-3">
                {instructorNotes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{note.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
