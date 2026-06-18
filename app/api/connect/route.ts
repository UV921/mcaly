import {auth} from "@clerk/nextjs/server"
import { generateOAuthUrl } from "corsair/oauth"
import{corsair} from "@/lib/corsair";
import { NextRequest,NextResponse } from "next/server";



export async function GET(request:NextRequest){
    //so this is a request for the user who click that for connecting the email 
    const REDIRECT_URI=`${process.env.APP_URL}/api/auth`

    const{userId}= await auth();
    if (!userId) {
        return NextResponse.json({
            error: "unauthorized"
        }, { status: 401 })
    }

    const plugin = new URL(request.url).searchParams.get("plugin")

    if (!plugin) {
        return NextResponse.json({
            error: "missing plugin"
        }, { status: 400 })
    }

    const { state, url } = await generateOAuthUrl(corsair, plugin, {
        tenantId: userId,
        redirectUri: REDIRECT_URI
    })

    const response = NextResponse.redirect(url);
    response.cookies.set("oauth_state",state,{
        httpOnly:true,
        sameSite:"lax",
        secure:process.env.NODE_ENV==="production",
        maxAge:60*10,
    })

    return response;

} 