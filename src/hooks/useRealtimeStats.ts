/**
 * Realtime Stats Hook (메모리 누수 방지)
 * 개선 사항:
 * 1. isMounted 체크로 언마운트 후 setState 방지
 * 2. 비동기 작업 취소 (AbortController)
 * 3. 구독 상태 추적
 */

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { subscriptionManager } from '../lib/subscriptionManager'
import { logError } from '../lib/errorHandler'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeStats() {
  const [totalRegistrations, setTotalRegistrations] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // 메모리 누수 방지용 Refs
  const isMountedRef = useRef(true)
  const subscriptionChannelRef = useRef<RealtimeChannel | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // 🔴 문제 1 해결: 마운트 상태 추적
    isMountedRef.current = true

    // 초기 데이터 로드
    const fetchInitialData = async () => {
      // 🔴 문제 2 해결: 요청 취소를 위한 AbortController
      abortControllerRef.current = new AbortController()

      try {
        const { data, error: fetchError } = await supabase
          .from('registration_stats')
          .select('cumulative_registrations')
          .order('stat_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError) throw fetchError

        // 🔴 문제 1 해결: 언마운트 체크
        if (!isMountedRef.current) return

        if (data) {
          setTotalRegistrations(data.cumulative_registrations || 0)
        }
      } catch (err) {
        // AbortError는 무시 (의도적인 취소)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        if (!isMountedRef.current) return

        const errorMessage = err instanceof Error ? err.message : '데이터 로드 실패'
        setError(errorMessage)
        logError(err, 'useRealtimeStats:fetchInitialData')
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    // 실시간 구독 설정
    const setupSubscription = () => {
      const channelName = `registration-stats-${Date.now()}`
      
      subscriptionChannelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registration_stats',
          },
          (payload) => {
            // 🔴 문제 1 해결: 콜백에서도 마운트 체크
            if (!isMountedRef.current) return

            if (payload.new && 'cumulative_registrations' in payload.new) {
              setTotalRegistrations(payload.new.cumulative_registrations as number)
            }
          }
        )
        .subscribe((status) => {
          if (!isMountedRef.current) return

          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            if (import.meta.env.DEV) {
              console.log('✅ Subscribed to registration stats')
            }
          } else if (status === 'CLOSED') {
            setIsConnected(false)
            if (import.meta.env.DEV) {
              console.log('🔌 Disconnected from registration stats')
            }
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false)
            setError('실시간 연결 실패')
            logError(new Error('Subscription error'), 'useRealtimeStats:subscription')
          }
        })

      // 🔴 문제 3 해결: SubscriptionManager에 등록
      subscriptionManager.register(
        channelName,
        () => {
          if (subscriptionChannelRef.current) {
            return supabase.removeChannel(subscriptionChannelRef.current)
          }
        },
        'realtime',
        { type: 'registration_stats' }
      )
    }

    // 초기 로드 및 구독 시작
    fetchInitialData()
    setupSubscription()

    // 🔴 정리 함수 (Cleanup)
    return () => {
      // 1. 마운트 상태 false로 설정
      isMountedRef.current = false

      // 2. 진행 중인 비동기 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 3. 실시간 구독 정리
      if (subscriptionChannelRef.current) {
        const channelToRemove = subscriptionChannelRef.current
        
        // 비동기로 제거하되, 에러는 무시
        supabase.removeChannel(channelToRemove).catch((err) => {
          logError(err, 'useRealtimeStats:cleanup')
        })

        subscriptionChannelRef.current = null
      }

      if (import.meta.env.DEV) {
        console.log('🧹 useRealtimeStats cleanup completed')
      }
    }
  }, []) // 빈 배열: 마운트 시 한 번만 실행

  return {
    totalRegistrations,
    isLoading,
    error,
    isConnected, // 연결 상태도 반환
  }
}

