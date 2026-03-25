interface UserGrowthChartProps {
  data: { date: string; users: number }[];
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass p-6 rounded-xl text-center">
        <p className="text-textSecondary">No growth data available</p>
      </div>
    );
  }

  const maxUsers = Math.max(...data.map(d => d.users));
  const minUsers = Math.min(...data.map(d => d.users));

  return (
    <div className="glass p-6 rounded-xl">
      <h3 className="text-lg font-semibold text-textPrimary mb-4">User Growth (30 Days)</h3>
      <div className="h-64 flex items-end space-x-1">
        {data.map((point, index) => {
          const height = maxUsers > minUsers ? ((point.users - minUsers) / (maxUsers - minUsers)) * 100 : 50;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-accent to-accent/60 rounded-t transition-all duration-300 hover:from-accent/80 hover:to-accent"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${point.date}: ${point.users} users`}
              />
              {index % 7 === 0 && (
                <span className="text-xs text-textSecondary mt-2 transform -rotate-45 origin-top-left">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-4 text-sm text-textSecondary">
        <span>0</span>
        <span>{maxUsers} users</span>
      </div>
    </div>
  );
}