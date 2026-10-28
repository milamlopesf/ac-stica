'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CategoriaBiblioteca, ItemBiblioteca } from '@/lib/types/database'
import {
  TIPOS_ARQUIVO_ACEITOS,
  extensaoValida,
  MODELOS_LAUDO,
  SUBCATEGORIAS_LAUDO,
  TIPOS_INSTALACAO_LAUDO,
  ehModeloDPT,
  ehModeloDrywall,
} from '@/lib/utils/biblioteca'
import { sanitizarNomeArquivo } from '@/lib/utils/storage'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { htmlEstaVazio } from '@/lib/utils/texto'

const BUCKET = 'biblioteca-documentos'

export function BibliotecaFormModal({
  categoria,
  fornecedoresExistentes = [],
  rwsExistentes = [],
  espessurasMontanteExistentes = [],
  numerosPlacasExistentes = [],
  tiposLaExistentes = [],
  espessurasLaExistentes = [],
  onFechar,
  onSalvo,
}: {
  categoria: CategoriaBiblioteca
  fornecedoresExistentes?: string[]
  rwsExistentes?: string[]
  espessurasMontanteExistentes?: string[]
  numerosPlacasExistentes?: string[]
  tiposLaExistentes?: string[]
  espessurasLaExistentes?: string[]
  onFechar: () => void
  onSalvo: (item: ItemBiblioteca) => void
}) {
  const supabase = createClient()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [rw, setRw] = useState('')
  const [modelo, setModelo] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [tipoInstalacao, setTipoInstalacao] = useState('')
  const [espessuraVidro, setEspessuraVidro] = useState('')
  const [comPorta, setComPorta] = useState(false)
  const [portaMaterial, setPortaMaterial] = useState('')
  const [portaEspessura, setPortaEspessura] = useState('')
  const [portaGuilhotina, setPortaGuilhotina] = useState(false)
  const [espessuraMontante, setEspessuraMontante] = useState('')
  const [numeroPlacas, setNumeroPlacas] = useState('')
  const [tipoLa, setTipoLa] = useState('')
  const [espessuraLa, setEspessuraLa] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const ehDPT = ehModeloDPT(modelo)
  const ehDrywall = ehModeloDrywall(modelo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!arquivo) {
      setErro('Selecione um arquivo PDF ou Excel.')
      return
    }
    if (!extensaoValida(arquivo.name)) {
      setErro('Apenas arquivos PDF ou Excel (.pdf, .xls, .xlsx) são aceitos.')
      return
    }

    setSalvando(true)

    const caminho = `${categoria}/${Date.now()}-${sanitizarNomeArquivo(arquivo.name)}`
    const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)

    if (erroUpload) {
      setSalvando(false)
      setErro(`Erro ao enviar arquivo: ${erroUpload.message}`)
      return
    }

    const { data, error: erroInsert } = await supabase
      .from('biblioteca')
      .insert({
        categoria,
        titulo,
        descricao: htmlEstaVazio(descricao) ? null : descricao,
        fornecedor: fornecedor || null,
        rw: rw || null,
        modelo: modelo || null,
        subcategoria: subcategoria || null,
        tipo_instalacao: ehDPT ? tipoInstalacao || null : null,
        espessura_vidro: ehDPT ? espessuraVidro.trim() || null : null,
        com_porta: ehDPT ? comPorta : false,
        porta_material: ehDPT && comPorta ? portaMaterial.trim() || null : null,
        porta_espessura: ehDPT && comPorta ? portaEspessura.trim() || null : null,
        porta_guilhotina: ehDPT && comPorta ? portaGuilhotina : false,
        espessura_montante: ehDrywall ? espessuraMontante.trim() || null : null,
        numero_placas: ehDrywall ? numeroPlacas.trim() || null : null,
        tipo_la: ehDrywall ? tipoLa.trim() || null : null,
        espessura_la: ehDrywall ? espessuraLa.trim() || null : null,
        nome_arquivo: arquivo.name,
        caminho_storage: caminho,
        tamanho_bytes: arquivo.size,
      })
      .select()
      .single()

    setSalvando(false)

    if (erroInsert) {
      setErro(`Erro ao salvar: ${erroInsert.message}`)
      return
    }

    onSalvo(data as ItemBiblioteca)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Novo Item</h2>

        {erro && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Título</label>
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <RichTextEditor value={descricao} onChange={setDescricao} placeholder="Breve descrição do item..." />
          </div>

          {categoria === 'laudos' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fornecedor</label>
                <input
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  list="fornecedores-existentes-novo"
                  placeholder="Digite ou escolha"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <datalist id="fornecedores-existentes-novo">
                  {fornecedoresExistentes.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Rw</label>
                <input
                  value={rw}
                  onChange={(e) => setRw(e.target.value)}
                  list="rws-existentes-novo"
                  placeholder="Digite ou escolha"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <datalist id="rws-existentes-novo">
                  {rwsExistentes.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Modelo</label>
                <select
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Selecione...</option>
                  {MODELOS_LAUDO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Subcategoria</label>
                <select
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Selecione...</option>
                  {SUBCATEGORIAS_LAUDO.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {ehDPT && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Tipo de instalação</label>
                    <select
                      value={tipoInstalacao}
                      onChange={(e) => setTipoInstalacao(e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {TIPOS_INSTALACAO_LAUDO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Espessura do vidro</label>
                    <input
                      value={espessuraVidro}
                      onChange={(e) => setEspessuraVidro(e.target.value)}
                      placeholder="Ex: 8mm, 6+10mm"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Com porta?</label>
                    <select
                      value={comPorta ? 'sim' : 'nao'}
                      onChange={(e) => setComPorta(e.target.value === 'sim')}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>

                  {comPorta && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Material da porta</label>
                        <input
                          value={portaMaterial}
                          onChange={(e) => setPortaMaterial(e.target.value)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Espessura da porta</label>
                        <input
                          value={portaEspessura}
                          onChange={(e) => setPortaEspessura(e.target.value)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Guilhotina?</label>
                        <select
                          value={portaGuilhotina ? 'sim' : 'nao'}
                          onChange={(e) => setPortaGuilhotina(e.target.value === 'sim')}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                        >
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}

              {ehDrywall && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Espessura do montante</label>
                    <input
                      value={espessuraMontante}
                      onChange={(e) => setEspessuraMontante(e.target.value)}
                      list="espessuras-montante-existentes-novo"
                      placeholder="Digite ou escolha"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <datalist id="espessuras-montante-existentes-novo">
                      {espessurasMontanteExistentes.map((e) => (
                        <option key={e} value={e} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Número de placas</label>
                    <input
                      value={numeroPlacas}
                      onChange={(e) => setNumeroPlacas(e.target.value)}
                      list="numeros-placas-existentes-novo"
                      placeholder="Digite ou escolha"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <datalist id="numeros-placas-existentes-novo">
                      {numerosPlacasExistentes.map((n) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Tipo de lã</label>
                    <input
                      value={tipoLa}
                      onChange={(e) => setTipoLa(e.target.value)}
                      list="tipos-la-existentes-novo"
                      placeholder="Digite ou escolha"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <datalist id="tipos-la-existentes-novo">
                      {tiposLaExistentes.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Espessura da lã</label>
                    <input
                      value={espessuraLa}
                      onChange={(e) => setEspessuraLa(e.target.value)}
                      list="espessuras-la-existentes-novo"
                      placeholder="Digite ou escolha"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <datalist id="espessuras-la-existentes-novo">
                      {espessurasLaExistentes.map((e) => (
                        <option key={e} value={e} />
                      ))}
                    </datalist>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Arquivo (PDF ou Excel)</label>
            <input
              required
              type="file"
              accept={TIPOS_ARQUIVO_ACEITOS}
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
