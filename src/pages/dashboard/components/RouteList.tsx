import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
} from 'solid-js'
import type { Component } from 'solid-js'
import clsx from 'clsx'
import type { RouteSegments } from '~/types'
import { Virtualizer, createVirtualizer } from '@tanstack/solid-virtual'
import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'

const PAGE_SIZE = 6

type RouteListProps = {
  class?: string
  dongleId: string
}

const endpoint = (dongleId: string) => `/v1/devices/${dongleId}/routes_segments?limit=${PAGE_SIZE}`

const getKey = (dongleId: string, previousPageData?: RouteSegments[]): string | undefined => {
  if (!previousPageData) return endpoint(dongleId)
  if (previousPageData.length === 0) return undefined
  const lastSegment = previousPageData.at(-1)!
  const lastSegmentEndTime = lastSegment.segment_start_times ? lastSegment.segment_start_times.at(-1) : undefined
  return lastSegmentEndTime ? `${endpoint(dongleId)}&end=${lastSegmentEndTime - 1}` : undefined
}

// Helper function for sorting routes based on filter
const sortRoutes = (routes: RouteSegments[], filter: string, currentFilter: () => string): RouteSegments[] => {
  switch (currentFilter()) {
    case 'date':
      return routes.sort((a, b) => new Date(b.start_time || '').getTime() - new Date(a.start_time || '').getTime())
    case 'miles':
      return routes.slice().sort((a, b) => (b.length || 0) - (a.length || 0))
    case 'duration':
      return routes.slice().sort((a, b) => {
        const aDuration = new Date(a.end_time || '').getTime() - new Date(a.start_time || '').getTime()
        const bDuration = new Date(b.end_time || '').getTime() - new Date(b.start_time || '').getTime()
        return bDuration - aDuration
      })
    default:
      return routes.sort((a, b) => new Date(b.start_time || '').getTime() - new Date(a.start_time || '').getTime())
  }
}

const logError = (message: string, error: unknown) => {
  if (error instanceof Error) {
    console.error(message, error.message)
  } else {
    console.error(message, error)
  }
}

const RouteList: Component<RouteListProps> = (props) => {
  const [hasMore, setHasMore] = createSignal(true)
  const [isLoading, setIsLoading] = createSignal(false)
  const [routes, setRoutes] = createSignal<RouteSegments[]>([])
  const [currentFilter, setCurrentFilter] = createSignal('date')
  const [loaderRef, setLoaderRef] = createSignal<HTMLDivElement | null>(null)

  let virtualizer: Virtualizer<HTMLDivElement, Element>

  createEffect(() => {
    virtualizer = createVirtualizer<HTMLDivElement, Element>({
      getScrollElement: () => loaderRef(),
      count: routes().length,
      estimateSize: () => 50,
      overscan: 10,
    })
  })

  const fetchMore = async () => {
    setIsLoading(true)
    try {
      const previousPageData = routes()
      const key = getKey(props.dongleId, previousPageData)
      const newRoutes = key ? await fetcher<RouteSegments[]>(key) : []

      if (newRoutes.length < PAGE_SIZE) {
        setHasMore(false)
      }

      setRoutes((prevRoutes) => [...prevRoutes, ...newRoutes])
      virtualizer.calculateRange()
    } catch (error) {
      logError('Error fetching more routes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  onMount(() => {
    void (async () => {
      try {
        const initialRoutes = await fetcher<RouteSegments[]>(endpoint(props.dongleId))
        setRoutes(initialRoutes)
      } catch (error) {
        logError('Error fetching initial routes:', error)
      }
    })()

    const loader = loaderRef()
    if (loader) {
      const observer = new IntersectionObserver((entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore() && !isLoading() && routes().length > 0) {
          fetchMore().catch((error) => logError('Error in fetchMore:', error))
        }
      })

      observer.observe(loader)
      onCleanup(() => observer.disconnect())
    }
  })

  return (
    <div
      class={clsx(
        'flex w-full flex-col',
        props.class,
      )}
      style={{ height: 'calc(100vh - 72px - 5rem)' }}
    >
      <div class="hide-scrollbar flex w-full items-center gap-5 overflow-x-auto overflow-y-hidden pb-7 pt-4">
        <p class="my-auto pb-1">Sort by:</p>
        <div
          class={`filter-custom-btn ${currentFilter() === 'date' ? 'selected-filter-custom-btn' : ''}`}
          onClick={() => setCurrentFilter('date')}
        >
          Date
        </div>
        <div
          class={`filter-custom-btn ${currentFilter() === 'miles' ? 'selected-filter-custom-btn' : ''}`}
          onClick={() => setCurrentFilter('miles')}
        >
          Miles
        </div>
        <div
          class={`filter-custom-btn ${currentFilter() === 'duration' ? 'selected-filter-custom-btn' : ''}`}
          onClick={() => setCurrentFilter('duration')}
        >
          Duration
        </div>
      </div>
      <div class="hide-scrollbar lg:custom-scrollbar flex size-full flex-col overflow-y-auto lg:pr-[50px]">
        <div class="flex w-fit flex-col gap-6">
          <For each={sortRoutes(routes(), currentFilter(), currentFilter)}>
            {(route) => (
              <RouteCard route={route} />
            )}
          </For>

          {/* Filler element to push messages to the bottom */}
          <div ref={setLoaderRef} style={{ height: '1px' }} />
        </div>
       
        {isLoading() && <p class="pb-8">Loading...</p>}
        {!hasMore() && !isLoading() && <p class="pb-8">No More Routes</p>}
      </div>
    </div>
  )
}

export default RouteList
