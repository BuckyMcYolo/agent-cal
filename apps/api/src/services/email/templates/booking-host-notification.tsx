/** @jsxImportSource react */
import { serverEnv } from "@workspace/env-config/server"
import { getResendClient } from "../client"

interface BookingHostNotificationEmailProps {
  hostName: string
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  startTime: string
  endTime: string
  timezone: string
  location?: string | null
  meetingUrl?: string | null
  manageUrl: string
}

export interface SendBookingHostNotificationParams
  extends BookingHostNotificationEmailProps {
  to: string
}

export async function sendBookingHostNotification(
  params: SendBookingHostNotificationParams
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
      subject: `New Booking: ${params.eventTitle} with ${params.attendeeName}`,
      react: (
        <BookingHostNotificationEmail
          hostName={params.hostName}
          attendeeName={params.attendeeName}
          attendeeEmail={params.attendeeEmail}
          eventTitle={params.eventTitle}
          startTime={params.startTime}
          endTime={params.endTime}
          timezone={params.timezone}
          location={params.location}
          meetingUrl={params.meetingUrl}
          manageUrl={params.manageUrl}
        />
      ),
    })

    if (error) {
      console.error("[Email] Failed to send host notification:", error)
      return { success: false, error: error.message }
    }

    console.log("[Email] Host notification sent:", data?.id)
    return { success: true }
  } catch (err) {
    console.error("[Email] Error sending host notification:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

function BookingHostNotificationEmail({
  hostName,
  attendeeName,
  attendeeEmail,
  eventTitle,
  startTime,
  endTime,
  timezone,
  location,
  meetingUrl,
  manageUrl,
}: BookingHostNotificationEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#333", fontSize: "24px" }}>New Booking</h1>

      <p style={{ color: "#666", fontSize: "16px" }}>Hi {hostName},</p>

      <p style={{ color: "#666", fontSize: "16px" }}>
        You have a new booking with <strong>{attendeeName}</strong>.
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

        <p style={{ color: "#666", fontSize: "14px", margin: "8px 0" }}>
          <strong>Attendee:</strong> {attendeeName} ({attendeeEmail})
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
          href={manageUrl}
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#0066cc",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "6px",
          }}
        >
          View Booking
        </a>
      </div>

      <p style={{ color: "#999", fontSize: "12px" }}>
        This booking has been added to your calendar.
      </p>
    </div>
  )
}
