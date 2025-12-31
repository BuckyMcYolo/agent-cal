/** @jsxImportSource react */
import { serverEnv } from "@workspace/env-config/server"
import { getResendClient } from "../client"

interface BookingConfirmationEmailProps {
  attendeeName: string
  hostName: string
  eventTitle: string
  startTime: string // formatted date/time string
  endTime: string
  timezone: string
  location?: string | null
  meetingUrl?: string | null
  cancelUrl: string
  rescheduleUrl: string
}

export interface SendBookingConfirmationParams
  extends BookingConfirmationEmailProps {
  to: string
  hostEmail: string
}

export async function sendBookingConfirmation(
  params: SendBookingConfirmationParams
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
      cc: [params.hostEmail],
      subject: `Booking Confirmed: ${params.eventTitle}`,
      react: (
        <BookingConfirmationEmail
          attendeeName={params.attendeeName}
          hostName={params.hostName}
          eventTitle={params.eventTitle}
          startTime={params.startTime}
          endTime={params.endTime}
          timezone={params.timezone}
          location={params.location}
          meetingUrl={params.meetingUrl}
          cancelUrl={params.cancelUrl}
          rescheduleUrl={params.rescheduleUrl}
        />
      ),
    })

    if (error) {
      console.error("[Email] Failed to send booking confirmation:", error)
      return { success: false, error: error.message }
    }

    console.log("[Email] Booking confirmation sent:", data?.id)
    return { success: true }
  } catch (err) {
    console.error("[Email] Error sending booking confirmation:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

function BookingConfirmationEmail({
  attendeeName,
  hostName,
  eventTitle,
  startTime,
  endTime,
  timezone,
  location,
  meetingUrl,
  cancelUrl,
  rescheduleUrl,
}: BookingConfirmationEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#333", fontSize: "24px" }}>Booking Confirmed</h1>

      <p style={{ color: "#666", fontSize: "16px" }}>Hi {attendeeName},</p>

      <p style={{ color: "#666", fontSize: "16px" }}>
        Your booking with <strong>{hostName}</strong> has been confirmed.
      </p>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
        }}
      >
        <h2 style={{ color: "#333", fontSize: "18px", margin: "0 0 15px 0" }}>
          {eventTitle}
        </h2>

        <p style={{ color: "#666", fontSize: "14px", margin: "8px 0" }}>
          <strong>When:</strong> {startTime} - {endTime} ({timezone})
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
          Reschedule
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

      <p style={{ color: "#999", fontSize: "12px" }}>
        If you need to make changes to this booking, use the links above.
      </p>
    </div>
  )
}
