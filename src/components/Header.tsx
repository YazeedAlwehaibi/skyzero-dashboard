import { Bell, Settings, User, BarChart3, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import skyZeroLogo from "@/assets/skyzero-logo.png";

export default function Header() {
  const location = useLocation();
  
  return (
    <header className="neuro-card sticky top-0 z-50 w-full border-neuro-border">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <img 
            src={skyZeroLogo} 
            alt="Skyzero" 
            className="h-8 w-auto"
          />
          <div className="hidden md:block">
            <h1 className="text-xl font-bold gradient-text">Skyzero</h1>
            <p className="text-xs text-muted-foreground">Carbon Emissions Platform</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === "/" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          
          <Link
            to="/carbon-offset-analysis"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === "/carbon-offset-analysis" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-medium">Offset Analysis</span>
          </Link>

        </nav>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-destructive rounded-full pulse-glow"></div>
            <span className="text-sm text-muted-foreground">Live Data</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Last Update: 2 min ago
          </Badge>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}