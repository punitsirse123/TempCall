import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, User, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const { data: timeSlots, isLoading } = useQuery({
    queryKey: ["availableTimeSlots", selectedDate],
    queryFn: async () => {
      let query = supabase
        .from("time_slots")
        .select("*")
        .eq("is_available", true)
        .order("start_time");

      // Only add date filters if a date is selected
      if (selectedDate) {
        const startOfDay = format(selectedDate, "yyyy-MM-dd");
        const endOfDay = format(selectedDate, "yyyy-MM-dd 23:59:59");
        
        query = query
          .gte("start_time", startOfDay)
          .lte("start_time", endOfDay);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const bookAppointment = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) return;

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("appointments").insert([
        {
          time_slot_id: selectedSlot.id,
          user_id: user?.id,
          client_name: name,
          client_email: email,
          notes,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment booked successfully! We'll be in touch soon.");
      setSelectedSlot(null);
      setName("");
      setEmail("");
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    bookAppointment.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/10">
      <div className="w-full max-w-4xl">
        <Card className="glass-morphism">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              20-Min Free Consultation
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Skip the guesswork—connect with Lumen Ads for a quick, time-saving consultation.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span>Select a Date</span>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border glass-morphism"
                    disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 2))}
                  />
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>Available Time Slots</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots?.map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                          className={cn(
                            "w-full justify-center transition-all duration-200",
                            selectedSlot?.id === slot.id && "scale-105"
                          )}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {format(new Date(slot.start_time), "h:mm a")}
                        </Button>
                      ))}
                      {timeSlots?.length === 0 && (
                        <p className="col-span-2 text-center text-muted-foreground py-4">
                          No available slots for this date
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className={cn(
                "transition-all duration-300",
                selectedSlot ? "opacity-100 translate-y-0" : "opacity-50 translate-y-4"
              )}>
                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <User className="h-5 w-5 text-primary" />
                      <span>Your Information</span>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          className="glass-morphism"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Your email"
                          required
                          className="glass-morphism"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span>Additional Notes</span>
                    </div>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific topics you'd like to discuss?"
                      rows={3}
                      className="glass-morphism resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-lg py-6"
                    disabled={!selectedSlot || bookAppointment.isPending}
                  >
                    {bookAppointment.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Booking...</span>
                      </div>
                    ) : (
                      "Schedule Now"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;