import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAYS = ["月", "火", "水", "木", "金", "土"] as const;

const PERIODS = [
  { label: "1限", time: "16:40〜18:00" },
  { label: "2限", time: "18:10〜19:30" },
  { label: "3限", time: "19:40〜21:00" },
] as const;

export const metadata = {
  title: "時間割・教室割 | 淑徳アドバンス",
  description: "淑徳アドバンスの時間割と教室割をご確認いただけます。",
};

export default async function TimetablePage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: timetableSlots }, { data: classroomAssignments }] =
    await Promise.all([
      supabase
        .from("timetable_slots")
        .select(
          `
          *,
          course:courses(name, instructor),
          classroom:classrooms(name, building)
        `
        )
        .order("day_of_week")
        .order("period"),
      supabase
        .from("classroom_assignments")
        .select(
          `
          *,
          classroom:classrooms(name, building, capacity),
          course:courses(name)
        `
        )
        .order("classroom_id"),
    ]);

  const getSlot = (day: string, period: number) => {
    if (!timetableSlots) return null;
    return timetableSlots.filter(
      (slot) => slot.day_of_week === day && slot.period === period
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">時間割・教室割</h1>
        <p className="text-muted-foreground">
          各曜日・時限ごとの講座と教室の一覧です
        </p>
      </div>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle>時間割表</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px] text-center bg-muted font-semibold">
                  時限
                </TableHead>
                {DAYS.map((day) => (
                  <TableHead
                    key={day}
                    className="text-center min-w-[150px] bg-muted font-semibold"
                  >
                    {day}曜日
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERIODS.map((period, periodIndex) => (
                <TableRow key={period.label}>
                  <TableCell className="text-center bg-muted/50 font-medium">
                    <div className="font-semibold">{period.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {period.time}
                    </div>
                  </TableCell>
                  {DAYS.map((day) => {
                    const slots = getSlot(day, periodIndex + 1);
                    return (
                      <TableCell
                        key={`${day}-${period.label}`}
                        className="align-top p-2"
                      >
                        {slots && slots.length > 0 ? (
                          <div className="space-y-2">
                            {slots.map((slot) => (
                              <div
                                key={slot.id}
                                className="rounded-md border bg-card p-2 text-sm space-y-1 hover:shadow-sm transition-shadow"
                              >
                                <div className="font-medium leading-tight">
                                  {slot.course?.name ?? "未設定"}
                                </div>
                                {slot.classroom && (
                                  <div className="text-xs text-muted-foreground">
                                    📍 {slot.classroom.building}{" "}
                                    {slot.classroom.name}
                                  </div>
                                )}
                                {slot.course?.instructor && (
                                  <div className="text-xs text-muted-foreground">
                                    👤 {slot.course.instructor}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-xs text-muted-foreground py-4">
                            -
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Classroom Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>教室割</CardTitle>
        </CardHeader>
        <CardContent>
          {classroomAssignments && classroomAssignments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classroomAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {assignment.classroom?.building}{" "}
                      {assignment.classroom?.name}
                    </h3>
                    {assignment.classroom?.capacity && (
                      <Badge variant="secondary">
                        定員 {assignment.classroom.capacity}名
                      </Badge>
                    )}
                  </div>
                  {assignment.course && (
                    <p className="text-sm text-muted-foreground">
                      {assignment.course.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              教室割の情報はまだ登録されていません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
