import { useCallback, useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from 'reactflow'
import { useParserStore } from '../../store/parserStore'
import { SourceNode } from './nodes/SourceNode'
import { HeaderNode } from './nodes/HeaderNode'
import { TransactionNode } from './nodes/TransactionNode'
import { FieldNode } from './nodes/FieldNode'
import { OutputNode } from './nodes/OutputNode'
import { EmptyState } from './EmptyState'

const nodeTypes = {
  source: SourceNode,
  header: HeaderNode,
  transaction: TransactionNode,
  field: FieldNode,
  output: OutputNode,
}

export function ParserCanvas() {
  const { parsedData, config, setNodes: storeSetNodes, setEdges: storeSetEdges } = useParserStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#0ea5e9' } }, eds)),
    [setEdges]
  )

  // Generate nodes from parsed data
  useEffect(() => {
    if (!parsedData) {
      setNodes([])
      setEdges([])
      return
    }

    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    // Source node
    newNodes.push({
      id: 'source',
      type: 'source',
      position: { x: 50, y: 200 },
      data: {
        label: config.name || 'Input Data',
        type: 'source',
        config,
        icon: '📄',
      },
    })

    // Group records by type
    const headers = parsedData.records.filter((r) => r.type === 'header')
    const transactions = parsedData.records.filter((r) => r.type === 'transaction')
    const dataRecords = parsedData.records.filter((r) => r.type === 'data')
    const footers = parsedData.records.filter((r) => r.type === 'footer')

    let yOffset = 50

    // Header nodes
    if (headers.length > 0 || parsedData.headers) {
      const headerNode: Node = {
        id: 'header-group',
        type: 'header',
        position: { x: 350, y: yOffset },
        data: {
          label: 'Headers',
          type: 'header',
          fields: parsedData.headers?.map((h, i) => ({
            id: `header-${i}`,
            name: h,
            value: headers[0]?.fields[i]?.value ?? h,
            type: 'string',
            originalValue: h,
          })) || [],
          record: headers[0],
          isExpanded: true,
          color: '#3b82f6',
          icon: '📋',
        },
      }
      newNodes.push(headerNode)
      newEdges.push({
        id: 'source-to-header',
        source: 'source',
        target: 'header-group',
        animated: true,
        style: { stroke: '#3b82f6' },
      })
      yOffset += 200
    }

    // Transaction nodes (show first 5)
    const displayTransactions = [...transactions, ...dataRecords].slice(0, 5)
    displayTransactions.forEach((record, index) => {
      const nodeId = `transaction-${index}`
      newNodes.push({
        id: nodeId,
        type: 'transaction',
        position: { x: 350, y: yOffset + index * 120 },
        data: {
          label: `Record ${record.index + 1}`,
          type: 'transaction',
          fields: record.fields,
          record,
          isExpanded: index === 0,
          color: record.type === 'transaction' ? '#10b981' : '#6366f1',
          icon: record.type === 'transaction' ? '💳' : '📝',
        },
      })
      newEdges.push({
        id: `source-to-${nodeId}`,
        source: 'source',
        target: nodeId,
        animated: true,
        style: { stroke: record.type === 'transaction' ? '#10b981' : '#6366f1' },
      })
    })

    yOffset += displayTransactions.length * 120 + 50

    // Footer node if exists
    if (footers.length > 0) {
      newNodes.push({
        id: 'footer-group',
        type: 'header',
        position: { x: 350, y: yOffset },
        data: {
          label: 'Footer',
          type: 'header',
          fields: footers[0].fields,
          record: footers[0],
          isExpanded: false,
          color: '#f59e0b',
          icon: '📄',
        },
      })
      newEdges.push({
        id: 'source-to-footer',
        source: 'source',
        target: 'footer-group',
        animated: true,
        style: { stroke: '#f59e0b' },
      })
    }

    // Output node
    const outputY = Math.max(yOffset, 300)
    newNodes.push({
      id: 'output',
      type: 'output',
      position: { x: 700, y: outputY / 2 },
      data: {
        label: 'Output',
        type: 'output',
        icon: '🎯',
        metadata: parsedData.metadata,
      },
    })

    // Connect all nodes to output
    newNodes.forEach((node) => {
      if (node.id !== 'source' && node.id !== 'output') {
        newEdges.push({
          id: `${node.id}-to-output`,
          source: node.id,
          target: 'output',
          animated: false,
          style: { stroke: '#94a3b8', strokeDasharray: '5,5' },
        })
      }
    })

    setNodes(newNodes)
    setEdges(newEdges)
    storeSetNodes(newNodes)
    storeSetEdges(newEdges)
  }, [parsedData, config, setNodes, setEdges, storeSetNodes, storeSetEdges])

  const minimapStyle = useMemo(
    () => ({
      height: 100,
      backgroundColor: '#f8fafc',
    }),
    []
  )

  if (!parsedData) {
    return <EmptyState />
  }

  return (
    <div className="w-full h-full relative">
      {/* Data loaded indicator */}
      <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        {parsedData.metadata.totalRecords} records loaded
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls className="bg-white rounded-lg shadow-lg border border-slate-200" />
        <MiniMap style={minimapStyle} nodeColor="#0ea5e9" maskColor="rgba(0,0,0,0.1)" />
      </ReactFlow>
    </div>
  )
}
