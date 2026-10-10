import { DashboardContent, DashboardFrame } from "./dashboard-ui";

type AdminFirstRunChecklistProps = {
  adminName?: string;
  courseCount: number;
  membersCount: number;
};

export function AdminFirstRunChecklist({
  adminName = "admin",
  courseCount,
  membersCount,
}: AdminFirstRunChecklistProps) {
  return (
    <DashboardFrame
      adminName={adminName}
      completionsCount={0}
      courseCount={courseCount}
      membersCount={membersCount}
    >
      <DashboardContent courses={[]} />
    </DashboardFrame>
  );
}
