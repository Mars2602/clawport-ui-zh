'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Map, MessageSquare, Columns3, Clock, Brain, Keyboard, AlertCircle, Loader2, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Rocket, RotateCcw, Check } from 'lucide-react'
import { useSettings } from '@/app/settings-provider'
import { useTheme } from '@/app/providers'
import { THEMES } from '@/lib/themes'
import type { ThemeId } from '@/lib/themes'
import { fetchOnboarded, syncOnboarded } from '@/lib/conversations'

// ---------------------------------------------------------------------------
// Accent color presets (same as settings page)
// ---------------------------------------------------------------------------

const ACCENT_PRESETS = [
  { labelKey: 'settings.colorPresets.red', value: '#EF4444' },
  { labelKey: 'settings.colorPresets.gold', value: '#F5C518' },
  { labelKey: 'settings.colorPresets.blue', value: '#3B82F6' },
  { labelKey: 'settings.colorPresets.green', value: '#22C55E' },
  { labelKey: 'settings.colorPresets.orange', value: '#F97316' },
  { labelKey: 'settings.colorPresets.purple', value: '#A855F7' },
  { labelKey: 'settings.colorPresets.pink', value: '#EC4899' },
  { labelKey: 'settings.colorPresets.teal', value: '#14B8A6' },
  { labelKey: 'settings.colorPresets.cyan', value: '#06B6D4' },
  { labelKey: 'settings.colorPresets.indigo', value: '#6366F1' },
  { labelKey: 'settings.colorPresets.rose', value: '#F43F5E' },
  { labelKey: 'settings.colorPresets.lime', value: '#84CC16' },
]

// ---------------------------------------------------------------------------
// Feature cards for overview step
// ---------------------------------------------------------------------------

const FEATURES = [
  { icon: Map, nameKey: 'onboarding.featureCards.agentMap.name', descKey: 'onboarding.featureCards.agentMap.desc' },
  { icon: MessageSquare, nameKey: 'onboarding.featureCards.chat.name', descKey: 'onboarding.featureCards.chat.desc' },
  { icon: Columns3, nameKey: 'onboarding.featureCards.kanban.name', descKey: 'onboarding.featureCards.kanban.desc' },
  { icon: Clock, nameKey: 'onboarding.featureCards.crons.name', descKey: 'onboarding.featureCards.crons.desc' },
  { icon: Brain, nameKey: 'onboarding.featureCards.memory.name', descKey: 'onboarding.featureCards.memory.desc' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  if (!name.trim()) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Types for system check
// ---------------------------------------------------------------------------

interface SystemCheckAgent {
  id: string
  name: string
  emoji: string
  title: string
}

type CheckStatus = 'loading' | 'ok' | 'error'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OnboardingWizardProps {
  forceOpen?: boolean
  onClose?: () => void
}

const THEME_LABELS: Record<string, { en: string; zh: string }> = {
  dark: { en: 'Dark', zh: '深色' },
  glass: { en: 'Glass', zh: '毛玻璃' },
  color: { en: 'Color', zh: '彩色' },
  light: { en: 'Light', zh: '浅色' },
}

export function OnboardingWizard({ forceOpen, onClose }: OnboardingWizardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const {
    settings,
    setPortalName,
    setPortalSubtitle,
    setOperatorName,
    setAccentColor,
  } = useSettings()
  const { theme, setTheme } = useTheme()
  const getThemeLabel = (id: string) => THEME_LABELS[id]?.[locale as 'en' | 'zh'] ?? THEME_LABELS[id]?.en ?? id

  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  // Local input values
  const [localName, setLocalName] = useState('')
  const [localSubtitle, setLocalSubtitle] = useState('')
  const [localOperator, setLocalOperator] = useState('')

  // System check state
  const [agentsStatus, setAgentsStatus] = useState<CheckStatus>('loading')
  const [cronsStatus, setCronsStatus] = useState<CheckStatus>('loading')
  const [agents, setAgents] = useState<SystemCheckAgent[]>([])
  const [agentsError, setAgentsError] = useState<string | null>(null)
  const [cronsError, setCronsError] = useState<string | null>(null)

  // First-run detection
  useEffect(() => {
    if (forceOpen) {
      setLocalName(settings.portalName ?? '')
      setLocalSubtitle(settings.portalSubtitle ?? '')
      setLocalOperator(settings.operatorName ?? '')
      setVisible(true)
      return
    }
    if (typeof window !== 'undefined') {
      const localFlag = localStorage.getItem('clawport-onboarded')
      // Always verify with server -- workspace may have moved since last session
      fetchOnboarded().then(onboarded => {
        if (onboarded) {
          if (!localFlag) localStorage.setItem('clawport-onboarded', '1')
        } else {
          // Server says not onboarded (workspace changed or fresh install)
          if (localFlag) localStorage.removeItem('clawport-onboarded')
          setVisible(true)
        }
      }).catch(() => {
        // Server unreachable -- trust localStorage if set, show wizard if not
        if (!localFlag) setVisible(true)
      })
    }
  }, [forceOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Run system checks when we reach the system check step
  useEffect(() => {
    if (visible && step === 1) {
      runSystemChecks()
    }
  }, [visible, step]) // eslint-disable-line react-hooks/exhaustive-deps

  function runSystemChecks() {
    setAgentsStatus('loading')
    setCronsStatus('loading')
    setAgentsError(null)
    setCronsError(null)

    // Check agents
    fetch('/api/agents')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data.map((a: Record<string, unknown>) => ({
            id: String(a.id ?? ''),
            name: String(a.name ?? ''),
            emoji: String(a.emoji ?? ''),
            title: String(a.title ?? ''),
          })))
          setAgentsStatus('ok')
        } else {
          setAgentsError(t('onboarding.noAgentsError'))
          setAgentsStatus('error')
        }
      })
      .catch(() => {
        setAgentsError(t('onboarding.agentRegistryError'))
        setAgentsStatus('error')
      })

    // Check crons (validates gateway + openclaw binary)
    fetch('/api/crons')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(() => {
        setCronsStatus('ok')
      })
      .catch(() => {
        setCronsError(t('onboarding.gatewayError'))
        setCronsStatus('error')
      })
  }

  const TOTAL_STEPS = 7

  const handleNext = useCallback(() => {
    // Commit operator name on step 1 (system check)
    if (step === 1) {
      setOperatorName(localOperator || null)
    }
    // Commit dashboard name/subtitle on step 2 (naming step)
    if (step === 2) {
      setPortalName(localName || null)
      setPortalSubtitle(localSubtitle || null)
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    } else {
      if (!forceOpen) {
        localStorage.setItem('clawport-onboarded', '1')
        syncOnboarded(true)
      }
      setVisible(false)
      onClose?.()
    }
  }, [step, localName, localSubtitle, localOperator, forceOpen, onClose, setPortalName, setPortalSubtitle, setOperatorName])

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1)
  }, [step])

  if (!visible) return null

  const systemAllOk = agentsStatus === 'ok' && cronsStatus === 'ok'
  const systemLoading = agentsStatus === 'loading' || cronsStatus === 'loading'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 520,
          margin: '0 var(--space-4)',
          background: 'var(--material-regular)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--separator)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Step indicator dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: 'var(--space-4) var(--space-4) 0',
        }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? 'var(--accent)' : i < step ? 'var(--accent)' : 'var(--fill-tertiary)',
                opacity: i < step ? 0.5 : 1,
                transition: 'all 200ms var(--ease-smooth)',
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div style={{
          padding: 'var(--space-5) var(--space-5) var(--space-4)',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div key="step-0" className="animate-fade-in" style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 56,
                marginBottom: 'var(--space-3)',
                lineHeight: 1,
              }}>
                {settings.portalEmoji ?? '🦞'}
              </div>
              <h2 style={{
                fontSize: 'var(--text-large-title)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                {t('onboarding.welcome')}
              </h2>
              <p style={{
                fontSize: 'var(--text-body)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
                maxWidth: 400,
                margin: '0 auto',
                marginBottom: 'var(--space-5)',
              }}>
                {t('onboarding.welcomeDesc')}
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                textAlign: 'left',
              }}>
                {[
                  { emoji: '🗺️', titleKey: 'onboarding.features.mapChat.title', descKey: 'onboarding.features.mapChat.desc' },
                  { emoji: '⚡', titleKey: 'onboarding.features.monitor.title', descKey: 'onboarding.features.monitor.desc' },
                  { emoji: '🎨', titleKey: 'onboarding.features.personalize.title', descKey: 'onboarding.features.personalize.desc' },
                ].map(item => (
                  <div
                    key={item.titleKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--fill-quaternary)',
                      border: '1px solid var(--separator)',
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
                    <div>
                      <div style={{
                        fontSize: 'var(--text-subheadline)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--text-primary)',
                      }}>
                        {t(item.titleKey)}
                      </div>
                      <div style={{
                        fontSize: 'var(--text-caption1)',
                        color: 'var(--text-tertiary)',
                        lineHeight: 'var(--leading-normal)',
                      }}>
                        {t(item.descKey)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{
                fontSize: 'var(--text-caption1)',
                color: 'var(--text-quaternary)',
                marginTop: 'var(--space-4)',
              }}>
                {t('onboarding.builtBy')}
              </p>
            </div>
          )}

          {/* Step 1: System Check */}
          {step === 1 && (
            <div key="step-1" className="animate-fade-in">
              <h2 style={{
                fontSize: 'var(--text-title1)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                {t('onboarding.systemCheck')}
              </h2>
              <p style={{
                fontSize: 'var(--text-subheadline)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-4)',
              }}>
                {t('onboarding.systemCheckDesc')}
              </p>

              {/* Your Name input */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-caption1)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {t('settings.yourName')}
                </label>
                <input
                  type="text"
                  className="apple-input"
                  placeholder={t('settings.yourName')}
                  value={localOperator}
                  onChange={e => setLocalOperator(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--separator)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Agent registry check */}
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--fill-quaternary)',
                  border: `1px solid ${agentsStatus === 'error' ? 'var(--system-red)' : 'var(--separator)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}>
                  {agentsStatus === 'loading' && <Loader2 size={18} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />}
                  {agentsStatus === 'ok' && <CheckCircle2 size={18} style={{ color: 'var(--system-green)' }} />}
                  {agentsStatus === 'error' && <XCircle size={18} style={{ color: 'var(--system-red)' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'var(--text-subheadline)',
                      fontWeight: 'var(--weight-medium)',
                      color: 'var(--text-primary)',
                    }}>
                      {t('onboarding.agentRegistry')}
                    </div>
                    {agentsStatus === 'ok' && (
                      <div style={{ fontSize: 'var(--text-caption1)', color: 'var(--text-tertiary)' }}>
                        {t('onboarding.agentsFound', { count: agents.length, plural: agents.length !== 1 ? 's' : '' })}
                      </div>
                    )}
                    {agentsError && (
                      <div style={{ fontSize: 'var(--text-caption1)', color: 'var(--system-red)' }}>
                        {agentsError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gateway check */}
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--fill-quaternary)',
                  border: `1px solid ${cronsStatus === 'error' ? 'var(--system-red)' : 'var(--separator)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}>
                  {cronsStatus === 'loading' && <Loader2 size={18} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />}
                  {cronsStatus === 'ok' && <CheckCircle2 size={18} style={{ color: 'var(--system-green)' }} />}
                  {cronsStatus === 'error' && <XCircle size={18} style={{ color: 'var(--system-red)' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'var(--text-subheadline)',
                      fontWeight: 'var(--weight-medium)',
                      color: 'var(--text-primary)',
                    }}>
                      {t('onboarding.gateway')}
                    </div>
                    {cronsStatus === 'ok' && (
                      <div style={{ fontSize: 'var(--text-caption1)', color: 'var(--text-tertiary)' }}>
                        {t('onboarding.connected')}
                      </div>
                    )}
                    {cronsError && (
                      <div style={{ fontSize: 'var(--text-caption1)', color: 'var(--system-red)' }}>
                        {cronsError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Agent roster */}
              {agentsStatus === 'ok' && agents.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div style={{
                    fontSize: 'var(--text-caption2)',
                    color: 'var(--text-quaternary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                  }}>
                    {t('onboarding.yourAgentTeam')}
                  </div>
                  <div style={{
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--fill-quaternary)',
                    border: '1px solid var(--separator)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}>
                    {agents.map(a => (
                      <div
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--material-thin)',
                          border: '1px solid var(--separator)',
                          fontSize: 'var(--text-caption1)',
                        }}
                      >
                        <span>{a.emoji}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{a.name}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{
                    fontSize: 'var(--text-caption1)',
                    color: 'var(--text-tertiary)',
                    marginTop: 'var(--space-2)',
                  }}>
                    {t('onboarding.agentTeamDesc')}
                  </p>
                </div>
              )}

              {/* Error help */}
              {!systemLoading && !systemAllOk && (
                <div style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,69,58,0.08)',
                  border: '1px solid rgba(255,69,58,0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                }}>
                  <AlertCircle size={16} style={{ color: 'var(--system-red)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{
                    fontSize: 'var(--text-caption1)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}>
                    {t('onboarding.setupHelp')}
                  </div>
                </div>
              )}

              {/* Retry button */}
              {!systemLoading && !systemAllOk && (
                <button
                  onClick={runSystemChecks}
                  style={{
                    marginTop: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--fill-tertiary)',
                    color: 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--text-caption1)',
                    fontWeight: 'var(--weight-medium)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RotateCcw size={16} />
                  {t('onboarding.retryChecks')}
                </button>
              )}
            </div>
          )}

          {/* Step 2: Name Your Dashboard */}
          {step === 2 && (
            <div key="step-2" className="animate-fade-in">
              <h2 style={{
                fontSize: 'var(--text-title1)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                {t('onboarding.nameDashboard')}
              </h2>
              <p style={{
                fontSize: 'var(--text-subheadline)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-5)',
              }}>
                {t('onboarding.nameDashboardDesc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--text-caption1)',
                    color: 'var(--text-tertiary)',
                    marginBottom: 'var(--space-1)',
                  }}>
                    {t('onboarding.dashboardName')}
                  </label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="ClawPort"
                    value={localName}
                    onChange={e => setLocalName(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--separator)',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--text-caption1)',
                    color: 'var(--text-tertiary)',
                    marginBottom: 'var(--space-1)',
                  }}>
                    {t('settings.subtitle')}
                  </label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="Command Centre"
                    value={localSubtitle}
                    onChange={e => setLocalSubtitle(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--separator)',
                    }}
                  />
                </div>

              </div>

              {/* Mini sidebar preview */}
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--fill-quaternary)',
                border: '1px solid var(--separator)',
              }}>
                <div style={{
                  fontSize: 'var(--text-caption2)',
                  color: 'var(--text-quaternary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                }}>
                  {t('common.preview')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: settings.accentColor
                      ? `linear-gradient(135deg, ${settings.accentColor}, ${settings.accentColor}dd)`
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {settings.portalEmoji ?? '🦞'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'var(--text-subheadline)',
                      fontWeight: 'var(--weight-bold)',
                      color: 'var(--text-primary)',
                      letterSpacing: 'var(--tracking-tight)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {localName || 'ClawPort'}
                    </div>
                    <div style={{
                      fontSize: 'var(--text-caption2)',
                      color: 'var(--text-tertiary)',
                    }}>
                      {localSubtitle || 'Command Centre'}
                    </div>
                  </div>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: 'var(--accent-fill)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    flexShrink: 0,
                    letterSpacing: '-0.02em',
                  }}>
                    {getInitials(localOperator)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Theme */}
          {step === 3 && (
            <div key="step-3" className="animate-fade-in">
              <h2 style={{
                fontSize: 'var(--text-title2)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                {t('onboarding.chooseTheme')}
              </h2>
              <p style={{
                fontSize: 'var(--text-subheadline)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-4)',
              }}>
                {t('onboarding.chooseThemeDesc')}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 'var(--space-3)',
              }}>
                {THEMES.map(themeItem => {
                  const isActive = theme === themeItem.id
                  const label = getThemeLabel(themeItem.id)
                  return (
                    <button
                      key={themeItem.id}
                      onClick={() => setTheme(themeItem.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-4) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--fill-quaternary)',
                        border: isActive ? '2px solid var(--accent)' : '2px solid var(--separator)',
                        cursor: 'pointer',
                        transition: 'all 150ms var(--ease-smooth)',
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{themeItem.emoji}</span>
                      <span style={{
                        fontSize: 'var(--text-footnote)',
                        fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      }}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Accent Color */}
          {step === 4 && (
            <div key="step-4" className="animate-fade-in">
              <h2 style={{
                fontSize: 'var(--text-title2)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                {t('onboarding.accentColor')}
              </h2>
              <p style={{
                fontSize: 'var(--text-subheadline)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-4)',
              }}>
                {t('onboarding.accentColorDesc')}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 'var(--space-3)',
                justifyItems: 'center',
              }}>
                {ACCENT_PRESETS.map(preset => {
                  const isActive = settings.accentColor === preset.value
                  return (
                    <button
                      key={preset.value}
                      onClick={() => setAccentColor(preset.value)}
                      aria-label={t(preset.labelKey)}
                      title={t(preset.labelKey)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: preset.value,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: isActive ? `3px solid ${preset.value}` : 'none',
                        outlineOffset: 3,
                        transition: 'all 100ms var(--ease-smooth)',
                      }}
                    >
                      {isActive && <Check size={18} color="#000" strokeWidth={3} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 5: Voice Input */}
          {step === 5 && (
            <div key="step-5" className="animate-fade-in">
              <h2 style={{
                fontSize: 'var(--text-title2)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                {t('onboarding.voiceInput')}
              </h2>
              <p style={{
                fontSize: 'var(--text-subheadline)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-4)',
                lineHeight: 'var(--leading-relaxed)',
              }}>
                {t('onboarding.voiceInputDesc')}
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}>
                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--fill-quaternary)',
                  border: '1px solid var(--separator)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-3)',
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--accent-fill)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Keyboard size={18} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: 'var(--text-subheadline)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--text-primary)',
                      }}>
                        {t('onboarding.macosDictation')}
                      </div>
                      <div style={{
                        fontSize: 'var(--text-caption1)',
                        color: 'var(--text-tertiary)',
                      }}>
                        {t('onboarding.recommended')}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--text-footnote)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 'var(--weight-semibold)', flexShrink: 0 }}>1.</span>
                      <span dangerouslySetInnerHTML={{ __html: t('onboarding.dictationSteps.step1') }} />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 'var(--weight-semibold)', flexShrink: 0 }}>2.</span>
                      <span dangerouslySetInnerHTML={{ __html: t('onboarding.dictationSteps.step2') }} />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 'var(--weight-semibold)', flexShrink: 0 }}>3.</span>
                      <span dangerouslySetInnerHTML={{ __html: t('onboarding.dictationSteps.step3') }} />
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--fill-quaternary)',
                  border: '1px solid var(--separator)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                }}>
                  <Keyboard size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{
                    fontSize: 'var(--text-caption1)',
                    color: 'var(--text-tertiary)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}>
                    {t('onboarding.voiceNote')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Overview */}
          {step === 6 && (
            <div key="step-6" className="animate-fade-in">
              <h2 style={{
                fontSize: 'var(--text-title2)',
                fontWeight: 'var(--weight-bold)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                {t('onboarding.allSet')}
              </h2>
              <p style={{
                fontSize: 'var(--text-subheadline)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-4)',
              }}>
                {t('onboarding.allSetDesc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {FEATURES.map(f => {
                  const Icon = f.icon
                  return (
                    <div
                      key={f.nameKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--fill-quaternary)',
                        border: '1px solid var(--separator)',
                      }}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--accent-fill)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={18} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 'var(--text-subheadline)',
                          fontWeight: 'var(--weight-semibold)',
                          color: 'var(--text-primary)',
                        }}>
                          {t(f.nameKey)}
                        </div>
                        <div style={{
                          fontSize: 'var(--text-caption1)',
                          color: 'var(--text-tertiary)',
                        }}>
                          {t(f.descKey)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-5) var(--space-5)',
          gap: 'var(--space-3)',
        }}>
          {step > 0 ? (
            <button
              onClick={handleBack}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--fill-tertiary)',
                color: 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-subheadline)',
                fontWeight: 'var(--weight-medium)',
                transition: 'all 150ms var(--ease-smooth)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={16} />
              {t('onboarding.buttons.back')}
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={step === 1 && systemLoading}
            style={{
              padding: 'var(--space-2) var(--space-6)',
              borderRadius: 'var(--radius-md)',
              background: step === 1 && systemLoading ? 'var(--fill-tertiary)' : 'var(--accent)',
              color: step === 1 && systemLoading ? 'var(--text-quaternary)' : 'var(--accent-contrast)',
              border: 'none',
              cursor: step === 1 && systemLoading ? 'wait' : 'pointer',
              fontSize: 'var(--text-subheadline)',
              fontWeight: 'var(--weight-semibold)',
              transition: 'all 150ms var(--ease-smooth)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {step === 0 ? t('onboarding.buttons.begin') : step === TOTAL_STEPS - 1 ? t('onboarding.buttons.getStarted') : t('onboarding.buttons.next')}
            {step === TOTAL_STEPS - 1 ? <Rocket size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
