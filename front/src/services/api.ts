
//const BASE_URL = "http://192.168.253.18:3019/api";
const BASE_URL = "http://localhost:3019/api";

// ==========================================
// 🛠️ MOTOR BASE (Faz o trabalho sujo de headers e erros)
// ==========================================
async function apiFetch(endpoint: string, options: RequestInit = {}, errorMessage: string) {
    const isFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers);

    if (!isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorMessage);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

// ==========================================
// 📄 DOCUMENTOS / HISTÓRICO
// ==========================================
export async function salvarDocumento(tipoTela: string, dados: any, excelBlob: Blob, nomeArquivo: string) {
    const formData = new FormData();
    formData.append("excel", excelBlob, nomeArquivo);
    formData.append("tipoTela", tipoTela);
    formData.append("dados", JSON.stringify(dados));
    return apiFetch("/documentos/salvar", { method: "POST", body: formData }, "Erro ao salvar o documento.");
}

export async function obterHistorico(tipoTela: string) {
    return apiFetch(`/documentos/historico/${tipoTela}`, {}, "Erro ao buscar o histórico.");
}

export function getUrlDownload(idArquivo: string) {
    return `${BASE_URL}/documentos/download/${idArquivo}`;
}

export async function deletarRegistro(rota: string, id: string) {
    return apiFetch(`/documentos/${rota}/${id}`, { method: "DELETE" }, "Erro ao deletar o registro.");
}

// ==========================================
// 📦 PRODUTOS / ESTOQUE
// ==========================================
export async function buscarProdutos(tipo: string) {
    return apiFetch(`/produtos?tipo=${tipo}`, {}, `Erro ao buscar os produtos do tipo ${tipo}.`);
}

export async function adicionarProduto(nome: string, tipo: string, unidade: string, quantidade: string = "0") {
    return apiFetch("/produtos", { method: 'POST', body: JSON.stringify({ nome, tipo, unidade, quantidade }) }, "Erro ao salvar produto.");
}

export async function atualizarSaldosProdutos(produtosAtualizados: any) {
    return apiFetch("/produtos/saldos", { method: 'PUT', body: JSON.stringify({ produtosAtualizados }) }, "Erro ao atualizar saldos.");
}

// ==========================================
// ✂️ TESOURAS
// ==========================================
export async function listarColaboradoresTesoura() {
    return apiFetch("/colaboradores-tesoura", { cache: 'no-store' }, "Erro ao buscar colaboradores de tesoura.");
}

export async function criarColaboradorTesoura(dados: any) {
    return apiFetch("/colaboradores-tesoura", { method: "POST", body: JSON.stringify(dados) }, "Erro ao criar colaborador.");
}

export async function atualizarColaboradorTesoura(id: string, dados: any) {
    return apiFetch(`/colaboradores-tesoura/${id}`, { method: "PUT", body: JSON.stringify(dados) }, "Erro ao atualizar colaborador.");
}

export async function desligarColaboradorTesoura(id: string) {
    return apiFetch(`/colaboradores-tesoura/${id}/desligar`, { method: "PATCH" }, "Erro ao desligar colaborador.");
}

// ==========================================
// 👓 COLABORADORES ÓCULOS
// ==========================================
export async function listarColaboradoresOculos() {
    return apiFetch("/oculos/colaboradores", { cache: 'no-store' }, "Erro ao buscar colaboradores de óculos.");
}

export async function criarColaboradorOculos(dados: any) {
    return apiFetch("/oculos/colaboradores", { method: "POST", body: JSON.stringify(dados) }, "Erro ao criar colaborador de óculos.");
}

export async function desativarColaboradorOculos(id: string) {
    return apiFetch(`/oculos/colaboradores/${id}/desativar`, { method: "PATCH" }, "Erro ao desativar colaborador.");
}

export async function atualizarTipoColaboradorOculos(id: string, tipo: "EFETIVO" | "CONTRATADO") {
    return apiFetch(`/oculos/colaboradores/${id}/tipo`, { method: "PATCH", body: JSON.stringify({ tipo }) }, "Erro ao atualizar tipo do colaborador.");
}

export async function atualizarColaboradorOculos(id: string, dados: any) {
    return apiFetch(
        `/oculos/colaboradores/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(dados) // 🔥 sem "status: ATIVO"
        },
        "Erro ao atualizar colaborador de óculos."
    );
}

// ==========================================
// 👓 REGISTROS DE ÓCULOS (DTOs / Tipagens Independentes)
// ==========================================

export interface CriarRegistroOculosPayload {
    colaboradorId?: string;
    equipamentoId?: string;
    statusDetalhe?: string;
    [key: string]: any; // Permite qualquer outro campo que seu form envie (ex: data, observacao)
}

export interface AtualizarRegistroOculosPayload {
    [key: string]: any; // Flexível para enviar atualizações parciais
}

export async function listarRegistrosOculos() {
    return apiFetch("/oculos/registros", {}, "Erro ao buscar registros de óculos.");
}

// 🔥 Usando o nosso próprio contrato interno (CriarRegistroOculosPayload)
export async function criarRegistroOculos(dados: CriarRegistroOculosPayload) {
    return apiFetch("/oculos/registros", { method: "POST", body: JSON.stringify(dados) }, "Erro ao criar registro de óculos.");
}

// 🔥 Usando o nosso próprio contrato interno (AtualizarRegistroOculosPayload)
export async function atualizarRegistroOculos(id: string, dados: AtualizarRegistroOculosPayload) {
    return apiFetch(`/oculos/registros/${id}`, { method: "PUT", body: JSON.stringify(dados) }, "Erro ao atualizar registro de óculos.");
}

export async function desativarRegistroOculos(id: string) {
    return apiFetch(`/oculos/registros/${id}/desativar`, { method: "PATCH" }, "Erro ao desativar registro.");
}

export async function reativarColaboradorOculos(id: string, dados: { nome: string; tipo: "EFETIVO" | "CONTRATADO", statusDetalhe?: string }) {
    return apiFetch(`/oculos/colaboradores/${id}`, { method: "PATCH", body: JSON.stringify({ ...dados, status: "ATIVO" }) }, "Erro ao reativar colaborador.");
}

// ==========================================
// 🧼 COLABORADORES LAVAGEM DE MÃOS
// ==========================================
export async function listarColaboradoresLavagem(ativos: boolean = true) {
    return apiFetch(`/colaboradores-lavagem`, { cache: 'no-store' }, "Erro ao buscar colaboradores de lavagem.");
}

export async function criarColaboradorLavagem(nome: string, tipo: "EFETIVO" | "CONTRATADO" = "EFETIVO", status?: string, statusDetalhe?: string) {
    return apiFetch("/colaboradores-lavagem", {
        method: "POST",
        body: JSON.stringify({ nome, tipo, status, statusDetalhe })
    }, "Erro ao criar colaborador de lavagem.");
}

export async function atualizarColaboradorLavagem(id: string, nome?: string, tipo?: "EFETIVO" | "CONTRATADO", ativo?: boolean, status?: string, statusDetalhe?: string) {
    return apiFetch(`/colaboradores-lavagem/${id}`, {
        method: "PUT",
        body: JSON.stringify({ nome, tipo, ativo, status, statusDetalhe })
    }, "Erro ao atualizar colaborador.");
}

export async function desativarColaboradorLavagem(id: string) {
    return apiFetch(`/colaboradores-lavagem/${id}/desativar`, { method: "PATCH" }, "Erro ao desativar colaborador.");
}

export async function reativarColaboradorLavagem(id: string) {
    return apiFetch(`/colaboradores-lavagem/${id}/reativar`, { method: "PATCH" }, "Erro ao reativar colaborador.");
}

// ==========================================
// 📊 CENTRAL DE HISTORICOS
// ==========================================
export const DocumentosAPI = {
    salvar: (tipoTela: string, dados: any, excelBlob: Blob, nomeArquivo: string) => {
        const formData = new FormData();
        formData.append("excel", excelBlob, nomeArquivo);
        formData.append("tipoTela", tipoTela);
        formData.append("dados", JSON.stringify(dados));
        return apiFetch("/documentos/salvar", { method: "POST", body: formData }, "Erro ao salvar o documento.");
    },
    obterHistorico: (tipoTela: string) => apiFetch(`/documentos/historico/${tipoTela}`, {}, "Erro ao buscar histórico."),
    getUrlDownload: (idArquivo: string) => `${BASE_URL}/documentos/download/${idArquivo}`,
    deletar: (rota: string, id: string) => apiFetch(`/documentos/${rota}/${id}`, { method: "DELETE" }, "Erro ao deletar.")
};

export const RelatoriosAPI = {
    buscarDados: (inicio?: string, fim?: string) => {
        const query = new URLSearchParams();
        if (inicio) query.append("dataInicio", inicio);
        if (fim) query.append("dataFim", fim);
        return apiFetch(`/relatorios?${query.toString()}`, {}, "Erro ao buscar relatórios.");
    },
    getUrlZip: (modulo: string, inicio?: string, fim?: string) => {
        const query = new URLSearchParams();
        if (inicio) query.append("dataInicio", inicio);
        if (fim) query.append("dataFim", fim);
        query.append("modulo", modulo);
        return `${BASE_URL}/relatorios/exportar-zip?${query.toString()}`;
    }
};