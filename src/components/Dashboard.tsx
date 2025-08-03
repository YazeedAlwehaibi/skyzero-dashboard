import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Fuel,
  Zap,
  Plane,
  Droplets,
  Trash2,
  Car,
  Sun,
  Building,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  BarChart3,
  Leaf
} from "lucide-react";

const emissionBaseSources = [
  { id: "GSE", title: "GSE Fuel & Energy", icon: Fuel, unit: "tCO₂e", dataSource: "Telematics", description: "Ground Support Equipment emissions from fuel consumption" },
  { id: "Electricity", title: "Terminal Electricity", icon: Zap, unit: "tCO₂e", dataSource: "Utility Bills", description: "HVAC, lighting, and facility power consumption" },
  { id: "Aircraft", title: "Aircraft Operations", icon: Plane, unit: "tCO₂e", dataSource: "APIs", description: "Landing, takeoff, and auxiliary power unit emissions" },
  { id: "Water", title: "Water Use", icon: Droplets, unit: "tCO₂e", dataSource: "Manual Upload", description: "Scope 2 emissions from water treatment and supply" },
  { id: "Waste", title: "Waste Generation", icon: Trash2, unit: "tCO₂e", dataSource: "Manual Upload", description: "Waste processing and disposal emissions" },
  { id: "Renewable", title: "Renewable Energy", icon: Sun, unit: "tCO₂e", dataSource: "Smart Meters", description: "Carbon offset from solar and renewable energy certificates" },
];

const getDataSourceBadge = (source: string) => {
  const variants: Record<string, string> = {
    "Smart Meters": "default",
    "APIs": "secondary",
    "Telematics": "outline",
    "Utility Bills": "secondary",
    "Manual Upload": "outline",
    "BIM/LCA": "outline"
  };
  return variants[source] || "outline";
};

export default function Dashboard() {
  const [selectedTerminal, setSelectedTerminal] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [emissionData, setEmissionData] = useState<any>({});
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [efficiency, setefficiency] = useState(0);

  useEffect(() => {
    fetch("/api/total_emissions")
      .then(res => res.json())
      .then(data => {
        setEmissionData(data.breakdown);  // ✅ هذا الصحيح
        setTotalEmissions(data.total);
        setNetEmissions(data.net_emissions);
        setefficiency(data.efficiency);
      })
      .catch(err => console.error("Failed to fetch emissions", err));
  }, []);

    const handleGenerateReport = () => {
    fetch("/api/export_offset_report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "offset-report.pdf";
        a.click();
        a.remove();
      })
      .catch((err) => {
        console.error("PDF generation failed", err);
      });
  };
const [netEmissions, setNetEmissions] = useState(0);
const [totalOffset, setTotalOffset] = useState(0);
  return (
    <div className="min-h-screen bg-gradient-surface p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Carbon Emissions Dashboard</h1>
            <p className="text-muted-foreground text-lg">Real-time emissions tracking across all airport operations</p>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="neuro-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Emissions</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{Math.round(totalEmissions)} tCO₂e</div>
              <p className="text-xs text-muted-foreground">Across all emission sources</p>
            </CardContent>
          </Card>

          <Card className="neuro-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Emissions</CardTitle>
              <Leaf className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{netEmissions.toLocaleString()} tCO₂e</div>
              <p className="text-xs text-success">After carbon offsets</p>
            </CardContent>
          </Card>

          <Card className="neuro-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Efficiency Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {efficiency.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
              </div>
              <Progress value={efficiency} className="mt-2" />

              {/* النص الديناميكي حسب النسبة واللون */}
              <p
                className={`text-xs mt-2 ${
                  efficiency < 50
                    ? "text-red-500"
                    : efficiency <= 80
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {efficiency < 50
                  ? "Below industry average"
                  : efficiency <= 80
                  ? "Industry average"
                  : "Above industry average"}
              </p>
            </CardContent>
          </Card>

        </div>

        <h2 className="text-2xl font-semibold mb-6 text-foreground">Real-Time Carbon Emissions by Source</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emissionBaseSources.map((source) => {
            const IconComponent = source.icon;
            const data = emissionData[source.id] || { value: 0, change: 0 };
            const isNegative = data.value < 0;

            return (
              <Card key={source.id} className="neuro-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{source.title}</CardTitle>
                  <IconComponent className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className={`text-2xl font-bold ${isNegative ? 'text-success' : 'text-foreground'}`}>
                      {isNegative ? '' : '+'}{data.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </div>
                    <div className="text-xs text-muted-foreground">{source.unit}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {data.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-warning" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-success" />
                      )}
                      <span className={`text-xs ${data.change > 0 ? 'text-warning' : 'text-success'}`}>
                        {Math.abs(data.change).toFixed(1)}%
                      </span>
                    </div>
                    <Badge variant={getDataSourceBadge(source.dataSource) as any} className="text-xs">
                      {source.dataSource}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{source.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button className="glow-button" onClick={handleGenerateReport}>Generate Report</Button>
        </div>
      </div>
    </div>
  );
}
