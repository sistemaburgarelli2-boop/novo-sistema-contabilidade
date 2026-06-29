import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params;
  const limpo = cep.replace(/\D/g, "");
  if (limpo.length !== 8) {
    return NextResponse.json({ erro: true }, { status: 400 });
  }
  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ erro: true }, { status: 502 });
  }
}
