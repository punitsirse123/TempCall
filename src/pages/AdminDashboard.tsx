import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TimeSlots from "@/components/admin/TimeSlots";
import Appointments from "@/components/admin/Appointments";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("time-slots");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-8 hidden md:flex">
            <Link to="/admin" className="text-lg font-semibold">
              Lumen Ads Admin
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/admin"
              className={`flex items-center space-x-2 ${
                activeTab === "time-slots" ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("time-slots")}
            >
              <Calendar className="h-4 w-4" />
              <span>Time Slots</span>
            </Link>
            <Link
              to="/admin/appointments"
              className={`flex items-center space-x-2 ${
                activeTab === "appointments" ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("appointments")}
            >
              <Users className="h-4 w-4" />
              <span>Appointments</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-9 w-9"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<TimeSlots />} />
          <Route path="/appointments" element={<Appointments />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;