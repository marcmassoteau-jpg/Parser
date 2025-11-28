import { CloudArrowUpIcon, DocumentTextIcon, TableCellsIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { useParserStore } from '../../store/parserStore'
import { parse, detectParserType, suggestDelimiter } from '../../parsers'

export function EmptyState() {
  const { config, setConfig, setRawData, setFileName, setParsedData, setIsProcessing, setError } = useParserStore()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      setRawData(text)
      setFileName(file.name)

      const detectedType = detectParserType(text)
      const newConfig = { ...config, type: detectedType, name: file.name }

      if (detectedType === 'csv') {
        newConfig.delimiter = suggestDelimiter(text)
      }

      setConfig(newConfig)
      const result = parse(text, newConfig)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      setRawData(text)
      setFileName(file.name)

      const detectedType = detectParserType(text)
      const newConfig = { ...config, type: detectedType, name: file.name }

      if (detectedType === 'csv') {
        newConfig.delimiter = suggestDelimiter(text)
      }

      setConfig(newConfig)
      const result = parse(text, newConfig)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const loadSampleData = async (type: 'csv' | 'fin' | 'iso20022') => {
    setIsProcessing(true)
    setError(null)

    try {
      let sampleData = ''
      let fileName = ''

      switch (type) {
        case 'csv':
          fileName = 'sample.csv'
          sampleData = `id,name,email,amount,date,status
1,John Doe,john@example.com,1500.00,2024-01-15,completed
2,Jane Smith,jane@example.com,2300.50,2024-01-16,pending
3,Bob Wilson,bob@example.com,890.25,2024-01-17,completed
4,Alice Brown,alice@example.com,3200.00,2024-01-18,failed
5,Charlie Davis,charlie@example.com,1750.75,2024-01-19,completed`
          break
        case 'fin':
          fileName = 'mt103.fin'
          sampleData = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:
:20:REFERENCE123456
:23B:CRED
:32A:240115EUR1500,00
:50K:/12345678
JOHN DOE
123 MAIN STREET
NEW YORK
:59:/DE89370400440532013000
JANE SMITH
456 ANOTHER ST
BERLIN
:70:PAYMENT FOR INVOICE 12345
:71A:SHA
-}`
          break
        case 'iso20022':
          fileName = 'pain001.xml'
          sampleData = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG-001</MsgId>
      <CreDtTm>2024-01-15T10:30:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>1500.00</CtrlSum>
      <InitgPty>
        <Nm>ACME Corporation</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>E2E-001</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">1500.00</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>BANKDEFF</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>Supplier Inc</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>DE89370400440532013000</IBAN>
          </Id>
        </CdtrAcct>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
          break
      }

      setRawData(sampleData)
      setFileName(fileName)

      const detectedType = detectParserType(sampleData)
      const newConfig = { ...config, type: detectedType, name: fileName }

      if (detectedType === 'csv') {
        newConfig.delimiter = suggestDelimiter(sampleData)
      }

      setConfig(newConfig)
      const result = parse(sampleData, newConfig)
      setParsedData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load sample')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="max-w-2xl w-full mx-auto px-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <DocumentTextIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Visual Parser</h2>
          <p className="text-slate-600">
            Upload a file or try a sample to get started with parsing and mapping
          </p>
        </div>

        <label className="block cursor-pointer mb-8">
          <input
            type="file"
            onChange={handleFileUpload}
            className="sr-only"
            accept=".csv,.txt,.xml,.mt,.fin,.json"
          />
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-all">
            <CloudArrowUpIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-1">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supports CSV, Fixed Width, SWIFT FIN, ISO 20022 XML, and custom formats
            </p>
          </div>
        </label>

        <div className="text-center mb-6">
          <span className="text-sm text-slate-500">Or try a sample</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => loadSampleData('csv')}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <TableCellsIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">CSV Sample</span>
          </button>

          <button
            onClick={() => loadSampleData('fin')}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <DocumentTextIcon className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">SWIFT MT103</span>
          </button>

          <button
            onClick={() => loadSampleData('iso20022')}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <CodeBracketIcon className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">ISO 20022</span>
          </button>
        </div>
      </div>
    </div>
  )
}
