"use client";

/**
 * Last-resort boundary: renders when the root layout itself fails, so it must
 * bring its own <html> and <body> and cannot rely on the design tokens.
 */
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fbfaf7",
          color: "#12233d",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
            Something went wrong.
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#5b6474" }}>
            The application could not start. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#12233d",
              color: "#fbfaf7",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
            suppressHydrationWarning
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
