import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Zap, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    icon: Zap,
    features: [
      "1 undangan digital",
      "Tema basic (Classic Elegant)",
      "Form RSVP",
      "Pesan tamu",
      "Watermark WedSaaS",
    ],
    notIncluded: [
      "Tema premium",
      "Digital gift",
      "Analytics",
      "Tanpa watermark",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "Rp 99.000",
    period: "per undangan",
    icon: Crown,
    features: [
      "Semua fitur Free",
      "Semua tema premium",
      "Digital gift registry",
      "Analytics lengkap",
      "Tanpa watermark",
      "Prioritas support",
    ],
    notIncluded: [],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "Rp 299.000",
    period: "per bulan",
    icon: Building2,
    features: [
      "Undangan tidak terbatas",
      "Semua fitur Premium",
      "White label",
      "Custom domain (segera hadir)",
      "Dedicated support",
    ],
    notIncluded: [],
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = (planId: string) => {
    toast({
      title: "Fitur pembayaran segera hadir",
      description: "Integrasi payment gateway sedang dalam pengembangan. Hubungi kami untuk informasi lebih lanjut.",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Langganan</h1>
        <p className="text-sm text-muted-foreground">Pilih paket yang sesuai dengan kebutuhanmu</p>
      </div>

      {/* Current Plan Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Paket Saat Ini</p>
              <p className="text-lg font-bold text-foreground capitalize">{user?.plan || "Free"}</p>
            </div>
            <Badge variant={user?.plan === "premium" ? "default" : "secondary"} className="capitalize">
              {user?.plan === "premium" && <Crown className="w-3 h-3 mr-1" />}
              {user?.plan || "Free"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id;
          return (
            <Card
              key={plan.id}
              className={`relative ${plan.highlighted ? "border-primary shadow-md" : ""}`}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="text-xs">Paling Populer</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${plan.highlighted ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <plan.icon className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {isCurrentPlan && <Badge variant="secondary" className="text-xs ml-auto">Aktif</Badge>}
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through opacity-50">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrentPlan ? "secondary" : plan.highlighted ? "default" : "outline"}
                  className="w-full"
                  disabled={isCurrentPlan}
                  onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  {isCurrentPlan ? "Paket Aktif" : `Pilih ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground text-center">
            Butuh bantuan memilih paket? Hubungi kami di{" "}
            <a href="mailto:hello@wedsaas.app" className="text-primary font-medium">hello@wedsaas.app</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
