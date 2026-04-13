import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

interface EnqueueInput {
  alertId?: string;
  channel: "email" | "telegram" | "push";
  recipient: string;
  subject?: string;
  body: string;
}

export function useNotificationQueue() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const enqueue = useMutation({
    mutationFn: async (input: EnqueueInput) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await db.from("notification_queue").insert({
        user_id: user.id,
        alert_id: input.alertId ?? null,
        channel: input.channel,
        recipient: input.recipient,
        subject: input.subject ?? null,
        body: input.body,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Notificação enfileirada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendAlertNotification = async (alert: {
    id: string;
    service: string;
    description: string;
    urgency: string;
    notify_channels?: string[];
  }, recipientEmail: string) => {
    const channels = alert.notify_channels?.length ? alert.notify_channels : ["email"];
    const subject = `[${alert.urgency.toUpperCase()}] Alerta: ${alert.service}`;
    const body = `Serviço: ${alert.service}\nDescrição: ${alert.description}\nUrgência: ${alert.urgency}`;

    for (const channel of channels) {
      await enqueue.mutateAsync({
        alertId: alert.id,
        channel: channel as "email" | "telegram" | "push",
        recipient: recipientEmail,
        subject,
        body,
      });
    }
  };

  return { enqueue, sendAlertNotification };
}
