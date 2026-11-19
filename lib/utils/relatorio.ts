import { createClient } from '@/lib/supabase/client'
import type { Projeto, ReuniaoConsultores, TarefaReuniaoConsultores } from '@/lib/types/database'
import type { ItemVistoria } from '@/lib/utils/vistoria'
import { prepararFotoVistoria } from '@/lib/utils/vistoriaArquivos'
import { CORES_ETAPA, CORES_STATUS, CORES_STATUS_ATIVIDADE, CORES_NOTA_AVALIACAO } from '@/lib/utils/cores'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { estaAtrasado } from '@/lib/utils/projetos'
import { formatarTamanho } from '@/lib/utils/storage'
import { htmlEstaVazio, textoComQuebras } from '@/lib/utils/texto'
import { LOGO_ATHIE_WOHNRATH_BASE64 } from '@/lib/utils/logoAthieBase64'

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

function htmlRodape() {
  return `<footer><div class="marca-footer"><img src="${LOGO_ATHIE_WOHNRATH_BASE64}" alt="Athié Wohnrath" /></div></footer>`
}

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result))
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsDataURL(blob)
  })
}

// Baixa a foto da pessoa (cadastro de equipe, casado pelo nome) e embute
// como data URL, pelo mesmo motivo da logo do cliente acima.
async function dataUrlFotoPessoa(
  supabase: ReturnType<typeof createClient>,
  nome: string | null
): Promise<string | null> {
  if (!nome) return null
  const { data: pessoa } = await supabase
    .from('pessoas_equipe')
    .select('foto_storage')
    .ilike('nome', nome)
    .maybeSingle()
  if (!pessoa?.foto_storage) return null
  const { data, error } = await supabase.storage.from('fotos-equipe').download(pessoa.foto_storage)
  if (error || !data) return null
  return blobParaDataUrl(data)
}

function linhaInfoPessoa(label: string, nome: string | null, fotoUrl: string | null) {
  const foto = fotoUrl
    ? `<img src="${fotoUrl}" alt="" style="width:20px;height:20px;border-radius:999px;object-fit:cover;vertical-align:middle;margin-right:6px;" />`
    : ''
  return `<tr><th>${escapeHtml(label)}</th><td>${foto}${escapeHtml(nome || '—')}</td></tr>`
}

// Baixa a logo e embute como data URL (em vez de uma URL assinada) porque o
// relatório abre numa janela separada (window.open + document.write), e essa
// janela não consegue buscar uma URL assinada do Supabase de forma
// confiável — o data URL não depende de nenhuma requisição de rede extra.
async function urlLogoCliente(
  supabase: ReturnType<typeof createClient>,
  caminho: string | null
): Promise<string | null> {
  if (!caminho) return null
  const { data, error } = await supabase.storage.from('logos-clientes').download(caminho)
  if (error || !data) return null
  return blobParaDataUrl(data)
}

function htmlCabecalhoTitulo(nome: string, logoClienteUrl: string | null) {
  return `<div class="cabecalho-titulo">
    <h1>${escapeHtml(nome)}</h1>
    ${logoClienteUrl ? `<img class="logo-cliente" src="${logoClienteUrl}" alt="Logo do cliente" />` : ''}
  </div>`
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    row-gap: 2px;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  header .marca { font-size: 13px; color: #0f766e; font-weight: 700; letter-spacing: 0.02em; }
  .cabecalho-titulo { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
  .cabecalho-titulo .logo-cliente { height: 38px; max-width: 170px; object-fit: contain; }
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
  li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; break-inside: avoid; page-break-inside: avoid; }
  li p { margin: 0 0 2px; }
  .texto-conteudo { line-height: 1.6; }
  .item-titulo { font-weight: 600; }
  .item-data { color: #9ca3af; font-size: 12px; }
  .vazio { color: #9ca3af; font-style: italic; }
  .tag {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 999px;
    margin-right: 4px;
    color: #fff;
  }
  .meta { font-size: 12px; color: #6b7280; margin: 2px 0 0; }
  .meta span + span::before { content: '·'; margin: 0 6px; color: #d1d5db; }
  footer { margin-top: 40px; }
  footer .marca-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f766e;
    border-radius: 8px;
    padding: 14px 0;
  }
  footer .marca-footer img { height: 24px; display: block; }
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
  const mostrarAvaliacao = Boolean(projeto.projetista && projeto.projetista !== 'Interno')

  const [
    { data: notas },
    { data: reunioes },
    { data: anexos },
    vinculado,
    { data: acoes },
    { data: avaliacoes },
    logoClienteUrl,
    fotoDiretorUrl,
    fotoGerenteUrl,
  ] = await Promise.all([
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
    supabase
      .from('atividades')
      .select('*')
      .eq('projeto_id', projeto.id)
      .order('data_vencimento', { ascending: true, nullsFirst: false }),
    mostrarAvaliacao
      ? supabase
          .from('avaliacoes_projetista')
          .select('*')
          .eq('projeto_id', projeto.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null as { nota: string; diagnostico: string | null; created_at: string }[] | null }),
    urlLogoCliente(supabase, projeto.logo_cliente_storage),
    dataUrlFotoPessoa(supabase, projeto.diretor),
    dataUrlFotoPessoa(supabase, projeto.gerente),
  ])

  const corEtapa = CORES_ETAPA[projeto.etapa]
  const corStatus = CORES_STATUS[projeto.status]

  const linhasInfo =
    [
      ['Etapa', corEtapa.label],
      ['Status', corStatus.label],
      ['Data de entrega', formatarData(projeto.entrega)],
    ]
      .map(([label, valor]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(valor)}</td></tr>`)
      .join('') +
    linhaInfoPessoa('Diretor', projeto.diretor, fotoDiretorUrl) +
    linhaInfoPessoa('Gerente', projeto.gerente, fotoGerenteUrl) +
    [
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
          ${r.participantes ? `<p class="meta">Participantes: ${escapeHtml(r.participantes)}</p>` : ''}
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

  const listaAcoes = (acoes ?? []).length
    ? (acoes ?? [])
        .map((a) => {
          const cor = CORES_STATUS_ATIVIDADE[a.status]
          return `
        <li>
          <p class="item-titulo">${escapeHtml(a.texto)}</p>
          <p class="meta">
            <span class="tag" style="background:${cor.hex}">${escapeHtml(cor.label)}</span>
            ${a.responsavel ? `<span>Responsável: ${escapeHtml(a.responsavel)}</span>` : ''}
            ${a.data_vencimento ? `<span>Prazo: ${formatarData(a.data_vencimento)}</span>` : ''}
          </p>
        </li>`
        })
        .join('')
    : '<li class="vazio">Nenhuma ação combinada registrada.</li>'

  const listaAvaliacoes = (avaliacoes ?? []).length
    ? (avaliacoes ?? [])
        .map((a) => {
          const cor = CORES_NOTA_AVALIACAO[a.nota as keyof typeof CORES_NOTA_AVALIACAO]
          const diagnostico = a.diagnostico ? textoComQuebras(a.diagnostico) : ''
          return `
        <li>
          <p class="item-data">${formatarDataHora(a.created_at)}</p>
          <p><span class="tag" style="background:${cor.hex}">${escapeHtml(cor.label)}</span></p>
          ${diagnostico ? `<p class="texto-conteudo">${paraHtmlComQuebras(diagnostico)}</p>` : ''}
        </li>`
        })
        .join('')
    : '<li class="vazio">Nenhuma avaliação registrada.</li>'

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
  ${htmlCabecalhoTitulo(projeto.nome, logoClienteUrl)}
  <div class="badges">
    <span class="badge" style="background:${corEtapa.hex}">${escapeHtml(corEtapa.label)}</span>
    <span class="badge" style="background:${corStatus.hex}">${escapeHtml(corStatus.label)}</span>
  </div>

  <table class="info">${linhasInfo}</table>

  <section>
    <h2>Ações combinadas (${(acoes ?? []).length})</h2>
    <ul>${listaAcoes}</ul>
  </section>

  ${
    mostrarAvaliacao
      ? `<section>
    <h2>Avaliação do projetista — ${escapeHtml(projeto.projetista ?? '')} (${(avaliacoes ?? []).length})</h2>
    <ul>${listaAvaliacoes}</ul>
  </section>`
      : ''
  }

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

  ${htmlRodape()}
</body>
</html>`

  janela.document.open()
  janela.document.write(html)
  janela.document.close()
}

export function emitirAtaConsultores(reuniao: ReuniaoConsultores, tarefas: TarefaReuniaoConsultores[]) {
  const janela = window.open('', '_blank')
  if (!janela) {
    alert('Não foi possível abrir o relatório. Verifique se o navegador está bloqueando pop-ups.')
    return
  }

  const concluidas = tarefas.filter((t) => t.concluido).length

  const listaTarefas = tarefas.length
    ? tarefas
        .map(
          (t) => `
        <li>
          <p class="item-titulo">${t.concluido ? '☑' : '☐'} ${escapeHtml(t.texto)}</p>
          ${t.responsavel ? `<p class="meta"><span>Responsável: ${escapeHtml(t.responsavel)}</span></p>` : ''}
        </li>`
        )
        .join('')
    : '<li class="vazio">Nenhuma tarefa registrada.</li>'

  const pauta = reuniao.pauta && !htmlEstaVazio(reuniao.pauta) ? reuniao.pauta : ''
  const geradoEm = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Ata · ${escapeHtml(reuniao.titulo)}</title>
<style>${ESTILO_RELATORIO}</style>
</head>
<body>
  <div class="acoes"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
  <header>
    <span class="marca">PAINEL ACÚSTICA · REUNIÃO CONSULTORES</span>
    <span class="item-data">Gerado em ${geradoEm}</span>
  </header>
  <h1>${escapeHtml(reuniao.titulo)}</h1>
  <p class="subtitulo">${formatarData(reuniao.data)}</p>

  ${
    reuniao.participantes
      ? `<table class="info"><tr><th>Participantes</th><td>${escapeHtml(reuniao.participantes)}</td></tr></table>`
      : ''
  }

  ${
    pauta
      ? `<section>
    <h2>Ata</h2>
    <div class="texto-conteudo">${pauta}</div>
  </section>`
      : ''
  }

  <section>
    <h2>Tarefas (${concluidas}/${tarefas.length})</h2>
    <ul>${listaTarefas}</ul>
  </section>

  ${htmlRodape()}
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

  ${htmlRodape()}
</body>
</html>`

  janela.document.open()
  janela.document.write(html)
  janela.document.close()
}

type ParametrosRelatorioVistoria = {
  nomeProjeto: string
  data: string
  itens: ItemVistoria[]
  fotosPorNome: Map<string, Blob>
  logoClienteStorage?: string | null
}

async function construirHtmlVistoria(params: ParametrosRelatorioVistoria): Promise<string> {
  const { nomeProjeto, data, itens, fotosPorNome, logoClienteStorage = null } = params
  const supabase = createClient()
  const logoClienteUrl = await urlLogoCliente(supabase, logoClienteStorage)

  const listaItens = (
    await Promise.all(
      itens.map(async (it) => {
        const fotosHtml = (
          await Promise.all(
            it.fotos.map(async (nome) => {
              const blob = fotosPorNome.get(nome)
              if (!blob) return ''
              const preparada = await prepararFotoVistoria(blob)
              if (!preparada) return ''
              return `<img src="data:image/jpeg;base64,${preparada.base64}" style="max-width:260px;max-height:260px;border-radius:6px;margin:4px 6px 4px 0;" />`
            })
          )
        ).join('')

        return `
        <li>
          <p class="item-titulo">${escapeHtml(it.ambiente)}${it.andar ? ` <span style="color:#b0b7bf;font-weight:400;">— ${escapeHtml(it.andar)}</span>` : ''}</p>
          <p class="meta"><span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;padding:2px 10px;border-radius:999px;border:1.5px solid #0f766e;color:#0f766e;">${escapeHtml(it.item)}</span></p>
          ${it.descricao ? `<p class="texto-conteudo">${paraHtmlComQuebras(it.descricao)}</p>` : ''}
          ${fotosHtml ? `<div style="margin-top:8px;">${fotosHtml}</div>` : ''}
        </li>`
      })
    )
  ).join('')

  const geradoEm = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Vistoria Acústica · ${escapeHtml(nomeProjeto)}</title>
<style>${ESTILO_RELATORIO}</style>
</head>
<body>
  <div class="acoes"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
  <header>
    <span class="marca">PAINEL ACÚSTICA · VISTORIA ACÚSTICA</span>
    <span class="item-data">Gerado em ${geradoEm}</span>
  </header>
  ${htmlCabecalhoTitulo(nomeProjeto, logoClienteUrl)}
  <p class="subtitulo">${data ? `Vistoria de ${escapeHtml(data)}` : 'Vistoria acústica'} · ${itens.length} ocorrência(s)</p>

  <section>
    <ul>${listaItens}</ul>
  </section>

  ${htmlRodape()}
</body>
</html>`

  return html
}

export async function emitirRelatorioVistoria(params: ParametrosRelatorioVistoria) {
  const janela = window.open('', '_blank')
  if (!janela) {
    alert('Não foi possível abrir o relatório. Verifique se o navegador está bloqueando pop-ups.')
    return
  }
  janela.document.write(
    '<p style="font-family: sans-serif; padding: 24px; color: #6b7280;">Gerando relatório...</p>'
  )

  const html = await construirHtmlVistoria(params)

  janela.document.open()
  janela.document.write(html)
  janela.document.close()
}

// Gera o mesmo relatório como um arquivo PDF de verdade (em vez de abrir a
// janela de impressão), pra poder salvar como anexo do projeto sem
// depender do usuário imprimir/salvar manualmente. Renderiza o mesmo HTML
// num iframe escondido, tira um "print" único (um canvas alto com tudo) via
// html2canvas-pro e monta as páginas do PDF manualmente, cortando o canvas
// sempre ENTRE dois elementos (nunca no meio de um item/badge/descrição) —
// o modo autoPaging:'slice' do jsPDF corta por altura de pixel pura, sem
// noção de limite de elemento, e por isso partia item ao meio na virada de
// página.
export async function gerarPdfVistoriaBlob(params: ParametrosRelatorioVistoria): Promise<Blob> {
  const html = await construirHtmlVistoria(params)

  const { jsPDF } = await import('jspdf')
  // jsPDF (e nosso uso direto abaixo) procuram por window.html2canvas antes
  // de tentar importar o pacote "html2canvas" puro, que não reconhece cores
  // modernas (lab/oklch) que o Chrome às vezes usa em estilos computados e
  // quebra a geração do PDF.
  const html2canvasPro = (await import('html2canvas-pro')).default

  const pdf = new jsPDF({ unit: 'px', format: 'a4' })
  // Dimensões reais da página (unit:'px' já converte o preset 'a4' pra
  // pixels a 96dpi) — renderiza o conteúdo com essa largura exata pra não
  // sobrar nem faltar nada na borda direita.
  const larguraPagina = pdf.internal.pageSize.getWidth()
  const alturaPagina = pdf.internal.pageSize.getHeight()

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-99999px'
  iframe.style.top = '0'
  iframe.style.width = `${larguraPagina}px`
  iframe.style.height = '1200px'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument
    if (!doc) throw new Error('Não foi possível preparar o PDF.')
    doc.open()
    doc.write(html)
    doc.close()

    await new Promise<void>((resolve) => {
      if (doc.readyState === 'complete') resolve()
      else iframe.addEventListener('load', () => resolve(), { once: true })
    })

    const imagens = Array.from(doc.images)
    await Promise.all(
      imagens.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              })
      )
    )

    doc.querySelector('.acoes')?.remove()

    // Altura real do conteúdo: não dá pra usar scrollHeight aqui, porque
    // com o iframe ainda na altura inicial (1200px) um relatório curto (sem
    // barra de rolagem) faz scrollHeight devolver a altura do iframe em vez
    // da altura real do conteúdo — sobra espaço em branco "fantasma" que
    // depois vira uma página extra quase vazia no PDF.
    const alturaConteudo = Math.ceil(
      Math.max(...Array.from(doc.body.children).map((el) => el.getBoundingClientRect().bottom))
    )

    // Redimensiona o iframe pra caber todo o conteúdo sem precisar de barra
    // de rolagem — senão ela "rouba" uns pixels de largura da página e o
    // texto sai cortado na borda direita.
    iframe.style.height = `${alturaConteudo}px`

    // Pontos de corte "seguros": topo/base de cada bloco que não pode ser
    // partido ao meio (cabeçalho, título, cada item da lista, rodapé).
    const elementosAtomicos = Array.from(
      doc.querySelectorAll<HTMLElement>('header, .cabecalho-titulo, .subtitulo, section > ul > li, footer')
    )
    const limites = new Set<number>([0, alturaConteudo])
    for (const el of elementosAtomicos) {
      const rect = el.getBoundingClientRect()
      limites.add(Math.round(rect.top))
      limites.add(Math.round(rect.bottom))
    }
    const cortes = Array.from(limites).sort((a, b) => a - b)

    // Renderiza o documento inteiro como um único canvas alto.
    const canvasCompleto = await html2canvasPro(doc.body, {
      width: larguraPagina,
      windowWidth: larguraPagina,
      height: alturaConteudo,
      windowHeight: alturaConteudo,
      scale: 2,
    })
    const escala = canvasCompleto.width / larguraPagina

    // Decide as quebras de página: avança o cursor pela altura máxima da
    // página, mas sempre recuando até o último ponto de corte seguro que
    // caiba — nunca corta dentro de um item.
    const paginas: Array<{ inicio: number; fim: number }> = []
    let cursor = 0
    while (cursor < alturaConteudo - 0.5) {
      const limiteIdeal = cursor + alturaPagina
      let fim = cortes.filter((c) => c > cursor && c <= limiteIdeal).pop()
      if (fim === undefined) {
        // Nenhum corte seguro cabe inteiro (item maior que uma página) —
        // usa o próximo corte disponível mesmo que estoure a página, pra
        // não entrar em loop infinito.
        fim = cortes.find((c) => c > cursor) ?? alturaConteudo
      }
      paginas.push({ inicio: cursor, fim })
      cursor = fim
    }

    paginas.forEach((pagina, indice) => {
      if (indice > 0) pdf.addPage()
      const alturaFatiaPx = Math.round((pagina.fim - pagina.inicio) * escala)
      if (alturaFatiaPx <= 0) return
      const fatia = document.createElement('canvas')
      fatia.width = canvasCompleto.width
      fatia.height = alturaFatiaPx
      const ctx = fatia.getContext('2d')
      if (!ctx) return
      ctx.drawImage(
        canvasCompleto,
        0,
        Math.round(pagina.inicio * escala),
        canvasCompleto.width,
        alturaFatiaPx,
        0,
        0,
        canvasCompleto.width,
        alturaFatiaPx
      )
      const alturaFatiaPdf = alturaFatiaPx / escala
      pdf.addImage(fatia.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, larguraPagina, alturaFatiaPdf)
    })

    return pdf.output('blob')
  } finally {
    document.body.removeChild(iframe)
  }
}
