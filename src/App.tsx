import { useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { ParserCanvas } from './components/Canvas/ParserCanvas'
import { ConfigPanel } from './components/Config/ConfigPanel'
import { DataPreview } from './components/Preview/DataPreview'
import { MappingPanel } from './components/Mapping/MappingPanel'
import { useParserStore } from './store/parserStore'
import 'reactflow/dist/style.css'

function App() {
  const [activePanel, setActivePanel] = useState<'config' | 'preview' | 'mapping'>('config')
  const { parsedData } = useParserStore()

  return (
    <ReactFlowProvider>
      <div className="h-full w-full flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative">
              <ParserCanvas />
            </div>
          </main>
          <aside className="w-96 border-l border-slate-200 bg-white flex flex-col">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActivePanel('config')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activePanel === 'config'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Configuration
              </button>
              <button
                onClick={() => setActivePanel('preview')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activePanel === 'preview'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActivePanel('mapping')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activePanel === 'mapping'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Mapping
                {parsedData && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {activePanel === 'config' && <ConfigPanel />}
              {activePanel === 'preview' && <DataPreview />}
              {activePanel === 'mapping' && <MappingPanel />}
            </div>
          </aside>
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export default App
