/**
 * Subscription Manager
 * 실시간 구독 리소스 누수 방지 및 중앙 관리
 */

import { logError } from './errorHandler'

export type SubscriptionCleanup = () => void | Promise<void>

export interface SubscriptionInfo {
  id: string
  type: 'realtime' | 'interval' | 'event'
  createdAt: Date
  cleanup: SubscriptionCleanup
  metadata?: Record<string, unknown>
}

/**
 * 구독 관리 클래스
 * 모든 활성 구독을 추적하고 정리
 */
export class SubscriptionManager {
  private subscriptions = new Map<string, SubscriptionInfo>()
  private cleanupInProgress = false

  /**
   * 새 구독 등록
   */
  register(
    id: string,
    cleanup: SubscriptionCleanup,
    type: SubscriptionInfo['type'] = 'realtime',
    metadata?: Record<string, unknown>
  ): void {
    // 이미 존재하는 구독은 먼저 정리
    if (this.subscriptions.has(id)) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Subscription ${id} already exists. Cleaning up old subscription.`)
      }
      this.unregister(id)
    }

    this.subscriptions.set(id, {
      id,
      type,
      createdAt: new Date(),
      cleanup,
      metadata,
    })

    if (import.meta.env.DEV) {
      console.log(`📝 Registered subscription: ${id} (${type})`)
      console.log(`   Active subscriptions: ${this.subscriptions.size}`)
    }
  }

  /**
   * 구독 해제
   */
  async unregister(id: string): Promise<void> {
    const subscription = this.subscriptions.get(id)
    if (!subscription) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Subscription ${id} not found`)
      }
      return
    }

    try {
      await subscription.cleanup()
      this.subscriptions.delete(id)

      if (import.meta.env.DEV) {
        console.log(`🗑️ Unregistered subscription: ${id}`)
        console.log(`   Active subscriptions: ${this.subscriptions.size}`)
      }
    } catch (error) {
      logError(error, `unregister:${id}`, subscription.metadata)
      // 에러가 발생해도 맵에서는 제거
      this.subscriptions.delete(id)
    }
  }

  /**
   * 특정 타입의 모든 구독 해제
   */
  async unregisterByType(type: SubscriptionInfo['type']): Promise<void> {
    const idsToRemove: string[] = []

    for (const [id, sub] of this.subscriptions.entries()) {
      if (sub.type === type) {
        idsToRemove.push(id)
      }
    }

    await Promise.all(idsToRemove.map((id) => this.unregister(id)))
  }

  /**
   * 모든 구독 해제
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInProgress) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Cleanup already in progress')
      }
      return
    }

    this.cleanupInProgress = true

    if (import.meta.env.DEV) {
      console.log(`🧹 Cleaning up ${this.subscriptions.size} subscriptions...`)
    }

    const cleanupPromises = Array.from(this.subscriptions.entries()).map(
      async ([id, sub]) => {
        try {
          await sub.cleanup()
        } catch (error) {
          logError(error, `cleanup:${id}`, sub.metadata)
        }
      }
    )

    await Promise.all(cleanupPromises)
    this.subscriptions.clear()

    this.cleanupInProgress = false

    if (import.meta.env.DEV) {
      console.log('✅ All subscriptions cleaned up')
    }
  }

  /**
   * 활성 구독 목록 조회
   */
  getActiveSubscriptions(): SubscriptionInfo[] {
    return Array.from(this.subscriptions.values())
  }

  /**
   * 활성 구독 수
   */
  get count(): number {
    return this.subscriptions.size
  }

  /**
   * 특정 구독 존재 여부
   */
  has(id: string): boolean {
    return this.subscriptions.has(id)
  }

  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.group('📊 Subscription Manager Debug')
    console.log('Active subscriptions:', this.subscriptions.size)
    console.table(
      Array.from(this.subscriptions.values()).map((sub) => ({
        id: sub.id,
        type: sub.type,
        age: `${Math.round((Date.now() - sub.createdAt.getTime()) / 1000)}s`,
      }))
    )
    console.groupEnd()
  }
}

// 싱글톤 인스턴스
export const subscriptionManager = new SubscriptionManager()

// 페이지 언로드 시 자동 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    subscriptionManager.cleanup()
  })
}

/**
 * 구독 래퍼 함수
 * cleanup 함수를 자동으로 등록하고 반환
 */
export function createManagedSubscription(
  id: string,
  subscriptionFn: () => SubscriptionCleanup,
  type: SubscriptionInfo['type'] = 'realtime',
  metadata?: Record<string, unknown>
): SubscriptionCleanup {
  const cleanup = subscriptionFn()

  subscriptionManager.register(id, cleanup, type, metadata)

  // 관리되는 cleanup 함수 반환
  return () => {
    subscriptionManager.unregister(id)
  }
}

/**
 * Interval 관리 래퍼
 */
export function createManagedInterval(
  id: string,
  callback: () => void,
  intervalMs: number
): SubscriptionCleanup {
  const intervalId = setInterval(callback, intervalMs)

  const cleanup = () => {
    clearInterval(intervalId)
  }

  subscriptionManager.register(id, cleanup, 'interval', {
    intervalMs,
  })

  return () => {
    subscriptionManager.unregister(id)
  }
}

/**
 * Event Listener 관리 래퍼
 */
export function createManagedEventListener<K extends keyof WindowEventMap>(
  id: string,
  target: EventTarget,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): SubscriptionCleanup {
  target.addEventListener(event, handler as EventListener, options)

  const cleanup = () => {
    target.removeEventListener(event, handler as EventListener, options)
  }

  subscriptionManager.register(id, cleanup, 'event', {
    event,
  })

  return () => {
    subscriptionManager.unregister(id)
  }
}

