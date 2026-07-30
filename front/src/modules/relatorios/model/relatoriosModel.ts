// front/src/app/(modulos)/model/relatoriosModel.ts
import { IconType } from "react-icons";
import {
    FaDroplet,
    FaClipboardCheck,
    FaBoxesStacked,
    FaFlaskVial,
    FaUserShield,
    FaScrewdriverWrench,
    FaStethoscope,
    FaGlasses,
    FaScissors
} from "react-icons/fa6";
import { ShieldCheck } from "lucide-react";

export type ChaveModulo =
    | "higienizacaoGeral"
    | "inspecaoOperacional"
    | "estoqueMaterial"
    | "controleQualidade"
    | "condutaHigiene"
    | "manutencaoCalibracao"
    | "controleAcesso"
    | "questionarioVisitante"
    | "registroOculos"
    | "colaboradorTesoura";

export interface ModuloConfig {
    key: ChaveModulo;
    titulo: string;
    icon: IconType | any;
    colorClass: string;
    bgClass: string;
}

export const modulosConfig: ModuloConfig[] = [
    { key: "higienizacaoGeral", titulo: "Higienização Geral", icon: FaDroplet, colorClass: "text-emerald-600", bgClass: "bg-emerald-100" },
    { key: "inspecaoOperacional", titulo: "Inspeção Operacional", icon: FaClipboardCheck, colorClass: "text-orange-600", bgClass: "bg-orange-100" },
    { key: "estoqueMaterial", titulo: "Gestão de Material e Equipamentos", icon: FaBoxesStacked, colorClass: "text-purple-600", bgClass: "bg-purple-100" },
    { key: "controleQualidade", titulo: "Controle de Qualidade", icon: FaFlaskVial, colorClass: "text-blue-600", bgClass: "bg-blue-100" },
    { key: "condutaHigiene", titulo: "Conduta e Higiene", icon: FaUserShield, colorClass: "text-pink-600", bgClass: "bg-pink-100" },
    { key: "manutencaoCalibracao", titulo: "Manutenção", icon: FaScrewdriverWrench, colorClass: "text-slate-600", bgClass: "bg-slate-200" },
    { key: "controleAcesso", titulo: "Controle de Acesso", icon: ShieldCheck, colorClass: "text-yellow-600", bgClass: "bg-yellow-100" },
    { key: "questionarioVisitante", titulo: "Questionário Visitante", icon: FaStethoscope, colorClass: "text-green-600", bgClass: "bg-green-100" },
];