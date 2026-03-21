export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return Response.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEWSLETTER_API_KEY;
    if (!apiKey) {
      console.error("NEWSLETTER_API_KEY environment variable is not set.");
      return Response.json(
        { error: "Newsletter service is not configured." },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({ email_address: email }),
    });

    if (res.ok) {
      return Response.json({ success: true });
    }

    if (res.status === 409) {
      return Response.json({ success: true });
    }

    const errorData = await res.json().catch(() => null);
    console.error("Buttondown API error:", res.status, errorData);

    return Response.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return Response.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
