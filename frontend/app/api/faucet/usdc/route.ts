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

    const response = await fetch("https://faucet.circle.com/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "apollo-require-preflight": "true",
        "Origin": "https://faucet.circle.com",
        "Referer": "https://faucet.circle.com/",
      },
      body: JSON.stringify({
        operationName: "RequestToken",
        variables: {
          input: {
            destinationAddress: address,
            token: "USDC",
            blockchain: "ETH"
          }
        },
        query: `mutation RequestToken($input: RequestTokenInput!) {
          requestToken(input: $input) {
            ...RequestTokenResponseInfo
            __typename
          }
        }

        fragment RequestTokenResponseInfo on RequestTokenResponse {
          amount
          blockchain
          contractAddress
          currency
          destinationAddress
          explorerLink
          hash
          status
          __typename
        }`
      })
    });

    const data = await response.json();

    console.log("=".repeat(80));
    console.log("USDC Faucet Response:");
    console.log("Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));
    console.log("=".repeat(80));

    if (data.data?.requestToken) {
      console.log("✅ Success - returning data:", data.data.requestToken);
      return NextResponse.json({
        success: true,
        data: data.data.requestToken
      });
    } else if (data.errors) {
      console.log("❌ GraphQL Errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || "USDC Faucet request failed" },
        { status: 400 }
      );
    } else {
      console.log("❌ Unknown error - no data or errors in response");
      return NextResponse.json(
        { error: "USDC Faucet request failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("USDC Faucet error:", error);
    return NextResponse.json(
      { error: "Failed to request USDC from faucet" },
      { status: 500 }
    );
  }
}
