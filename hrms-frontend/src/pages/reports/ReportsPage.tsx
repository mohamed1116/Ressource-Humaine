export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard
          title="Attendance Report"
          description="Monthly and daily attendance summaries by department"
          icon="⏰"
          href="/reports/attendance"
        />
        <ReportCard
          title="Leave Report"
          description="Leave usage, balances, and trends across departments"
          icon="📋"
          href="/reports/leaves"
        />
        <ReportCard
          title="Salary Report"
          description="Payroll summaries, tax breakdowns, and cost analysis"
          icon="💰"
          href="/reports/salary"
        />
        <ReportCard
          title="Performance Report"
          description="Evaluation scores, ratings, and department comparisons"
          icon="📈"
          href="/reports/performance"
        />
      </div>
    </div>
  );
}

function ReportCard({ title, description, icon, href }: { title: string; description: string; icon: string; href: string }) {
  return (
    <a href={href} className="block bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
}
