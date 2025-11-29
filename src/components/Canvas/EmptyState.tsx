import { CloudArrowUpIcon, DocumentTextIcon, TableCellsIcon, CodeBracketIcon, Bars3BottomLeftIcon, CpuChipIcon } from '@heroicons/react/24/outline'
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

  const loadSampleData = async (type: 'csv' | 'fin' | 'iso20022' | 'fixed-width' | 'custom') => {
    setIsProcessing(true)
    setError(null)

    try {
      let sampleData = ''
      let fileName = ''

      switch (type) {
        case 'csv':
          fileName = 'transactions.csv'
          sampleData = `transaction_id,account_number,beneficiary_name,amount,currency,value_date,status,reference
TXN001,GB82WEST12345698765432,Acme Corporation,15000.00,GBP,2024-01-15,COMPLETED,INV-2024-001
TXN002,DE89370400440532013000,Global Tech GmbH,23500.50,EUR,2024-01-16,PENDING,PO-2024-0042
TXN003,FR7630006000011234567890189,Société Générale,8900.25,EUR,2024-01-17,COMPLETED,CONTRACT-789
TXN004,US12345678901234567890,American Supplies Inc,32000.00,USD,2024-01-18,FAILED,WIRE-2024-003
TXN005,CH9300762011623852957,Swiss Holdings AG,17500.75,CHF,2024-01-19,COMPLETED,PAYMENT-456
TXN006,JP1234567890123456789,Tokyo Industries Ltd,45000.00,JPY,2024-01-20,PROCESSING,TRADE-2024-01`
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
        case 'fixed-width':
          fileName = 'bank_statement.txt'
          // Fixed width format: Record Type (2) | Account (16) | Date (8) | Amount (12) | Currency (3) | Description (30) | Reference (15)
          sampleData = `HDACCOUNT_HEADER  20240115            MONTHLY STATEMENT             REF-HEAD-001
01GB82WEST123456982024011500015000.00GBPPayment to Acme Corp          TXN-00001-2024
01GB82WEST123456982024011600023500.50EURTransfer to Global Tech       TXN-00002-2024
01GB82WEST123456982024011700008900.25EURContract payment              TXN-00003-2024
01GB82WEST123456982024011800032000.00USDWire to American Supplies    TXN-00004-2024
01GB82WEST123456982024011900017500.75CHFPayment Swiss Holdings        TXN-00005-2024
TRTRAILER_RECORD  2024012000096901.50   TOTAL: 5 TRANSACTIONS         REF-TAIL-001   `
          break
        case 'custom':
          fileName = 'server_logs.log'
          // Custom log format with structured data
          sampleData = `[2024-01-15 10:30:45.123] INFO  [PaymentService] Transaction initiated | txn_id=TXN001 | amount=15000.00 | currency=GBP | status=PENDING
[2024-01-15 10:30:45.456] DEBUG [ValidationService] Validating transaction | txn_id=TXN001 | rules_applied=AML,SANCTIONS,LIMITS
[2024-01-15 10:30:46.789] INFO  [PaymentService] Transaction approved | txn_id=TXN001 | amount=15000.00 | currency=GBP | status=APPROVED
[2024-01-15 10:31:00.234] INFO  [PaymentService] Transaction initiated | txn_id=TXN002 | amount=23500.50 | currency=EUR | status=PENDING
[2024-01-15 10:31:01.567] WARN  [ValidationService] High-value transaction flagged | txn_id=TXN002 | threshold=20000 | requires_approval=true
[2024-01-15 10:31:15.890] INFO  [PaymentService] Transaction pending review | txn_id=TXN002 | amount=23500.50 | currency=EUR | status=PENDING_REVIEW
[2024-01-15 10:32:00.123] ERROR [PaymentService] Transaction failed | txn_id=TXN003 | error=INSUFFICIENT_FUNDS | account=GB82WEST12345698765432`
          break
      }

      setRawData(sampleData)
      setFileName(fileName)

      // For fixed-width and custom, we set the type explicitly
      let detectedType = detectParserType(sampleData)
      if (type === 'fixed-width') detectedType = 'fixed-width'
      if (type === 'custom') detectedType = 'custom'

      const newConfig = { ...config, type: detectedType, name: fileName }

      if (detectedType === 'csv') {
        newConfig.delimiter = suggestDelimiter(sampleData)
      }

      // Add field definitions for fixed-width sample
      if (type === 'fixed-width') {
        newConfig.fieldDefinitions = [
          { id: 'f1', name: 'Record Type', start: 0, length: 2, type: 'string' },
          { id: 'f2', name: 'Account/Header', start: 2, length: 16, type: 'string' },
          { id: 'f3', name: 'Date', start: 18, length: 8, type: 'date' },
          { id: 'f4', name: 'Amount', start: 26, length: 12, type: 'number' },
          { id: 'f5', name: 'Currency', start: 38, length: 3, type: 'string' },
          { id: 'f6', name: 'Description', start: 41, length: 30, type: 'string' },
          { id: 'f7', name: 'Reference', start: 71, length: 15, type: 'string' },
        ]
      }

      // Add custom pattern for log parsing
      if (type === 'custom') {
        newConfig.customPattern = '\\[(?<timestamp>[^\\]]+)\\]\\s+(?<level>\\w+)\\s+\\[(?<service>[^\\]]+)\\]\\s+(?<message>[^|]+)(?:\\s*\\|\\s*(?<fields>.+))?'
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
          <span className="text-sm text-slate-500">Or try a sample to explore capabilities</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => loadSampleData('csv')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <TableCellsIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-slate-700 block">CSV</span>
              <span className="text-xs text-slate-400">Transactions</span>
            </div>
          </button>

          <button
            onClick={() => loadSampleData('fixed-width')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Bars3BottomLeftIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-slate-700 block">Fixed Width</span>
              <span className="text-xs text-slate-400">Bank Statement</span>
            </div>
          </button>

          <button
            onClick={() => loadSampleData('fin')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <DocumentTextIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-slate-700 block">SWIFT FIN</span>
              <span className="text-xs text-slate-400">MT103 Payment</span>
            </div>
          </button>

          <button
            onClick={() => loadSampleData('iso20022')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <CodeBracketIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-slate-700 block">ISO 20022</span>
              <span className="text-xs text-slate-400">pain.001 XML</span>
            </div>
          </button>

          <button
            onClick={() => loadSampleData('custom')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-lg transition-all group col-span-2 md:col-span-1"
          >
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
              <CpuChipIcon className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-slate-700 block">Custom</span>
              <span className="text-xs text-slate-400">Log Parser</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
