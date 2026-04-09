export class StructureTree {
  constructor(container) {
    this.container = container;
    this.data = [
      {
        id: 'fuselage',
        label: '机身',
        expanded: true,
        children: [
          {
            id: 'fuselage-frame',
            label: '机身框站位',
            children: [
              { id: 'fr0', label: 'FR0 STA3623' },
              { id: 'fr1', label: 'FR1 STA3623' },
              { id: 'fr3', label: 'FR3 STA3623' },
              { id: 'fr84', label: 'FR84 STA3623' }
            ]
          },
          {
            id: 'fuselage-stringer',
            label: '机身长桁站位',
            children: [
              { id: 'stgr1-lh', label: 'STGR1_LH' },
              { id: 'stgr2-lh', label: 'STGR2_LH' },
              { id: 'stgr3-lh', label: 'STGR3_LH' },
              { id: 'stgr41-rh', label: 'STGR41_RH' }
            ]
          }
        ]
      },
      {
        id: 'wing',
        label: '机翼',
        expanded: false,
        children: [
          {
            id: 'wing-spar',
            label: '机翼梁站位',
            children: [
              { id: 'c-wing-f-spar', label: '中央翼前梁' },
              { id: 'c-wing-r-spar', label: '中央翼后梁' },
              { id: 'l-out-wing-f-spar', label: '左侧外翼前梁' },
              { id: 'l-out-wing-r-spar-in', label: '左侧外翼后梁 (内段)' },
              { id: 'l-out-wing-r-spar-mid', label: '左侧外翼后梁 (中段)' },
              { id: 'l-out-wing-r-spar-out', label: '左侧外翼后梁 (外段)' },
              { id: 'r-out-wing-f-spar', label: '右侧外翼前梁' },
              { id: 'r-out-wing-r-spar-in', label: '右侧外翼后梁 (内段)' },
              { id: 'r-out-wing-r-spar-mid', label: '右侧外翼后梁 (中段)' },
              { id: 'r-out-wing-r-spar-out', label: '右侧外翼后梁 (外段)' }
            ]
          },
          {
            id: 'wing-rib',
            label: '机翼肋站位',
            children: [
              { id: 'l-rib-1', label: '左侧1肋' },
              { id: 'l-rib-2', label: '左侧2肋' },
              { id: 'l-rib-3', label: '左侧3肋' },
              { id: 'l-rib-16', label: '左侧16肋' }
            ]
          },
          {
            id: 'wing-upper-stringer',
            label: '上壁板长桁站位',
            children: [{ id: 'l-out-wing-u1-stgr', label: '左外翼上1长桁' }]
          },
          {
            id: 'wing-lower-stringer',
            label: '下壁板长桁站位',
            children: [{ id: 'l-out-wing-hatch-c1', label: '左外翼口盖中心-1' }]
          },
          {
            id: 'wing-main-gear',
            label: '主起连接区',
            children: [{ id: 'l-aux-spar', label: '左侧辅助梁' }]
          },
          {
            id: 'wing-flaps',
            label: '襟翼',
            children: [{ id: 'l-inner-flap', label: '左内襟翼' }]
          }
        ]
      },
      {
        id: 'tail',
        label: '尾翼',
        expanded: false,
        children: [
          {
            id: 'h-stab',
            label: '平尾',
            children: [
              { id: 'h-stab-spar', label: '平尾梁站位', children: [{ id: 'l-h-stab-f-spar', label: '左侧平尾前梁' }] },
              { id: 'h-stab-rib', label: '平尾肋站位', children: [{ id: 'l-h-stab-1-rib', label: '左侧平尾1#肋' }] },
              { id: 'h-stab-stringer', label: '左侧长桁站位', children: [{ id: 'l-h-stab-1-stgr', label: '左侧平尾1#长桁' }] }
            ]
          },
          {
            id: 'v-fin',
            label: '垂尾',
            children: [
              { id: 'v-fin-spar', label: '垂尾梁站位', children: [{ id: 'v-fin-f-spar', label: '垂尾前梁' }, { id: 'v-fin-r-spar', label: '垂尾后梁' }, { id: 'v-fin-aux-spar', label: '垂尾辅助梁' }] },
              {
                id: 'v-fin-rib', label: '垂尾肋站位', children: [
                  { id: 'v-fin-1-rib', label: '垂尾1#肋' },
                  { id: 'v-fin-2-rib', label: '垂尾2#肋' },
                  { id: 'v-fin-11-rib', label: '垂尾11#肋' },
                  { id: 'v-fin-tip-rib', label: '垂尾端肋' }
                ]
              },
              { id: 'v-fin-stringer', label: '垂尾长桁站位', children: [{ id: 'v-fin-1-stgr', label: '垂尾1#长桁' }, { id: 'v-fin-2-stgr', label: '垂尾2#长桁' }] }
            ]
          }
        ]
      },
      {
        id: 'openings',
        label: '重要开口',
        expanded: false,
        children: [
          { id: 'pax-door', label: '机身登机门' },
          { id: 'cargo-door', label: '货舱门' },
          { id: 'bulk-cargo-door', label: '散装货舱门' },
          { id: 'service-door', label: '服务门' },
          { id: 'emergency-exit', label: '应急出口' }
        ]
      }
    ];
    this.selectedId = null;
    this.searchQuery = '';
    this.render();
  }

  render() {
    const filteredData = this.getFilteredData(this.data);

    this.container.innerHTML = `
      <div class="structure-tree-container">
        <div class="tree-header">
          <span>飞机部段筛选结构树</span>
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" class="tree-search-input" placeholder="模糊搜索部段..." value="${this.searchQuery}">
            ${this.searchQuery ? '<span class="clear-search">✕</span>' : ''}
          </div>
        </div>
        <div class="tree-content">
          ${filteredData.length > 0 ? this.renderNodes(filteredData) : '<div class="no-results">无匹配部段</div>'}
        </div>
      </div>
    `;
    this.initEvents();
    this.addStyles();
  }

  getFilteredData(nodes) {
    if (!this.searchQuery) return nodes;

    const query = this.searchQuery.toLowerCase();

    return nodes.map(node => {
      const isMatch = node.label.toLowerCase().includes(query);
      const filteredChildren = node.children ? this.getFilteredData(node.children) : null;
      const hasMatchingChild = filteredChildren && filteredChildren.length > 0;

      if (isMatch || hasMatchingChild) {
        return {
          ...node,
          expanded: hasMatchingChild ? true : node.expanded,
          children: filteredChildren
        };
      }
      return null;
    }).filter(node => node !== null);
  }

  renderNodes(nodes) {
    return nodes.map(node => `
      <div class="tree-node ${node.children ? 'has-children' : ''} ${node.expanded ? 'expanded' : ''}" data-id="${node.id}">
        <div class="node-content ${this.selectedId === node.id ? 'selected' : ''}">
          ${node.children ? `<span class="tree-chevron">${node.expanded ? '▼' : '▶'}</span>` : '<span class="tree-bullet">•</span>'}
          <span class="node-label">${node.label}</span>
        </div>
        ${node.children ? `
          <div class="node-children">
            ${this.renderNodes(node.children)}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  initEvents() {
    const searchInput = this.container.querySelector('.tree-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        // Keep focus
        const newInput = this.container.querySelector('.tree-search-input');
        newInput.focus();
        newInput.setSelectionRange(e.target.value.length, e.target.value.length);
      });
    }

    const clearBtn = this.container.querySelector('.clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    const nodes = this.container.querySelectorAll('.tree-node');
    nodes.forEach(node => {
      const content = node.querySelector('.node-content');
      content.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = node.dataset.id;

        // Handle expansion
        if (node.classList.contains('has-children')) {
          this.toggleNode(id);
        } else {
          this.selectedId = id;
          this.render();
          window.dispatchEvent(new CustomEvent('part-select', { detail: { id } }));
        }
      });
    });
  }

  toggleNode(id) {
    const nodeData = this.findNode(this.data, id);
    if (nodeData) {
      nodeData.expanded = !nodeData.expanded;
      this.render();
    }
  }

  findNode(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  addStyles() {
    const styleId = 'structure-tree-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .structure-tree-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border-right: 1px solid #e2e8f0;
      }

      .tree-header {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
      }

      .tree-header > span {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
      }

      .search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 10px;
        font-size: 12px;
        color: #94a3b8;
      }

      .tree-search-input {
        width: 100%;
        padding: 8px 32px 8px 30px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 12px;
        background: #ffffff;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
        color: #334155;
      }

      .tree-search-input:focus {
        border-color: #0052d9;
        box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1);
        background: #fff;
      }

      .tree-search-input::placeholder {
        color: #cbd5e1;
      }

      .clear-search {
        position: absolute;
        right: 10px;
        font-size: 12px;
        color: #94a3b8;
        cursor: pointer;
        transition: color 0.2s;
      }

      .clear-search:hover {
        color: #64748b;
      }

      .no-results {
        padding: 20px;
        text-align: center;
        color: #94a3b8;
        font-size: 13px;
      }

      .tree-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }

      .tree-node {
        user-select: none;
      }

      .node-content {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;
        color: #475569;
      }

      .node-content:hover {
        background: #f1f5f9;
        color: #0052d9;
      }

      .node-content.selected {
        background: rgba(0, 82, 217, 0.05);
        color: #0052d9;
        font-weight: 600;
        border-right: 2px solid #0052d9;
      }

      .tree-chevron {
        font-size: 10px;
        width: 12px;
        color: #94a3b8;
      }

      .tree-bullet {
        font-size: 12px;
        width: 12px;
        text-align: center;
        color: #cbd5e1;
      }

      .node-children {
        display: none;
        padding-left: 20px;
      }

      .tree-node.expanded > .node-children {
        display: block;
      }

      .node-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);
  }
}
