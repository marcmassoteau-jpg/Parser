import { useState, useEffect, useCallback } from 'react'
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

type PanelType = 'config' | 'preview' | 'mapping'

function App() {
  const [activePanel, setActivePanel] = useState<PanelType>('config')
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

  // Handle mobile panel change - opens panel and switches to selected tab
  const handleMobilePanelChange = useCallback((panel: PanelType) => {
    setActivePanel(panel)
    setShowMobilePanel(true)
  }, [])

  // Handle closing mobile panel
  const handleMobilePanelClose = useCallback(() => {
    setShowMobilePanel(false)
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
                className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
                onClick={() => setShowMobileSidebar(false)}
              />
              <div className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white z-50 shadow-2xl animate-slide-right safe-area-top">
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
                className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
                onClick={handleMobilePanelClose}
              />
              <div className="fixed left-0 right-0 bottom-0 h-[75vh] bg-white z-50 rounded-t-2xl shadow-2xl flex flex-col animate-slide-up">
                {/* Drag handle */}
                <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
                  <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>

                {/* Tab navigation */}
                <div className="flex border-b border-slate-200 mx-3 mb-1">
                  <button
                    onClick={() => setActivePanel('config')}
                    className={`flex-1 px-2 py-2.5 text-sm font-medium transition-all border-b-2 ${
                      activePanel === 'config'
                        ? 'text-primary-600 border-primary-600'
                        : 'text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                  >
                    Configuration
                  </button>
                  <button
                    onClick={() => setActivePanel('preview')}
                    className={`flex-1 px-2 py-2.5 text-sm font-medium transition-all border-b-2 ${
                      activePanel === 'preview'
                        ? 'text-primary-600 border-primary-600'
                        : 'text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActivePanel('mapping')}
                    className={`flex-1 px-2 py-2.5 text-sm font-medium transition-all border-b-2 relative ${
                      activePanel === 'mapping'
                        ? 'text-primary-600 border-primary-600'
                        : 'text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                  >
                    Mapping
                    {parsedData && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </button>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-auto safe-area-bottom">
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
            activePanel={activePanel}
            onPanelChange={handleMobilePanelChange}
            isPanelOpen={showMobilePanel}
            onPanelClose={handleMobilePanelClose}
          />
        )}
      </div>
    </ReactFlowProvider>
  )
}

export default App
