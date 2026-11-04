from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter(prefix="/api/v1/manutencao", tags=["manutencao"])

@router.get("/os/{numero_os}")
async def obter_detalhes_os(numero_os: str, db: AsyncSession = Depends(get_db)):
    # 1. Dados Principais da OS
    q_os = text("""
        SELECT numero_os, veiculo_prefixo, tipo_manutencao, descricao_servico, data_abertura, status,
               empresa_codigo, filial_codigo, garagem_codigo, data_fechamento, data_retorno,
               origem_solicitacao, usuario_abertura, total_horas, km_acumulado, valor_mao_de_obra,
               valor_materiais, valor_total_geral, status_execucao, fornecedor_terceiro,
               grupo_servico, grupo_defeito, defeito_descricao, tipo_operacao, complemento_observacao
        FROM ordens_servico 
        WHERE numero_os = :numero_os 
        LIMIT 1;
    """)
    res_os = await db.execute(q_os, {"numero_os": numero_os})
    row = res_os.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada.")

    os_dict = dict(row._mapping)

    # 2. Executantes (Mão de obra)
    q_exec = text("SELECT funcionario_executante, horas_executante, valor_mo_executante FROM os_executantes WHERE numero_os = :numero_os;")
    res_exec = await db.execute(q_exec, {"numero_os": numero_os})
    os_dict["executantes"] = [dict(r._mapping) for r in res_exec.fetchall()]

    # 3. Materiais Aplicados
    q_mat = text("SELECT numero_requisicao, data_aplicacao, material_descricao, quantidade, valor_unitario, valor_total, km_ultima_troca, data_ultima_troca FROM os_materiais_aplicados WHERE numero_os = :numero_os;")
    res_mat = await db.execute(q_mat, {"numero_os": numero_os})
    os_dict["materiais"] = [dict(r._mapping) for r in res_mat.fetchall()]

    return os_dict
