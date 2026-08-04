import { createClient } from '@/lib/supabase/client'
import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS } from '@/lib/utils/cores'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { estaAtrasado } from '@/lib/utils/projetos'
import { formatarTamanho } from '@/lib/utils/storage'
import { textoComQuebras } from '@/lib/utils/texto'

function escapeHtml(valor: string) {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function paraHtmlComQuebras(texto: string) {
  return texto
    .split('\n')
    .map((linha) => escapeHtml(linha))
    .join('<br>')
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const ESTILO_RELATORIO = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #111827;
    max-width: 820px;
    margin: 0 auto;
    padding: 40px 32px 64px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  header .marca { font-size: 13px; color: #0f766e; font-weight: 700; letter-spacing: 0.02em; }
  h1 { font-size: 22px; margin: 4px 0 0; }
  .subtitulo { color: #6b7280; font-size: 13px; margin: 4px 0 0; }
  .badges { margin: 8px 0 20px; }
  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    margin-right: 6px;
    color: #fff;
  }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  table.info th, table.info td {
    text-align: left;
    padding: 7px 10px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 13px;
  }
  table.info th { width: 200px; color: #6b7280; font-weight: 600; }
  section { margin-bottom: 24px; }
  section h2 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #0f766e;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  ul { list-style: none; margin: 0; padding: 0; }
  li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  li p { margin: 0 0 2px; }
  .texto-conteudo { line-height: 1.6; }
  .item-titulo { font-weight: 600; }
  .item-data { color: #9ca3af; font-size: 12px; }
  .vazio { color: #9ca3af; font-style: italic; }
  footer { margin-top: 40px; font-size: 11px; color: #9ca3af; text-align: right; }
  .acoes { margin-bottom: 24px; }
  .acoes button {
    background: #0f766e;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .stat-cards { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
  .stat-card {
    flex: 1;
    min-width: 110px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 14px;
  }
  .stat-card .valor { font-size: 24px; font-weight: 700; }
  .stat-card .rotulo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; color: #6b7280; }
  table.grupos { width: 100%; border-collapse: collapse; }
  table.grupos th, table.grupos td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 13px;
  }
  table.grupos th { color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase; }
  table.grupos td.numero, table.grupos th.numero { text-align: right; }
  @media print {
    .acoes { display: none; }
    body { padding: 0; }
  }
`

export async function emitirRelatorioProjeto(projeto: Projeto) {
  const janela = window.open('', '_blank')
  if (!janela) {
    alert('Não foi possível abrir o relatório. Verifique se o navegador está bloqueando pop-ups.')
    return
  }
  janela.document.write(
    '<p style="font-family: sans-serif; padding: 24px; color: #6b7280;">Gerando relatório...</p>'
  )

  const supabase = createClient()

  const [{ data: notas }, { data: reunioes }, { data: anexos }, vinculado] = await Promise.all([
    supabase
      .from('notas')
      .select('*')
      .eq('projeto_id', projeto.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reunioes')
      .select('*')
      .eq('projeto_id', projeto.id)
      .order('data', { ascending: false }),
    supabase
      .from('anexos')
      .select('*')
      .eq('projeto_id', projeto.id)
      .order('created_at', { ascending: false }),
    projeto.projeto_vinculado_id
      ? supabase.from('projetos').select('nome').eq('id', projeto.projeto_vinculado_id).single()
      : Promise.resolve({ data: null as { nome: string } | null }),
  ])

  const corEtapa = CORES_ETAPA[projeto.etapa]
  const corStatus = CORES_STATUS[projeto.status]

  const linhasInfo = [
    ['Etapa', corEtapa.label],
    ['Status', corStatus.label],
    ['Data de entrega', formatarData(projeto.entrega)],
    ['Diretor', projeto.diretor || '—'],
    ['Gerente', projeto.gerente || '—'],
    ['Projetista acústico', projeto.projetista || '—'],
    ...(vinculado?.data?.nome ? [['Projeto vinculado', vinculado.data.nome]] : []),
  ]
    .map(([label, valor]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(valor)}</td></tr>`)
    .join('')

  const listaNotas = (notas ?? []).length
    ? (notas ?? [])
        .map((n) => {
          const texto = textoComQuebras(n.texto)
          return `
        <li>
          <p class="item-data">${formatarDataHora(n.created_at)}</p>
          <p class="texto-conteudo">${texto ? paraHtmlComQuebras(texto) : '—'}</p>
        </li>`
        })
        .join('')
    : '<li class="vazio">Nenhuma anotação registrada.</li>'

  const listaReunioes = (reunioes ?? []).length
    ? (reunioes ?? [])
        .map((r) => {
          const conteudo = r.conteudo ? textoComQuebras(r.conteudo) : ''
          return `
        <li>
          <p class="item-titulo">${escapeHtml(r.titulo)} <span class="item-data">— ${formatarData(r.data)}</span></p>
          ${conteudo ? `<p class="texto-conteudo">${paraHtmlComQuebras(conteudo)}</p>` : ''}
        </li>`
        })
        .join('')
    : '<li class="vazio">Nenhuma ata registrada.</li>'

  const listaAnexos = (anexos ?? []).length
    ? (anexos ?? [])
        .map(
          (a) => `
        <li>${escapeHtml(a.nome_arquivo)} <span class="item-data">(${formatarTamanho(a.tamanho_bytes)})</span></li>`
        )
        .join('')
    : '<li class="vazio">Nenhum anexo enviado.</li>'

  const geradoEm = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório · ${escapeHtml(projeto.nome)}</title>
<style>${ESTILO_RELATORIO}</style>
</head>
<body>
  <div class="acoes"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
  <header>
    <span class="marca">PAINEL ACÚSTICA · RELATÓRIO DE PROJETO</span>
    <span class="item-data">Gerado em ${geradoEm}</span>
  </header>
  <h1>${escapeHtml(projeto.nome)}</h1>
  <div class="badges">
    <span class="badge" style="background:${corEtapa.hex}">${escapeHtml(corEtapa.label)}</span>
    <span class="badge" style="background:${corStatus.hex}">${escapeHtml(corStatus.label)}</span>
  </div>

  <table class="info">${linhasInfo}</table>

  <section>
    <h2>Anotações (${(notas ?? []).length})</h2>
    <ul>${listaNotas}</ul>
  </section>

  <section>
    <h2>Atas de reunião (${(reunioes ?? []).length})</h2>
    <ul>${listaReunioes}</ul>
  </section>

  <section>
    <h2>Anexos (${(anexos ?? []).length})</h2>
    <ul>${listaAnexos}</ul>
  </section>

  <footer>Painel Acústica</footer>
</body>
</html>`

  janela.document.open()
  janela.document.write(html)
  janela.document.close()
}

export type CampoAgrupamento = 'etapa' | 'status' | 'diretor' | 'gerente' | 'projetista'

const LABEL_CAMPO: Record<CampoAgrupamento, string> = {
  etapa: 'Etapa',
  status: 'Status',
  diretor: 'Diretor',
  gerente: 'Gerente',
  projetista: 'Projetista acústico',
}

function calcularStats(lista: Projeto[], hoje: string) {
  return {
    total: lista.length,
    aFazer: lista.filter((p) => p.status === 'A Fazer').length,
    emAndamento: lista.filter((p) => p.status === 'Em Andamento').length,
    aguardandoTerceiros: lista.filter((p) => p.status === 'Aguardando Terceiros').length,
    concluido: lista.filter((p) => p.status === 'Concluído').length,
    atrasado: lista.filter((p) => estaAtrasado(p, hoje)).length,
  }
}

export function emitirRelatorioGeral(
  projetos: Projeto[],
  agruparPor: CampoAgrupamento | null
) {
  const janela = window.open('', '_blank')
  if (!janela) {
    alert('Não foi possível abrir o relatório. Verifique se o navegador está bloqueando pop-ups.')
    return
  }

  const hoje = hojeISO()
  const geral = calcularStats(projetos, hoje)

  let tabelaGrupos = ''
  if (agruparPor) {
    const grupos = new Map<string, Projeto[]>()
    for (const p of projetos) {
      const valorBruto = p[agruparPor]
      const chave = (valorBruto && String(valorBruto).trim()) || 'Não atribuído'
      if (!grupos.has(chave)) grupos.set(chave, [])
      grupos.get(chave)!.push(p)
    }

    const linhas = Array.from(grupos.entries())
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .map(([nome, lista]) => {
        const s = calcularStats(lista, hoje)
        return `<tr>
          <td>${escapeHtml(nome)}</td>
          <td class="numero">${s.total}</td>
          <td class="numero">${s.emAndamento}</td>
          <td class="numero">${s.aguardandoTerceiros}</td>
          <td class="numero">${s.concluido}</td>
          <td class="numero">${s.atrasado}</td>
        </tr>`
      })
      .join('')

    tabelaGrupos = `
    <section>
      <h2>Por ${escapeHtml(LABEL_CAMPO[agruparPor])}</h2>
      <table class="grupos">
        <thead>
          <tr>
            <th>${escapeHtml(LABEL_CAMPO[agruparPor])}</th>
            <th class="numero">Total</th>
            <th class="numero">Em andamento</th>
            <th class="numero">Aguardando terceiros</th>
            <th class="numero">Concluído</th>
            <th class="numero">Atrasado</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </section>`
  }

  const geradoEm = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  const subtitulo = agruparPor ? `Agrupado por ${LABEL_CAMPO[agruparPor]}` : 'Visão geral'

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório Geral · Painel Acústica</title>
<style>${ESTILO_RELATORIO}</style>
</head>
<body>
  <div class="acoes"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
  <header>
    <span class="marca">PAINEL ACÚSTICA · RELATÓRIO GERAL</span>
    <span class="item-data">Gerado em ${geradoEm}</span>
  </header>
  <h1>Números gerais</h1>
  <p class="subtitulo">${escapeHtml(subtitulo)}</p>

  <section>
    <div class="stat-cards" style="margin-top: 16px;">
      <div class="stat-card"><div class="valor">${geral.total}</div><div class="rotulo">Total de projetos</div></div>
      <div class="stat-card"><div class="valor" style="color:${CORES_STATUS['Em Andamento'].hex}">${geral.emAndamento}</div><div class="rotulo">Em andamento</div></div>
      <div class="stat-card"><div class="valor" style="color:${CORES_STATUS['Aguardando Terceiros'].hex}">${geral.aguardandoTerceiros}</div><div class="rotulo">Aguardando terceiros</div></div>
      <div class="stat-card"><div class="valor" style="color:${CORES_STATUS['Concluído'].hex}">${geral.concluido}</div><div class="rotulo">Concluído</div></div>
      <div class="stat-card"><div class="valor" style="color:${CORES_STATUS['Atrasado'].hex}">${geral.atrasado}</div><div class="rotulo">Atrasado</div></div>
    </div>
  </section>

  ${tabelaGrupos}

  <footer>Painel Acústica</footer>
</body>
</html>`

  janela.document.open()
  janela.document.write(html)
  janela.document.close()
}
