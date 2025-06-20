"use client"

import { Switch } from "@/components/ui/switch"
import { useUserPreferences } from "@/lib/user-preference-store/provider"

export function PerformanceMonitoring() {
  const { preferences, setShowPerformanceDashboard } = useUserPreferences()

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Performance monitoring</h3>
          <p className="text-muted-foreground text-xs">
            Show performance metrics dashboard for debugging and optimization
          </p>
        </div>
        <Switch
          checked={preferences.showPerformanceDashboard}
          onCheckedChange={setShowPerformanceDashboard}
        />
      </div>
    </div>
  )
} 