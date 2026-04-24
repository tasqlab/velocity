import { useState, useEffect, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative z-10 w-full max-w-md mx-4 p-6 rounded-2xl transform transition-all duration-300 scale-100"
        style={{ 
          background: 'linear-gradient(180deg, rgba(30,35,42,0.98) 0%, rgba(20,23,28,0.98) 100%)', 
          border: '1px solid rgba(0,209,255,0.2)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 30px rgba(0,209,255,0.1)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-velocity-text">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-velocity-textMuted hover:text-velocity-text hover:bg-velocity-surface transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  placeholder: string
  confirmText: string
}

export function InputModal({ isOpen, onClose, onConfirm, title, placeholder, confirmText }: ConfirmModalProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (isOpen) setValue('')
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onConfirm(value.trim())
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full px-4 py-3 rounded-xl mb-4 text-velocity-text placeholder-velocity-textMuted focus:outline-none transition-all"
          style={{ 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-velocity-textMuted hover:text-velocity-text transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            style={{ 
              background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)', 
              color: '#0B0E11',
              boxShadow: '0 4px 15px rgba(0,209,255,0.3)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface AccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-velocity-textMuted hover:text-velocity-text hover:bg-velocity-surface/50 transition-all"
      >
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ActionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function ActionModal({ isOpen, onClose, title, children }: ActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-3">
        {children}
      </div>
    </Modal>
  )
}
