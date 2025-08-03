import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Trees,
  Fuel,
  Target,
  TrendingDown,
  Leaf,
  Plane,
  Calculator,
  Award,
  Plus,
  Minus,
  Factory,
  Wind
} from "lucide-react";

interface OffsetStrategy {
  id: string;
  type: string;
  value: number;
  unit: string;
  impactRate: number; // kg CO2 per unit
}

interface OffsetType {
  name: string;
  unit: string;
  impactRate: number; // kg CO2 per unit
  icon: string;
  color: string;
}

const offsetTypes: OffsetType[] = [
  {
    name: "Tree Planting",
    unit: "trees",
    impactRate: 0.025, // ✅ تحديث بناءً على متوسط الأشجار في مناخ السعودية
    icon: "🌳",
    color: "green-500"
  },
  {
    name: "RECs",
    unit: "MWh",
    impactRate: 0.568, // ✅ تحديث بناءً على عامل الانبعاث في شبكة الكهرباء السعودية
    icon: "📜",
    color: "yellow-500"
  },
  {
    name: "Carbon Credit",
    unit: "tCO₂e",
    impactRate: 1, // ✅ ثابت عالمي (1 طن = 1000 كجم)
    icon: "📜",
    color: "purple-500"
  },
  {
    name: "Renewable Energy",
    unit: "MWh",
    impactRate: 0.568, // ✅ نفس قيمة RECs لأنها تعوض نفس كمية الانبعاثات
    icon: "⚡",
    color: "blue-500"
  }
];


import Header from "@/components/Header";

export default function CarbonOffsetAnalysis() {
  const [strategies, setStrategies] = useState<OffsetStrategy[]>([
    { id: "1", type: "Tree Planting", value: 1000, unit: "trees", impactRate: 0.025 },

  ]);
// عند فتح الصفحة، نحمل البيانات من التخزين المحلي
useEffect(() => {
  const savedStrategies = localStorage.getItem("offset_strategies");
  if (savedStrategies) {
    setStrategies(JSON.parse(savedStrategies));
  }
}, []);

// عند كل تعديل على الاستراتيجيات، نحفظها
useEffect(() => {
  localStorage.setItem("offset_strategies", JSON.stringify(strategies));
}, [strategies]);

  // داخل function CarbonOffsetAnalysis() { ... }

const handleGenerateReport = () => {
  fetch("http://localhost:5000/api/export_offset_report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      baselineEmissions,
      totalOffset,
      netEmissions,
      reductionPercentage,
      strategies: strategies.map((s) => ({
        type: s.type,
        value: s.value,
        impact: calculateStrategyImpact(s).toFixed(0),
        percentage: ((calculateStrategyImpact(s) / totalOffset) * 100).toFixed(0)
      }))
    })
  })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "offset-report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(err => console.error("Download failed:", err));
};

  const [totalEmissions, setTotalEmissions] = useState(0);
  const [emissionData, setEmissionData] = useState<any>({});

  useEffect(() => {
    fetch("/api/total_emissions")
      .then(res => res.json())
      .then(data => {
        setEmissionData(data.breakdown);  // ✅ هذا الصحيح
        setTotalEmissions(data.total);
      })
      .catch(err => console.error("Failed to fetch emissions", err));
  }, []);
  // Mock baseline emissions data
  const baselineEmissions = 5847; // kg CO2

  // Calculate total offset
  const totalOffset = strategies.reduce((total, strategy) => {
    if (strategy.type === "SAF Usage") {
      return total + (totalEmissions  * strategy.value / 100 * 0.8);
    }
    return total + (strategy.value * strategy.impactRate);
  }, 0);

  const netEmissions = Math.max(0, totalEmissions  - totalOffset);
  const reductionPercentage = Math.min(100, (totalOffset / (totalEmissions )) * 100);
  const isNetZero = netEmissions <= 0.1;

  const addStrategy = () => {
    const newStrategy: OffsetStrategy = {
      id: Date.now().toString(),
      type: "Tree Planting",
      value: 100,
      unit: "trees",
      impactRate: 22
    };
    setStrategies([...strategies, newStrategy]);
  };

  const removeStrategy = (id: string) => {
    setStrategies(strategies.filter(s => s.id !== id));
  };

  const updateStrategy = (id: string, field: keyof OffsetStrategy, value: any) => {
    setStrategies(strategies.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === 'type') {
          const offsetType = offsetTypes.find(t => t.name === value);
          if (offsetType) {
            updated.unit = offsetType.unit;
            updated.impactRate = offsetType.impactRate;
          }
        }
        return updated;
      }
      return s;
    }));
  };

  const getOffsetIcon = (type: string) => {
    const offsetType = offsetTypes.find(t => t.name === type);
    return offsetType?.icon || "🌳";
  };

  const getOffsetColor = (type: string) => {
    const offsetType = offsetTypes.find(t => t.name === type);
    return offsetType?.color || "gray-400";
  };

  const tailwindColor = (color: string) => {
    const colors: { [key: string]: string } = {
      "green-500": "#22c55e",
      "yellow-500": "#eab308",
      "purple-500": "#a855f7",
      "blue-500": "#3b82f6",
      "gray-400": "#9ca3af" // fallback
    };
    return colors[color] || "#999";
  };


  const calculateStrategyImpact = (strategy: OffsetStrategy) => {
    if (strategy.type === "SAF Usage") {
      return (totalEmissions  * strategy.value / 100 * 0.8) ;
    }
    return (strategy.value * strategy.impactRate);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="bg-gradient-surface p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">
            Carbon Offset Analysis
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Design and visualize multiple carbon offset strategies to achieve net-zero emissions.
            Mix different offset types to optimize your carbon reduction approach.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Panel - Input Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="neuro-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <span>Offset Strategies</span>
                  </span>
                  <Button
                    size="sm"
                    onClick={addStrategy}
                    className="glow-button"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {strategies.map((strategy, index) => (
                  <div key={strategy.id} className="space-y-4 p-4 neuro-inset rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getOffsetIcon(strategy.type)}</span>
                        <span className="font-medium text-sm">Strategy {index + 1}</span>
                      </div>
                      {strategies.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStrategy(strategy.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Select
                        value={strategy.type}
                        onValueChange={(value) => updateStrategy(strategy.id, 'type', value)}
                      >
                        <SelectTrigger className="w-full neuro-inset">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {offsetTypes.map((type) => (
                            <SelectItem key={type.name} value={type.name}>
                              <div className="flex items-center space-x-2">
                                <span>{type.icon}</span>
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Value</label>
                          <Badge variant="outline" className="text-xs">
                            {strategy.value} {strategy.unit}
                          </Badge>
                        </div>

                        {strategy.type === "SAF Usage" ? (
                          <Slider
                            value={[strategy.value]}
                            onValueChange={([value]) => updateStrategy(strategy.id, 'value', value)}
                            min={0}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={strategy.value}
                              onChange={(e) => updateStrategy(strategy.id, 'value', parseInt(e.target.value) || 0)}
                              className="neuro-inset"
                              min={0}
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-2 bg-muted/50 rounded text-xs">
                        <span className="font-medium">Impact: </span>
                        <span className={`text-${getOffsetColor(strategy.type)} font-bold`}>
                          -{calculateStrategyImpact(strategy).toFixed(0)} tCO₂
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Impact Summary */}
                <div className="p-4 neuro-inset rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Total Impact:</h4>
                  <div className="space-y-1 text-xs">
                    {strategies.map((strategy) => (
                      <div key={strategy.id} className="flex justify-between">
                        <span>{strategy.type}:</span>
                        <span className={`text-${getOffsetColor(strategy.type)} font-medium`}>
                          -{calculateStrategyImpact(strategy).toFixed(0)} tCO₂
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 border-t border-border">
                      <span className="font-medium">Combined Offset:</span>
                      <span className="text-primary font-bold">-{totalOffset.toFixed(0)} tCO₂</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results & Visualizations */}
          <div className="lg:col-span-2 space-y-6">

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="neuro-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Emissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {(totalEmissions ).toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">tCO₂e</div>
                </CardContent>
              </Card>

              <Card className="neuro-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Offset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {totalOffset.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">tCO₂e reduced</div>
                </CardContent>
              </Card>

              <Card className="neuro-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Net Emissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isNetZero ? 'text-success' : 'text-foreground'}`}>
                    {Math.max(0, (totalEmissions  - totalOffset)).toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">tCO₂e remaining</div>
                </CardContent>
              </Card>

              <Card className="neuro-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {reductionPercentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">achieved</div>
                </CardContent>
              </Card>
            </div>

            {/* Visualization Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Progress to Net Zero */}
              <Card className="neuro-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Progress to Net Zero</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    <div className="text-center mb-4">
                      <div className={`text-6xl font-bold ${isNetZero ? 'text-success' : 'text-primary'}`}>
                        {Math.min(100, reductionPercentage).toFixed(0)}%
                      </div>
                      <div className="text-muted-foreground">towards net zero</div>
                    </div>

                    <Progress
                      value={Math.min(100, reductionPercentage)}
                      className="h-3"
                    />

                    {isNetZero && (
                      <div className="flex items-center justify-center mt-4 p-3 bg-success-light rounded-lg">
                        <Award className="h-5 w-5 text-success mr-2" />
                        <span className="text-success font-medium">Net Zero Achieved!</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Carbon Forest Visualization */}
              <Card className="neuro-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Leaf className="h-5 w-5 text-success" />
                    <span>Offset Visualization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {strategies.map((strategy) => {
                      const impact = calculateStrategyImpact(strategy);
                      const impactPercentage = totalOffset > 0 ? (impact / totalOffset) * 100 : 0;
                      const filledDots = Math.round((impactPercentage / 100) * 10);
                      const maxDots = 10;

                      return (
                        <div key={strategy.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center space-x-2">
                              <span>{getOffsetIcon(strategy.type)}</span>
                              <span>{strategy.type}</span>
                            </span>
                            <span className={`text-${getOffsetColor(strategy.type)} font-medium`}>
                              -{impact.toFixed(0)} tCO₂ ({impactPercentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="grid grid-cols-10 gap-1">
                            {Array.from({ length: maxDots }, (_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-all duration-700 ease-out ${
                                  i < filledDots ? "shadow-glow" : "bg-muted"
                                }`}
                                style={
                                  i < filledDots
                                    ? { backgroundColor: tailwindColor(getOffsetColor(strategy.type)) }
                                    : {}
                                }
                                title={`${((i + 1) / 10 * impactPercentage).toFixed(0)}% of total offset`}
                              />
                            ))}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center text-xs text-muted-foreground mt-4">
                    Each dot represents 10% of the offset strategy's contribution
                  </div>
                </CardContent>
              </Card>


            </div>

          </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex justify-center">
          <Button className="glow-button">
            Generate Offset Report
          </Button>
        </div> */}

      </div>
      </div>
    </div>
  );
}

