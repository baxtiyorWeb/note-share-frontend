import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: ["Basic features access", "Up to 5 projects", "Community support", "1GB storage"],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
  },
  {
    name: "Premium",
    price: "$19",
    period: "/month",
    description: "For professionals and power users",
    features: [
      "All Free features",
      "Unlimited projects",
      "Priority support",
      "50GB storage",
      "Advanced analytics",
      "Custom integrations",
    ],
    buttonText: "Upgrade to Premium",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/month",
    description: "For teams and organizations",
    features: [
      "All Premium features",
      "Unlimited team members",
      "Dedicated support",
      "500GB storage",
      "Custom branding",
      "API access",
      "SLA guarantee",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
  },
]

export function PremiumPlans() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`relative p-6 flex flex-col ${plan.popular ? "border-[#2563eb] border-2 shadow-lg" : ""}`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563eb] text-white px-3 py-1 rounded-full text-xs font-medium">
              Most Popular
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>

          <ul className="space-y-3 mb-6 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            variant={plan.buttonVariant}
            className={
              plan.buttonVariant === "default" ? "w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white" : "w-full"
            }
          >
            {plan.buttonText}
          </Button>
        </Card>
      ))}
    </div>
  )
}
