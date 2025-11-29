import { useState, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { ParserCanvas } from './components/Canvas/ParserCanvas'
import { ConfigPanel } from './components/Config/ConfigPanel'
import { DataPreview } from './components/Preview/DataPreview'
import { MappingPanel } from './components/Mapping/MappingPanel'
import { MobileNav } from './components/Layout/MobileNav'
import { useParserStore } from './store/parserStore'
import 'reactflow/dist/style.css'

function App() {
  const [activePanel, setActivePanel] = useState<'config' | 'preview' | 'mapping'>('config')
  const [isMobile, setIsMobile] = useState(false)
  const [showMobilePanel, setShowMobilePanel] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const { parsedData } = useParserStore()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <ReactFlowProvider>
      <div className="h-full w-full flex flex-col bg-slate-50">
        <Header
          isMobile={isMobile}
          onMenuClick={() => setShowMobileSidebar(true)}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Sidebar */}
          {!isMobile && <Sidebar />}

          {/* Mobile Sidebar Overlay */}
          {isMobile && showMobileSidebar && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
                onClick={() => setShowMobileSidebar(false)}
              />
              <div className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl animate-slide-up">
                <Sidebar onClose={() => setShowMobileSidebar(false)} />
              </div>
            </>
          )}

          {/* Main Canvas */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative">
              <ParserCanvas />
            </div>
          </main>

          {/* Desktop Right Panel */}
          {!isMobile && (
            <aside className="w-96 border-l border-slate-200 bg-white flex flex-col shadow-lg">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActivePanel('config')}
                  className={`flex-1 px-4 py-3.5 text-sm font-medium transition-all ${
                    activePanel === 'config'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Configuration
                </button>
                <button
                  onClick={() => setActivePanel('preview')}
                  className={`flex-1 px-4 py-3.5 text-sm font-medium transition-all ${
                    activePanel === 'preview'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActivePanel('mapping')}
                  className={`flex-1 px-4 py-3.5 text-sm font-medium transition-all relative ${
                    activePanel === 'mapping'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Mapping
                  {parsedData && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {activePanel === 'config' && <ConfigPanel />}
                {activePanel === 'preview' && <DataPreview />}
                {activePanel === 'mapping' && <MappingPanel />}
              </div>
            </aside>
          )}

          {/* Mobile Bottom Sheet */}
          {isMobile && showMobilePanel && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowMobilePanel(false)}
              />
              <div className="fixed left-0 right-0 bottom-0 h-[70vh] bg-white z-50 rounded-t-3xl shadow-2xl flex flex-col safe-area-bottom">
                <div className="flex justify-center py-3">
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>
                <div className="flex border-b border-slate-200 px-2">
                  <button
                    onClick={() => setActivePanel('config')}
                    className={`flex-1 px-3 py-3 text-sm font-medium transition-all rounded-t-lg ${
                      activePanel === 'config'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-slate-600'
                    }`}
                  >
                    Config
                  </button>
                  <button
                    onClick={() => setActivePanel('preview')}
                    className={`flex-1 px-3 py-3 text-sm font-medium transition-all rounded-t-lg ${
                      activePanel === 'preview'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-slate-600'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActivePanel('mapping')}
                    className={`flex-1 px-3 py-3 text-sm font-medium transition-all rounded-t-lg relative ${
                      activePanel === 'mapping'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-slate-600'
                    }`}
                  >
                    Mapping
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  {activePanel === 'config' && <ConfigPanel />}
                  {activePanel === 'preview' && <DataPreview />}
                  {activePanel === 'mapping' && <MappingPanel />}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <MobileNav
            onPanelToggle={() => setShowMobilePanel(!showMobilePanel)}
            isPanelOpen={showMobilePanel}
          />
        )}
      </div>
    </ReactFlowProvider>
  )
}

export default App
