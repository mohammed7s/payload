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
            amount
            blockchain
            contractAddress
            currency
            destinationAddress
            explorerLink
            hash
            status
            __typename
          }
        }`
      })
    });

    const data = await response.json();

    if (data.data?.requestToken) {
      return NextResponse.json({
        success: true,
        data: data.data.requestToken
      });
    } else if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0]?.message || "USDC Faucet request failed" },
        { status: 400 }
      );
    } else {
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
