import { serverEnv } from "@workspace/env-config/server"
import { getResendClient } from "../client"

interface BookingRescheduledEmailProps {
  recipientName: string
  otherPartyName: string
  eventTitle: string
  oldStartTime: string
  oldEndTime: string
  newStartTime: string
  newEndTime: string
  timezone: string
  location?: string | null
  meetingUrl?: string | null
  isHost: boolean
  cancelUrl?: string
  rescheduleUrl?: string
}

export interface SendBookingRescheduledParams
  extends Omit<BookingRescheduledEmailProps, "isHost"> {
  to: string
  isHost: boolean
}

export async function sendBookingRescheduled(
  params: SendBookingRescheduledParams
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
      subject: `Booking Rescheduled: ${params.eventTitle}`,
      react: (
        <BookingRescheduledEmail
          recipientName={params.recipientName}
          otherPartyName={params.otherPartyName}
          eventTitle={params.eventTitle}
          oldStartTime={params.oldStartTime}
          oldEndTime={params.oldEndTime}
          newStartTime={params.newStartTime}
          newEndTime={params.newEndTime}
          timezone={params.timezone}
          location={params.location}
          meetingUrl={params.meetingUrl}
          isHost={params.isHost}
          cancelUrl={params.cancelUrl}
          rescheduleUrl={params.rescheduleUrl}
        />
      ),
    })

    if (error) {
      console.error("[Email] Failed to send reschedule email:", error)
      return { success: false, error: error.message }
    }

    console.log("[Email] Reschedule email sent:", data?.id)
    return { success: true }
  } catch (err) {
    console.error("[Email] Error sending reschedule email:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

function BookingRescheduledEmail({
  recipientName,
  otherPartyName,
  eventTitle,
  oldStartTime,
  oldEndTime,
  newStartTime,
  newEndTime,
  timezone,
  location,
  meetingUrl,
  isHost,
  cancelUrl,
  rescheduleUrl,
}: BookingRescheduledEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#0066cc", fontSize: "24px" }}>
        Booking Rescheduled
      </h1>

      <p style={{ color: "#666", fontSize: "16px" }}>Hi {recipientName},</p>

      <p style={{ color: "#666", fontSize: "16px" }}>
        {isHost
          ? `Your booking with ${otherPartyName} has been rescheduled.`
          : `Your booking with ${otherPartyName} has been rescheduled.`}
      </p>

      {/* Old time - crossed out */}
      <div
        style={{
          backgroundColor: "#fff5f5",
          padding: "15px",
          borderRadius: "8px",
          margin: "20px 0",
          borderLeft: "4px solid #cc0000",
        }}
      >
        <p style={{ color: "#999", fontSize: "12px", margin: "0 0 5px 0" }}>
          Previous time:
        </p>
        <p
          style={{
            color: "#999",
            fontSize: "14px",
            margin: "0",
            textDecoration: "line-through",
          }}
        >
          {oldStartTime} - {oldEndTime} ({timezone})
        </p>
      </div>

      {/* New time */}
      <div
        style={{
          backgroundColor: "#f0fff4",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
          borderLeft: "4px solid #00cc66",
        }}
      >
        <p style={{ color: "#00cc66", fontSize: "12px", margin: "0 0 5px 0" }}>
          New time:
        </p>
        <h2 style={{ color: "#333", fontSize: "18px", margin: "0 0 15px 0" }}>
          {eventTitle}
        </h2>

        <p style={{ color: "#333", fontSize: "14px", margin: "8px 0" }}>
          <strong>When:</strong> {newStartTime} - {newEndTime} ({timezone})
        </p>

        {location && (
          <p style={{ color: "#666", fontSize: "14px", margin: "8px 0" }}>
            <strong>Where:</strong> {location}
          </p>
        )}

        {meetingUrl && (
          <p style={{ color: "#666", fontSize: "14px", margin: "8px 0" }}>
            <strong>Meeting Link:</strong>{" "}
            <a href={meetingUrl} style={{ color: "#0066cc" }}>
              Join Meeting
            </a>
          </p>
        )}
      </div>

      {!isHost && cancelUrl && rescheduleUrl && (
        <div style={{ margin: "30px 0" }}>
          <a
            href={rescheduleUrl}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#0066cc",
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: "6px",
              marginRight: "10px",
            }}
          >
            Reschedule Again
          </a>
          <a
            href={cancelUrl}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#ffffff",
              color: "#cc0000",
              textDecoration: "none",
              borderRadius: "6px",
              border: "1px solid #cc0000",
            }}
          >
            Cancel
          </a>
        </div>
      )}

      <p style={{ color: "#999", fontSize: "12px" }}>
        Your calendar has been updated with the new time.
      </p>
    </div>
  )
}
