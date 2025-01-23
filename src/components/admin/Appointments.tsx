import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

const Appointments = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          time_slots (
            start_time,
            end_time
          )
        `)
        .gte("created_at", date ? format(date, "yyyy-MM-dd") : "")
        .lte("created_at", date ? format(date, "yyyy-MM-dd 23:59:59") : "")
        .order("created_at");

      if (error) throw error;
      return data;
    },
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "confirmed" | "cancelled";
    }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appointments</h2>

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
              {appointments?.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{appointment.client_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {appointment.client_email}
                      </p>
                      <p className="text-sm">
                        {format(
                          new Date(appointment.time_slots.start_time),
                          "MMMM d, yyyy h:mm a"
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(appointment.time_slots.end_time),
                          "h:mm a"
                        )}
                      </p>
                    </div>
                    <div className="space-x-2">
                      {appointment.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateAppointmentStatus.mutate({
                                id: appointment.id,
                                status: "confirmed",
                              })
                            }
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateAppointmentStatus.mutate({
                                id: appointment.id,
                                status: "cancelled",
                              })
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === "confirmed"
                          ? "bg-green-500/10 text-green-500"
                          : appointment.status === "cancelled"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                  {appointment.notes && (
                    <p className="text-sm text-muted-foreground">
                      Notes: {appointment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;