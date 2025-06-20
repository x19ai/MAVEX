"use client"

import { PerformanceMonitor, measureAsync } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Record<string, { avg: number; count: number; max: number }>>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateMetrics = () => {
      const monitor = PerformanceMonitor.getInstance()
      const currentMetrics = monitor.getMetrics()
      console.log("Performance metrics updated:", currentMetrics)
      setMetrics(currentMetrics)
    }

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000)
    updateMetrics() // Initial update

    return () => clearInterval(interval)
  }, [])

  const clearMetrics = () => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.clearMetrics()
    setMetrics({})
    console.log("Performance metrics cleared")
  }

  const testPerformanceMonitoring = async () => {
    console.log("Testing performance monitoring...")
    await measureAsync("test-operation", async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log("Test performance monitoring completed")
    })
    
    // Update metrics immediately
    const monitor = PerformanceMonitor.getInstance()
    const currentMetrics = monitor.getMetrics()
    console.log("Test metrics:", currentMetrics)
    setMetrics(currentMetrics)
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        Performance
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 max-h-96 overflow-y-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between items-center">
          Performance Metrics
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={testPerformanceMonitoring}>
              Test
            </Button>
            <Button variant="outline" size="sm" onClick={clearMetrics}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
              ×
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(metrics).length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No metrics recorded yet</p>
            <p className="text-xs text-muted-foreground">
              Try sending a message or click "Test" to verify monitoring is working.
            </p>
          </div>
        ) : (
          Object.entries(metrics).map(([operation, data]) => (
            <div key={operation} className="text-xs space-y-1">
              <div className="font-medium">{operation}</div>
              <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                <div>Avg: {data.avg.toFixed(1)}ms</div>
                <div>Max: {data.max.toFixed(1)}ms</div>
                <div>Count: {data.count}</div>
              </div>
              {data.avg > 1000 && (
                <div className="text-red-500 text-xs">⚠️ Slow operation</div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
} 