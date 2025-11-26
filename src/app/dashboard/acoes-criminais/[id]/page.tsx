'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, CheckCircle2, Save, Upload, FileText, Trash2, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DetailLayout } from '@/components/detail/DetailLayout'
import { StepItem } from '@/components/detail/StepItem'
import { StatusPanel } from '@/components/detail/StatusPanel'
import { DocumentPanel } from '@/components/detail/DocumentPanel'
import { NotesPanel } from '@/components/detail/NotesPanel'

const WORKFLOWS = {
  'Ação Criminal': [
    'Cadastro de Documentos',
    'Análise do Caso',
    'Petição Inicial',
    'Protocolar Processo',
    'Aguardar Citação',
    'Resposta à Acusação',
    'Instrução Processual',
    'Alegações Finais',
    'Sentença',
    'Recurso (se necessário)'
  ]
}

export default function AcoesCriminaisPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter()
  const [caseData, setCaseData] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({})
  const [documents, setDocuments] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({})
  const [editingDocument, setEditingDocument] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStepDialog, setShowStepDialog] = useState(false)
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [pendingNotes, setPendingNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [documentToDelete, setDocumentToDelete] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Estados para dados específicos de cada etapa
  const [stepData, setStepData] = useState<{ [key: number]: any }>({})

  // Estados para uploads de arquivos específicos
  const [fileUploads, setFileUploads] = useState<{ [key: string]: File | null }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'idle' | 'uploading' | 'success' | 'error' }>({})

  useEffect(() => {
    fetchCase()
    fetchDocuments()
  }, [id])

  const fetchCase = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/acoes-criminais?id=${id}`)
      if (response.ok) {
        const rec = await response.json()
        const data = {
          id: rec.id,
          title: rec.client_name || rec.clientName || `Ação Criminal #${id}`,
          type: 'Ação Criminal',
          status: rec.status || 'Em andamento',
          currentStep: rec.current_step || rec.currentStep || 0,
          notes: rec.notes || '',
          createdAt: rec.created_at || rec.createdAt,
          updatedAt: rec.updated_at || rec.updatedAt,
        }
        setCaseData(data)
        setNotes(data.notes)
        setStatus(data.status)
      }
    } catch (error) {
      console.error('Erro ao buscar caso:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?moduleType=acoes_criminais&recordId=${id}`)
      if (res.ok) {
        const docs = await res.json()
        setDocuments(docs || [])
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/documents/delete/${documentId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error('Erro ao deletar documento:', error)
    }
  }

  const handleDocumentDoubleClick = (document: any) => {
    setEditingDocument(document.id)
    setEditingName(document.name)
  }

  const handleDocumentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value)
  }

  const handleDocumentNameSave = async () => {
    try {
      if (!editingDocument) return
      const res = await fetch(`/api/documents/rename/${editingDocument}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_name: editingName })
      })
      if (res.ok) {
        await fetchDocuments()
        setEditingDocument(null)
        setEditingName('')
      }
    } catch (error) {
      console.error('Erro ao salvar nome do documento:', error)
    }
  }

  const handleDocumentNameCancel = () => {
    setEditingDocument(null)
    setEditingName('')
  }

  const handleDocumentNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDocumentNameSave()
    } else if (e.key === 'Escape') {
      handleDocumentNameCancel()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => uploadDroppedFile(file))
  }

  const handleDropFiles = (files: File[]) => {
    setIsDragOver(false)
    files.forEach(file => uploadDroppedFile(file))
  }

  const uploadDroppedFile = async (file: File) => {
    try {
      setUploadingFiles((prev: { [key: string]: boolean }) => ({ ...prev, [file.name]: true }))
      const fd = new FormData()
      fd.append('file', file)
      fd.append('caseId', String(id))
      fd.append('moduleType', 'acoes_criminais')
      fd.append('fieldName', 'documentoAnexado')
      if (caseData?.title) fd.append('clientName', String(caseData.title))
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      if (res.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
    } finally {
      setUploadingFiles((prev: { [key: string]: boolean }) => ({ ...prev, [file.name]: false }))
    }
  }

  const handleFileUpload = async (file: File, fieldName: string) => {
    try {
      setUploadStatus((prev: { [key: string]: 'idle' | 'uploading' | 'success' | 'error' }) => ({ ...prev, [fieldName]: 'uploading' }))
      const fd = new FormData()
      fd.append('file', file)
      fd.append('caseId', String(id))
      fd.append('moduleType', 'acoes_criminais')
      fd.append('fieldName', fieldName)
      if (caseData?.title) fd.append('clientName', String(caseData.title))
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      if (res.ok) {
        setFileUploads((prev: { [key: string]: File | null }) => ({ ...prev, [fieldName]: file }))
        setUploadStatus((prev: { [key: string]: 'idle' | 'uploading' | 'success' | 'error' }) => ({ ...prev, [fieldName]: 'success' }))
        await fetchDocuments()
      } else {
        setUploadStatus((prev: { [key: string]: 'idle' | 'uploading' | 'success' | 'error' }) => ({ ...prev, [fieldName]: 'error' }))
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      setUploadStatus((prev: { [key: string]: 'idle' | 'uploading' | 'success' | 'error' }) => ({ ...prev, [fieldName]: 'error' }))
    }
  }

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= (caseData?.currentStep || 0)) {
      setExpandedSteps((prev: { [key: number]: boolean }) => ({
        ...prev,
        [stepIndex]: !prev[stepIndex]
      }))
    } else {
      setPendingStepIndex(stepIndex)
      setShowStepDialog(true)
    }
  }

  const handleCompleteStep = () => {
    if (pendingStepIndex !== null && caseData) {
      setCaseData((prev: any) => ({ ...prev, currentStep: pendingStepIndex }))
      setExpandedSteps((prev: { [key: number]: boolean }) => ({ ...prev, [pendingStepIndex]: true }))
    }
    setShowStepDialog(false)
    setPendingStepIndex(null)
  }

  const confirmStepChange = () => {
    handleCompleteStep()
  }

  const handleSaveStepData = (stepIndex: number, data: any) => {
    setStepData((prev: { [key: number]: any }) => ({
      ...prev,
      [stepIndex]: { ...prev[stepIndex], ...data }
    }))
  }

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`/api/acoes-criminais?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      if (response.ok) {
        setPendingNotes('')
        setShowNotesDialog(false)
      }
    } catch (e) {
      console.error('Erro ao salvar observações:', e)
    }
  }

  const confirmSaveNotes = () => {
    setNotes(pendingNotes)
    setShowNotesDialog(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      const response = await fetch(`/api/acoes-criminais?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok && typeof window !== 'undefined') {
        try {
          localStorage.setItem('acoes-criminais-status-update', JSON.stringify({ id, status: newStatus, t: Date.now() }))
          window.dispatchEvent(new CustomEvent('acoes-criminais-status-updated', { detail: { id, status: newStatus } }))
        } catch {}
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const renderStepContent = (stepIndex: number) => {
    if (!caseData) return null

    switch (caseData.type) {
      case 'Ação Criminal':
        return renderAcaoCriminalStepContent(stepIndex)
      default:
        return <div>Tipo de caso não reconhecido</div>
    }
  }

  const renderAcaoCriminalStepContent = (stepIndex: number) => {
    const currentStepData = stepData[stepIndex] || {}

    switch (stepIndex) {
      case 0: // Cadastro de Documentos
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rg-acusado">RG do Acusado</Label>
                <Input
                  id="rg-acusado"
                  value={currentStepData.rgAcusado || ''}
                  onChange={(e) => handleSaveStepData(stepIndex, { rgAcusado: e.target.value })}
                  placeholder="Digite o RG do acusado"
                />
              </div>
              <div>
                <Label htmlFor="nome-acusado">Nome do Acusado</Label>
                <Input
                  id="nome-acusado"
                  value={currentStepData.nomeAcusado || ''}
                  onChange={(e) => handleSaveStepData(stepIndex, { nomeAcusado: e.target.value })}
                  placeholder="Digite o nome do acusado"
                />
              </div>
              <div>
                <Label htmlFor="cpf-acusado">CPF do Acusado</Label>
                <Input
                  id="cpf-acusado"
                  value={currentStepData.cpfAcusado || ''}
                  onChange={(e) => handleSaveStepData(stepIndex, { cpfAcusado: e.target.value })}
                  placeholder="Digite o CPF do acusado"
                />
              </div>
              <div>
                <Label htmlFor="endereco-acusado">Endereço do Acusado</Label>
                <Input
                  id="endereco-acusado"
                  value={currentStepData.enderecoAcusado || ''}
                  onChange={(e) => handleSaveStepData(stepIndex, { enderecoAcusado: e.target.value })}
                  placeholder="Digite o endereço do acusado"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="boletim-ocorrencia">Boletim de Ocorrência</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="boletim-ocorrencia"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'boletimOcorrencia')
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadStatus.boletimOcorrencia === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                  {uploadStatus.boletimOcorrencia === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>
              </div>

              <div>
                <Label htmlFor="documentos-identidade">Documentos de Identidade</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="documentos-identidade"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'documentosIdentidade')
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadStatus.documentosIdentidade === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                  {uploadStatus.documentosIdentidade === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>
              </div>

              <div>
                <Label htmlFor="comprovante-residencia">Comprovante de Residência</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="comprovante-residencia"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'comprovanteResidencia')
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadStatus.comprovanteResidencia === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                  {uploadStatus.comprovanteResidencia === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>
              </div>
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Dados
            </Button>
          </div>
        )

      case 1: // Análise do Caso
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="analise-caso">Análise Detalhada do Caso</Label>
              <Textarea
                id="analise-caso"
                value={currentStepData.analiseCaso || ''}
                onChange={(e) => handleSaveStepData(stepIndex, { analiseCaso: e.target.value })}
                placeholder="Descreva a análise detalhada do caso criminal..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="estrategia-defesa">Estratégia de Defesa</Label>
              <Textarea
                id="estrategia-defesa"
                value={currentStepData.estrategiaDefesa || ''}
                onChange={(e) => handleSaveStepData(stepIndex, { estrategiaDefesa: e.target.value })}
                placeholder="Descreva a estratégia de defesa..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="documentos-analise">Documentos de Análise</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentos-analise"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'documentosAnalise')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.documentosAnalise === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.documentosAnalise === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Análise
            </Button>
          </div>
        )

      case 2: // Petição Inicial
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="peticao-inicial">Petição Inicial</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="peticao-inicial"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'peticaoInicial')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.peticaoInicial === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.peticaoInicial === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="procuracao-criminal">Procuração</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="procuracao-criminal"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'procuracaoCriminal')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.procuracaoCriminal === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.procuracaoCriminal === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Petição
            </Button>
          </div>
        )

      case 3: // Protocolar Processo
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="processo-protocolado">Processo Protocolado</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="processo-protocolado"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'processoProtocolado')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.processoProtocolado === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.processoProtocolado === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="numero-protocolo">Número do Protocolo</Label>
              <Input
                id="numero-protocolo"
                value={currentStepData.numeroProtocolo || ''}
                onChange={(e) => handleSaveStepData(stepIndex, { numeroProtocolo: e.target.value })}
                placeholder="Digite o número do protocolo"
              />
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Protocolo
            </Button>
          </div>
        )

      case 4: // Aguardar Citação
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="citacao-recebida">Citação Recebida</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="citacao-recebida"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'citacaoRecebida')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.citacaoRecebida === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.citacaoRecebida === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="data-citacao">Data da Citação</Label>
              <Input
                id="data-citacao"
                type="date"
                value={currentStepData.dataCitacao || ''}
                onChange={(e) => handleSaveStepData(stepIndex, { dataCitacao: e.target.value })}
              />
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Citação
            </Button>
          </div>
        )

      case 5: // Resposta à Acusação
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="resposta-acusacao">Resposta à Acusação</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resposta-acusacao"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'respostaAcusacao')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.respostaAcusacao === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.respostaAcusacao === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="documentos-defesa">Documentos de Defesa</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentos-defesa"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'documentosDefesa')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.documentosDefesa === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.documentosDefesa === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Resposta
            </Button>
          </div>
        )

      case 6: // Instrução Processual
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="ata-audiencia">Ata da Audiência</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ata-audiencia"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'ataAudiencia')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.ataAudiencia === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.ataAudiencia === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="provas-testemunhas">Provas e Testemunhas</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="provas-testemunhas"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'provasTestemunhas')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.provasTestemunhas === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.provasTestemunhas === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Instrução
            </Button>
          </div>
        )

      case 7: // Alegações Finais
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="alegacoes-finais">Alegações Finais</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="alegacoes-finais"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'alegacoesFinais')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.alegacoesFinais === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.alegacoesFinais === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="memoriais">Memoriais</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="memoriais"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'memoriais')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.memoriais === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.memoriais === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alegações
            </Button>
          </div>
        )

      case 8: // Sentença
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="sentenca">Sentença</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sentenca"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'sentenca')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.sentenca === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.sentenca === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="resultado-sentenca">Resultado da Sentença</Label>
              <Textarea
                id="resultado-sentenca"
                value={currentStepData.resultadoSentenca || ''}
                onChange={(e) => handleSaveStepData(stepIndex, { resultadoSentenca: e.target.value })}
                placeholder="Descreva o resultado da sentença..."
                rows={4}
              />
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Sentença
            </Button>
          </div>
        )

      case 9: // Recurso (se necessário)
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="recurso">Recurso</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="recurso"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'recurso')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.recurso === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.recurso === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="documentos-finais">Documentos Finais</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="documentos-finais"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'documentosFinais')
                  }}
                  accept=".pdf,.doc,.docx"
                />
                {uploadStatus.documentosFinais === 'uploading' && <span className="text-sm text-blue-600">Enviando...</span>}
                {uploadStatus.documentosFinais === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes-finais">Observações Finais</Label>
              <Textarea
                id="observacoes-finais"
                value={currentStepData.observacoesFinais || ''}
                onChange={(e) => handleSaveStepData(stepIndex, { observacoesFinais: e.target.value })}
                placeholder="Observações finais do caso..."
                rows={4}
              />
            </div>

            <Button onClick={() => handleSaveStepData(stepIndex, currentStepData)} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Recurso
            </Button>
          </div>
        )

      default:
        return <div>Etapa não encontrada</div>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!caseData) {
    return <div>Ação não encontrada</div>
  }

  const workflow = WORKFLOWS[caseData.type as keyof typeof WORKFLOWS] || []

  return (
    <DetailLayout
      backHref="/dashboard/acoes-criminais"
      title={caseData.title}
      subtitle={caseData.type}
      onDelete={handleDelete}
      left={
        <div className="space-y-4">
          {workflow.map((step, index) => (
            <StepItem
              key={index}
              index={index}
              title={step}
              isCurrent={index === caseData.currentStep}
              isCompleted={index < caseData.currentStep}
              isPending={index > caseData.currentStep}
              expanded={expandedSteps[index]}
              onToggle={() => handleStepClick(index)}
              onMarkComplete={() => handleCompleteStep()}
            >
              {renderStepContent(index)}
            </StepItem>
          ))}
        </div>
      }
      right={
        <div className="space-y-6">
          <StatusPanel
            status={status}
            onStatusChange={handleStatusChange}
            currentStep={caseData.currentStep + 1}
            totalSteps={workflow.length}
            createdAt={caseData.createdAt}
            updatedAt={caseData.updatedAt}
          />
          
          <DocumentPanel
            onDropFiles={handleDropFiles}
            uploading={Object.values(uploadingFiles).some(Boolean)}
            documents={documents}
            loadingDocuments={false}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDocumentDownload={(doc) => { if (doc?.file_path) window.open(doc.file_path, '_blank') }}
            onDocumentDelete={(doc) => {
              setDocumentToDelete(doc)
              setDeleteDialogOpen(true)
            }}
            editingDocumentId={editingDocument}
            editingDocumentName={editingName}
            onDocumentNameChange={setEditingName}
            onDocumentNameSave={handleDocumentNameSave}
            onDocumentNameKeyPress={handleDocumentNameKeyPress}
            onDocumentDoubleClick={handleDocumentDoubleClick}
          />
          
          <NotesPanel
            notes={notes}
            onChange={setNotes}
            onSave={handleSaveNotes}
          />
        </div>
      }
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fluxo do Processo</CardTitle>
          <CardDescription>
            Acompanhe o progresso do caso através das etapas do workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.map((step, index) => (
              <div key={index} className="border rounded-lg">
                <Collapsible 
                  open={expandedSteps[index]} 
                  onOpenChange={() => handleStepClick(index)}
                >
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${
                      index <= (caseData.currentStep || 0) ? 'bg-green-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index < (caseData.currentStep || 0) ? 'bg-green-600 text-white' :
                          index === (caseData.currentStep || 0) ? 'bg-blue-600 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {index < (caseData.currentStep || 0) ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className="font-medium">{step}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          index < (caseData.currentStep || 0) ? 'default' :
                          index === (caseData.currentStep || 0) ? 'secondary' :
                          'outline'
                        }>
                          {index < (caseData.currentStep || 0) ? 'Concluído' :
                           index === (caseData.currentStep || 0) ? 'Em andamento' :
                           'Pendente'}
                        </Badge>
                        {expandedSteps[index] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t bg-white">
                      {renderStepContent(index)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            Documentos organizados por etapa do processo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflow.map((step, stepIndex) => {
            const fieldMap: Record<number, string[]> = {
              0: ['rnmMaeFile','rnmPaiFile','rnmSupostoPaiFile','certidaoNascimentoFile','comprovanteEnderecoFile','passaporteFile','guiaPagaFile'],
              1: ['analiseCaso','estrategiaDefesa'],
              2: ['peticaoInicial','procuracaoClienteFile','procuracaoAnexadaFile'],
              3: ['processoProtocolado','numeroProtocolo'],
              4: ['citacaoRecebida','dataCitacao'],
              5: ['respostaAcusacao','documentosDefesa'],
              6: ['ataAudiencia','provasTestemunhas'],
              7: ['alegacoesFinais','memoriais'],
              8: ['sentenca','resultadoSentenca'],
              9: ['recurso','documentosFinaisAnexadosFile','documentosProcessoFinalizadoFile'],
            }
            const stepDocuments = (documents || []).filter((doc: any) => (fieldMap[stepIndex] || []).includes(doc?.field_name))
            if (stepDocuments.length === 0) return null

            return (
              <div key={stepIndex} className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Etapa {stepIndex + 1}: {step}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stepDocuments.map((document) => (
                    <div key={document.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingDocument === document.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={handleDocumentNameChange}
                                onKeyDown={handleDocumentNameKeyPress}
                                className="text-sm"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={handleDocumentNameSave}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleDocumentNameCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <h5 
                              className="font-medium text-sm cursor-pointer hover:text-blue-600"
                              onDoubleClick={() => handleDocumentDoubleClick(document)}
                            >
                              {document.name}
                            </h5>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {Number.isFinite(document.size) ? (document.size / 1024 / 1024).toFixed(2) : '—'} MB
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDocumentDoubleClick(document)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {documents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento enviado ainda</p>
              <p className="text-sm">Arraste arquivos aqui ou use os campos de upload nas etapas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
          <CardDescription>
            Adicione observações e anotações sobre o caso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione suas observações sobre o caso..."
            rows={4}
            className="mb-4"
          />
          <Button onClick={handleSaveNotes}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Observações
          </Button>
        </CardContent>
      </Card>

      {/* Document Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documentToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && handleDeleteDocument(documentToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogs */}
      <AlertDialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avançar para próxima etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar a etapa atual como concluída e avançar para a próxima etapa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStepChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar observações</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja salvar as alterações nas observações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveNotes}>
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Solte os arquivos aqui para fazer upload</p>
          </div>
        </div>
      )}
    </DetailLayout>
  )
}
