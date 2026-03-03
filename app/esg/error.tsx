"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ESGError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Negotiations page error:", error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Negotiations page error</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          {error.message || "Something went wrong loading the negotiations workspace."}
        </p>
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        Reload section
      </Button>
    </div>
  )
}
