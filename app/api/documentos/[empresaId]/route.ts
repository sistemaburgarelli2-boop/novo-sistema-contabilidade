import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(_request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const { data, error } = await supabase
      .from("documentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return ok(data ?? []);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const formData = await request.formData();
    const file = formData.get("arquivo") as File | null;
    const categoria = (formData.get("categoria") as string) || "outros";
    const setor = (formData.get("setor") as string) || "geral";
    const competencia = (formData.get("competencia") as string) || null;

    if (!file) return fail("Arquivo é obrigatório.", 400);

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) return fail("Arquivo excede 10 MB.", 400);

    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${empresaId}/${Date.now()}_${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("documentos")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(storagePath);

    const { data, error } = await supabase.from("documentos").insert({
      empresa_id: empresaId,
      nome: file.name,
      categoria,
      setor,
      competencia,
      status: "recebido",
      arquivo_url: urlData.publicUrl,
      arquivo_nome: file.name,
      arquivo_tipo: ext,
      arquivo_tam: file.size,
      enviado_por: user.id,
    }).select("*").single();

    if (error) throw new Error(error.message);
    return ok(data, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
