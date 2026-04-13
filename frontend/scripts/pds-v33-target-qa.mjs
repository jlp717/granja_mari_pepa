import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'docs', 'pds', 'qa-evidence')
const RECORRIDO = path.join(OUT, 'recorrido-final')
const EXTRACTION = path.join(ROOT, 'docs', 'pds', 'extraction')
const SOURCE_BASE = 'https://www.jobyaviation.com'
const TARGET_BASE = 'http://localhost:3001'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 1200 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-375', width: 375, height: 812 }
]

const PAGES = [
  { name: 'home', source: '/', target: '/es' },
  { name: 'experience-contacto', source: '/experience', target: '/es/contacto' },
  { name: 'technology-productos', source: '/technology', target: '/es/productos' },
  { name: 'company-acerca', source: '/company', target: '/es/acerca' },
  { name: 'privacy-policy', source: '/privacy-policy', target: '/es/legal/privacidad' },
  { name: 'terms-of-use', source: '/terms-of-use', target: '/es/legal/terminos' }
]

const metadata = (kind, viewport, url) => ({
  kind,
  version: 'v3.3',
  url,
  timestamp: new Date().toISOString(),
  viewport,
  userAgent: UA
})

async function ensureDirs() {
  await fs.mkdir(OUT, { recursive: true })
  await fs.mkdir(RECORRIDO, { recursive: true })
  await fs.mkdir(EXTRACTION, { recursive: true })
}

async function collectConsoleErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await page.waitForFunction(
    () => document.querySelectorAll('section, footer').length > 0 || document.querySelector('main')?.children.length,
    null,
    { timeout: 30000 }
  ).catch(() => {})
  await page.waitForTimeout(1800)
}

async function record(page, url, viewport) {
  await goto(page, url)

  const evaluateRecord = () => page.evaluate(async ({ viewport }) => {
    const clamp = (value) => Math.max(0, Math.min(1, value))
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const frames = []
    const positions = Array.from({ length: 21 }, (_, index) => index / 20)
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const videos = [...document.querySelectorAll('video')]

    videos.forEach((video) => {
      video.preload = 'auto'
      video.autoplay = false
      video.loop = false
      video.pause()
      try {
        video.load()
      } catch {
        // Some cross-origin media elements can reject explicit reloads.
      }
    })

    await Promise.race([
      Promise.all(videos.map((video) => {
        if (video.readyState >= 1 && Number.isFinite(video.duration)) return true
        return new Promise((resolve) => {
          const done = () => resolve(true)
          video.addEventListener('loadedmetadata', done, { once: true })
          video.addEventListener('error', done, { once: true })
        })
      })),
      delay(6000)
    ])

    for (const pct of positions) {
      window.scrollTo(0, Math.round(maxScroll * pct))
      await delay(700)

      const visibleElements = [...document.querySelectorAll('section, footer, video, canvas')]
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
        })
        .slice(0, 220)
        .map((element, index) => {
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return {
            index,
            tag: element.tagName,
            id: element.id || null,
            classes: String(element.className || '').slice(0, 160),
            rect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            },
            opacity: style.opacity,
            transform: style.transform,
            backgroundColor: style.backgroundColor,
            color: style.color,
            position: style.position,
            zIndex: style.zIndex,
            visibility: style.visibility
          }
        })

      frames.push({
        pct,
        scrollY: Math.round(window.scrollY),
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        elementCount: visibleElements.length,
        stickyCount: visibleElements.filter((element) => element.position === 'sticky' || element.position === 'fixed').length,
        videos: [...document.querySelectorAll('video')].map((video) => ({
          src: video.currentSrc || video.src || video.querySelector('source')?.src || '',
          autoplay: video.autoplay,
          loop: video.loop,
          paused: video.paused,
          duration: Number.isFinite(video.duration) ? video.duration : null,
          currentTime: video.currentTime
        })),
        elements: visibleElements
      })
    }

    const sections = [...document.querySelectorAll('section, footer')].map((element, index) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        index,
        tag: element.tagName,
        id: element.id || null,
        classes: String(element.className || '').slice(0, 160),
        height: Math.round(rect.height),
        backgroundColor: style.backgroundColor,
        layout: style.display
      }
    })

    return {
      totalHeight: document.documentElement.scrollHeight,
      viewportHeight: viewport.height,
      viewportWidth: viewport.width,
      sectionCount: sections.length,
      sections,
      videos: [...document.querySelectorAll('video')].map((video) => ({
        src: video.currentSrc || video.src || video.querySelector('source')?.src || '',
        autoplay: video.autoplay,
        loop: video.loop,
        duration: Number.isFinite(video.duration) ? video.duration : null
      })),
      canvases: document.querySelectorAll('canvas').length,
      frames,
      progressCheck: {
        maxScroll,
        finalScroll: Math.round(window.scrollY),
        viewport
      }
    }
  }, { viewport })

  try {
    return await evaluateRecord()
  } catch (error) {
    if (!String(error?.message || error).includes('Execution context was destroyed')) {
      throw error
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(1200)
    return evaluateRecord()
  }
}

function scorePair(source, target) {
  const heightSimilarity = Math.min(source.totalHeight, target.totalHeight) / Math.max(source.totalHeight, target.totalHeight)
  const sectionSimilarity = 1 - Math.min(1, Math.abs(source.sectionCount - target.sectionCount) / Math.max(1, source.sectionCount))
  const canvasSimilarity = source.canvases === 0 ? (target.canvases === 0 ? 1 : 0) : Math.min(source.canvases, target.canvases) / Math.max(source.canvases, target.canvases)
  const videoStructure = source.videos.length === 0
    ? (target.videos.length === 0 ? 1 : 0)
    : Math.min(source.videos.length, target.videos.length) / Math.max(source.videos.length, target.videos.length)
  const targetVideoContract = target.videos.every((video) => !video.autoplay && !video.loop) ? 1 : 0
  const videoScrubFrames = target.frames.filter((frame) => frame.videos.some((video) => video.duration && video.currentTime > 0)).length
  const needsScrub = source.videos.length > 0
  const videoScrub = needsScrub ? (videoScrubFrames >= 8 ? 1 : videoScrubFrames / 8) : 1

  const frameScores = source.frames.map((sourceFrame, index) => {
    const targetFrame = target.frames[index]
    if (!targetFrame) return 0
    const elementDensity = Math.min(sourceFrame.elementCount, targetFrame.elementCount) / Math.max(1, Math.max(sourceFrame.elementCount, targetFrame.elementCount))
    const stickyParity = 1 - Math.min(1, Math.abs(sourceFrame.stickyCount - targetFrame.stickyCount) / Math.max(1, sourceFrame.stickyCount || targetFrame.stickyCount || 1))
    const videoTimeParity = sourceFrame.videos.length && targetFrame.videos.length
      ? 1 - Math.min(1, Math.abs(sourceFrame.videos[0].currentTime - targetFrame.videos[0].currentTime) / Math.max(1, sourceFrame.videos[0].duration || 1))
      : 1
    return (elementDensity * 0.35) + (stickyParity * 0.25) + (videoTimeParity * 0.4)
  })

  const avgFrame = frameScores.reduce((sum, value) => sum + value, 0) / Math.max(1, frameScores.length)
  const worstFrame = Math.min(...frameScores)
  const avgSimilarity = (heightSimilarity * 0.22) + (sectionSimilarity * 0.18) + (canvasSimilarity * 0.1) + (videoStructure * 0.1) + (targetVideoContract * 0.12) + (videoScrub * 0.13) + (avgFrame * 0.15)
  const worstSimilarity = Math.min(heightSimilarity, sectionSimilarity, canvasSimilarity, videoStructure, targetVideoContract, videoScrub, worstFrame)
  const passRate = [heightSimilarity, sectionSimilarity, canvasSimilarity, videoStructure, targetVideoContract, videoScrub, avgFrame]
    .filter((value) => value >= 0.9).length / 7

  return {
    heightSimilarity,
    sectionSimilarity,
    canvasSimilarity,
    videoStructure,
    targetVideoContract,
    videoScrub,
    avgFrame,
    worstFrame,
    avgSimilarity,
    worstSimilarity,
    passRate,
    pass: avgSimilarity >= 0.9 && worstSimilarity >= 0.9 && passRate >= 0.95
  }
}

async function main() {
  await ensureDirs()
  const browser = await chromium.launch({ headless: true })
  const summary = {
    _metadata: metadata('qa-summary', null, `${SOURCE_BASE} :: ${TARGET_BASE}`),
    pages: []
  }

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport, userAgent: UA })
    const sourcePage = await context.newPage()
    const targetPage = await context.newPage()
    const sourceErrors = await collectConsoleErrors(sourcePage)
    const targetErrors = await collectConsoleErrors(targetPage)

    for (const pageDef of PAGES) {
      const sourceUrl = `${SOURCE_BASE}${pageDef.source}`
      const targetUrl = `${TARGET_BASE}${pageDef.target}`
      console.log(`[${viewport.name}] ${pageDef.name}`)

      sourceErrors.length = 0
      targetErrors.length = 0
      const sourceRecord = await record(sourcePage, sourceUrl, viewport)
      const targetRecord = await record(targetPage, targetUrl, viewport)
      const diff = {
        _metadata: metadata('compareScrollBehavior', viewport, `${sourceUrl} -> ${targetUrl}`),
        page: pageDef,
        sourceUrl,
        targetUrl,
        console: {
          sourceErrors: [...sourceErrors],
          targetErrors: [...targetErrors],
          pass: sourceErrors.length === 0 && targetErrors.length === 0
        },
        score: scorePair(sourceRecord, targetRecord)
      }

      const suffix = `${pageDef.name}-${viewport.name}`
      await fs.writeFile(path.join(EXTRACTION, `scroll-behavior-target-${suffix}.json`), JSON.stringify({
        _metadata: metadata('recordScrollBehaviorTarget', viewport, targetUrl),
        ...targetRecord
      }, null, 2))
      await fs.writeFile(path.join(EXTRACTION, `scroll-diff-${suffix}.json`), JSON.stringify(diff, null, 2))
      await fs.writeFile(path.join(RECORRIDO, `${suffix}.json`), JSON.stringify({
        _metadata: metadata('recorrido-final-21-positions', viewport, `${sourceUrl} -> ${targetUrl}`),
        source: sourceRecord,
        target: targetRecord,
        diff: diff.score
      }, null, 2))

      summary.pages.push({
        page: pageDef.name,
        viewport: viewport.name,
        sourceUrl,
        targetUrl,
        ...diff.score,
        consolePass: diff.console.pass
      })
    }

    await context.close()
  }

  await browser.close()
  summary.pass = summary.pages.every((page) => page.pass && page.consolePass)
  summary.avgSimilarity = summary.pages.reduce((sum, page) => sum + page.avgSimilarity, 0) / Math.max(1, summary.pages.length)
  summary.worstSimilarity = Math.min(...summary.pages.map((page) => page.worstSimilarity))
  await fs.writeFile(path.join(OUT, 'qa-summary.json'), JSON.stringify(summary, null, 2))

  if (!summary.pass) {
    process.exitCode = 2
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
