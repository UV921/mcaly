import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/lib/corsair"
import { NextRequest, NextResponse } from "next/server";

const REDIRECT_URI = `${process.env.APP_URL}/api/auth`;

export async function GET(request: NextRequest) {
    
    const {searchParams}=new URL(request.url)
    const code=searchParams.get("code")
    const state=searchParams.get("state")

    if(!code || !state){
        return  NextResponse.json("missing code or secret",{
            status:400
        
            
        });
    }
    const storedState=request.cookies.get("oauth_state")?.value

    if(!storedState || storedState!=state){
        return NextResponse.json("invalid state",{
            status:400,
        })
    }
    try {
        await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri: REDIRECT_URI,
        });

        const response = NextResponse.redirect(new URL("/onboarding", request.url))
        response.cookies.delete("oauth_state");
        return response;

    } catch {
        return new NextResponse("oauth failed", {
            status: 500
        })
    }
}