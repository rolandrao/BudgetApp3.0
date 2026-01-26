import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SummaryCard({ title, amount, subtext }) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{amount}</div>
        <p className="text-xs text-gray-400 mt-1">
          {subtext}
        </p>
      </CardContent>
    </Card>
  )
}