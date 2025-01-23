import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

const TimeSlots = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: timeSlots, isLoading } = useQuery({
    queryKey: ["timeSlots", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .gte("start_time", date ? format(date, "yyyy-MM-dd") : "")
        .lte("start_time", date ? format(date, "yyyy-MM-dd 23:59:59") : "")
        .order("start_time");

      if (error) throw error;
      return data;
    },
  });

  const createTimeSlot = useMutation({
    mutationFn: async () => {
      if (!date || !startTime || !endTime) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const startDateTime = `${format(date, "yyyy-MM-dd")}T${startTime}:00`;
      const endDateTime = `${format(date, "yyyy-MM-dd")}T${endTime}:00`;

      const { error } = await supabase.from("time_slots").insert([
        {
          start_time: startDateTime,
          end_time: endDateTime,
          created_by: user.id,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      setIsOpen(false);
      toast.success("Time slot created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteTimeSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      toast.success("Time slot deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleCreateTimeSlot = (e: React.FormEvent) => {
    e.preventDefault();
    createTimeSlot.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Time Slots</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Create Time Slot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Time Slot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTimeSlot} className="space-y-4">
              <div className="space-y-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">End Time</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-4">
        <div className="w-fit">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>
        <div className="flex-1">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {timeSlots?.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(slot.start_time), "h:mm a")} -{" "}
                      {format(new Date(slot.end_time), "h:mm a")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(slot.start_time), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTimeSlot.mutate(slot.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeSlots;