import './docs.css';

/**
 * Engineering Handbook Data - 由产品经理整理，旨在为开发同事提供系统性的功能逻辑说明。
 */
const HANDBOOK_DATA = {
    '0. 高保真原型设计规范 (Interaction Specs)': {
        items: [
            {
                id: '0.1',
                title: '0.1 原型设计初衷与愿景',
                description: '本原型旨在定义三维结构修理系统的交互基调，解决传统二维维修手册直观性不足的问题。',
                level: ['Concept'],
                details: `
                    ### PM 视角 (Product Perspective)
                    - **直观性革命**: 通过 3D 数模与损伤标记的 1:1 映射，消除工程师在坐标转换时的思维断层。
                    - **信息降维**: 采用“冰川白”美学，不仅是为了视觉高级感，更是为了通过高对比度、低色彩干扰的界面，让工程师将注意力集中在红色的“损伤标点”上。
                `
            },
            {
                id: '0.2',
                title: '0.2 核心交互设计原则',
                description: '基于“最小干扰”与“情境唤起”原则。',
                level: ['Interaction'],
                details: `
                    ### PM 视角 (Product Perspective)
                    - **非侵入式弹窗**: 3D 标点时不会粗暴地打断用户，侧边栏也不会自动扩展。只有当用户明确点击某个 Marker 时，才通过 Popup 提供“轻量化”上下文。
                    - **二级钻取逻辑**: Level 1 看全局（治理视角），Level 2 看细节（操作视角）。这种深度隔离保证了系统处理海量数据时的性能与操作专注度。
                `
            },
            {
                id: '0.3',
                title: '0.3 工程目录说明',
                description: '清晰的模块化目录结构是高效协作的基础。',
                level: ['Structure'],
                details: `
                    - **/src/features**: 核心业务特性模块。
                        - \`spatial-view/\`: 三维渲染引擎与交互。
                        - \`record-sidebar/\`: 左侧多维过滤看板。
                        - \`external-case/\`: CASE 业务系统集成模块。
                        - \`detail-sidebar/\`: 右侧详情面板。
                    - **/src/services**: 全局数据服务（MockDataService 等）。
                    - **/src/components**: 公用 UI 组件。
                    - **/src/utils**: 格式化、转换等通用工具函数。
                    - **/src/styles**: 全局设计系统 CSS。
                `
            },
            {
                id: '0.4',
                title: '0.4 核心依赖图谱',
                description: '项目依赖选型遵循轻量化与工业标准原则。',
                level: ['Dependencies'],
                details: `
                    - **Three.js (^0.170.0)**: 底层三维 WebGL 渲染内核。
                    - **Vite (^6.0.0)**: 下一代前端构建工具，提供极速热更新。
                    - **xlsx (^0.18.5)**: 处理 ATA 树及损伤数据的高性能导出。
                    - **Custom Event Bus**: 内置原生 DOM 事件系统，作为全局通讯总线。
                `
            },
            {
                id: '0.5',
                title: '0.5 用户交互全生命周期 (Journey Map)',
                description: '描述一个维修工程师从进入系统到完成闭环的完整过程。',
                level: ['UX Journey'],
                details: `
                    <div class="mermaid-container">
                    <pre class="mermaid">
                    sequenceDiagram
                        participant User as 维修工程师
                        participant L1 as Level 1 看板
                        participant L2 as Level 2 钻取页
                        participant Canvas as 3D 交互区
                        participant CASE as 外系统集成
                        
                        User->>L1: 选择特定 MSN 飞机
                        L1->>L2: 场景切换 (平滑过渡)
                        User->>L2: 筛选/搜索 ATA 结构
                        User->>Canvas: 视角操控与标点/测量
                        Canvas-->>User: 弱交互展示 (MarkerPopup)
                        User->>CASE: 点击“发起技术请求”
                        CASE->>User: 模拟业务逻辑闭环
                    </pre>
                    </div>
                `
            },
            {
                id: '0.6',
                title: '0.6 弹窗与交互逻辑管理',
                description: '协同管理 Summary（汇总）与 Individual（单条）视图。',
                level: ['Architecture'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **双轨制弹窗**: 本系统区分了 \`PopupManager\` (负责汇总看板) 与 \`MarkerPopup\` (负责单条记录操作)。
                    - **覆盖逻辑**: 遵循“业务优先级”原则。当用户选中具体标记点时，\`individual\` 弹窗会强制覆盖 \`summary\` 弹窗，以减少视觉干扰。

                    ### 使用流程 (Usage Workflow)
                    1. 点击 ATA 树分级节点 -> 呼出 \`PopupManager\`。
                    2. 点击三维标记点或详情 ID -> 呼出 \`MarkerPopup\`。
                    3. 系统通过 \`main.js\` 协调两者显隐。
                `
            },
            {
                id: '0.7',
                title: '0.7 数据服务原子化',
                description: 'MockDataService 作为全案唯一的事实来源。',
                level: ['Global'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **解耦存储**: 所有飞机机位、ATA 结构、损伤记录均由 \`MockDataService\` 统一管理。
                    - **原子响应**: 组件不直接修改数据。任何写操作必须通过 Service 完成，并借由全局事件总线广播变更，确保多端 UI（列表、三维、详情）强一致。

                    ### 使用流程 (Usage Workflow)
                    1. 组件请求预览数据 -> 调用 \`Service.getMarkerDetails()\`。
                    2. 用户保存新标点 -> 调用 \`Service.saveMarker()\`。
                `
            }
        ]
    },
    '1. 筛选列表 (左侧看板)': {
        items: [
            {
                id: '1.1',
                title: '1.1 飞机信息筛选列表',
                description: '系统的入口层（Level 1），负责全机队维度的初步锁定。',
                level: ['view-level-1'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **联动过滤**: 基于 \`activeFilters\` 对象，通过 \`getFilteredAircraftList()\` 对原始 JSON 数据进行多项匹配（型别 ∩ 航司 ∩ MSN）。
                    - **平稳过渡**: 点击确认项后，触发 \`setViewLevel(2)\`。该方法会销毁 Level 1 视图并异步加载 Level 2 资源。

                    ### 使用流程 (Usage Workflow)
                    1. 用户在下拉菜单选择过滤条件。
                    2. 系统实时广播 \`filter-change\`。
                    3. 点击具体架次条目进入 DrillDown 深度视图。
                `,
                subItems: [
                    { id: '1.1.1', title: '筛选功能', implementation: 'src/features/record-sidebar/components/SelectionView.js', details: '通过 CustomDropdown 实现型别、航司、机号的级联动态过滤逻辑。' },
                    { id: '1.1.2', title: '飞机筛选列表功能', implementation: 'src/features/record-sidebar/components/SelectionView.js', details: '基于 getFilteredAircraftList() 聚合生成不重复的注册号/MSN 映射表。' },
                    { id: '1.1.3', title: '飞机筛选确认功能', implementation: 'src/features/record-sidebar/RecordSidebar.js', details: '点击确认后，通过 setViewLevel(2) 切换至 DrillDown 模式。' },
                    { id: '1.1.4', title: '飞机筛选项重置功能', implementation: 'src/features/record-sidebar/components/SelectionView.js', details: '清空 activeFilters 中的 type/airline/msn 字段并重新向全局广播 filter-change。' }
                ]
            },
            {
                id: '1.2',
                title: '1.2 损伤标记列表',
                description: 'Level 2 核心业务区，集成 ATA 结构管理与损伤条目定位。',
                level: ['view-level-2'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **递归渲染**: \`AtaTreeView\` 使用递归函数处理 6 位（Chapter-Section-Subject）编码，自动构建树形 DOM。
                    - **状态同步**: 勾选父节点会自动遍历所有子节点并更新 \`uncheckedAtaNodes\` Set，随后触发 \`ata-visibility-changed\` 驱动 3D 模型显隐。

                    ### 使用流程 (Usage Workflow)
                    1. 搜索框输入关键字，触发递归节点的 Visibility 切换。
                    2. 勾选复选框控制 3D 模型的图层显示。
                    3. 点击条目实现 2D 列表与 3D 标点的双向高亮同步。
                `,
                subItems: [
                    { id: '1.2.1.1-1.2.1.7', title: 'ATA 结构树筛选功能集', implementation: 'src/features/record-sidebar/components/DrillDownView.js', details: '提供飞机状态、损伤类型、ATA 章节、件号、SR/CRS 编号的多维度模糊搜索。' },
                    { id: '1.2.1.8', title: 'ATA 树内损伤标记列表', implementation: 'src/features/record-sidebar/components/AtaTreeView.js', details: '递归渲染 ATA 分级节点，并在叶子节点展示所属的详细损伤条目。' },
                    { id: '1.2.1.9-1.2.1.12', title: '状态提示 Icon (1.2.1.9-1.2.1.12)', implementation: 'src/features/record-sidebar/components/AtaTreeView.js', details: '根据数据源字段（has3D, hasSR, hasCRS）在条目后方动态渲染状态指示图标。' },
                    { id: '1.2.1.13', title: 'ATA结构树导出功能', implementation: 'src/utils/ExportUtils.js', details: '集成 xlsx 库，将当前过滤后的 ATA 树形结构降维扁平化后导出。' },
                    { id: '1.2.1.14', title: '筛选条件重置', implementation: 'src/features/record-sidebar/components/DrillDownView.js', details: '重置所有二级筛选因子，恢复 ATA 树的完整可见性。' },
                    { id: '1.2.2', title: '框站位结构树', implementation: 'src/features/record-sidebar/StructureTree.js', details: '提供基于飞机物理结构的树状视图切换机制。' },
                    { id: '1.2.3.1', title: '三维标记架次选择', implementation: 'src/features/external-case/ExternalCaseView.js', details: '在进入标点模式前，唤起弹窗同步当前 CASE 业务关联的架次数据。' },
                    { id: '1.2.3.2-1.2.3.5', title: '三维标记管理 (命名/编辑/删除)', implementation: 'Target Architecture', details: '【目标建议】建立 MarkerPersistenceService，支持标记点的 JSON 序列化存储与增删改查。' },
                    { id: '1.2.4', title: '返回飞机筛选列表', implementation: 'src/features/record-sidebar/components/DrillDownView.js', details: '触发 setViewLevel(1)，卸载钻取视图并恢复全局统计视野。' }
                ]
            },
            {
                id: '1.3',
                title: '1.3 面包屑',
                description: '全局路径的可视化展示与快速操作入口。',
                level: ['all'],
                subItems: [
                    { id: '1.3.1-1.3.4', title: '维度快捷筛选 (1.3.1-1.3.4)', implementation: 'NavigationBar Breadcrumb', details: '实时映射 activeFilters 的状态，支持在顶部直接进行型别/航司/MSN/注册号的交叉筛选。' },
                    { id: '1.3.5-1.3.6', title: 'ATA/件号快捷显示', implementation: 'NavigationBar.js', details: '在 Level 2 模式下，展示当前锁定的 ATA 章节与件号过滤词。' }
                ]
            }
        ]
    },
    '2. 三维视图 (中间区域)': {
        items: [
            {
                id: '2.1',
                title: '2.1 零部件损伤三维标记',
                description: '基于 WebGL 的三维交互核心，负责数据可视化。',
                level: ['view-level-2'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **Spider Layout**: 当多个 Marker 共享同一个 \`siteId\` (坐标重叠) 时，\`SpatialView\` 会计算一个扩散布局参数。通过 CSS 变量 \`--angle\` 使标记点以圆环形式展开，并配合 \`site-count\` 进行聚合显示。
                    - **Raycaster 测距**: 利用封装的测量工具，通过捕捉用户两次点击的 3D 坐标，计算欧几里得距离并映射为米(m)。

                    ### PM 视角 (Product Perspective)
                    - **物理重叠解决方案**: 在早期版本中，重叠的标记会导致点击失效。Spider Layout 的引入解决了“一个洞里有多条损伤”的工程实际情况，属于高频业务痛点。
                    - **交互感增强**: 扩散动画不仅美观，通过物理位置的暂时偏移，能让工程师清晰看到“历史记录”的厚度。

                    ### 使用流程 (Usage Workflow)
                    1. 用户点击“测量”按钮激活模式。
                    2. 在三维数模上连续选取两点。
                    3. 系统实时绘制 SVG 引导线并渲染数值标签。
                `,
                subItems: [
                    { id: '2.1.1', title: '计数功能', implementation: 'src/features/spatial-view/SpatialView.js', details: '统计同一 siteId 下的所有标记数量，动态更新图标数字。' },
                    { id: '2.1.2-2.1.3', title: '扩散与聚合 (Spider Layout)', implementation: 'src/features/spatial-view/SpatialView.js', details: '通过坐标偏移算法解决 Marker 重叠问题；大缩放级别下自动聚合为 Site Counter。' },
                    { id: '2.1.4', title: '标记信息弹窗 (2.1.4)', implementation: 'src/components/MarkerPopup.js', details: '展示已有记录列表，提供发起技术请求 (2.1.4.1) 与关闭功能 (2.1.4.2)。' },
                    { id: '2.1.5', title: '详细信息弹窗 (2.1.5)', implementation: 'src/features/external-case/ExternalCaseView.js', details: '深度集成页面，支持详细查看 SR (2.1.5.1) 与 CRS (2.1.5.2) 信息。' }
                ]
            },
            {
                id: '2.2',
                title: '2.2 新增三维通用功能',
                description: '三维空间的辅助分析工具包。',
                level: ['all'],
                subItems: [
                    { id: '2.2.1', title: '参照开启/关闭', implementation: 'Layer Manager Logic', details: '切换蒙皮、骨架、内部组件的 Layer 显示优先级。' },
                    { id: '2.2.2', title: '三维测量功能', implementation: 'src/features/spatial-view/SpatialView.js', details: '基于 Raycaster 的点对点空间距离计算工具。' }
                ]
            },
            {
                id: '2.3',
                title: '2.3 发起技术请求功能',
                description: '跨系统集成的关键入口，实现从三维修理到 CASE 业务系统的无缝跳转。',
                level: ['view-level-2'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **跨系统通讯**: 通过自定义事件 \`initiate-technical-request\` 进行驱动。\`App\` 类作为协调者，捕获事件后隐藏主容器 DOM 并唤起 \`ExternalCaseView\` 实例。
                    - **上下文保持**: 跳转时，系统会将当前选中的机号、ATA 章节及损伤 ID 作为参数传递，确保目标系统能进入对应的业务上下文。

                    ### 使用流程 (Usage Workflow)
                    1. 在标记详情弹窗中点击“发起技术请求”。
                    2. 主界面执行 \`display: none\`，CASE 模拟界面执行 \`display: block\`。
                    3. 完成业务操作后，点击 CASE 界面顶部的“返回”按钮恢复原状。
                `
            }
        ]
    },
    '3. 详细信息看板 (右侧看板)': {
        items: [
            {
                id: '3.1/3.2/3.3',
                title: '3.1/3.2/3.3 各阶段详情信息看板',
                description: '展示损伤记录在 SR/CRS/CR 阶段的完整技术描述。',
                level: ['view-level-2'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **按需加载**: \`DetailSidebar\` 通过监听 \`damage-marker-select\` 事件获取 ID。
                    - **状态驱动**: 当选中不同阶段（Tab）时，系统会从 \`MockDataService\` 过滤出对应的单证记录（如 SR001, CRS002）并进行局部重绘。

                    ### 使用流程 (Usage Workflow)
                    1. 选中任意损伤记录，右侧面板自动向左展开（Expand）。
                    2. 切换顶部 Tab 查看不同阶段的处置方案。
                    3. 当用户通过面包屑返回 Level 1 时，该面板会自动收起。
                `
            }
        ]
    },
    '4. 时间轴组件 (Conditional Render)': {
        items: [
            {
                id: '4.1-4.3',
                title: '4.1/4.2/4.3 时间轴功能集',
                description: '损伤历史的生命周期追溯与管理工具。',
                level: ['view-level-2', 'case-view'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **时序过滤**: 采用区间算法处理 \`dateRange\`。用户拖拽横轴滑块时，会实时修改共享的 \`dateRange\` 对象，并对 \`markerData\` 进行重新过滤。
                    - **坐标映射**: 时间轴上的 Marker 节点是根据记录的 \`createdAt\` 时间戳占总区间的比例（Percentage）计算左偏移量并渲染。

                    ### 使用流程 (Usage Workflow)
                    1. 拖拽时间轴两侧的边缘 Handlers。
                    2. 观察左侧列表和 3D 视图中，不符合时间段的记录实时消失（带渐变效果）。
                    3. 点击时间轴上的特定点，可快速定位到该历史记录。
                `
            }
        ]
    },
    '5. 全局编码规范 (Standards)': {
        items: [
            {
                id: '5.1',
                title: '5.1 模块化与解耦模式',
                description: '本项目遵循严格的模块化设计，确保组件间的高内聚低耦合。',
                level: ['Architecture'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **Coordinator 模式**: 由 \`main.js\` 中的 \`App\` 类作为协调者。
                    - **事件驱动**: 严禁 A 模块直接调用 B 模块的私有私有方法（如 \`this.sidebar.refresh()\`）。

                    ### 使用流程 (Usage Workflow)
                    1. A 模块通过 \`window.dispatchEvent\` 抛出事件。
                    2. \`App\` 监听事件并在其内部调用 \`this.B.method()\`，由此实现物理路径上的完全解耦。
                `
            },
            {
                id: '5.2',
                title: '5.2 状态同步与 DOM 管理',
                description: '保证全局数据展示的一致性。',
                level: ['Convention'],
                details: `
                    ### 核心逻辑 (Core Logic)
                    - **单向数据流**: 数据变更 \`Service -> Event -> Coordinator -> UI\`。
                    - **样式隔离**: feature 内部必须使用对应的 \`.css\` 文件。
                `
            }
        ]
    }
};

class DocsApp {
    constructor() {
        this.navContainer = document.getElementById('sidebar-nav');
        this.contentBody = document.getElementById('content-body');
        this.contentTitle = document.getElementById('content-title');
        this.breadcrumb = document.getElementById('breadcrumb');

        this.init();
    }

    init() {
        this.renderSidebar();
        this.listenForNavClicks();
    }

    renderSidebar() {
        let html = '';
        for (const [group, data] of Object.entries(HANDBOOK_DATA)) {
            html += `
                <div class="nav-group">
                    <div class="nav-group-title">${group}</div>
                    ${data.items.map(item => `
                        <div class="nav-item-container">
                            <div class="nav-item" data-id="${item.id}">${item.title}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        this.navContainer.innerHTML = html;
    }

    listenForNavClicks() {
        this.navContainer.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (!navItem) return;

            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            navItem.classList.add('active');

            this.showContent(navItem.dataset.id);
        });
    }

    showContent(id) {
        let selectedItem = null;
        let selectedGroup = '';

        for (const [group, data] of Object.entries(HANDBOOK_DATA)) {
            const found = data.items.find(i => i.id === id);
            if (found) {
                selectedItem = found;
                selectedGroup = group;
                break;
            }
        }

        if (!selectedItem) return;

        this.contentTitle.textContent = selectedItem.title;
        this.breadcrumb.textContent = `首页 / ${selectedGroup} / ${selectedItem.id}`;

        let subItemsHtml = '';
        if (selectedItem.subItems) {
            subItemsHtml = `
                <section class="doc-section">
                    <h2>CSV 功能映射 (Statistics Tree)</h2>
                    <table class="event-table">
                        <thead>
                            <tr>
                                <th>细项编号</th>
                                <th>功能标题</th>
                                <th>工程实现路径</th>
                                <th>逻辑要点 (含目标架构建议)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedItem.subItems.map(si => `
                                <tr>
                                    <td style="color: var(--docs-accent)">${si.id}</td>
                                    <td style="font-weight: 500">${si.title}</td>
                                    <td style="font-size: 11px; opacity: 0.8">${si.implementation}</td>
                                    <td style="font-size: 12px">${si.details}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>
            `;
        }

        // Start transition
        this.contentBody.classList.remove('fade-in');
        void this.contentBody.offsetWidth; // Trigger reflow

        this.contentBody.innerHTML = `
            <article class="doc-section">
                <header class="section-header">
                    <div class="header-left">
                        <h2>模块定义与渲染约束</h2>
                        <div class="level-indicator">
                            ${selectedItem.level.map(l => `<span class="level-chip ${l.toLowerCase().replace('view-level-', 'v').replace(' ', '-') || 'v1'}">${l.toUpperCase()}</span>`).join('')}
                        </div>
                    </div>
                    ${selectedItem.implementation ? `
                        <div class="copy-path-btn" onclick="navigator.clipboard.writeText('${selectedItem.implementation}')">
                            <span class="icon">📋</span> 复制路径
                        </div>
                    ` : ''}
                </header>
                <p class="description">${selectedItem.description}</p>
                ${selectedItem.implementation ? `<div class="feature-tag">入口路径: <code>${selectedItem.implementation}</code></div>` : ''}
            </article>

            ${subItemsHtml}

            ${selectedItem.details ? `
                <section class="doc-section">
                    <h2>工程细节分析</h2>
                    <div class="details-content">
                        ${selectedItem.details}
                    </div>
                </section>
            ` : ''}

            ${selectedItem.code ? `
                <section class="doc-section">
                    <h2>工程代码采样</h2>
                    <pre class="code-snippet"><code>${selectedItem.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </section>
            ` : ''}
        `;

        this.contentBody.classList.add('fade-in');

        // Re-run Mermaid for charts
        if (window.mermaid) {
            window.mermaid.run();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DocsApp();
});
