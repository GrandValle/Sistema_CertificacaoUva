const BASE_URL = "http://192.168.250.237:3333/api";

export async function salvarDocumento(
    tipoTela: string,
    dados: any,
    excelBlob: Blob,
    nomeArquivo: string
) {
    const formData = new FormData();

    formData.append("excel", excelBlob, nomeArquivo);
    formData.append("tipoTela", tipoTela);
    formData.append("dados", JSON.stringify(dados));

    const response = await fetch(`${BASE_URL}/documentos/salvar`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao salvar o documento no servidor.");
    }

    return response.json();
}

export async function obterHistorico(tipoTela: string) {
    const response = await fetch(`${BASE_URL}/documentos/historico/${tipoTela}`);

    if (!response.ok) {
        throw new Error("Erro ao buscar o histórico.");
    }

    return response.json();
}

export function getUrlDownload(idArquivo: string) {
    return `${BASE_URL}/documentos/download/${idArquivo}`;
}

export async function deletarRegistro(rota: string, id: string) {
    const response = await fetch(`${BASE_URL}/documentos/${rota}/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao deletar o registro.");
    }

    return response.json();
}