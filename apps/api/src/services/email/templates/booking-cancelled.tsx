/** @jsxImportSource react */
import { serverEnv } from "@workspace/env-config/server"
import { getResendClient } from "../client"

interface BookingCancelledEmailProps {
  recipientName: string
  otherPartyName: string
  eventTitle: string
  startTime: string
  endTime: string
  timezone: string
  reason?: string | null
  isHost: boolean
}

export interface SendBookingCancelledParams
  extends Omit<BookingCancelledEmailProps, "isHost"> {
  to: string
  isHost: boolean
}

export async function sendBookingCancelled(
  params: SendBookingCancelledParams
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()

  if (!resend) {
    console.warn("[Email] Resend not configured, skipping email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: serverEnv.EMAIL_FROM,
      to: [params.to],
      subject: `Booking Cancelled: ${params.eventTitle}`,
      react: (
        <BookingCancelledEmail
          recipientName={params.recipientName}
          otherPartyName={params.otherPartyName}
          eventTitle={params.eventTitle}
          startTime={params.startTime}
          endTime={params.endTime}
          timezone={params.timezone}
          reason={params.reason}
          isHost={params.isHost}
        />
      ),
    })

    if (error) {
      console.error("[Email] Failed to send cancellation email:", error)
      return { success: false, error: error.message }
    }

    console.log("[Email] Cancellation email sent:", data?.id)
    return { success: true }
  } catch (err) {
    console.error("[Email] Error sending cancellation email:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

function BookingCancelledEmail({
  recipientName,
  otherPartyName,
  eventTitle,
  startTime,
  endTime,
  timezone,
  reason,
  isHost,
}: BookingCancelledEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#cc0000", fontSize: "24px" }}>Booking Cancelled</h1>

      <p style={{ color: "#666", fontSize: "16px" }}>Hi {recipientName},</p>

      <p style={{ color: "#666", fontSize: "16px" }}>
        {isHost
          ? `The booking with ${otherPartyName} has been cancelled.`
          : `Your booking with ${otherPartyName} has been cancelled.`}
      </p>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
          borderLeft: "4px solid #cc0000",
        }}
      >
        <h2
          style={{
            color: "#333",
            fontSize: "18px",
            margin: "0 0 15px 0",
            textDecoration: "line-through",
          }}
        >
          {eventTitle}
        </h2>

        <p
          style={{
            color: "#999",
            fontSize: "14px",
            margin: "8px 0",
            textDecoration: "line-through",
          }}
        >
          {startTime} - {endTime} ({timezone})
        </p>

        {reason && (
          <p style={{ color: "#666", fontSize: "14px", margin: "15px 0 0 0" }}>
            <strong>Reason:</strong> {reason}
          </p>
        )}
      </div>

      <p style={{ color: "#999", fontSize: "12px" }}>
        This booking has been removed from your calendar.
      </p>
    </div>
  )
}
