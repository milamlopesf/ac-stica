'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { Projeto } from '@/lib/types/database'
import type { ItemVistoria, TipoItemVistoria } from '@/lib/utils/vistoria'
import { ordenarItensVistoria, parseWhatsAppVistoria } from '@/lib/utils/vistoria'
import { extrairArquivosVistoria } from '@/lib/utils/vistoriaArquivos'
import { gerarExcelVistoria } from '@/lib/utils/vistoriaExcel'
import { emitirRelatorioVistoria } from '@/lib/utils/relatorio'
import { sanitizarNomeArquivo } from '@/lib/utils/storage'
import { ProjetoPickerTR } from './ProjetoPickerTR'

const TIPOS: TipoItemVistoria[] = ['DIVISÓRIAS', 'DRYWALL', 'INSTALAÇÃO']
const BUCKET_ANEXOS = 'anexos-projetos'

type Resultado = { itens: ItemVistoria[]; data: string; fotos: Map<string, Blob> }

function nomeArquivoVistoria(nomeProjeto: string, data: string, ext: string) {
  const dataArquivo = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(data)
    ? data.split('/').reverse().join('-')
    : new Date().toISOString().slice(0, 10)
  return `Vistoria_Acustica_${sanitizarNomeArquivo(nomeProjeto)}_${dataArquivo}.${ext}`
}

function baixarArquivo(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function FotoMiniatura({ blob, onRemover }: { blob: Blob; onRemover: () => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemover}
        className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-md bg-black/70 text-xs text-white hover:bg-red-600"
        aria-label="Remover foto"
        title="Remover foto"
      >
        ✕
      </button>
    </div>
  )
}

function FotoAdicionar({ onSelecionar }: { onSelecionar: (arquivos: File[]) => void }) {
  return (
    <label
      className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-xl text-gray-400 hover:border-teal-300 hover:text-teal-600"
      title="Adicionar foto"
    >
      +
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (arquivos.length) onSelecionar(arquivos)
        }}
        className="hidden"
      />
    </label>
  )
}

export function VistoriaWhatsAppClient({ projetosIniciais }: { projetosIniciais: Projeto[] }) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [projetos, setProjetos] = useState<Projeto[]>(projetosIniciais)
  const [projetoId, setProjetoId] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [gerandoExcel, setGerandoExcel] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const projetoSelecionado = projetos.find((p) => p.id === projetoId) ?? null

  async function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    if (!arquivos.length) return
    setErro('')
    setProcessando(true)
    try {
      const { texto, fotos } = await extrairArquivosVistoria(arquivos)
      const parse = parseWhatsAppVistoria(texto, new Set(fotos.keys()))
      if (!parse.itens.length) {
        setErro(
          'Não encontrei nenhuma ocorrência nessa conversa. Confira se o arquivo é o export correto do WhatsApp (zip com o .txt da conversa e as fotos).'
        )
      } else {
        setResultado({ itens: parse.itens, data: parse.data, fotos })
        setSalvo(false)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao ler os arquivos.')
    }
    setProcessando(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function atualizarItem(id: string, patch: Partial<ItemVistoria>) {
    setResultado((prev) => prev && { ...prev, itens: prev.itens.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
    setSalvo(false)
  }

  // Usado no "onBlur" do andar/ambiente: só reordena a lista depois que o
  // usuário termina de editar, pra não "pular" o card enquanto ele digita.
  function atualizarEReordenar(id: string, patch: Partial<ItemVistoria>) {
    setResultado(
      (prev) =>
        prev && {
          ...prev,
          itens: ordenarItensVistoria(prev.itens.map((it) => (it.id === id ? { ...it, ...patch } : it))),
        }
    )
    setSalvo(false)
  }

  function removerFoto(itemId: string, nomeFoto: string) {
    setResultado(
      (prev) =>
        prev && {
          ...prev,
          itens: prev.itens.map((it) =>
            it.id === itemId ? { ...it, fotos: it.fotos.filter((f) => f !== nomeFoto) } : it
          ),
        }
    )
    setSalvo(false)
  }

  function adicionarFotos(itemId: string, arquivos: File[]) {
    setResultado((prev) => {
      if (!prev) return prev
      const novasFotos = new Map(prev.fotos)
      const nomes: string[] = []
      arquivos.forEach((arquivo, i) => {
        const nome = `manual-${Date.now()}-${i}-${sanitizarNomeArquivo(arquivo.name)}`
        novasFotos.set(nome, arquivo)
        nomes.push(nome)
      })
      return {
        ...prev,
        fotos: novasFotos,
        itens: prev.itens.map((it) => (it.id === itemId ? { ...it, fotos: [...it.fotos, ...nomes] } : it)),
      }
    })
    setSalvo(false)
  }

  function removerItem(id: string) {
    setResultado((prev) => prev && { ...prev, itens: prev.itens.filter((it) => it.id !== id) })
    setSalvo(false)
  }

  function atualizarData(novaData: string) {
    setResultado((prev) => prev && { ...prev, data: novaData })
    setSalvo(false)
  }

  function recomecar() {
    setResultado(null)
    setErro('')
    setSalvo(false)
  }

  async function baixarExcel() {
    if (!resultado) return
    setGerandoExcel(true)
    const blob = await gerarExcelVistoria({
      itens: resultado.itens,
      data: resultado.data,
      fotosPorNome: resultado.fotos,
    })
    setGerandoExcel(false)
    baixarArquivo(blob, nomeArquivoVistoria(projetoSelecionado?.nome ?? 'vistoria', resultado.data, 'xlsx'))
  }

  function baixarPdf() {
    if (!resultado) return
    emitirRelatorioVistoria({
      nomeProjeto: projetoSelecionado?.nome ?? 'Vistoria',
      data: resultado.data,
      itens: resultado.itens,
      fotosPorNome: resultado.fotos,
    })
  }

  async function salvarNoProjeto() {
    if (!resultado || !projetoId) return
    setSalvando(true)
    setErro('')
    const blob = await gerarExcelVistoria({
      itens: resultado.itens,
      data: resultado.data,
      fotosPorNome: resultado.fotos,
    })
    const nomeArquivo = nomeArquivoVistoria(projetoSelecionado?.nome ?? 'vistoria', resultado.data, 'xlsx')
    const caminho = `${projetoId}/${Date.now()}-${sanitizarNomeArquivo(nomeArquivo)}`

    const { error: erroUpload } = await supabase.storage.from(BUCKET_ANEXOS).upload(caminho, blob)
    if (erroUpload) {
      setSalvando(false)
      setErro(`Erro ao enviar arquivo: ${erroUpload.message}`)
      return
    }

    const { error: erroInsert } = await supabase.from('anexos').insert({
      projeto_id: projetoId,
      nome_arquivo: nomeArquivo,
      caminho_storage: caminho,
      tamanho_bytes: blob.size,
    })
    setSalvando(false)
    if (erroInsert) {
      setErro(`Erro ao registrar anexo: ${erroInsert.message}`)
      return
    }
    setSalvo(true)
  }

  const totalAlertas = resultado?.itens.reduce((soma, it) => soma + it.alertas.length, 0) ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/planilhas" className="text-sm text-blue-600 hover:underline">
          ← Voltar para Planilhas de Cálculo
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Vistoria Acústica (WhatsApp)</h1>
        <p className="text-sm text-gray-500">
          Suba o export da conversa do WhatsApp da vistoria e gere a planilha de pendências no padrão AW, pronta
          para revisar antes de baixar.
        </p>
      </div>

      {erro && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>
      )}

      {!resultado ? (
        <div className="max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start gap-4 p-6 sm:p-7">
            <span
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                projetoId ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-700'
              )}
            >
              1
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-sm font-semibold text-gray-900">Projeto vinculado</p>
              <p className="mb-3 text-sm text-gray-500">
                A planilha gerada fica salva como anexo deste projeto.
              </p>
              <ProjetoPickerTR
                projetos={projetos}
                projetoId={projetoId}
                onChange={setProjetoId}
                onProjetoCriado={(novo) => setProjetos((prev) => [...prev, novo])}
                mostrarRotulo={false}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <span
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  projetoId ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-400'
                )}
              >
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className={clsx('mb-3 text-sm font-semibold', projetoId ? 'text-gray-900' : 'text-gray-400')}>
                  Conversa do WhatsApp
                </p>

                <label
                  className={clsx(
                    'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors',
                    projetoId
                      ? 'cursor-pointer border-teal-200 bg-teal-50/40 hover:border-teal-300 hover:bg-teal-50'
                      : 'cursor-not-allowed border-gray-200 bg-gray-50'
                  )}
                >
                  <span className={clsx('text-2xl', !projetoId && 'opacity-40')}>📎</span>
                  {processando ? (
                    <span className="text-sm font-medium text-gray-600">Lendo a conversa...</span>
                  ) : (
                    <>
                      <span className={clsx('text-sm font-medium', projetoId ? 'text-teal-800' : 'text-gray-400')}>
                        Clique para selecionar o .zip exportado do WhatsApp
                      </span>
                      <span className="text-xs text-gray-400">
                        (ou selecione o .txt da conversa junto com as fotos)
                      </span>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".zip,.txt,image/*"
                    multiple
                    disabled={!projetoId || processando}
                    onChange={handleArquivos}
                    className="hidden"
                  />
                </label>
                {!projetoId && (
                  <p className="mt-2 text-xs text-amber-600">Escolha o projeto antes de subir a conversa.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">Projeto</p>
                <p className="text-sm font-medium text-gray-900">{projetoSelecionado?.nome ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data da vistoria</p>
                <input
                  value={resultado.data}
                  onChange={(e) => atualizarData(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ocorrências</p>
                <p className="text-sm font-medium text-gray-900">{resultado.itens.length}</p>
              </div>
              {totalAlertas > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Pontos de atenção</p>
                  <p className="text-sm font-medium text-amber-600">{totalAlertas}</p>
                </div>
              )}
            </div>
            <button
              onClick={recomecar}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Recomeçar
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Confira cada ocorrência abaixo — ambiente, tipo, descrição e fotos — antes de gerar o arquivo. Itens com
            pontos de atenção vêm destacados.
          </p>

          <div className="flex flex-col gap-3">
            {resultado.itens.map((it, index) => (
              <div
                key={it.id}
                className={clsx(
                  'rounded-lg border bg-white p-4 shadow-sm',
                  it.alertas.length ? 'border-amber-300' : 'border-gray-200'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
                    <input
                      key={`ambiente-${it.id}`}
                      defaultValue={it.ambiente}
                      onBlur={(e) => atualizarEReordenar(it.id, { ambiente: e.target.value })}
                      placeholder="Ambiente"
                      className="w-40 rounded-md border border-gray-300 px-2 py-1 text-sm font-medium"
                    />
                    <input
                      key={`andar-${it.id}`}
                      defaultValue={it.andar}
                      onBlur={(e) => atualizarEReordenar(it.id, { andar: e.target.value })}
                      placeholder="Andar"
                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                    <select
                      value={it.item}
                      onChange={(e) => atualizarItem(it.id, { item: e.target.value as TipoItemVistoria })}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      {TIPOS.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removerItem(it.id)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="Remover ocorrência"
                  >
                    ✕
                  </button>
                </div>

                {it.alertas.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {it.alertas.map((alerta, i) => (
                      <li
                        key={i}
                        className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
                      >
                        ⚠ {alerta}
                      </li>
                    ))}
                  </ul>
                )}

                <textarea
                  value={it.descricao}
                  onChange={(e) => atualizarItem(it.id, { descricao: e.target.value })}
                  placeholder="Descrição da ocorrência..."
                  rows={2}
                  className="mt-3 w-full resize-none rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {it.fotos.map((nomeFoto) => {
                    const blob = resultado.fotos.get(nomeFoto)
                    if (!blob) return null
                    return <FotoMiniatura key={nomeFoto} blob={blob} onRemover={() => removerFoto(it.id, nomeFoto)} />
                  })}
                  <FotoAdicionar onSelecionar={(arquivos) => adicionarFotos(it.id, arquivos)} />
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-4 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            {salvo && <span className="mr-auto text-sm font-medium text-green-700">✓ Salvo no projeto</span>}
            <button
              onClick={baixarPdf}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ⬇ Baixar PDF
            </button>
            <button
              onClick={baixarExcel}
              disabled={gerandoExcel}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {gerandoExcel ? 'Gerando...' : '⬇ Baixar Excel'}
            </button>
            <button
              onClick={salvarNoProjeto}
              disabled={salvando}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar no projeto'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
