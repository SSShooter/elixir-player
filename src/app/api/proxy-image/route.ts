import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
        return new NextResponse("Missing URL parameter", { status: 400 })
    }

    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const headers = new Headers()
        headers.set("Content-Type", blob.type)
        headers.set("Cache-Control", "public, max-age=31536000, immutable")

        return new NextResponse(buffer, {
            headers,
        })
    } catch (error) {
        console.error("Error proxying image:", error)
        return new NextResponse("Failed to proxy image", { status: 500 })
    }
}
