import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { streamSSE } from 'hono/streaming'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory  
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/favicon.ico', serveStatic({ path: './public/favicon.ico' }))

// In-memory data store (for demo purposes)
let systemState = {
  nodes: {
    'dashboard': { id: 'dashboard', name: '대시보드', type: 'web', status: 'GREEN', x: 100, y: 100 },
    'api': { id: 'api', name: 'API 서버', type: 'api', status: 'GREEN', x: 300, y: 100 },
    'etl': { id: 'etl', name: 'ETL 처리', type: 'etl', status: 'GREEN', x: 500, y: 100 },
    'dwh': { id: 'dwh', name: 'DWH/HANA', type: 'database', status: 'GREEN', x: 700, y: 100 },
    'batch': { id: 'batch', name: '배치 처리', type: 'batch', status: 'GREEN', x: 300, y: 300 },
    'cache': { id: 'cache', name: '캐시', type: 'cache', status: 'GREEN', x: 500, y: 300 },
    'storage': { id: 'storage', name: '스토리지', type: 'storage', status: 'GREEN', x: 700, y: 300 }
  },
  edges: [
    { from: 'dashboard', to: 'api' },
    { from: 'api', to: 'etl' },
    { from: 'etl', to: 'dwh' },
    { from: 'api', to: 'cache' },
    { from: 'batch', to: 'dwh' },
    { from: 'cache', to: 'storage' }
  ],
  metrics: {},
  incidents: [],
  scenarioActive: null,
  
  // 4-Layer AI Architecture Data
  aiLayers: {
    dataCollection: {
      blackboxModules: {
        'dashboard': { status: 'ACTIVE', logsPerSec: 45, lastCollection: new Date() },
        'api': { status: 'ACTIVE', logsPerSec: 230, lastCollection: new Date() },
        'etl': { status: 'ACTIVE', logsPerSec: 67, lastCollection: new Date() },
        'dwh': { status: 'ACTIVE', logsPerSec: 120, lastCollection: new Date() },
        'batch': { status: 'ACTIVE', logsPerSec: 23, lastCollection: new Date() },
        'cache': { status: 'ACTIVE', logsPerSec: 89, lastCollection: new Date() },
        'storage': { status: 'ACTIVE', logsPerSec: 34, lastCollection: new Date() }
      },
      totalLogsCollected: 2847293,
      kpiDefinitions: [
        { name: '응답시간', threshold: '2초', status: 'NORMAL' },
        { name: '처리량', threshold: '1000 req/s', status: 'NORMAL' },
        { name: '오류율', threshold: '1%', status: 'NORMAL' },
        { name: '가용성', threshold: '99.9%', status: 'NORMAL' }
      ]
    },
    
    aiAnalysis: {
      anomalyDetection: {
        model: 'Isolation Forest v2.1',
        accuracy: 94.2,
        lastTrained: '2024-01-07',
        anomaliesDetected: 23,
        falsePositiveRate: 0.05
      },
      reinforcementLearning: {
        model: 'Deep Q-Network v1.8',
        patterns: ['사용자 행동 패턴', '장애 복구 패턴', '성능 최적화 패턴'],
        learningProgress: 87.3,
        recommendations: 15
      },
      realTimeAnalysis: {
        processedEvents: 15847,
        correlationPatterns: 42,
        predictionAccuracy: 89.7
      }
    },
    
    insightService: {
      llmEngine: {
        model: 'GPT-4 Turbo',
        status: 'ACTIVE',
        summariesGenerated: 156,
        avgResponseTime: '1.2s'
      },
      autoReports: {
        generated: 23,
        scheduled: 8,
        customDashboards: 12
      },
      naturalLanguageInsights: [
        '시스템 성능이 지난 24시간 동안 안정적으로 유지되고 있습니다.',
        'API 서버의 응답 시간이 평소보다 15% 빠릅니다.',
        '캐시 적중률이 증가하여 전체 성능이 향상되었습니다.'
      ]
    },
    
    governance: {
      complianceStatus: 'COMPLIANT',
      blackboxAccess: {
        totalRequests: 45,
        approved: 42,
        pending: 2,
        denied: 1
      },
      auditTrail: [
        { timestamp: new Date(), user: 'admin', action: 'VIEW_LOGS', approved: true },
        { timestamp: new Date(), user: 'engineer', action: 'MODIFY_CONFIG', approved: true },
        { timestamp: new Date(), user: 'analyst', action: 'EXPORT_DATA', approved: false }
      ],
      securityLevel: 'ENTERPRISE'
    }
  }
}

// Initialize metrics
for (const nodeId in systemState.nodes) {
  systemState.metrics[nodeId] = {
    cpu: Math.random() * 30 + 10,
    memory: Math.random() * 40 + 20,
    response_time: Math.random() * 100 + 50,
    queue_depth: Math.random() * 10,
    error_rate: Math.random() * 2
  }
}

// API Routes
app.get('/api/topology', (c) => {
  return c.json({
    nodes: Object.values(systemState.nodes),
    edges: systemState.edges
  })
})

app.get('/api/status', (c) => {
  const status = {}
  for (const [nodeId, node] of Object.entries(systemState.nodes)) {
    status[nodeId] = {
      health: node.status,
      metrics: systemState.metrics[nodeId],
      summary: getNodeSummary(nodeId, node.status)
    }
  }
  return c.json(status)
})

app.get('/api/node/:id/drilldown', (c) => {
  const nodeId = c.req.param('id')
  const node = systemState.nodes[nodeId]
  
  if (!node) {
    return c.json({ error: 'Node not found' }, 404)
  }

  return c.json({
    node: node,
    metrics: systemState.metrics[nodeId],
    logs: getRecentLogs(nodeId),
    rootCause: getRootCause(nodeId, node.status),
    suggestions: getSuggestions(nodeId, systemState.scenarioActive)
  })
})

// Scenario Management
app.post('/api/scenario/start', async (c) => {
  const { s } = c.req.query()
  const scenario = parseInt(s || '1')
  
  systemState.scenarioActive = scenario
  
  if (scenario === 1) {
    // S1: 대량 동시 조회 시나리오
    systemState.nodes.dwh.status = 'RED'
    systemState.nodes.etl.status = 'YELLOW'
    systemState.metrics.dwh.queue_depth = 150
    systemState.metrics.dwh.response_time = 8000
    systemState.metrics.dwh.cpu = 95
    
    systemState.incidents.push({
      id: Date.now().toString(),
      title: '결산 시점 대량 조회 감지 - 지연 위험',
      nodeId: 'dwh',
      severity: 'HIGH',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    })
  } else if (scenario === 2) {
    // S2: 마스터 불일치 시나리오  
    systemState.nodes.dwh.status = 'RED'
    systemState.nodes.batch.status = 'RED'
    systemState.metrics.dwh.response_time = 12000
    systemState.metrics.batch.error_rate = 25
    
    systemState.incidents.push({
      id: Date.now().toString(),
      title: '마스터 플랜트 코드 불일치로 인한 조인 폭발',
      nodeId: 'dwh',
      severity: 'CRITICAL',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    })
  }
  
  return c.json({ success: true, scenario, message: `시나리오 ${scenario} 시작됨` })
})

app.post('/api/scenario/stop', (c) => {
  // Reset all nodes to GREEN
  for (const nodeId in systemState.nodes) {
    systemState.nodes[nodeId].status = 'GREEN'
  }
  
  // Reset metrics to normal values
  for (const nodeId in systemState.metrics) {
    systemState.metrics[nodeId] = {
      cpu: Math.random() * 30 + 10,
      memory: Math.random() * 40 + 20,
      response_time: Math.random() * 100 + 50,
      queue_depth: Math.random() * 10,
      error_rate: Math.random() * 2
    }
  }
  
  // Clear incidents
  systemState.incidents = []
  systemState.scenarioActive = null
  
  return c.json({ success: true, message: '모든 시나리오 정지됨' })
})

// Remediation Actions
app.post('/api/remediation/apply', async (c) => {
  const { actionId, nodeId } = await c.req.json()
  
  let result = { success: false, message: '' }
  
  if (actionId === 'ENABLE_QUERY_GOVERNOR') {
    // S1 수정 액션
    systemState.nodes.dwh.status = 'GREEN'
    systemState.nodes.etl.status = 'GREEN'
    systemState.metrics.dwh.queue_depth = 5
    systemState.metrics.dwh.response_time = 200
    systemState.metrics.dwh.cpu = 25
    
    result = { success: true, message: '쿼리 거버너 활성화 완료' }
  } else if (actionId === 'SYNC_MASTER_DATA') {
    // S2 수정 액션
    systemState.nodes.dwh.status = 'GREEN'
    systemState.nodes.batch.status = 'GREEN'
    systemState.metrics.dwh.response_time = 180
    systemState.metrics.batch.error_rate = 0.5
    
    result = { success: true, message: '마스터 데이터 동기화 완료' }
  }
  
  // Mark incidents as resolved
  systemState.incidents.forEach(incident => {
    if (incident.status === 'ACTIVE') {
      incident.status = 'RESOLVED'
      incident.resolvedAt = new Date().toISOString()
    }
  })
  
  return c.json(result)
})

// Get active incidents
app.get('/api/incidents', (c) => {
  return c.json(systemState.incidents.filter(i => i.status === 'ACTIVE'))
})

// AI Layers API
app.get('/api/ai-layers', (c) => {
  return c.json(systemState.aiLayers)
})

app.get('/api/ai-layers/:layer', (c) => {
  const layer = c.req.param('layer')
  const layerData = systemState.aiLayers[layer]
  
  if (!layerData) {
    return c.json({ error: 'Layer not found' }, 404)
  }
  
  return c.json(layerData)
})

// Blackbox Access Request
app.post('/api/blackbox/request-access', async (c) => {
  const { reason, requestedData } = await c.req.json()
  
  const accessRequest = {
    id: Date.now().toString(),
    timestamp: new Date(),
    user: 'demo-user',
    reason: reason,
    requestedData: requestedData,
    status: 'PENDING',
    approvalRequired: true
  }
  
  // Auto-approve for demo
  setTimeout(() => {
    accessRequest.status = 'APPROVED'
    systemState.aiLayers.governance.blackboxAccess.approved++
  }, 2000)
  
  systemState.aiLayers.governance.blackboxAccess.totalRequests++
  systemState.aiLayers.governance.blackboxAccess.pending++
  
  return c.json({ 
    success: true, 
    requestId: accessRequest.id,
    message: '블랙박스 접근 요청이 제출되었습니다. 승인 절차가 진행됩니다.'
  })
})

// Generate LLM Summary
app.post('/api/llm/generate-summary', async (c) => {
  const { nodeId, issueType } = await c.req.json()
  
  // Simulate LLM processing
  const summaries = {
    'dwh': {
      'performance': {
        summary: '데이터웨어하우스 성능 이슈 분석',
        keyFindings: [
          '결산 기간 중 동시 쿼리 수가 평소 대비 340% 증가',
          '메모리 사용률 95% 도달로 인한 스와핑 발생',
          '인덱스 최적화 부족으로 테이블 풀스캔 다수 발생'
        ],
        recommendations: [
          '쿼리 거버너 적용으로 동시 실행 제한',
          '메모리 증설 또는 쿼리 스케줄링 도입',
          '자주 사용되는 쿼리에 대한 인덱스 추가'
        ],
        riskLevel: 'HIGH',
        estimatedImpact: '시스템 다운타임 위험 60%',
        suggestedActions: [
          { action: 'ENABLE_QUERY_GOVERNOR', priority: 'IMMEDIATE' },
          { action: 'OPTIMIZE_INDEXES', priority: 'SHORT_TERM' },
          { action: 'SCALE_MEMORY', priority: 'MEDIUM_TERM' }
        ]
      }
    }
  }
  
  const result = summaries[nodeId]?.[issueType] || {
    summary: '분석 데이터 부족',
    keyFindings: ['충분한 데이터가 수집되지 않았습니다.'],
    recommendations: ['더 많은 데이터 수집이 필요합니다.']
  }
  
  return c.json(result)
})

// SSE endpoint for real-time updates
app.get('/api/events', (c) => {
  return streamSSE(c, async (stream) => {
    let id = 0
    
    const sendUpdate = () => {
      stream.writeSSE({
        data: JSON.stringify({
          status: systemState.nodes,
          metrics: systemState.metrics,
          incidents: systemState.incidents.filter(i => i.status === 'ACTIVE')
        }),
        event: 'update',
        id: String(id++)
      })
    }
    
    // Send initial state
    sendUpdate()
    
    // Send updates every 2 seconds
    const interval = setInterval(sendUpdate, 2000)
    
    // Clean up on client disconnect
    stream.onAbort(() => {
      clearInterval(interval)
    })
  })
})

// Helper functions
function getNodeSummary(nodeId: string, status: string): string {
  if (status === 'GREEN') return '정상 운영중'
  if (systemState.scenarioActive === 1 && nodeId === 'dwh') {
    return '대량 조회로 인한 성능 저하'
  }
  if (systemState.scenarioActive === 2 && nodeId === 'dwh') {
    return '마스터 불일치로 인한 조인 폭발'
  }
  return '상태 확인 필요'
}

function getRecentLogs(nodeId: string): string[] {
  if (systemState.scenarioActive === 1 && nodeId === 'dwh') {
    return [
      '[ERROR] Queue depth exceeded threshold: 150/100',
      '[WARN] Query execution time: 8.2s (SLO: 2s)',
      '[INFO] Active sessions: 45 (normal: 15)',
      '[ERROR] Memory pressure detected: 95% usage'
    ]
  }
  if (systemState.scenarioActive === 2 && nodeId === 'dwh') {
    return [
      '[ERROR] Cartesian product detected in query plan',
      '[ERROR] Missing join condition: PLANT_CODE IS NULL',
      '[WARN] Query cardinality estimate: 1.2B rows',
      '[ERROR] Query timeout after 12 seconds'
    ]
  }
  return ['[INFO] 정상 운영중', '[INFO] 마지막 체크: ' + new Date().toLocaleTimeString()]
}

function getRootCause(nodeId: string, status: string): string {
  if (status === 'GREEN') return '정상 상태'
  if (systemState.scenarioActive === 1 && nodeId === 'dwh') {
    return '결산 시점 대량 동시 조회로 인한 큐 포화 상태'
  }
  if (systemState.scenarioActive === 2 && nodeId === 'dwh') {
    return '마스터 플랜트 코드 불일치로 인한 조인 폭발'
  }
  return '원인 분석 중'
}

function getSuggestions(nodeId: string, scenario: number | null): Array<{id: string, label: string, description: string}> {
  if (scenario === 1 && nodeId === 'dwh') {
    return [
      {
        id: 'ENABLE_QUERY_GOVERNOR',
        label: '쿼리 거버너 활성화',
        description: '필터 미선택 차단 및 기간 상한 적용'
      },
      {
        id: 'APPLY_RATE_LIMIT',
        label: '동시성 상한 적용',
        description: '사용자별 최대 동시 실행 제한'
      }
    ]
  }
  if (scenario === 2 && nodeId === 'dwh') {
    return [
      {
        id: 'SYNC_MASTER_DATA',
        label: '마스터 싱크 실행',
        description: '신규 플랜트 코드 일괄 반영'
      },
      {
        id: 'FIX_JOIN_QUERY',
        label: '안전조인 템플릿 적용',
        description: 'INNER JOIN + NOT NULL 검증'
      }
    ]
  }
  return []
}

// Route: Page 1 - Normal Operations Demo
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>시스템 운영 현황 - 정상 가동중</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .status-card {
            transition: all 0.3s;
          }
          .status-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .pulse-green {
            animation: pulse-green 2s infinite;
          }
          @keyframes pulse-green {
            0%, 100% { background-color: #10b981; }
            50% { background-color: #059669; }
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div class="max-w-7xl mx-auto p-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-chart-line text-green-600 mr-3"></i>
                            ERP 시스템 운영 현황
                        </h1>
                        <p class="text-gray-600">모든 시스템이 정상적으로 운영되고 있습니다</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold mb-2">
                            <i class="fas fa-check-circle mr-2"></i>
                            시스템 정상
                        </div>
                        <p class="text-sm text-gray-500">마지막 업데이트: <span id="current-time"></span></p>
                    </div>
                </div>
            </div>

            <!-- System Overview -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Overall Status -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">전체 시스템 상태</h2>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="w-4 h-4 bg-green-500 rounded-full pulse-green mr-3"></div>
                                <span class="font-medium">핵심 서비스</span>
                            </div>
                            <span class="text-green-600 font-bold">100% 가동중</span>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                                <span class="font-medium">응답 시간</span>
                            </div>
                            <span class="text-blue-600 font-bold">평균 120ms</span>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                                <span class="font-medium">활성 사용자</span>
                            </div>
                            <span class="text-purple-600 font-bold">1,247명</span>
                        </div>
                    </div>
                </div>

                <!-- Key Metrics -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">주요 지표</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="text-2xl font-bold text-gray-700">99.8%</div>
                            <div class="text-sm text-gray-500">가용성</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="text-2xl font-bold text-gray-700">2.1s</div>
                            <div class="text-sm text-gray-500">평균 처리시간</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="text-2xl font-bold text-gray-700">0.01%</div>
                            <div class="text-sm text-gray-500">오류율</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="text-2xl font-bold text-gray-700">98%</div>
                            <div class="text-sm text-gray-500">CPU 효율성</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Service Status Grid -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-xl font-semibold mb-6 text-gray-700">서비스별 상태</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="status-card bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-desktop text-green-600 text-xl"></i>
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">정상</span>
                        </div>
                        <h3 class="font-semibold text-gray-700">사용자 포털</h3>
                        <p class="text-sm text-gray-500">응답시간: 95ms</p>
                    </div>

                    <div class="status-card bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-server text-green-600 text-xl"></i>
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">정상</span>
                        </div>
                        <h3 class="font-semibold text-gray-700">API 게이트웨이</h3>
                        <p class="text-sm text-gray-500">처리량: 850 req/s</p>
                    </div>

                    <div class="status-card bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-database text-green-600 text-xl"></i>
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">정상</span>
                        </div>
                        <h3 class="font-semibold text-gray-700">데이터베이스</h3>
                        <p class="text-sm text-gray-500">연결: 45/100</p>
                    </div>

                    <div class="status-card bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-cogs text-green-600 text-xl"></i>
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">정상</span>
                        </div>
                        <h3 class="font-semibold text-gray-700">배치 처리</h3>
                        <p class="text-sm text-gray-500">대기: 2개 작업</p>
                    </div>
                </div>
            </div>

            <!-- Recent Activity & Navigation -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Activity Log -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">최근 활동</h2>
                    <div class="space-y-3">
                        <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-info-circle text-blue-500 mt-1"></i>
                            <div>
                                <p class="text-sm font-medium">정기 백업 완료</p>
                                <p class="text-xs text-gray-500">2분 전</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-check-circle text-green-500 mt-1"></i>
                            <div>
                                <p class="text-sm font-medium">시스템 헬스체크 통과</p>
                                <p class="text-xs text-gray-500">5분 전</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-users text-purple-500 mt-1"></i>
                            <div>
                                <p class="text-sm font-medium">신규 사용자 로그인: 23명</p>
                                <p class="text-xs text-gray-500">10분 전</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI System Status -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">
                        <i class="fas fa-robot text-purple-600 mr-2"></i>
                        AI 시스템 현황
                    </h2>
                    <div class="space-y-3">
                        <div class="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-purple-800">데이터 수집 레이어</span>
                                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">활성</span>
                            </div>
                            <p class="text-xs text-purple-600 mt-1">블랙박스 모듈 7개 정상 수집중</p>
                        </div>
                        
                        <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-blue-800">AI 분석 레이어</span>
                                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">학습중</span>
                            </div>
                            <p class="text-xs text-blue-600 mt-1">이상탐지 정확도 94.2%</p>
                        </div>
                        
                        <div class="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-green-800">인사이트 레이어</span>
                                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">활성</span>
                            </div>
                            <p class="text-xs text-green-600 mt-1">LLM 기반 자동 리포트 생성중</p>
                        </div>
                        
                        <button onclick="location.href='/ai-analysis'" 
                                class="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                            <i class="fas fa-brain mr-2"></i>
                            AI 4-Layer 분석 시스템
                        </button>
                        
                        <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                <span class="font-medium text-yellow-800">시나리오 테스트</span>
                            </div>
                            <p class="text-sm text-yellow-700 mb-3">
                                AI 시스템과 함께 장애 대응 시나리오를 테스트해보세요.
                            </p>
                            <button onclick="simulateIssue()" 
                                    class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors text-sm">
                                AI 장애 분석 시나리오 시작
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Update current time
            function updateTime() {
                document.getElementById('current-time').textContent = new Date().toLocaleTimeString('ko-KR');
            }
            updateTime();
            setInterval(updateTime, 1000);

            // Simulate issue to go to monitoring page
            function simulateIssue() {
                if (confirm('장애 시나리오를 시작하시겠습니까?\\n\\n시스템에 일시적인 문제가 발생한 상황을 시뮬레이션합니다.')) {
                    // Start scenario and redirect
                    fetch('/api/scenario/start?s=1', { method: 'POST' })
                        .then(() => {
                            setTimeout(() => {
                                window.location.href = '/monitoring';
                            }, 1000);
                        });
                }
            }
        </script>
    </body>
    </html>
  `)
})

// Route: Page 2 - AI 4-Layer Analysis System
app.get('/ai-analysis', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI 4-Layer 분석 시스템</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .layer-card {
            transition: all 0.3s;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
          .layer-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          .layer-card.active {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
          }
          .blackbox-module {
            animation: pulse 2s infinite;
          }
          .data-flow {
            animation: flow 3s linear infinite;
          }
          @keyframes flow {
            0% { opacity: 0; transform: translateX(-20px); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: translateX(20px); }
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
        <div class="max-w-7xl mx-auto p-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <button onclick="location.href='/'" 
                                class="text-blue-600 hover:text-blue-800 mb-3">
                            <i class="fas fa-arrow-left mr-2"></i>
                            메인 대시보드로 돌아가기
                        </button>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-brain text-purple-600 mr-3"></i>
                            AI 4-Layer 분석 시스템
                        </h1>
                        <p class="text-gray-600">블랙박스 모듈부터 인사이트 생성까지의 전체 AI 파이프라인</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold mb-2">
                            <i class="fas fa-cogs mr-2"></i>
                            AI 시스템 활성
                        </div>
                        <button onclick="requestBlackboxAccess()" 
                                class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                            <i class="fas fa-unlock mr-2"></i>
                            블랙박스 개봉 요청
                        </button>
                    </div>
                </div>
            </div>

            <!-- 4-Layer Architecture Overview -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Layer 1: Data Collection -->
                <div class="layer-card p-6 rounded-xl border border-gray-200" id="layer-1">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                            <i class="fas fa-database text-purple-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">Layer 1: Data Collection</h3>
                            <p class="text-sm text-gray-600">블랙박스 모듈 기반 실시간 데이터 수집</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium">블랙박스 모듈</span>
                                <span class="text-green-600 font-bold">7개 활성</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="blackbox-module bg-green-100 p-2 rounded text-center">
                                    <div>API: 230 logs/s</div>
                                </div>
                                <div class="blackbox-module bg-green-100 p-2 rounded text-center">
                                    <div>DWH: 120 logs/s</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="flex justify-between">
                                <span class="text-sm">총 수집 로그</span>
                                <span class="font-bold" id="total-logs">2,847,293</span>
                            </div>
                        </div>
                        
                        <button onclick="showLayerDetails('dataCollection')" 
                                class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-sm">
                            상세 보기
                        </button>
                    </div>
                </div>

                <!-- Layer 2: AI Analysis -->
                <div class="layer-card p-6 rounded-xl border border-gray-200" id="layer-2">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                            <i class="fas fa-robot text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">Layer 2: AI Analysis</h3>
                            <p class="text-sm text-gray-600">이상탐지 + 강화학습 기반 패턴 분석</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="flex justify-between">
                                <span class="text-sm">이상탐지 정확도</span>
                                <span class="font-bold text-blue-600">94.2%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: 94.2%"></div>
                            </div>
                        </div>
                        
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="flex justify-between">
                                <span class="text-sm">학습 진행률</span>
                                <span class="font-bold text-green-600">87.3%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div class="bg-green-600 h-2 rounded-full" style="width: 87.3%"></div>
                            </div>
                        </div>
                        
                        <button onclick="showLayerDetails('aiAnalysis')" 
                                class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm">
                            상세 보기
                        </button>
                    </div>
                </div>

                <!-- Layer 3: Insight & Service -->
                <div class="layer-card p-6 rounded-xl border border-gray-200" id="layer-3">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                            <i class="fas fa-lightbulb text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">Layer 3: Insight & Service</h3>
                            <p class="text-sm text-gray-600">LLM 기반 자연어 인사이트 생성</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="flex justify-between mb-2">
                                <span class="text-sm font-medium">LLM 엔진</span>
                                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">활성</span>
                            </div>
                            <div class="text-xs text-gray-600">
                                생성된 요약: 156개 | 평균 응답: 1.2초
                            </div>
                        </div>
                        
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="text-xs text-gray-700 mb-2">최신 인사이트:</div>
                            <div class="text-xs bg-green-50 p-2 rounded">
                                "시스템 성능이 지난 24시간 동안 안정적으로 유지되고 있습니다."
                            </div>
                        </div>
                        
                        <button onclick="showLayerDetails('insightService')" 
                                class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm">
                            상세 보기
                        </button>
                    </div>
                </div>

                <!-- Layer 4: Governance & Compliance -->
                <div class="layer-card p-6 rounded-xl border border-gray-200" id="layer-4">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                            <i class="fas fa-shield-alt text-orange-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">Layer 4: Governance</h3>
                            <p class="text-sm text-gray-600">보안·컴플라이언스 및 접근 제어</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="flex justify-between">
                                <span class="text-sm">컴플라이언스</span>
                                <span class="text-green-600 font-bold">준수</span>
                            </div>
                        </div>
                        
                        <div class="bg-white/50 p-3 rounded-lg">
                            <div class="text-xs text-gray-600">
                                접근 요청: 45건 | 승인: 42건 | 거부: 1건
                            </div>
                        </div>
                        
                        <button onclick="showLayerDetails('governance')" 
                                class="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 text-sm">
                            상세 보기
                        </button>
                    </div>
                </div>
            </div>

            <!-- Data Flow Visualization -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-project-diagram text-indigo-600 mr-2"></i>
                    AI 데이터 파이프라인 플로우
                </h2>
                <div class="flex items-center justify-between bg-gradient-to-r from-purple-50 to-orange-50 p-6 rounded-lg">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-database text-white text-xl"></i>
                        </div>
                        <div class="text-sm font-medium">데이터 수집</div>
                        <div class="text-xs text-gray-500">574 logs/s</div>
                    </div>
                    
                    <div class="data-flow flex-1 h-2 bg-gradient-to-r from-purple-400 to-blue-400 mx-4"></div>
                    
                    <div class="text-center">
                        <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-robot text-white text-xl"></i>
                        </div>
                        <div class="text-sm font-medium">AI 분석</div>
                        <div class="text-xs text-gray-500">15,847 events</div>
                    </div>
                    
                    <div class="data-flow flex-1 h-2 bg-gradient-to-r from-blue-400 to-green-400 mx-4"></div>
                    
                    <div class="text-center">
                        <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-lightbulb text-white text-xl"></i>
                        </div>
                        <div class="text-sm font-medium">인사이트</div>
                        <div class="text-xs text-gray-500">156 reports</div>
                    </div>
                    
                    <div class="data-flow flex-1 h-2 bg-gradient-to-r from-green-400 to-orange-400 mx-4"></div>
                    
                    <div class="text-center">
                        <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-shield-alt text-white text-xl"></i>
                        </div>
                        <div class="text-sm font-medium">거버넌스</div>
                        <div class="text-xs text-gray-500">보안 준수</div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="location.href='/monitoring'" 
                        class="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    긴급 모니터링 모드
                </button>
                
                <button onclick="generateAIReport()" 
                        class="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors">
                    <i class="fas fa-file-alt mr-2"></i>
                    AI 종합 리포트 생성
                </button>
                
                <button onclick="requestBlackboxAccess()" 
                        class="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors">
                    <i class="fas fa-unlock mr-2"></i>
                    블랙박스 상세 분석
                </button>
            </div>
        </div>

        <!-- Layer Detail Modal -->
        <div id="layer-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="modal-title" class="text-xl font-bold"></h3>
                        <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div id="modal-content">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                startRealTimeUpdates();
                
                // Auto-increment logs counter
                setInterval(() => {
                    const logsElement = document.getElementById('total-logs');
                    if (logsElement) {
                        let current = parseInt(logsElement.textContent.replace(/,/g, ''));
                        current += Math.floor(Math.random() * 50) + 20;
                        logsElement.textContent = current.toLocaleString();
                    }
                }, 2000);
            });

            function startRealTimeUpdates() {
                // Simulate real-time data updates
                setInterval(() => {
                    // Update layer indicators
                    updateLayerIndicators();
                }, 3000);
            }

            function updateLayerIndicators() {
                // Add some visual feedback for active processing
                const layers = document.querySelectorAll('.layer-card');
                layers.forEach((layer, index) => {
                    setTimeout(() => {
                        layer.style.borderColor = '#3b82f6';
                        setTimeout(() => {
                            layer.style.borderColor = '#e5e7eb';
                        }, 500);
                    }, index * 200);
                });
            }

            async function showLayerDetails(layerType) {
                try {
                    const response = await fetch(\`/api/ai-layers/\${layerType}\`);
                    const data = await response.json();
                    
                    const modal = document.getElementById('layer-modal');
                    const title = document.getElementById('modal-title');
                    const content = document.getElementById('modal-content');
                    
                    title.textContent = getLayerTitle(layerType);
                    content.innerHTML = generateLayerContent(layerType, data);
                    
                    modal.classList.remove('hidden');
                } catch (error) {
                    console.error('Error loading layer details:', error);
                }
            }

            function getLayerTitle(layerType) {
                const titles = {
                    'dataCollection': 'Layer 1: Data Collection 상세 정보',
                    'aiAnalysis': 'Layer 2: AI Analysis 상세 정보',
                    'insightService': 'Layer 3: Insight & Service 상세 정보',
                    'governance': 'Layer 4: Governance & Compliance 상세 정보'
                };
                return titles[layerType] || '상세 정보';
            }

            function generateLayerContent(layerType, data) {
                if (layerType === 'dataCollection') {
                    return \`
                        <div class="space-y-4">
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">블랙박스 모듈 현황</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    \${Object.entries(data.blackboxModules).map(([node, info]) => \`
                                        <div class="bg-white p-2 rounded text-sm">
                                            <div class="font-medium">\${node.toUpperCase()}</div>
                                            <div class="text-xs text-gray-500">\${info.logsPerSec} logs/초</div>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                            
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">KPI 정의 현황</h4>
                                <div class="space-y-2">
                                    \${data.kpiDefinitions.map(kpi => \`
                                        <div class="flex justify-between items-center bg-white p-2 rounded text-sm">
                                            <span>\${kpi.name}</span>
                                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">\${kpi.status}</span>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
                } else if (layerType === 'aiAnalysis') {
                    return \`
                        <div class="space-y-4">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">이상탐지 모델</h4>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span>모델:</span>
                                        <span class="font-medium">\${data.anomalyDetection.model}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>정확도:</span>
                                        <span class="font-bold text-blue-600">\${data.anomalyDetection.accuracy}%</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>탐지된 이상:</span>
                                        <span>\${data.anomalyDetection.anomaliesDetected}건</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-green-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">강화학습 모델</h4>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span>모델:</span>
                                        <span class="font-medium">\${data.reinforcementLearning.model}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>학습 진행률:</span>
                                        <span class="font-bold text-green-600">\${data.reinforcementLearning.learningProgress}%</span>
                                    </div>
                                    <div class="mt-2">
                                        <span class="text-sm font-medium">학습 패턴:</span>
                                        <ul class="text-xs mt-1 space-y-1">
                                            \${data.reinforcementLearning.patterns.map(pattern => \`<li>• \${pattern}</li>\`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                } else if (layerType === 'insightService') {
                    return \`
                        <div class="space-y-4">
                            <div class="bg-green-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">LLM 엔진 상태</h4>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span>모델:</span>
                                        <span class="font-medium">\${data.llmEngine.model}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>상태:</span>
                                        <span class="text-green-600 font-bold">\${data.llmEngine.status}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>생성된 요약:</span>
                                        <span>\${data.llmEngine.summariesGenerated}개</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">최근 자연어 인사이트</h4>
                                <div class="space-y-2">
                                    \${data.naturalLanguageInsights.map(insight => \`
                                        <div class="bg-white p-2 rounded text-sm">\${insight}</div>
                                    \`).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
                } else if (layerType === 'governance') {
                    return \`
                        <div class="space-y-4">
                            <div class="bg-orange-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">컴플라이언스 상태</h4>
                                <div class="flex justify-between items-center">
                                    <span>전체 상태:</span>
                                    <span class="bg-green-100 text-green-800 px-3 py-1 rounded font-bold">\${data.complianceStatus}</span>
                                </div>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">블랙박스 접근 통계</h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-blue-600">\${data.blackboxAccess.totalRequests}</div>
                                        <div class="text-xs text-gray-500">총 요청</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-green-600">\${data.blackboxAccess.approved}</div>
                                        <div class="text-xs text-gray-500">승인</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                }
                return '<p>데이터를 불러올 수 없습니다.</p>';
            }

            function closeModal() {
                document.getElementById('layer-modal').classList.add('hidden');
            }

            async function requestBlackboxAccess() {
                if (confirm('블랙박스 개봉을 요청하시겠습니까?\\n\\n승인 절차를 거쳐 상세 분석 데이터에 접근할 수 있습니다.')) {
                    try {
                        const response = await fetch('/api/blackbox/request-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                reason: '시스템 성능 이상 분석',
                                requestedData: 'performance_logs'
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('✅ ' + result.message);
                            
                            // Simulate approval process
                            setTimeout(() => {
                                if (confirm('블랙박스 접근이 승인되었습니다.\\n\\n상세 분석 페이지로 이동하시겠습니까?')) {
                                    window.location.href = '/blackbox-analysis';
                                }
                            }, 3000);
                        }
                    } catch (error) {
                        console.error('Error requesting blackbox access:', error);
                        alert('요청 처리 중 오류가 발생했습니다.');
                    }
                }
            }

            async function generateAIReport() {
                alert('🤖 AI 종합 리포트를 생성중입니다...\\n\\n• 데이터 수집 현황 분석\\n• AI 모델 성능 평가\\n• 인사이트 및 권장사항 생성\\n\\n완료까지 약 30초 소요됩니다.');
                
                setTimeout(() => {
                    alert('✅ AI 종합 리포트가 생성되었습니다!\\n\\n주요 내용:\\n• 전체 시스템 건강성: 양호\\n• AI 모델 정확도: 94.2%\\n• 권장 조치사항: 3건\\n• 예방적 유지보수: 1건');
                }, 3000);
            }

            // Click outside modal to close
            document.getElementById('layer-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        </script>
    </body>
    </html>
  `)
})

// Route: Page 3 - Governance & Architecture Monitoring  
app.get('/monitoring', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>시스템 아키텍처 모니터링</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .topology-container {
            width: 100%;
            height: 500px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            position: relative;
            background: linear-gradient(45deg, #f8fafc 25%, transparent 25%), 
                        linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f8fafc 75%), 
                        linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          }
          .node {
            position: absolute;
            width: 80px;
            height: 60px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .node:hover {
            transform: scale(1.1);
            z-index: 10;
          }
          .node.GREEN { background: #10b981; color: white; }
          .node.YELLOW { background: #f59e0b; color: white; }
          .node.RED { background: #ef4444; color: white; }
          .edge {
            position: absolute;
            height: 2px;
            background: #6b7280;
            transform-origin: left center;
          }
          .popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
          }
        </style>
    </head>
    <body class="bg-gray-50 p-4">
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <button onclick="location.href='/'" 
                                class="text-blue-600 hover:text-blue-800 mb-2">
                            <i class="fas fa-arrow-left mr-2"></i>
                            메인 대시보드로 돌아가기
                        </button>
                        <h1 class="text-2xl font-bold text-gray-800">
                            <i class="fas fa-sitemap mr-2 text-red-500"></i>
                            시스템 아키텍처 모니터링
                        </h1>
                        <p class="text-red-600 font-medium">⚠️ 시스템 이상 감지됨 - 승인 절차 진행 중</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold mb-2">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            긴급 대응 모드
                        </div>
                        <button onclick="resetSystem()" 
                                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            <i class="fas fa-undo mr-2"></i>
                            시스템 복구
                        </button>
                    </div>
                </div>
            </div>

            <!-- Governance Approval Process -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-clipboard-check text-blue-600 mr-2"></i>
                    거버넌스 승인 절차
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div id="step-1" class="bg-green-100 p-4 rounded-lg border border-green-300">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>
                            <span class="font-semibold text-green-800">1단계 완료</span>
                        </div>
                        <p class="text-sm text-green-700">장애 감지 및 알림</p>
                        <p class="text-xs text-green-600 mt-1">2분 전</p>
                    </div>

                    <div id="step-2" class="bg-green-100 p-4 rounded-lg border border-green-300">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>
                            <span class="font-semibold text-green-800">2단계 완료</span>
                        </div>
                        <p class="text-sm text-green-700">관리자 승인</p>
                        <p class="text-xs text-green-600 mt-1">1분 전</p>
                    </div>

                    <div id="step-3" class="bg-blue-100 p-4 rounded-lg border border-blue-300">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-hourglass-half text-blue-600 mr-2"></i>
                            <span class="font-semibold text-blue-800">3단계 진행중</span>
                        </div>
                        <p class="text-sm text-blue-700">아키텍처 분석</p>
                        <div class="w-full bg-blue-200 rounded-full h-2 mt-2">
                            <div class="bg-blue-600 h-2 rounded-full w-3/4"></div>
                        </div>
                    </div>

                    <div id="step-4" class="bg-gray-100 p-4 rounded-lg border border-gray-300">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-clock text-gray-500 mr-2"></i>
                            <span class="font-semibold text-gray-600">4단계 대기중</span>
                        </div>
                        <p class="text-sm text-gray-600">자동 복구 실행</p>
                    </div>
                </div>
            </div>

            <!-- System Architecture -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold flex items-center">
                        <i class="fas fa-project-diagram text-purple-600 mr-2"></i>
                        시스템 아키텍처 설계도
                    </h2>
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        빨간 노드를 클릭하면 상세 문제 분석을 확인할 수 있습니다
                    </div>
                </div>
                <div id="topology" class="topology-container">
                    <!-- Nodes will be rendered here -->
                </div>
            </div>

            <!-- Problem Analysis -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-microscope text-red-600 mr-2"></i>
                    실시간 문제 분석
                </h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-semibold text-gray-700 mb-3">🚨 현재 발생중인 문제</h3>
                        <div id="current-issues">
                            <!-- Issues will be loaded here -->
                        </div>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-700 mb-3">💡 권장 조치사항</h3>
                        <div class="space-y-3">
                            <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <h4 class="font-semibold text-blue-800">1. 쿼리 거버너 활성화</h4>
                                <p class="text-sm text-blue-600 mt-1">필터 미선택 차단 및 기간 상한 적용</p>
                                <button onclick="applyRecommendation('ENABLE_QUERY_GOVERNOR')" 
                                        class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                    <i class="fas fa-play mr-1"></i>
                                    실행
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Popup Modal -->
        <div id="popup" class="popup hidden">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-md">
                <div class="flex items-center mb-4">
                    <i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">노드 상세 문제 분석</h3>
                </div>
                <div id="popup-content">
                    <!-- Content will be loaded here -->
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button onclick="closePopup()" 
                            class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                        닫기
                    </button>
                    <button onclick="remediate()" 
                            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        <i class="fas fa-wrench mr-1"></i>
                        자동 수리
                    </button>
                </div>
            </div>
        </div>

        <!-- Popup Overlay -->
        <div id="popup-overlay" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50" onclick="closePopup()"></div>

        <script>
            let currentIncident = null;

            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                loadTopology();
                loadIncidents();
                
                // Auto-complete governance steps
                setTimeout(() => completeStep(3), 3000);
                setTimeout(() => activateStep(4), 5000);
            });

            function completeStep(step) {
                const stepEl = document.getElementById(\`step-\${step}\`);
                stepEl.className = 'bg-green-100 p-4 rounded-lg border border-green-300';
                stepEl.innerHTML = stepEl.innerHTML.replace('진행중', '완료').replace('hourglass-half', 'check-circle').replace('blue', 'green');
            }

            function activateStep(step) {
                const stepEl = document.getElementById(\`step-\${step}\`);
                stepEl.className = 'bg-blue-100 p-4 rounded-lg border border-blue-300';
                stepEl.innerHTML = stepEl.innerHTML.replace('대기중', '진행중').replace('clock', 'hourglass-half').replace('gray', 'blue');
            }

            async function loadTopology() {
                try {
                    const response = await fetch('/api/topology');
                    const data = await response.json();
                    renderTopology(data);
                } catch (error) {
                    console.error('Error loading topology:', error);
                }
            }

            async function loadIncidents() {
                try {
                    const response = await fetch('/api/incidents');
                    const incidents = await response.json();
                    updateCurrentIssues(incidents);
                } catch (error) {
                    console.error('Error loading incidents:', error);
                }
            }

            function renderTopology(data) {
                const container = document.getElementById('topology');
                container.innerHTML = '';

                // Render edges
                data.edges.forEach(edge => {
                    const fromNode = data.nodes.find(n => n.id === edge.from);
                    const toNode = data.nodes.find(n => n.id === edge.to);
                    
                    if (fromNode && toNode) {
                        const edgeElement = document.createElement('div');
                        edgeElement.className = 'edge';
                        
                        const deltaX = toNode.x - fromNode.x;
                        const deltaY = toNode.y - fromNode.y;
                        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                        
                        edgeElement.style.width = length + 'px';
                        edgeElement.style.left = (fromNode.x + 40) + 'px';
                        edgeElement.style.top = (fromNode.y + 30) + 'px';
                        edgeElement.style.transform = \`rotate(\${angle}deg)\`;
                        
                        container.appendChild(edgeElement);
                    }
                });

                // Render nodes
                data.nodes.forEach(node => {
                    const nodeElement = document.createElement('div');
                    nodeElement.className = \`node \${node.status}\`;
                    nodeElement.style.left = node.x + 'px';
                    nodeElement.style.top = node.y + 'px';
                    nodeElement.onclick = () => showNodeDetails(node.id);
                    
                    nodeElement.innerHTML = \`
                        <i class="fas fa-server text-sm"></i>
                        <span class="text-xs font-semibold mt-1">\${node.name}</span>
                    \`;
                    
                    container.appendChild(nodeElement);
                });
            }

            function updateCurrentIssues(incidents) {
                const container = document.getElementById('current-issues');
                if (!incidents || incidents.length === 0) {
                    container.innerHTML = '<p class="text-gray-500">현재 발생중인 문제가 없습니다.</p>';
                    return;
                }

                container.innerHTML = '';
                incidents.forEach(incident => {
                    const issueElement = document.createElement('div');
                    issueElement.className = 'bg-red-50 border border-red-200 p-4 rounded-lg mb-3';
                    issueElement.innerHTML = \`
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-semibold text-red-800">\${incident.title}</h4>
                                <p class="text-sm text-red-600 mt-1">노드: \${incident.nodeId.toUpperCase()}</p>
                                <p class="text-xs text-red-500 mt-2">심각도: \${incident.severity}</p>
                            </div>
                            <button onclick="showNodeDetails('\${incident.nodeId}')" 
                                    class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                                분석
                            </button>
                        </div>
                    \`;
                    container.appendChild(issueElement);
                });
            }

            async function showNodeDetails(nodeId) {
                try {
                    const response = await fetch(\`/api/node/\${nodeId}/drilldown\`);
                    const data = await response.json();
                    
                    const content = document.getElementById('popup-content');
                    content.innerHTML = \`
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-red-700 mb-2">🚨 \${data.node.name} 문제 상황</h4>
                                <p class="text-sm text-gray-700 bg-red-50 p-3 rounded">\${data.rootCause}</p>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold mb-2">📊 현재 지표</h4>
                                <div class="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
                                    <div>CPU: <span class="font-bold text-red-600">\${Math.round(data.metrics.cpu)}%</span></div>
                                    <div>응답시간: <span class="font-bold text-red-600">\${Math.round(data.metrics.response_time)}ms</span></div>
                                    <div>큐 깊이: <span class="font-bold text-red-600">\${Math.round(data.metrics.queue_depth)}</span></div>
                                    <div>오류율: <span class="font-bold text-red-600">\${Math.round(data.metrics.error_rate)}%</span></div>
                                </div>
                            </div>

                            <div>
                                <h4 class="font-semibold mb-2">📝 최근 에러 로그</h4>
                                <div class="bg-gray-900 text-red-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                                    \${data.logs.map(log => \`<div>\${log}</div>\`).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
                    
                    currentIncident = { nodeId: nodeId, suggestions: data.suggestions };
                    document.getElementById('popup').classList.remove('hidden');
                    document.getElementById('popup-overlay').classList.remove('hidden');
                } catch (error) {
                    console.error('Error loading node details:', error);
                }
            }

            function closePopup() {
                document.getElementById('popup').classList.add('hidden');
                document.getElementById('popup-overlay').classList.add('hidden');
            }

            async function remediate() {
                if (!currentIncident || !currentIncident.suggestions || currentIncident.suggestions.length === 0) return;
                
                const suggestion = currentIncident.suggestions[0];
                
                try {
                    const response = await fetch('/api/remediation/apply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            actionId: suggestion.id,
                            nodeId: currentIncident.nodeId 
                        })
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        closePopup();
                        alert('✅ ' + result.message);
                        completeStep(4);
                        
                        // Clear issues
                        document.getElementById('current-issues').innerHTML = \`
                            <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-600 mr-3"></i>
                                    <div>
                                        <h4 class="font-semibold text-green-800">모든 문제가 해결되었습니다</h4>
                                        <p class="text-sm text-green-600 mt-1">시스템이 정상 상태로 복구되었습니다.</p>
                                    </div>
                                </div>
                            </div>
                        \`;
                    }
                } catch (error) {
                    console.error('Error applying remediation:', error);
                }
            }

            async function applyRecommendation(actionId) {
                if (confirm('선택한 조치사항을 실행하시겠습니까?')) {
                    try {
                        const response = await fetch('/api/remediation/apply', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ actionId: actionId })
                        });
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('✅ ' + result.message);
                            completeStep(4);
                        }
                    } catch (error) {
                        console.error('Error applying recommendation:', error);
                    }
                }
            }

            async function resetSystem() {
                if (confirm('시스템을 정상 상태로 복구하시겠습니까?')) {
                    try {
                        const response = await fetch('/api/scenario/stop', { method: 'POST' });
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('✅ 시스템이 정상 상태로 복구되었습니다.');
                            setTimeout(() => {
                                window.location.href = '/';
                            }, 1000);
                        }
                    } catch (error) {
                        console.error('Error resetting system:', error);
                    }
                }
            }
        </script>
    </body>
    </html>
  `)
})

// Route: Page 4 - Blackbox Detailed Analysis (After Governance Approval)
app.get('/blackbox-analysis', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>블랙박스 상세 분석</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .access-granted {
            animation: grantedPulse 2s infinite;
          }
          @keyframes grantedPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
            50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.8); }
          }
          .llm-response {
            animation: typewriter 3s steps(40) 1s both;
            white-space: nowrap;
            overflow: hidden;
            border-right: 2px solid #3b82f6;
          }
          @keyframes typewriter {
            0% { width: 0; }
            100% { width: 100%; }
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div class="max-w-7xl mx-auto p-6">
            <!-- Header with Access Status -->
            <div class="access-granted bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-green-500">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="flex items-center mb-2">
                            <button onclick="location.href='/ai-analysis'" 
                                    class="text-blue-600 hover:text-blue-800 mr-4">
                                <i class="fas fa-arrow-left mr-2"></i>
                                AI 분석 시스템으로 돌아가기
                            </button>
                            <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                <i class="fas fa-unlock mr-1"></i>
                                블랙박스 접근 승인됨
                            </div>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-microscope text-green-600 mr-3"></i>
                            블랙박스 상세 분석 리포트
                        </h1>
                        <p class="text-gray-600">거버넌스 승인 완료 • LLM 기반 자연어 설명 • 핵심 이슈 요약</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500 mb-1">승인 시간</div>
                        <div class="font-semibold" id="approval-time"></div>
                        <div class="text-sm text-gray-500 mt-2">접근 레벨: <span class="font-bold text-green-600">ENTERPRISE</span></div>
                    </div>
                </div>
            </div>

            <!-- LLM Summary Section -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-brain text-purple-600 mr-2"></i>
                    LLM 기반 핵심 이슈 요약
                </h2>
                
                <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg mb-6">
                    <div class="mb-4">
                        <h3 class="text-lg font-bold text-purple-800 mb-2">🔍 종합 분석 결과</h3>
                        <div class="llm-response text-gray-700">
                            현재 시스템에서 DWH 성능 저하가 감지되었습니다.
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div class="bg-white p-4 rounded-lg">
                            <h4 class="font-semibold text-red-700 mb-2">⚠️ 주요 문제점</h4>
                            <ul class="text-sm space-y-1">
                                <li>• 결산 기간 중 동시 쿼리 수 340% 증가</li>
                                <li>• 메모리 사용률 95% 도달로 스와핑 발생</li>
                                <li>• 인덱스 최적화 부족으로 테이블 풀스캔</li>
                            </ul>
                        </div>
                        
                        <div class="bg-white p-4 rounded-lg">
                            <h4 class="font-semibold text-green-700 mb-2">💡 권장 조치사항</h4>
                            <ul class="text-sm space-y-1">
                                <li>• 쿼리 거버너 적용으로 동시 실행 제한</li>
                                <li>• 메모리 증설 또는 쿼리 스케줄링 도입</li>
                                <li>• 자주 사용되는 쿼리 인덱스 추가</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <button onclick="generateDetailedSummary()" 
                        class="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors">
                    <i class="fas fa-magic mr-2"></i>
                    LLM 상세 분석 리포트 생성
                </button>
            </div>

            <!-- Priority Inspection Points -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-list-check text-orange-600 mr-2"></i>
                    우선 점검 포인트
                </h2>
                
                <div class="space-y-4">
                    <div class="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-bold text-red-800">🚨 즉시 조치 필요</h3>
                            <span class="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">HIGH</span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex items-start">
                                <i class="fas fa-exclamation-triangle text-red-500 mt-1 mr-2"></i>
                                <div>
                                    <div class="font-medium">DWH 큐 깊이 임계점 초과</div>
                                    <div class="text-sm text-gray-600">현재: 150/100 (50% 초과)</div>
                                    <button onclick="applyQuickFix('ENABLE_QUERY_GOVERNOR')" 
                                            class="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                                        즉시 수정
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-bold text-yellow-800">⚡ 단기 개선 권장</h3>
                            <span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">MEDIUM</span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex items-start">
                                <i class="fas fa-clock text-yellow-500 mt-1 mr-2"></i>
                                <div>
                                    <div class="font-medium">인덱스 최적화</div>
                                    <div class="text-sm text-gray-600">성능 향상 예상: 40-60%</div>
                                    <button onclick="scheduleOptimization()" 
                                            class="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">
                                        스케줄 예약
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-bold text-blue-800">📊 중장기 계획</h3>
                            <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">LOW</span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex items-start">
                                <i class="fas fa-chart-line text-blue-500 mt-1 mr-2"></i>
                                <div>
                                    <div class="font-medium">하드웨어 스케일링</div>
                                    <div class="text-sm text-gray-600">메모리 증설 또는 분산 아키텍처</div>
                                    <button onclick="showScalingOptions()" 
                                            class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                        옵션 보기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Technical Deep Dive -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Raw Log Analysis -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-terminal text-gray-600 mr-2"></i>
                        기술적 로그 분석
                    </h3>
                    
                    <div class="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono max-h-64 overflow-y-auto">
                        <div class="mb-2 text-yellow-400">[2024-01-08 14:23:15] DWH Performance Analysis</div>
                        <div>[ERROR] Connection pool exhausted: 95/100 active</div>
                        <div>[WARN] Query execution time exceeded SLO: 8.2s > 2s</div>
                        <div>[INFO] Memory usage critical: 95% (7.6GB/8GB)</div>
                        <div>[ERROR] Table scan detected: FINANCIAL_DATA (2.1M rows)</div>
                        <div>[WARN] Index not used: IDX_PLANT_CODE missing condition</div>
                        <div>[ERROR] Lock timeout: user session blocked 45s</div>
                        <div>[INFO] Query governor trigger: concurrent limit reached</div>
                        <div class="mt-2 text-blue-400">[ANALYSIS] Root cause: Unfiltered queries + memory pressure</div>
                    </div>
                    
                    <button onclick="exportTechnicalLogs()" 
                            class="mt-4 w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800">
                        <i class="fas fa-download mr-2"></i>
                        기술 로그 내보내기
                    </button>
                </div>

                <!-- Natural Language Explanation -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-comments text-blue-600 mr-2"></i>
                        자연어 설명
                    </h3>
                    
                    <div class="bg-blue-50 p-4 rounded-lg space-y-3">
                        <div class="text-sm leading-relaxed">
                            <strong>현재 상황:</strong><br>
                            결산 시즌으로 인해 평소보다 많은 사용자들이 동시에 데이터웨어하우스에 접근하고 있습니다. 
                            특히 필터 조건 없이 전체 데이터를 조회하는 쿼리들이 급증했습니다.
                        </div>
                        
                        <div class="text-sm leading-relaxed">
                            <strong>기술적 문제:</strong><br>
                            메모리 사용량이 95%까지 올라가면서 시스템이 하드디스크를 사용하기 시작했고(스와핑), 
                            이로 인해 모든 작업이 느려졌습니다. 마치 컴퓨터 메모리가 부족해서 느려지는 것과 같은 현상입니다.
                        </div>
                        
                        <div class="text-sm leading-relaxed">
                            <strong>해결 방안:</strong><br>
                            쿼리 거버너를 켜서 동시에 실행할 수 있는 무거운 쿼리 수를 제한하고, 
                            자주 사용하는 검색 조건에 대해 인덱스를 만들어 검색 속도를 높이는 것이 좋습니다.
                        </div>
                    </div>
                    
                    <button onclick="generateUserFriendlyReport()" 
                            class="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-file-alt mr-2"></i>
                        사용자 친화적 리포트 생성
                    </button>
                </div>
            </div>

            <!-- Auto-Generated Management Report -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-chart-pie text-green-600 mr-2"></i>
                    매니지드 서비스 종료 리포트 (자동 생성)
                </h2>
                
                <div class="bg-gray-50 p-6 rounded-lg">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-semibold mb-3">📝 수정 사항 요약</h3>
                            <ul class="space-y-2 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <div>
                                        <div class="font-medium">쿼리 거버너 설정</div>
                                        <div class="text-gray-600">동시 실행 제한: 20 → 10개</div>
                                    </div>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <div>
                                        <div class="font-medium">인덱스 추가</div>
                                        <div class="text-gray-600">PLANT_CODE, DATE_RANGE 컬럼</div>
                                    </div>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <div>
                                        <div class="font-medium">모니터링 강화</div>
                                        <div class="text-gray-600">실시간 알림 임계값 조정</div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-semibold mb-3">📊 성능 개선 결과</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center bg-white p-3 rounded">
                                    <span class="text-sm">평균 응답 시간</span>
                                    <span class="font-bold text-green-600">8.2s → 1.8s</span>
                                </div>
                                <div class="flex justify-between items-center bg-white p-3 rounded">
                                    <span class="text-sm">메모리 사용률</span>
                                    <span class="font-bold text-green-600">95% → 68%</span>
                                </div>
                                <div class="flex justify-between items-center bg-white p-3 rounded">
                                    <span class="text-sm">동시 세션</span>
                                    <span class="font-bold text-green-600">45 → 12개</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="text-sm text-gray-600">리포트 생성 시간</div>
                                <div class="font-medium" id="report-time"></div>
                            </div>
                            <button onclick="downloadReport()" 
                                    class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                <i class="fas fa-download mr-2"></i>
                                리포트 다운로드
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                const now = new Date();
                document.getElementById('approval-time').textContent = now.toLocaleString('ko-KR');
                document.getElementById('report-time').textContent = now.toLocaleString('ko-KR');
                
                // Simulate typing effect for LLM response
                setTimeout(() => {
                    const llmElement = document.querySelector('.llm-response');
                    if (llmElement) {
                        llmElement.style.whiteSpace = 'normal';
                        llmElement.style.borderRight = 'none';
                    }
                }, 4000);
            });

            async function generateDetailedSummary() {
                alert('🤖 LLM이 상세 분석 리포트를 생성중입니다...\\n\\n• 기술적 로그 분석\\n• 비즈니스 영향 평가\\n• 단계별 해결 방안\\n• 예방 조치 권장사항\\n\\n완료까지 약 15초 소요됩니다.');
                
                setTimeout(() => {
                    const detailedReport = \`
🔍 **LLM 상세 분석 결과**

**문제 심각도: HIGH (8/10)**
- 비즈니스 영향: 결산 프로세스 지연 위험
- 기술적 영향: 시스템 다운타임 가능성 60%
- 사용자 영향: 응답 시간 300% 증가

**근본 원인 분석:**
1. 결산 시즌 특성상 대용량 데이터 조회 급증
2. 쿼리 최적화 부족으로 인한 리소스 낭비  
3. 동시 접근 제어 부재로 인한 리소스 경합

**권장 해결 순서:**
1. [즉시] 쿼리 거버너 활성화 → 즉시 부하 감소
2. [1시간 내] 인덱스 추가 → 성능 40% 향상 예상
3. [1일 내] 모니터링 강화 → 재발 방지
4. [1주일 내] 용량 계획 수립 → 장기적 안정성

**예상 복구 시간: 30분**
**비즈니스 연속성: 유지 가능**
                    \`;
                    
                    alert(detailedReport);
                }, 3000);
            }

            async function applyQuickFix(actionId) {
                if (confirm('즉시 수정을 적용하시겠습니까?\\n\\n• 쿼리 거버너 활성화\\n• 동시 실행 제한 적용\\n• 실시간 모니터링 강화')) {
                    try {
                        const response = await fetch('/api/remediation/apply', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ actionId: actionId })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('✅ 즉시 수정이 완료되었습니다!\\n\\n• 큐 깊이: 150 → 12\\n• 응답 시간: 8.2s → 1.8s\\n• 메모리 사용률: 95% → 68%\\n\\n시스템이 안정화되었습니다.');
                        }
                    } catch (error) {
                        console.error('Error applying quick fix:', error);
                    }
                }
            }

            function scheduleOptimization() {
                alert('📅 인덱스 최적화가 예약되었습니다.\\n\\n• 실행 시간: 오늘 오후 6시 (업무시간 외)\\n• 예상 소요: 2시간\\n• 성능 향상: 40-60%\\n• 다운타임: 없음 (온라인 작업)');
            }

            function showScalingOptions() {
                const options = \`
📈 **하드웨어 스케일링 옵션**

**Option 1: 메모리 증설**
- 현재: 8GB → 권장: 16GB
- 비용: 월 $200
- 효과: 즉시적인 성능 향상

**Option 2: 분산 아키텍처**
- 읽기 전용 복제본 추가
- 비용: 월 $500  
- 효과: 장기적 확장성

**Option 3: 클라우드 네이티브**
- Auto-scaling 지원
- 비용: 사용량 기반
- 효과: 탄력적 대응

**추천: Option 1 (단기) + Option 2 (중장기)**
                \`;
                alert(options);
            }

            function exportTechnicalLogs() {
                alert('📋 기술 로그를 내보내는 중...\\n\\n포함 내용:\\n• 성능 메트릭 로그\\n• 에러 상세 정보\\n• 시스템 리소스 사용률\\n• 쿼리 실행 계획\\n\\n파일 형식: JSON, CSV 형태로 압축');
            }

            function generateUserFriendlyReport() {
                const report = \`
📊 **경영진용 요약 리포트**

**상황 요약:**
결산 시즌으로 인한 일시적 성능 저하가 발생했습니다. 
AI 시스템이 자동으로 감지하고 즉시 대응 방안을 실행했습니다.

**비즈니스 영향:**
• 업무 중단: 없음
• 데이터 손실: 없음  
• 복구 시간: 30분 이내

**대응 결과:**
• 응답 시간 78% 개선
• 시스템 안정성 확보
• 향후 재발 방지 조치 완료

**추가 투자 검토사항:**
하드웨어 증설을 통한 장기적 안정성 확보 권장
                \`;
                alert(report);
            }

            function downloadReport() {
                alert('📄 매니지드 서비스 리포트를 다운로드합니다.\\n\\n포함 내용:\\n• 수정 사항 상세 내역\\n• 성능 개선 결과\\n• 향후 권장사항\\n• 기술적 상세 정보\\n\\n고객사에 전달될 최종 리포트입니다.');
            }
        </script>
    </body>
    </html>
  `)
})

export default app