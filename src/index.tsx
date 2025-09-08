import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { streamSSE } from 'hono/streaming'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory  
app.use('/static/*', serveStatic({ root: './public' }))

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
  scenarioActive: null
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

// Default route - Main UI
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>시스템 모니터링 대시보드</title>
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
          .drilldown-panel {
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: white;
            box-shadow: -2px 0 8px rgba(0,0,0,0.1);
            transition: right 0.3s;
            z-index: 100;
          }
          .drilldown-panel.open {
            right: 0;
          }
        </style>
    </head>
    <body class="bg-gray-50 p-4">
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-chart-line mr-2"></i>
                        시스템 모니터링 대시보드
                    </h1>
                    <div class="flex gap-2">
                        <button onclick="startScenario(1)" 
                                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                            시나리오 1 시작 (대량조회)
                        </button>
                        <button onclick="startScenario(2)" 
                                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                            시나리오 2 시작 (마스터불일치)
                        </button>
                        <button onclick="stopScenario()" 
                                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            복구
                        </button>
                    </div>
                </div>
            </div>

            <!-- System Topology -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">시스템 설계도</h2>
                <div id="topology" class="topology-container">
                    <!-- Nodes and edges will be rendered here -->
                </div>
            </div>

            <!-- Metrics Summary -->
            <div id="metrics-summary" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <!-- Metrics cards will be rendered here -->
            </div>
        </div>

        <!-- Popup Modal -->
        <div id="popup" class="popup hidden">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-md">
                <div class="flex items-center mb-4">
                    <i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">시스템 알림</h3>
                </div>
                <p id="popup-message" class="text-gray-700 mb-4"></p>
                <div class="flex justify-end gap-2">
                    <button onclick="closePopup()" 
                            class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                        취소
                    </button>
                    <button id="remediate-btn" onclick="remediate()" 
                            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        보수
                    </button>
                </div>
            </div>
        </div>

        <!-- Drilldown Panel -->
        <div id="drilldown-panel" class="drilldown-panel">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">상세 정보</h3>
                    <button onclick="closeDrilldown()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div id="drilldown-content">
                    <!-- Drilldown content will be loaded here -->
                </div>
            </div>
        </div>

        <!-- Popup Overlay -->
        <div id="popup-overlay" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50" onclick="closePopup()"></div>

        <script>
            let currentScenario = null;
            let currentIncident = null;
            let eventSource = null;

            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                loadTopology();
                loadStatus();
                startEventStream();
            });

            function startEventStream() {
                if (eventSource) {
                    eventSource.close();
                }
                
                eventSource = new EventSource('/api/events');
                eventSource.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    updateTopology(data.status);
                    updateMetrics(data.status, data.metrics);
                    
                    // Show popup for new incidents
                    if (data.incidents && data.incidents.length > 0) {
                        const incident = data.incidents[0];
                        if (!currentIncident || currentIncident.id !== incident.id) {
                            currentIncident = incident;
                            showPopup(incident);
                        }
                    }
                };
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

            async function loadStatus() {
                try {
                    const response = await fetch('/api/status');
                    const data = await response.json();
                    updateMetrics(null, data);
                } catch (error) {
                    console.error('Error loading status:', error);
                }
            }

            function renderTopology(data) {
                const container = document.getElementById('topology');
                container.innerHTML = '';

                // Render edges first (so they appear behind nodes)
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
                    nodeElement.onclick = () => showDrilldown(node.id);
                    
                    nodeElement.innerHTML = \`
                        <i class="fas fa-server text-sm"></i>
                        <span class="text-xs font-semibold mt-1">\${node.name}</span>
                    \`;
                    
                    container.appendChild(nodeElement);
                });
            }

            function updateTopology(nodes) {
                const container = document.getElementById('topology');
                const nodeElements = container.querySelectorAll('.node');
                
                nodeElements.forEach((element, index) => {
                    const nodeId = Object.keys(nodes)[index];
                    if (nodeId && nodes[nodeId]) {
                        element.className = \`node \${nodes[nodeId].status}\`;
                    }
                });
            }

            function updateMetrics(nodes, data) {
                const container = document.getElementById('metrics-summary');
                container.innerHTML = '';

                Object.entries(data).forEach(([nodeId, info]) => {
                    const metrics = info.metrics || info;
                    const card = document.createElement('div');
                    card.className = 'bg-white rounded-lg shadow p-4';
                    
                    card.innerHTML = \`
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-semibold text-gray-700">\${nodeId.toUpperCase()}</h3>
                            <span class="px-2 py-1 rounded text-xs font-medium \${
                                info.health === 'GREEN' ? 'bg-green-100 text-green-800' :
                                info.health === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }">
                                \${info.health || 'GREEN'}
                            </span>
                        </div>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span>CPU:</span>
                                <span>\${Math.round(metrics.cpu)}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span>응답시간:</span>
                                <span>\${Math.round(metrics.response_time)}ms</span>
                            </div>
                            <div class="flex justify-between">
                                <span>큐 깊이:</span>
                                <span>\${Math.round(metrics.queue_depth)}</span>
                            </div>
                        </div>
                    \`;
                    
                    container.appendChild(card);
                });
            }

            async function startScenario(scenario) {
                try {
                    const response = await fetch(\`/api/scenario/start?s=\${scenario}\`, {
                        method: 'POST'
                    });
                    const result = await response.json();
                    currentScenario = scenario;
                    console.log(\`시나리오 \${scenario} 시작:\`, result.message);
                } catch (error) {
                    console.error('Error starting scenario:', error);
                }
            }

            async function stopScenario() {
                try {
                    const response = await fetch('/api/scenario/stop', {
                        method: 'POST'
                    });
                    const result = await response.json();
                    currentScenario = null;
                    currentIncident = null;
                    closePopup();
                    console.log('시나리오 정지:', result.message);
                } catch (error) {
                    console.error('Error stopping scenario:', error);
                }
            }

            function showPopup(incident) {
                document.getElementById('popup-message').textContent = incident.title;
                document.getElementById('popup').classList.remove('hidden');
                document.getElementById('popup-overlay').classList.remove('hidden');
            }

            function closePopup() {
                document.getElementById('popup').classList.add('hidden');
                document.getElementById('popup-overlay').classList.add('hidden');
            }

            async function remediate() {
                if (!currentIncident || !currentScenario) return;
                
                let actionId;
                if (currentScenario === 1) {
                    actionId = 'ENABLE_QUERY_GOVERNOR';
                } else if (currentScenario === 2) {
                    actionId = 'SYNC_MASTER_DATA';
                }

                try {
                    const response = await fetch('/api/remediation/apply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            actionId: actionId,
                            nodeId: currentIncident.nodeId 
                        })
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        closePopup();
                        currentIncident = null;
                        alert(result.message);
                    }
                } catch (error) {
                    console.error('Error applying remediation:', error);
                }
            }

            async function showDrilldown(nodeId) {
                try {
                    const response = await fetch(\`/api/node/\${nodeId}/drilldown\`);
                    const data = await response.json();
                    
                    const content = document.getElementById('drilldown-content');
                    content.innerHTML = \`
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold mb-2">노드 정보</h4>
                                <p class="text-sm text-gray-600">\${data.node.name} (\${data.node.type})</p>
                                <p class="text-sm \${
                                    data.node.status === 'GREEN' ? 'text-green-600' :
                                    data.node.status === 'YELLOW' ? 'text-yellow-600' :
                                    'text-red-600'
                                }">\${data.node.status}</p>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold mb-2">원인 분석</h4>
                                <p class="text-sm text-gray-700">\${data.rootCause}</p>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold mb-2">최근 로그</h4>
                                <div class="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                                    \${data.logs.map(log => \`<div>\${log}</div>\`).join('')}
                                </div>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold mb-2">메트릭</h4>
                                <div class="grid grid-cols-2 gap-2 text-sm">
                                    <div>CPU: \${Math.round(data.metrics.cpu)}%</div>
                                    <div>메모리: \${Math.round(data.metrics.memory)}%</div>
                                    <div>응답시간: \${Math.round(data.metrics.response_time)}ms</div>
                                    <div>큐 깊이: \${Math.round(data.metrics.queue_depth)}</div>
                                </div>
                            </div>
                            
                            \${data.suggestions.length > 0 ? \`
                                <div>
                                    <h4 class="font-semibold mb-2">수리 방안</h4>
                                    <div class="space-y-2">
                                        \${data.suggestions.map(suggestion => \`
                                            <button onclick="applyRemediation('\${suggestion.id}', '\${nodeId}')" 
                                                    class="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded border">
                                                <div class="font-medium text-blue-900">\${suggestion.label}</div>
                                                <div class="text-sm text-blue-700">\${suggestion.description}</div>
                                            </button>
                                        \`).join('')}
                                    </div>
                                </div>
                            \` : ''}
                        </div>
                    \`;
                    
                    document.getElementById('drilldown-panel').classList.add('open');
                } catch (error) {
                    console.error('Error loading drilldown:', error);
                }
            }

            function closeDrilldown() {
                document.getElementById('drilldown-panel').classList.remove('open');
            }

            async function applyRemediation(actionId, nodeId) {
                try {
                    const response = await fetch('/api/remediation/apply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ actionId, nodeId })
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        alert(result.message);
                        closeDrilldown();
                    }
                } catch (error) {
                    console.error('Error applying remediation:', error);
                }
            }

            // Clean up on page unload
            window.addEventListener('beforeunload', function() {
                if (eventSource) {
                    eventSource.close();
                }
            });
        </script>
    </body>
    </html>
  `)
})

export default app
