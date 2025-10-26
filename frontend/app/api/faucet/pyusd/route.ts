import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.sandbox.paxos.com/v2/treasury/faucet/transfers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: "PYUSD",
        network: "ETHEREUM",
        address: address
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        data
      });
    } else if (response.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    } else {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || "PYUSD Faucet request failed" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("PYUSD Faucet error:", error);
    return NextResponse.json(
      { error: "Failed to request PYUSD from faucet" },
      { status: 500 }
    );
  }
}
